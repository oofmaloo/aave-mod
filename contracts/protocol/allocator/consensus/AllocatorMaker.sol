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
// import {AllocatorController} from './AllocatorController.sol';
import {AllocatorDataTypes} from './libraries/AllocatorDataTypes.sol';
import {IAllocatorMaker} from './interfaces/IAllocatorMaker.sol';

import "hardhat/console.sol";

abstract contract AllocatorMaker is IAllocatorMaker {
    using SafeMath for uint256;
	using PercentageMath for uint256;
    using WadRayMath for uint256;
    using SafeERC20 for IERC20;

    mapping(address => AllocatorDataTypes.AssetData) internal _assets;

    mapping(uint256 => AllocatorDataTypes.AllocatorSubmit) internal _allocatorSubmits;

    mapping(uint256 => AllocatorDataTypes.AllocatorVote) internal _allocatorVotes;

    address internal _allocatorManager;

    uint256 public submitsCount;

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
        	asset.minBalance = config[i].minBalance;
			asset.minStakedBalance = config[i].minStakedBalance;
			asset.submitTimeRequirement = config[i].submitTimeRequirement;
			asset.maxAllocators = config[i].maxAllocators;
			asset.maxAllocatorsPeriod = config[i].maxAllocatorsPeriod;
			asset.active = true;
        }
    }

	function _allocatorSubmit(
		AllocatorDataTypes.AssetData storage asset,
		address validator,
		AllocatorDataTypes.AllocatorSubmitParams memory params
	) internal {
		Aggregator _aggregator = Aggregator(params.aggregator);
		console.log("submitAllocator 2", address(_aggregator));

		params.currentTotalBalance = _aggregator.getBalance();
		console.log("submitAllocator 3", params.currentTotalBalance);

        params.currentWeightedBalance = 0;
        params.simulatedWeightedBalance = 0;
        params.totalRoutedBalance = 0;
		params.routersCount = _aggregator._routersDataCount();

		console.log("submitAllocator before for 1");
		// ensure actually better
		// loop each router
        for (uint256 i = 0; i < params.routersCount; i++) {
			address router = _aggregator._routersDataList(i);
            // require(router != address(0));
            if (router == address(0)) {
                continue;
            }

        	uint256 currentBalance = IRouter(router).getBalance(params.asset, address(_aggregator));
			console.log("submitAllocator currentBalance", currentBalance);
            uint256 currentRate = IRouter(router).getPreviousInterestRate(params.asset);
			console.log("submitAllocator currentRate", currentRate);

			for (uint256 ii = 0; ii < params.routers.length; ii++) {
				console.log("submitAllocator for for");
	            if (router == params.routers[ii]) {
	            	console.log("submitAllocator for for if");
		        	uint256 liquidityAdded;
					uint256 liquidityTaken;
					console.log("submitAllocator for for b4 percentMul");
					uint256 _amount = params.currentTotalBalance.percentMul(params.ladderPercentages[ii]);
		        	if (currentBalance > _amount) {
		        		liquidityTaken = currentBalance.sub(_amount);
		    		} else if (currentBalance < _amount) {
		    			liquidityAdded = _amount.sub(currentBalance);
		    		}
					console.log("submitAllocator for for b4 getSimulatedInterestRate");
					// get rate based on added or removed liquidity
					uint256 simulatedRate = IRouter(params.routers[ii]).getSimulatedInterestRate(params.asset, liquidityAdded, liquidityTaken);

		            params.simulatedWeightedBalance += _amount.rayMul(simulatedRate);
				}
			}


            if (currentBalance == 0) {
                continue;
            }
            params.currentWeightedBalance += currentBalance.rayMul(currentRate);
			params.totalRoutedBalance += currentBalance;
        }
		console.log("submitAllocator after for 1", params.totalRoutedBalance);
        uint256 currentWeightedRate = params.currentWeightedBalance.rayDiv(params.totalRoutedBalance);
		console.log("submitAllocator after for currentWeightedRate", currentWeightedRate);
        uint256 simulatedWeightedRate = params.simulatedWeightedBalance.rayDiv(params.totalRoutedBalance);

        // removed for testing
        // require(currentWeightedRate <= simulatedWeightedRate, "Error: Current is greater");
		console.log("submitAllocator after require");

        AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit = _allocatorSubmits[submitsCount];
        allocatorSubmit.id = submitsCount;
		allocatorSubmit.submitter = params.caller;
		allocatorSubmit.delegator = params.delegator;
		allocatorSubmit.routers = params.routers;
		allocatorSubmit.asset = params.asset;
		allocatorSubmit.ladderPercentages = params.ladderPercentages;
		allocatorSubmit.onSubmitWeightedYield = currentWeightedRate;
		allocatorSubmit.onSubmitSimulatedWeightedYield = simulatedWeightedRate;
		allocatorSubmit.timestampSubmitted = block.timestamp;
		allocatorSubmit.active = true;

		// validator.AllocatorSubmit++;

        submitsCount++;
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

		// Aggregator _aggregator = Aggregator(_poolDataProvider.getAggregatorAddress(allocatorSubmit.asset));

		Aggregator _aggregator = Aggregator(aggregator);

	    address[] memory routers = _aggregator.getActiveRoutersDataList();

		// uint256[] memory balances = new uint256[](routers.length);
		uint256[] memory depositBalances = new uint256[](allocatorSubmit.routers.length);

		uint256 currentTotalBalance = _aggregator.getBalance();
		// 1000
		console.log("_allocate currentTotalBalance", currentTotalBalance);

		// withdraw from all routers that aren't included in deposits
	    for (uint256 i = 0; i < routers.length; i++) {

			// address router = _aggregator._routersDataList(i);
        	uint256 redeemAmount = IRouter(routers[i]).getBalance(allocatorSubmit.asset, address(_aggregator));
			console.log("_allocate redeemAmount", redeemAmount);
        	// balance - Used to store balance within router
        	// balances[i] = redeemAmount;
			// check new allo
			for (uint256 ii = 0; ii < allocatorSubmit.routers.length; ii++) {
				if (allocatorSubmit.routers[ii] == routers[i]) {
					console.log("_allocate allocatorSubmit.routers[ii] == router");
					// check if already deposited
					// withdraw dif
					// this router allocator doesn't get deposited if redeemAmount > _amount
					// 500 = 1000 * 0.50
					uint256 _amount = currentTotalBalance.percentMul(allocatorSubmit.ladderPercentages[ii]);

					console.log("_allocate _amount", _amount);

					// odd/even issues with percent ratios require the following
					// store _amount for less calculations in next loop
		        	redeemAmount = redeemAmount > _amount ? redeemAmount.sub(_amount) : 0;
		        	console.log("_allocate redeemAmount == router", redeemAmount);

					depositBalances[ii] = redeemAmount > 0 ? 0 : _amount;

					if (redeemAmount > 0) {
						console.log("_allocate redeemAmount > 0", redeemAmount);
						_aggregator.redeemFromRouter(
							routers[i],
							redeemAmount
						);
					}
				}
			}
		}

		console.log("_allocate after first for loop");
		// all assets at this point are withdrawn if needed
		// re-get total balance of withdraws
		// uint256 availableBalance = IERC20(allocatorSubmit.asset).balanceOf(address(_aggregator));

		for (uint256 ii = 0; ii < allocatorSubmit.routers.length; ii++) {
			console.log("_allocate allocatorSubmit.routers.length depositBalances[ii]", depositBalances[ii]);
			if (depositBalances[ii] > 0) {

				// use available balance for math issues causing decimal imbalances
				uint256 availableBalance = IERC20(allocatorSubmit.asset).balanceOf(address(_aggregator));

				// if (allocatorSubmit.routers.length == ii) {
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

	function _allocatorVote(
		AllocatorDataTypes.AllocatorVote storage allocatorVote,
		uint8 support,
		uint256 weight
	) internal {
		console.log("_allocatorVote");
		console.log("_allocatorVote support", support);
		console.log("_allocatorVote weight", weight);

		allocatorVote.hasVoted[msg.sender] = true;
        if (support == uint8(AllocatorDataTypes.VoteType.Against)) {
            allocatorVote.againstVotes += weight;
        } else if (support == uint8(AllocatorDataTypes.VoteType.For)) {
            allocatorVote.forVotes += weight;
        } else {
            revert("Allocator: invalid value for enum VoteType");
        }
	}

	function setAllocatorManager(address newAllocatorManager) external override onlyAllocatorManager {
		_allocatorManager = newAllocatorManager;
	}
}