// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IAaveProtocolDataProvider} from '../../../../protocol/routers/aave/test/interfaces/IAaveProtocolDataProvider.sol';
import {WadRayMath} from '../../../../protocol/libraries/math/WadRayMath.sol';
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IInterestRateModelStandard} from '../interfaces/IInterestRateModelStandard.sol';

import "hardhat/console.sol";

contract MockInterestRateModelStandard is IInterestRateModelStandard {
	using WadRayMath for uint256;

	address public _aaveDataProvider;

	/**
	* @dev This constant represents the usage ratio at which the pool aims to obtain most competitive borrow rates.
	* Expressed in ray
	**/
	uint256 public immutable OPTIMAL_USAGE_RATIO;

	/**
	* @dev This constant represents the excess usage ratio above the optimal. It's always equal to
	* 1-optimal usage ratio. Added as a constant here for gas optimizations.
	* Expressed in ray
	**/
	uint256 public immutable MAX_EXCESS_USAGE_RATIO;

	// IRouter public immutable ROUTER;

	// Base variable borrow rate when usage rate = 0. Expressed in ray
	uint256 internal immutable _baseVariableBorrowRate;

	// Slope of the variable interest curve when usage ratio > 0 and <= OPTIMAL_USAGE_RATIO. Expressed in ray
	uint256 internal immutable _variableRateSlope1;

	// Slope of the variable interest curve when usage ratio > OPTIMAL_USAGE_RATIO. Expressed in ray
	uint256 internal immutable _variableRateSlope2;


	constructor(
		// IRouter router,
		address aaveDataProvider,
		uint256 optimalUsageRatio,
		uint256 baseVariableBorrowRate,
		uint256 variableRateSlope1,
		uint256 variableRateSlope2
	) {
		require(WadRayMath.RAY >= optimalUsageRatio, "Errors.INVALID_OPTIMAL_USAGE_RATIO");
		_aaveDataProvider = aaveDataProvider;
		OPTIMAL_USAGE_RATIO = optimalUsageRatio;
		MAX_EXCESS_USAGE_RATIO = WadRayMath.RAY - optimalUsageRatio;
		// ROUTER = router;
		_baseVariableBorrowRate = baseVariableBorrowRate;
		_variableRateSlope1 = variableRateSlope1;
		_variableRateSlope2 = variableRateSlope2;
	}

	/**
	* @notice Returns the variable rate slope below optimal usage ratio
	* @dev Its the variable rate when usage ratio > 0 and <= OPTIMAL_USAGE_RATIO
	* @return The variable rate slope
	**/
	function getVariableRateSlope1() external view returns (uint256) {
		return _variableRateSlope1;
	}

	/**
	* @notice Returns the variable rate slope above optimal usage ratio
	* @dev Its the variable rate when usage ratio > OPTIMAL_USAGE_RATIO
	* @return The variable rate slope
	**/
	function getVariableRateSlope2() external view returns (uint256) {
		return _variableRateSlope2;
	}

	function getBaseVariableBorrowRate() external view returns (uint256) {
		return _baseVariableBorrowRate;
	}

	function getMaxVariableBorrowRate() external view returns (uint256) {
		return _baseVariableBorrowRate + _variableRateSlope1 + _variableRateSlope2;
	}


	function getMaxSupply(address asset, uint256 minRate) external view override returns (uint256) {
		console.log("asset", asset);
		console.log("minRate", minRate);

		// uint256 ltv = 0; // 99%
		// uint256 debt = 0; // 99
		// uint256 supply = 0; // 100 
		// uint256 supply = IERC20(ROUTER.depositToken(asset)).totalSupply();
		console.log("_aaveDataProvider", _aaveDataProvider);

		(address aTokenAddress,, address variableDebtTokenAddress) = IAaveProtocolDataProvider(_aaveDataProvider).getReserveTokensAddresses(asset);
		console.log("aTokenAddress", aTokenAddress);
		console.log("variableDebtTokenAddress", variableDebtTokenAddress);
		uint256 debt = IERC20Metadata(variableDebtTokenAddress).totalSupply();
		console.log("debt  ", debt);
		uint256 supply = IERC20Metadata(aTokenAddress).totalSupply();
		console.log("supply", supply);
		uint256 ltv = debt.rayDiv(supply);
		console.log("ltv   ", ltv);

		uint256 kinkRate = _variableRateSlope1;


		uint256 liquidity;


	    if (ltv > OPTIMAL_USAGE_RATIO) {
	    	console.log("ltv > OPTIMAL_USAGE_RATIO");
	    	// (0 + .04 + .60) * (((70/(100+x)) - .6) / .6) = .08

	    	if (minRate >= kinkRate) {
	    		// if the min rate exists on the kink, use only kink formula
		    	uint256 x = minRate.rayMul(OPTIMAL_USAGE_RATIO); // 0.048 = .08 * .6
		    	uint256 y = (_variableRateSlope1 + _variableRateSlope2).rayMul(ltv); // 0.448 = (.04 + .6) * .7
		    	uint256 z = (_variableRateSlope1 + _variableRateSlope2).rayMul(_variableRateSlope2); // 0.384 = (.04 + .6) * .6
		    	uint256 a = x + z; // 0.432 = 0.048 + 0.384
		    	uint256 b = y.rayDiv(a); // 103.7037 = 0.448 / 0.432
				if (y < supply) {
					return 0;
				} else {
					return (b - supply); // 3.7037 = 103.7037 - 100
				}
	    	} else {
		    	// max amount to stay above OPTIMAL_USAGE_RATIO
		    	// 116.66 = 70 / .6
		    	// kink supply amount
	    		// if the min rate exists off the kink, check the liquidity up to the kink
	    		liquidity += debt.rayDiv(OPTIMAL_USAGE_RATIO) - supply; // upToKinkMaxLiquidity
	    	}
	    } else {
			// .04 * (99/100)
			// = 3.96
			// uint256 x = _variableRateSlope1 * ltv/ OPTIMAL_USAGE_RATIO * 100;
			uint256 x = _variableRateSlope1.rayMul(ltv).rayDiv(OPTIMAL_USAGE_RATIO);
			// uint256 x = _variableRateSlope1.rayMul(ltv).rayDiv(OPTIMAL_USAGE_RATIO) * 100;
			console.log("x", x);

			// // .02 * 100
			// uint256 y = minRate * supply;

			// 3.96 / .9 / .02
			// = 220
			// uint256 y = x / OPTIMAL_USAGE_RATIO / minRate;
			uint256 y1 = x.rayDiv(OPTIMAL_USAGE_RATIO).rayDiv(minRate);
			console.log("- y1    ", y1);

			uint256 y = x.rayDiv(OPTIMAL_USAGE_RATIO).rayDiv(minRate) / (10**(27-IERC20Metadata(asset).decimals()));
			// uint256 y = x.rayDiv(OPTIMAL_USAGE_RATIO).rayDiv(minRate) / (WadRayMath.RAY - 10**IERC20Metadata(asset).decimals());
			console.log("- y     ", y);
			console.log("- supply", supply);

			if (y < supply) {
				return 0;
			} else {
				return (y - supply);
			}
	    }

	    // continue here if current ltv is on kink
	    // continue to rest of liquidity from the kink descending
		// .04 * (99/100)
		// = 3.96
		uint256 x = _variableRateSlope1.rayMul(OPTIMAL_USAGE_RATIO).rayDiv(OPTIMAL_USAGE_RATIO);
		console.log("x", x);

		// .02 * 100

		// 3.96 / .9 / .02
		// = 220
		uint256 y1 = x.rayDiv(OPTIMAL_USAGE_RATIO).rayDiv(minRate);
		console.log("- y1    ", y1);

		uint256 y = x.rayDiv(OPTIMAL_USAGE_RATIO).rayDiv(minRate) / (10**(27-IERC20Metadata(asset).decimals()));
		console.log("- y     ", y);
		console.log("- supply", supply);

		if (liquidity + y < supply) {
			return 0;
		} else {
			return (liquidity + y - supply);
		}



	}
}