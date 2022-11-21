// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IRouter} from "../../../interfaces/IRouter.sol";
import {IAllocator} from "../../../interfaces/IAllocator.sol";
import {Aggregator} from "../../../protocol/aggregator/Aggregator.sol";
import {PercentageMath} from '../../../protocol/libraries/math/PercentageMath.sol';
import {WadRayMath} from '../../../protocol/libraries/math/WadRayMath.sol';
import {AllocatorDataTypes} from './libraries/AllocatorDataTypes.sol';
import {IAllocatorMaker} from './interfaces/IAllocatorMaker.sol';
import {IPriceOracle} from '../../../interfaces/IPriceOracle.sol';

import "hardhat/console.sol";

/**
 * @title MockAllocatorKeeperMaker
 */
abstract contract MockAllocatorKeeperMaker is IAllocatorMaker {
    using SafeMath for uint256;
	using PercentageMath for uint256;
    using WadRayMath for uint256;
    using SafeERC20 for IERC20;

    address internal wethAddress = 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9;

    mapping(address => AllocatorDataTypes.AssetData) internal _assets;

    // mapping(uint256 => AllocatorDataTypes.AllocatorSubmit) internal _allocatorSubmits;

    mapping(address => mapping(uint256 => AllocatorDataTypes.AllocatorSubmit)) internal _allocatorSubmits;
    mapping(address => uint256) public allocatorSubmitsCount;

    // router => model
    mapping(address => address) public _routersInterestRateModels;

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

    function _configureRouterModels(address[] memory routers, address[] memory models) internal {
        for (uint256 i = 0; i < routers.length; i++) {
        	_routersInterestRateModels[routers[i]] = models[i];
        }
    }

	function _allocatorSubmitPlain(
		AllocatorDataTypes.AllocatorSubmitParams memory params
	) internal {
		allocatorSubmitsCount[params.asset]++; // last submit is always latest and cant be zero 0
        AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit = _allocatorSubmits[params.asset][allocatorSubmitsCount[params.asset]];
        allocatorSubmit.id = allocatorSubmitsCount[params.asset];
		allocatorSubmit.submitter = params.caller;
		allocatorSubmit.routers = params.routers;
		allocatorSubmit.asset = params.asset;
		allocatorSubmit.aggregator = params.aggregator;
		allocatorSubmit.ladderPercentages = params.ladderPercentages;
		allocatorSubmit.timestampSubmitted = block.timestamp;
		allocatorSubmit.active = true;
        // allocatorSubmitsCount[params.asset]++;
	}

	function _allocatorChecker(
		AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit
	) internal view returns (bool) {

		SubmitAllocatorParams memory params;

		Aggregator _aggregator = Aggregator(allocatorSubmit.aggregator);

		params.currentTotalBalance = _aggregator.getRoutersBalance();

        params.currentWeightedBalance = 0;
        params.simulatedWeightedBalance = 0;
        params.totalRoutedBalance = 0;

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

        	// uint256 currentBalance = IRouter(router).getBalance(allocatorSubmit.asset, allocatorSubmit.aggregator);
        	uint256 currentBalance = IRouter(router).getBalanceStored(allocatorSubmit.asset, allocatorSubmit.aggregator);
        	console.log("currentBalance", currentBalance);
            uint256 currentRate = IRouter(router).getPreviousInterestRate(allocatorSubmit.asset);
            console.log("currentRate", currentRate);

            // check if matches any of new distr
			for (uint256 ii = 0; ii < allocatorSubmit.routers.length; ii++) {
				// get new distr data to compare against current
	            if (router == allocatorSubmit.routers[ii]) {
		        	uint256 liquidityAdded = 0;
					uint256 liquidityTaken = 0;

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
            console.log("currentWeightedBalance", params.currentWeightedBalance);
			params.totalRoutedBalance += currentBalance;
        }

        uint256 currentWeightedRate = params.currentWeightedBalance.rayDiv(params.totalRoutedBalance);
        console.log("currentWeightedRate  ", currentWeightedRate);

        uint256 simulatedWeightedRate = params.simulatedWeightedBalance.rayDiv(params.totalRoutedBalance);
        console.log("simulatedWeightedRate", simulatedWeightedRate);

        if (simulatedWeightedRate < currentWeightedRate) {
        	return false;
        } else {
        	return true;
        }
	}

	function _allocatorParamsChecker(
		AllocatorDataTypes.AllocatorSubmitParams memory allocatorSubmit
	) internal view returns (bool) {
		console.log("_allocatorParamsChecker");
		ExecuteAllocatorParams memory params;

		// SubmitAllocatorParams memory params;

		Aggregator _aggregator = Aggregator(allocatorSubmit.aggregator);

		params.currentTotalBalance = _aggregator.getRoutersBalance();

        params.currentWeightedBalance = 0;
        params.simulatedWeightedBalance = 0;
        params.totalRoutedBalance = 0;

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

        	// params.currentBalance = IRouter(router).getBalance(allocatorSubmit.asset, allocatorSubmit.aggregator);
        	params.currentBalance = IRouter(router).getBalanceStored(allocatorSubmit.asset, allocatorSubmit.aggregator);
        	console.log("currentBalance", params.currentBalance);
            params.currentRate = IRouter(router).getPreviousInterestRate(allocatorSubmit.asset);
            console.log("currentRate", params.currentRate);

            // check if matches any of new distr
			for (uint256 ii = 0; ii < allocatorSubmit.routers.length; ii++) {
				// get new distr data to compare against current
	            if (router == allocatorSubmit.routers[ii]) {

					uint256 _amount = params.currentTotalBalance.percentMul(allocatorSubmit.ladderPercentages[ii]);
					params.liquidityTaken = 0;
					params.liquidityAdded = 0;
		        	if (params.currentBalance > _amount) {
		        		params.liquidityTaken = params.currentBalance - _amount;
		    		} else if (params.currentBalance < _amount) {
		    			params.liquidityAdded = _amount - params.currentBalance;
		    		}

					// get rate based on added or removed liquidity
					uint256 simulatedRate = IRouter(router).getSimulatedInterestRate(
						allocatorSubmit.asset,
						params.liquidityAdded,
						params.liquidityTaken
					);

		            params.simulatedWeightedBalance += _amount.rayMul(simulatedRate);

		            // continue to next
		            continue;
				}
			}

            if (params.currentBalance == 0) {
                continue;
            }
            params.currentWeightedBalance += params.currentBalance.rayMul(params.currentRate);
            console.log("_allocatorParamsChecker currentWeightedBalance", params.currentWeightedBalance);
			params.totalRoutedBalance += params.currentBalance;
        }

        params.currentWeightedRate = params.currentWeightedBalance.rayDiv(params.totalRoutedBalance);
        console.log("_allocatorParamsChecker currentWeightedRate  ", params.currentWeightedRate);

        params.simulatedWeightedRate = params.simulatedWeightedBalance.rayDiv(params.totalRoutedBalance);
        console.log("_allocatorParamsChecker simulatedWeightedRate", params.simulatedWeightedRate);

        if (params.simulatedWeightedRate < params.currentWeightedRate) {
        	return false;
        } else {
        	return true;
        }
	}

	// function _allocatorCheckQueue(
	// 	AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit
	// ) internal view returns (uint256) {
	// 	SubmitAllocatorParams memory params;

	// 	// if executed or doesnt exist
	// 	if (allocatorSubmit.executed || !allocatorSubmit.active) {
	// 		return 0;
	// 	}

	// 	Aggregator _aggregator = Aggregator(allocatorSubmit.aggregator);

	// 	params.currentTotalBalance = _aggregator.getRoutersBalance();
 //        params.currentWeightedBalance = 0;
 //        params.simulatedWeightedBalance = 0;
 //        params.totalRoutedBalance = 0;

	// 	address[] memory routers = _aggregator.getRoutersDataList();

	// 	// ensure actually better
	// 	// loop each router
 //        for (uint256 i = 0; i < routers.length; i++) {
	// 		address router = routers[i];
 //            if (router == address(0)) {
 //                continue;
 //            }

 //        	uint256 currentBalance = IRouter(router).getBalance(allocatorSubmit.asset, allocatorSubmit.aggregator);
 //            uint256 currentRate = IRouter(router).getPreviousInterestRate(allocatorSubmit.asset);

 //            // check if matches any of new distr
	// 		for (uint256 ii = 0; ii < allocatorSubmit.routers.length; ii++) {
	// 			// get new distr data to compare against current
	//             if (router == allocatorSubmit.routers[ii]) {
	// 	        	uint256 liquidityAdded;
	// 				uint256 liquidityTaken;

	// 				uint256 _amount = params.currentTotalBalance.percentMul(allocatorSubmit.ladderPercentages[ii]);
	// 	        	if (currentBalance > _amount) {
	// 	        		liquidityTaken = currentBalance.sub(_amount);
	// 	    		} else if (currentBalance < _amount) {
	// 	    			liquidityAdded = _amount.sub(currentBalance);
	// 	    		}

	// 				// get rate based on added or removed liquidity
	// 				uint256 simulatedRate = IRouter(allocatorSubmit.routers[ii]).getSimulatedInterestRate(allocatorSubmit.asset, liquidityAdded, liquidityTaken);

	// 	            params.simulatedWeightedBalance += _amount.rayMul(simulatedRate);

	// 	            // continue to next
	// 	            continue;
	// 			}
	// 		}
	// 		params.totalRoutedBalance += currentBalance;
 //        }

 //        uint256 simulatedWeightedRate = params.simulatedWeightedBalance.rayDiv(params.totalRoutedBalance);

 //        return simulatedWeightedRate;
	// }

    struct SubmitAllocatorParams {
		address underlyingAsset;
		uint256 currentTotalBalance;
		uint256 currentWeightedBalance;
		uint256 simulatedWeightedBalance;
		uint256 totalRoutedBalance;
    }

	function _execute(
		AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit
	) internal {
		console.log("_execute start");
		SubmitAllocatorParams memory params;

		Aggregator _aggregator = Aggregator(allocatorSubmit.aggregator);

	    // address[] memory routers = _aggregator.getActiveRoutersDataList();
	    address[] memory routers = _aggregator.getRoutersDataList();

		uint256[] memory depositBalances = new uint256[](allocatorSubmit.routers.length);

		uint256 currentTotalBalance = _aggregator.getRoutersBalance();
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

		console.log("allocatorSubmit.routers.length", allocatorSubmit.routers.length);
		console.log("depositBalances.length", depositBalances.length);

		for (uint256 i = 0; i < allocatorSubmit.routers.length; i++) {
			console.log("_allocate allocatorSubmit.routers.length depositBalances[i]", depositBalances[i]);
			if (depositBalances[i] != 0) {

				// use available balance for math issues causing decimal imbalances
				uint256 availableBalance = IERC20(allocatorSubmit.asset).balanceOf(address(_aggregator));

				// if balance left is less than designated depositing amount then use balance
				// its possible decimal issues arise and this bypasses it
				if (availableBalance < depositBalances[i]) {
					// if last, send remaining funds
					depositBalances[i] = availableBalance;
				}

				// send funds to router
				_aggregator.depositRouter(
					allocatorSubmit.routers[i],
					depositBalances[i]
				);
			}
		}
		_aggregator.setLastAllocated();
	}

    struct ExecuteAllocatorParams {
		address underlyingAsset;
		uint256 currentTotalBalance;
		uint256 currentWeightedBalance;
		uint256 simulatedWeightedBalance;
		uint256 totalRoutedBalance;
		uint256 redeemAmount;
		uint256 currentBalance;
		uint256 currentRate;
		uint256 liquidityAdded;
		uint256 liquidityTaken;
		uint256 currentWeightedRate;
		uint256 simulatedWeightedRate;
		// uint256 allocationAmount;
    }

	function _checkAndExecute(
		AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit
	) internal {
		ExecuteAllocatorParams memory params;

		Aggregator _aggregator = Aggregator(allocatorSubmit.aggregator);

	    // address[] memory routers = _aggregator.getActiveRoutersDataList();
	    address[] memory routers = _aggregator.getRoutersDataList();
		uint256[] memory depositBalances = new uint256[](allocatorSubmit.routers.length);

		uint256 currentTotalBalance = _aggregator.getRoutersBalance();

		params.underlyingAsset = allocatorSubmit.asset;

		// reset to 0 incase added in submit
        params.currentWeightedBalance = 0;
        params.simulatedWeightedBalance = 0;

		// withdraw from all routers that aren't included in deposits
	    for (uint256 i = 0; i < routers.length; i++) {
			address router = routers[i];
            if (router == address(0)) {
                continue;
            }

            // start amount for redeeming if needed
            // updates continously down the function
        	// params.redeemAmount = IRouter(router).getBalance(params.underlyingAsset, address(_aggregator));
        	params.redeemAmount = IRouter(router).getBalanceStored(params.underlyingAsset, address(_aggregator));

        	// checker code
        	params.currentBalance = params.redeemAmount;
            params.currentRate = IRouter(router).getPreviousInterestRate(params.underlyingAsset);
            

			// all routers
			// remove funds if needed
			for (uint256 ii = 0; ii < allocatorSubmit.routers.length; ii++) {
				if (allocatorSubmit.routers[ii] == router) {
		            // execute code
					// check if already deposited
					// withdraw dif
					// this router allocator doesn't get deposited if redeemAmount > _amount

					// amount in new distribution
					uint256 _amount = currentTotalBalance.percentMul(allocatorSubmit.ladderPercentages[ii]);

					// odd/even issues with percent ratios require the following
					// store _amount for less calculations in next loop
		        	params.redeemAmount = params.redeemAmount > _amount ? params.redeemAmount - _amount : 0;

		        	// how much to redeem
		        	// store deposit amounts in storage array for less contract calls
					depositBalances[ii] = params.redeemAmount > 0 ? 0 : _amount;

					if (params.redeemAmount != 0) {
						_aggregator.redeemFromRouter(
							router,
							params.redeemAmount
						);
					}

					// checker code
					params.liquidityTaken = 0;
					params.liquidityAdded = 0;

		        	if (params.currentBalance > _amount) {
		        		params.liquidityTaken = params.currentBalance - _amount;
		    		} else if (params.currentBalance < _amount) {
		    			params.liquidityAdded = _amount - params.currentBalance;
		    		}

					// get rate based on added or removed liquidity
					uint256 simulatedRate = IRouter(router).getSimulatedInterestRate(
						params.underlyingAsset,
						params.liquidityAdded,
						params.liquidityTaken
					);

		            params.simulatedWeightedBalance += _amount.rayMul(simulatedRate);

					continue;
				}
			}
            if (params.redeemAmount == 0) {
                continue;
            }

            params.currentWeightedBalance += params.currentBalance.rayMul(params.currentRate);
		}

        params.currentWeightedRate = params.currentWeightedBalance.rayDiv(currentTotalBalance);
        params.simulatedWeightedRate = params.simulatedWeightedBalance.rayDiv(currentTotalBalance);
        require(params.simulatedWeightedRate > params.currentWeightedRate, "ERROR.ALLOCATION_NO_BETTER");


		// all assets at this point are withdrawn if needed
		// re-get total balance of withdraws
		for (uint256 i = 0; i < allocatorSubmit.routers.length; i++) {
			if (depositBalances[i] != 0) {

				// use available balance for math issues causing decimal imbalances
				uint256 availableBalance = IERC20(params.underlyingAsset).balanceOf(address(_aggregator));

				// if balance left is less than designated depositing amount then use balance
				// its possible decimal issues arise and this bypasses it
				if (availableBalance < depositBalances[i]) {
					// if last, send remaining funds
					depositBalances[i] = availableBalance;
				}

				// send funds to router
				_aggregator.depositRouter(
					allocatorSubmit.routers[i],
					depositBalances[i]
				);
			}
		}

		_aggregator.setLastAllocated();
	}

	function _executeWithCheck(
		AllocatorDataTypes.AllocatorSubmitParams memory allocatorSubmit
		// AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit
	) internal {
		ExecuteAllocatorParams memory params;

		Aggregator _aggregator = Aggregator(allocatorSubmit.aggregator);

	    // address[] memory routers = _aggregator.getActiveRoutersDataList();
	    address[] memory routers = _aggregator.getRoutersDataList();
		uint256[] memory depositBalances = new uint256[](allocatorSubmit.routers.length);

		uint256 currentTotalBalance = _aggregator.getRoutersBalance();
		console.log("currentTotalBalance", currentTotalBalance);

		params.underlyingAsset = allocatorSubmit.asset;

		// reset to 0 incase added in submit
        params.currentWeightedBalance = 0;
        params.simulatedWeightedBalance = 0;

		// withdraw from all routers that aren't included in deposits
	    for (uint256 i = 0; i < routers.length; i++) {
			address router = routers[i];
			console.log("i", i);
			console.log("router", router);
            if (router == address(0)) {
                continue;
            }

            // start amount for redeeming if needed
            // updates continously down the function
        	// params.redeemAmount = IRouter(router).getBalance(params.underlyingAsset, address(_aggregator));
        	params.redeemAmount = IRouter(router).getBalanceStored(params.underlyingAsset, address(_aggregator));


        	// checker code
        	params.currentBalance = params.redeemAmount;
            params.currentRate = IRouter(router).getPreviousInterestRate(params.underlyingAsset);
            

			// all routers
			// remove funds if needed
			for (uint256 ii = 0; ii < allocatorSubmit.routers.length; ii++) {

				if (allocatorSubmit.routers[ii] == router) {
		            // execute code
					// check if already deposited
					// withdraw dif
					// this router allocator doesn't get deposited if redeemAmount > _amount
					// amount in new distribution
					console.log("params.currentBalance", params.currentBalance);
					uint256 _amount = currentTotalBalance.percentMul(allocatorSubmit.ladderPercentages[ii]);
					console.log("_amount", _amount);
					// odd/even issues with percent ratios require the following
					// store _amount for less calculations in next loop
		        	params.redeemAmount = params.currentBalance > _amount ? params.currentBalance - _amount : 0;
		        	console.log("redeemAmount", params.redeemAmount);
		        	// how much to redeem
		        	// store deposit amounts in storage array for less contract calls
					// depositBalances[ii] = params.redeemAmount > 0 ? 0 : _amount;
					// depositBalances[ii] = params.redeemAmount > 0 ? 0 : _amount - params.currentBalance;
					depositBalances[ii] = _amount > params.currentBalance ? _amount - params.currentBalance : 0;
					console.log("depositBalances[ii]", depositBalances[ii]);

					if (params.redeemAmount != 0) {
						console.log("Aggregator Balance bef", IERC20(params.underlyingAsset).balanceOf(address(_aggregator)));
						_aggregator.redeemFromRouter(
							router,
							params.redeemAmount
						);
						console.log("Aggregator Balance aft", IERC20(params.underlyingAsset).balanceOf(address(_aggregator)));
					}

					// checker code
					params.liquidityTaken = 0;
					params.liquidityAdded = 0;

		        	if (params.currentBalance > _amount) {
		        		params.liquidityTaken = params.currentBalance - _amount;
		    		} else if (params.currentBalance < _amount) {
		    			params.liquidityAdded = _amount - params.currentBalance;
		    		}

					// get rate based on added or removed liquidity
					uint256 simulatedRate = IRouter(router).getSimulatedInterestRate(
						params.underlyingAsset,
						params.liquidityAdded,
						params.liquidityTaken
					);

		            params.simulatedWeightedBalance += _amount.rayMul(simulatedRate);

					continue;
				}
			}
            if (params.redeemAmount == 0) {
                continue;
            }

            params.currentWeightedBalance += params.currentBalance.rayMul(params.currentRate);
		}
        params.currentWeightedRate = params.currentWeightedBalance.rayDiv(currentTotalBalance);
        params.simulatedWeightedRate = params.simulatedWeightedBalance.rayDiv(currentTotalBalance);
        require(params.simulatedWeightedRate > params.currentWeightedRate, "ERROR.ALLOCATION_NO_BETTER");


		// all assets at this point are withdrawn if needed
		// re-get total balance of withdraws
		for (uint256 i = 0; i < allocatorSubmit.routers.length; i++) {
			console.log("depositBalances[i]1", depositBalances[i]);
			if (depositBalances[i] != 0) {
				console.log("depositBalances[i]2", i, depositBalances[i]);

				// use available balance for math issues causing decimal imbalances
				uint256 availableBalance = IERC20(params.underlyingAsset).balanceOf(address(_aggregator));
				console.log("availableBalance", availableBalance);
				// if balance left is less than designated depositing amount then use balance
				// its possible decimal issues arise and this bypasses it
				if (availableBalance < depositBalances[i]) {
					// if last, send remaining funds
					depositBalances[i] = availableBalance;
				}
				console.log("depositBalances[i]3", depositBalances[i]);
				// send funds to router
				_aggregator.depositRouter(
					allocatorSubmit.routers[i],
					depositBalances[i]
				);
			}
		}

		allocatorSubmitsCount[allocatorSubmit.asset]++;
        AllocatorDataTypes.AllocatorSubmit storage newAllocatorSubmit = _allocatorSubmits[allocatorSubmit.asset][allocatorSubmitsCount[allocatorSubmit.asset]];
        newAllocatorSubmit.id = allocatorSubmitsCount[allocatorSubmit.asset];
		// newAllocatorSubmit.submitter = allocatorSubmit.caller;
		// newAllocatorSubmit.routers = allocatorSubmit.routers;
		// newAllocatorSubmit.asset = allocatorSubmit.asset;
		newAllocatorSubmit.aggregator = allocatorSubmit.aggregator;
		// newAllocatorSubmit.ladderPercentages = allocatorSubmit.ladderPercentages;
		newAllocatorSubmit.timestampSubmitted = block.timestamp;
		// newAllocatorSubmit.active = true;
		// newAllocatorSubmit.executed = true;

		_aggregator.setLastAllocated();
	}

	function _executeWithCheck2(
		AllocatorDataTypes.AllocatorSubmitParams memory allocatorSubmit
	) internal {
		ExecuteAllocatorParams memory params;

		Aggregator _aggregator = Aggregator(allocatorSubmit.aggregator);

	    address[] memory routers = _aggregator.getRoutersDataList();
		uint256[] memory depositBalances = new uint256[](allocatorSubmit.routers.length);

		uint256 currentTotalBalance = _aggregator.getRoutersBalance();
		console.log("currentTotalBalance", currentTotalBalance);

		params.underlyingAsset = allocatorSubmit.asset;

		// reset to 0 incase added in submit
        params.currentWeightedBalance = 0;
        params.simulatedWeightedBalance = 0;

		// withdraw from all routers that aren't included in deposits
	    for (uint256 i = 0; i < routers.length; i++) {
			address router = routers[i];
			// console.log("i", i);
			// console.log("router", router);
            if (router == address(0)) {
                continue;
            }

            // start amount for redeeming if needed
            // updates continously down the function
        	// params.redeemAmount = IRouter(router).getBalance(params.underlyingAsset, address(_aggregator));
        	params.redeemAmount = IRouter(router).getBalanceStored(params.underlyingAsset, address(_aggregator));

        	// checker code
        	params.currentBalance = params.redeemAmount;
            params.currentRate = IRouter(router).getPreviousInterestRate(params.underlyingAsset);
            

            bool isIncluded = false;
			// all routers
			// remove funds if needed
			for (uint256 ii = 0; ii < allocatorSubmit.routers.length; ii++) {

				if (allocatorSubmit.routers[ii] == router) {
					isIncluded = true;
		            // execute code
					// check if already deposited
					// withdraw dif
					// this router allocator doesn't get deposited if redeemAmount > _amount
					// amount in new distribution
					// console.log("params.currentBalance", params.currentBalance);
					uint256 _amount = currentTotalBalance.percentMul(allocatorSubmit.ladderPercentages[ii]);

					// odd/even issues with percent ratios require the following
					// store _amount for less calculations in next loop
		        	params.redeemAmount = params.currentBalance > _amount ? params.currentBalance - _amount : 0;

		        	// how much to redeem
		        	// store deposit amounts in storage array for less contract calls
					depositBalances[ii] = _amount > params.currentBalance ? _amount - params.currentBalance : 0;

					if (params.redeemAmount != 0) {
						_aggregator.redeemFromRouter(
							router,
							params.redeemAmount
						);
					}

					// checker code

					// params.liquidityTaken = 0;
					// params.liquidityAdded = 0;

		   //      	if (params.currentBalance > _amount) {
		   //      		params.liquidityTaken = params.currentBalance - _amount;
		   //  		} else if (params.currentBalance < _amount) {
		   //  			params.liquidityAdded = _amount - params.currentBalance;
		   //  		}

					// get rate based on added or removed liquidity
					// liquidityTaken after redeeming
					// since we redeemed already, only add
					uint256 simulatedRate = IRouter(router).getSimulatedInterestRate(
						params.underlyingAsset,
						depositBalances[ii], // params.liquidityAdded
						0 // params.liquidityTaken
					);

		            params.simulatedWeightedBalance += _amount.rayMul(simulatedRate);

		            // redeem after checker
					// if (params.redeemAmount != 0) {
					// 	_aggregator.redeemFromRouter(
					// 		router,
					// 		params.redeemAmount
					// 	);
					// }

					continue;
				}
			}

			// if not in new
			if (!isIncluded) {
				if (params.redeemAmount != 0) {
					_aggregator.redeemFromRouter(
						router,
						params.redeemAmount
					);
				}
			}

            if (params.redeemAmount == 0) {
                continue;
            }

            params.currentWeightedBalance += params.currentBalance.rayMul(params.currentRate);
		}
        params.currentWeightedRate = params.currentWeightedBalance.rayDiv(currentTotalBalance);
        params.simulatedWeightedRate = params.simulatedWeightedBalance.rayDiv(currentTotalBalance);
        require(params.simulatedWeightedRate > params.currentWeightedRate, "ERROR.ALLOCATION_NO_BETTER");


		// all assets at this point are withdrawn if needed
		// re-get total balance of withdraws
		for (uint256 i = 0; i < allocatorSubmit.routers.length; i++) {
			if (depositBalances[i] != 0) {
				// use available balance for math issues causing decimal imbalances
				uint256 availableBalance = IERC20(params.underlyingAsset).balanceOf(address(_aggregator));
				// if balance left is less than designated depositing amount then use balance
				// its possible decimal issues arise and this bypasses it
				if (availableBalance < depositBalances[i]) {
					// if last, send remaining funds
					depositBalances[i] = availableBalance;
				}
				// send funds to router
				_aggregator.depositRouter(
					allocatorSubmit.routers[i],
					depositBalances[i]
				);
			}
		}

		// allocatorSubmitsCount[allocatorSubmit.asset]++;
  //       AllocatorDataTypes.AllocatorSubmit storage newAllocatorSubmit = _allocatorSubmits[allocatorSubmit.asset][allocatorSubmitsCount[allocatorSubmit.asset]];
  //       newAllocatorSubmit.id = allocatorSubmitsCount[allocatorSubmit.asset];
		// newAllocatorSubmit.aggregator = allocatorSubmit.aggregator;
		// newAllocatorSubmit.timestampSubmitted = block.timestamp;

		_aggregator.setLastAllocated();
	}

	// function _executeAlgo(
	// 	AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit,
	// 	address aggregator
	// ) internal {
		// if (sum(x_1, x_2) > liquidity) {
		// 	liquidity = liquidity // 100
		// 	for (results) {
		// 		result_delta = results[i] - results[i+1] // 64.5
		// 		amount = ratios[i]*liquidity // 68.3
		// 		// 64.5 > 55.5
		// 		if (result_delta > results[i+1]) 
		// 			amount  = result_delta // 64.5
		// 		_break bool;
		// 		if (liquidity < results[i] - results[i+1])
		// 			_break = true;
		// 		deposit(amount);
		// 		// after 1 iteration
		// 		// --- liquidity = 35.5
		// 	}
		// }
	// }


	// function _checkAndExecuteWithGas(
	// 	AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit
	// ) internal {
	// 	// uint256 startGas = gasleft();

	// 	ExecuteAllocatorParams memory params;

	// 	Aggregator _aggregator = Aggregator(allocatorSubmit.aggregator);

	//     // address[] memory routers = _aggregator.getActiveRoutersDataList();
	//     address[] memory routers = _aggregator.getRoutersDataList();
	// 	uint256[] memory depositBalances = new uint256[](allocatorSubmit.routers.length);

	// 	uint256 currentTotalBalance = _aggregator.getRoutersBalance();

	// 	params.underlyingAsset = allocatorSubmit.asset;

	// 	// reset to 0 incase added in submit
 //        params.currentWeightedBalance = 0;
 //        params.simulatedWeightedBalance = 0;

	// 	// withdraw from all routers that aren't included in deposits
	//     for (uint256 i = 0; i < routers.length; i++) {
	// 		address router = routers[i];
 //            if (router == address(0)) {
 //                continue;
 //            }

 //            // start amount for redeeming if needed
 //            // updates continously down the function
 //        	params.redeemAmount = IRouter(router).getBalance(params.underlyingAsset, address(_aggregator));

 //        	// checker code
 //        	params.currentBalance = params.redeemAmount;
 //            params.currentRate = IRouter(router).getPreviousInterestRate(params.underlyingAsset);
            

	// 		// all routers
	// 		// remove funds if needed
	// 		for (uint256 ii = 0; ii < allocatorSubmit.routers.length; ii++) {
	// 			if (allocatorSubmit.routers[ii] == router) {
	// 	            // execute code
	// 				// check if already deposited
	// 				// withdraw dif
	// 				// this router allocator doesn't get deposited if redeemAmount > _amount

	// 				// amount in new distribution
	// 				uint256 _amount = currentTotalBalance.percentMul(allocatorSubmit.ladderPercentages[ii]);

	// 				// odd/even issues with percent ratios require the following
	// 				// store _amount for less calculations in next loop
	// 	        	params.redeemAmount = params.redeemAmount > _amount ? params.redeemAmount - _amount : 0;

	// 	        	// how much to redeem
	// 	        	// store deposit amounts in storage array for less contract calls
	// 				depositBalances[ii] = params.redeemAmount > 0 ? 0 : _amount;

	// 				if (params.redeemAmount != 0) {
	// 					_aggregator.redeemFromRouter(
	// 						router,
	// 						params.redeemAmount
	// 					);
	// 				}

	// 				// checker code

	// 	        	if (params.currentBalance > _amount) {
	// 	        		params.liquidityTaken = params.currentBalance - _amount;
	// 	    		} else if (params.currentBalance < _amount) {
	// 	    			params.liquidityAdded = _amount - params.currentBalance;
	// 	    		}

	// 				// get rate based on added or removed liquidity
	// 				uint256 simulatedRate = IRouter(router).getSimulatedInterestRate(
	// 					params.underlyingAsset,
	// 					params.liquidityAdded,
	// 					params.liquidityTaken
	// 				);

	// 	            params.simulatedWeightedBalance += _amount.rayMul(simulatedRate);

	// 				continue;
	// 			}
	// 		}
 //            if (params.redeemAmount == 0) {
 //                continue;
 //            }

 //            params.currentWeightedBalance += params.currentBalance.rayMul(params.currentRate);
	// 	}

 //        params.currentWeightedRate = params.currentWeightedBalance.rayDiv(currentTotalBalance);
 //        params.simulatedWeightedRate = params.simulatedWeightedBalance.rayDiv(currentTotalBalance);
 //        require(params.simulatedWeightedRate > params.currentWeightedRate, "ERROR.ALLOCATION_NOT_BETTER");


	// 	// all assets at this point are withdrawn if needed
	// 	// re-get total balance of withdraws
	// 	for (uint256 i = 0; i < allocatorSubmit.routers.length; i++) {
	// 		if (depositBalances[i] != 0) {

	// 			// use available balance for math issues causing decimal imbalances
	// 			uint256 availableBalance = IERC20(params.underlyingAsset).balanceOf(address(_aggregator));

	// 			// if balance left is less than designated depositing amount then use balance
	// 			// its possible decimal issues arise and this bypasses it
	// 			if (availableBalance < depositBalances[i]) {
	// 				// if last, send remaining funds
	// 				depositBalances[i] = availableBalance;
	// 			}

	// 			// send funds to router
	// 			_aggregator.depositRouter(
	// 				allocatorSubmit.routers[i],
	// 				depositBalances[i]
	// 			);
	// 		}
	// 	}

	// 	// uint256 ethPrice = IPriceOracle(oracle).getAssetPrice(wethAddress);
	// 	// uint256 gasPrice = tx.gasprice;
	// 	// uint256 gasUsed = startGas - gasleft();
	// 	// uint256 value = gasPrice * gasUsed * (ethPrice / 1e8);

	// 	// console.log("value", value);
	// }

	// function _getMinYieldIncrease(
	// 	AllocatorDataTypes.AllocatorSubmit storage prevAllocatorSubmit,
	// 	AllocatorDataTypes.AllocatorSubmitParams memory newParams,
	// 	address oracle
	// ) internal view returns (uint256) {
	// 	uint256 increase = 0;

	// 	uint256 timeSinceLastAllocation = 0;
	// 	uint256 totalBalance = 0;

	// 	// cost to run tx
	// 	uint256 price = IPriceOracle(oracle).getPrice(newParams.asset);
	// 	uint256 gasWei = tx.gasprice;


	// 	uint256 maxGasCost = balance.rayDiv(timeSinceLastAllocation);

	// 	require(gas <= maxGasCost);
	// }
	
	// function _getMinYieldIncrease(
	// 	AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit,
	// 	address oracle
	// ) internal view returns (uint256) {
	// 	console.log("_getMinYieldIncrease");

	// 	Aggregator _aggregator = Aggregator(allocatorSubmit.aggregator);
	// 	(uint256 totalRoutedBalance, uint256 weightedRate) = _aggregator.getRouterWeightedInterestRate();
	// 	console.log("totalRoutedBalance", totalRoutedBalance);
	// 	console.log("weightedRate", weightedRate);

	// 	return _getMinYieldIncrease(
	// 		allocatorSubmit.asset,
	// 		totalRoutedBalance.rayMul(weightedRate),
	// 		allocatorSubmit.timestampAllocated,
	// 		oracle
	// 	);
	// }

	// function _getMinYieldIncrease(
	// 	address asset,
	// 	address aggregator,
	// 	address oracle
	// ) internal view returns (uint256) {

	// 	Aggregator _aggregator = Aggregator(allocatorSubmit.aggregator);
	// 	(uint256 totalRoutedBalance, uint256 weightedRate) = _aggregator.getRouterWeightedInterestRate();

	// 	return maxGasCost;
	// }

	// function _getMinYieldIncrease(
	// 	address asset,
	// 	uint256 currentAnnualYield,
	// 	uint256 prevTimestamp,
	// 	address oracle
	// ) internal view returns (uint256) {
	// 	console.log("asset", asset);
	// 	console.log("currentAnnualYield", currentAnnualYield);
	// 	console.log("prevTimestamp", prevTimestamp);
	// 	uint256 startGas = gasleft();

	// 	console.log("startGas", startGas);

	// 	// cost to run tx
	// 	uint256 ethPrice = IPriceOracle(oracle).getAssetPrice(wethAddress);
	// 	console.log("ethPrice", ethPrice);
	// 	uint256 gasPrice = tx.gasprice;
	// 	console.log("gasPrice", gasPrice);
	// 	// uint256 gasValue = price / 1e8 * gasWei;
	// 	// uint256 maxGasCost = currentAnnualYield / 31556926 * (block.timestamp - prevTimestamp);
	// 	// console.log("maxGasCost", maxGasCost);

	// 	// uint256 maxGasCost = gasValue / 31556926 * (block.timestamp - prevTimestamp);
	// 	// console.log("maxGasCost", maxGasCost);
	// 	uint256 gasUsed = startGas - gasleft();

	// 	console.log("gasUsed", gasUsed);

	// 	uint256 value = gasPrice * gasUsed * (ethPrice / 1e8);

	// 	return value;
	// }

	function setAllocatorManager(address newAllocatorManager) external override onlyAllocatorManager {
		_allocatorManager = newAllocatorManager;
	}
}