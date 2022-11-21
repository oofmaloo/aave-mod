// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IRouter} from "../../../interfaces/IRouter.sol";
import {IAllocator} from "../../../interfaces/IAllocator.sol";
import {Aggregator} from "../../aggregator/Aggregator.sol";
import {PercentageMath} from '../../libraries/math/PercentageMath.sol';
import {WadRayMath} from '../../libraries/math/WadRayMath.sol';
import {AllocatorDataTypes} from './libraries/AllocatorDataTypes.sol';
import {IAllocatorMaker} from './interfaces/IAllocatorMaker.sol';

import "hardhat/console.sol";

abstract contract AllocatorKeeperMaker is IAllocatorMaker {
    using SafeMath for uint256;
	using PercentageMath for uint256;
    using WadRayMath for uint256;
    using SafeERC20 for IERC20;

    mapping(address => AllocatorDataTypes.AssetData) internal _assets;

    // mapping(uint256 => AllocatorDataTypes.AllocatorSubmit) internal _allocatorSubmits;

    mapping(address => mapping(uint256 => AllocatorDataTypes.AllocatorSubmit)) internal _allocatorSubmits;
    mapping(address => uint256) internal _allocatorSubmitCounts;

    address internal _allocatorManager;

    constructor(address allocatorManager) {
    	_allocatorManager = allocatorManager;
    }

	modifier onlyAllocatorManager() {
		require(msg.sender == _allocatorManager, 'ONLY_ALLOCATOR_MANAGER');
		_;
	}

    function _configureAssets(AllocatorDataTypes.AllocatorConfigsInput[] memory config) internal {
        for (uint256 i = 0; i < config.length; i++) {
        	AllocatorDataTypes.AssetData storage asset = _assets[config[i].asset];
			asset.executeTimeRequirement = config[i].executeTimeRequirement;
			asset.submitTimeRequirementDelta = config[i].submitTimeRequirementDelta;
			asset.active = true;
        }
    }

	function _allocatorSubmitPlain(
		AllocatorDataTypes.AssetData storage asset,
		AllocatorDataTypes.AllocatorSubmitParams memory params
	) internal {
        AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit = _allocatorSubmits[params.asset][_allocatorSubmitCounts[params.asset]];
        allocatorSubmit.id = _allocatorSubmitCounts[params.asset];
		allocatorSubmit.submitter = params.caller;
		allocatorSubmit.routers = params.routers;
		allocatorSubmit.asset = params.asset;
		allocatorSubmit.aggregator = params.aggregator;
		allocatorSubmit.ladderPercentages = params.ladderPercentages;
		allocatorSubmit.timestampSubmitted = block.timestamp;
		allocatorSubmit.active = true;
        _allocatorSubmitCounts[params.asset]++;
	}

	function _allocatorChecker(
		AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit
	) internal view returns (bool) {

		SubmitAllocatorParams memory params;

		Aggregator _aggregator = Aggregator(allocatorSubmit.aggregator);

		params.currentTotalBalance = _aggregator.getBalanceStored();

        params.currentWeightedBalance = 0;
        params.simulatedWeightedBalance = 0;
        params.totalRoutedBalance = 0;
		// params.routersCount = _aggregator._routersDataCount();

		address[] memory routers = _aggregator.getRoutersDataList();

		// ensure actually better
		// loop each router
        for (uint256 i = 0; i < routers.length; i++) {
        	// address router = _aggregator.getRouterFromIndex(i);
			// address router = _aggregator._routersDataList(i);
			address router = routers[i];
            if (router == address(0)) {
                continue;
            }

        	uint256 currentBalance = IRouter(router).getBalanceStored(allocatorSubmit.asset, allocatorSubmit.aggregator);
            uint256 currentRate = IRouter(router).getPreviousInterestRate(allocatorSubmit.asset);

            // check if matches any of new distr
			for (uint256 ii = 0; ii < allocatorSubmit.routers.length; ii++) {
				// get new distr data to compare against current
	            if (router == allocatorSubmit.routers[ii]) {
		        	uint256 liquidityAdded;
					uint256 liquidityTaken;

					uint256 _amount = params.currentTotalBalance.percentMul(allocatorSubmit.ladderPercentages[ii]);
		        	if (currentBalance > _amount) {
		        		liquidityTaken = currentBalance.sub(_amount);
		    		} else if (currentBalance < _amount) {
		    			liquidityAdded = _amount.sub(currentBalance);
		    		}

					// get rate based on added or removed liquidity
					uint256 simulatedRate = IRouter(allocatorSubmit.routers[ii]).getSimulatedInterestRate(allocatorSubmit.asset, liquidityAdded, liquidityTaken);

		            params.simulatedWeightedBalance += _amount.rayMul(simulatedRate);

		            // continue to next
		            continue;
				}
			}

            if (currentBalance == 0) {
                continue;
            }
            params.currentWeightedBalance += currentBalance.rayMul(currentRate);
			params.totalRoutedBalance += currentBalance;
        }

        uint256 currentWeightedRate = params.currentWeightedBalance.rayDiv(params.totalRoutedBalance);

        uint256 simulatedWeightedRate = params.simulatedWeightedBalance.rayDiv(params.totalRoutedBalance);

        if (simulatedWeightedRate < currentWeightedRate) {
        	return false;
        } else {
        	return true;
        }
	}

    struct SubmitAllocatorParams {
		address underlyingAsset;
		uint256 routersLength;
		uint256 ladderPercentagesLength;
		uint256 currentTotalBalance;
		uint256 currentWeightedBalance;
		uint256 simulatedWeightedBalance;
		uint256 totalRoutedBalance;
		uint256 routersCount;
    }

	function _execute(
		AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit,
		address aggregator
	) internal {
		SubmitAllocatorParams memory params;

		Aggregator _aggregator = Aggregator(aggregator);

	    // address[] memory routers = _aggregator.getActiveRoutersDataList();
	    address[] memory routers = _aggregator.getRoutersDataList();

		// uint256[] memory balances = new uint256[](routers.length);
		uint256[] memory depositBalances = new uint256[](allocatorSubmit.routers.length);

		uint256 currentTotalBalance = _aggregator.getBalance();
		// 1000
		console.log("_allocate currentTotalBalance", currentTotalBalance);

		// withdraw from all routers that aren't included in deposits
	    for (uint256 i = 0; i < routers.length; i++) {
			address router = routers[i];
            if (router == address(0)) {
                continue;
            }

            // start amount for redeeming if needed
            // updates continously down the function
        	uint256 redeemAmount = IRouter(routers[i]).getBalance(allocatorSubmit.asset, address(_aggregator));
			console.log("_allocate redeemAmount", redeemAmount);

			// all routers
			// remove funds if needed
			for (uint256 ii = 0; ii < allocatorSubmit.routers.length; ii++) {
				if (allocatorSubmit.routers[ii] == routers[i]) {
					console.log("_allocate allocatorSubmit.routers[ii] == router");
					// check if already deposited
					// withdraw dif
					// this router allocator doesn't get deposited if redeemAmount > _amount
					// 500 = 1000 * 0.50

					// amount in new distribution
					uint256 _amount = currentTotalBalance.percentMul(allocatorSubmit.ladderPercentages[ii]);

					console.log("_allocate _amount", _amount);

					// odd/even issues with percent ratios require the following
					// store _amount for less calculations in next loop
		        	redeemAmount = redeemAmount > _amount ? redeemAmount.sub(_amount) : 0;
		        	console.log("_allocate redeemAmount == router", redeemAmount);

		        	// how much to redeem
		        	// store deposit amounts in storage array for less contract calls
					depositBalances[ii] = redeemAmount > 0 ? 0 : _amount;

					if (redeemAmount != 0) {
						console.log("_allocate redeemAmount > 0", redeemAmount);
						_aggregator.redeemFromRouter(
							routers[i],
							redeemAmount
						);
					}
					continue;
				}
			}
		}

		console.log("_allocate after first for loop");
		// all assets at this point are withdrawn if needed
		// re-get total balance of withdraws
		// uint256 availableBalance = IERC20(allocatorSubmit.asset).balanceOf(address(_aggregator));

		for (uint256 ii = 0; ii < allocatorSubmit.routers.length; ii++) {
			console.log("_allocate allocatorSubmit.routers.length depositBalances[ii]", depositBalances[ii]);
			if (depositBalances[ii] != 0) {

				// use available balance for math issues causing decimal imbalances
				uint256 availableBalance = IERC20(allocatorSubmit.asset).balanceOf(address(_aggregator));

				// if balance left is less than designated depositing amount then use balance
				// its possible decimal issues arise and this bypasses it
				if (availableBalance < depositBalances[ii]) {
					// if last, send remaining funds
					depositBalances[ii] = availableBalance;
				}

				// send funds to router
				_aggregator.depositRouter(
					allocatorSubmit.routers[ii],
					depositBalances[ii]
				);
			}
		}
	}

	function setAllocatorManager(address newAllocatorManager) external override onlyAllocatorManager {
		_allocatorManager = newAllocatorManager;
	}
}