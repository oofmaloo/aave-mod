// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

// import {IERC20} from '../../../dependencies/openzeppelin/contracts/IERC20.sol';
// import {GPv2SafeERC20} from '../../../dependencies/gnosis/contracts/GPv2SafeERC20.sol';
import {IPool} from "../../../interfaces/IPool.sol";
import {Aggregator} from '../../aggregator/Aggregator.sol';

library AggregatorLogic {
	// using GPv2SafeERC20 for IERC20;

    event AggregatorInitialized(
        address indexed pool,
        address indexed asset,
        address aggregator
    );

    function executeInitAggregator(
        IPool pool, 
        address provider,
        address underlyingAsset,
        address[] memory routers
    ) internal {
        address aggregatorAddress = _executeInitAggregator(
            provider,
            underlyingAsset,
            routers
        );

        pool.setAggregator(
            underlyingAsset,
            aggregatorAddress
        );

        // pool.setInterestRateOracle(
        //     underlyingAsset,
        //     interestRateOracle
        // );

        // approve sending to aggregator
        // IERC20(underlyingAsset).approve(aggregatorAddress, type(uint256).max);

        emit AggregatorInitialized(
            address(pool),
            underlyingAsset,
            aggregatorAddress
        );
    }

    function _executeInitAggregator(
        address provider,
        address underlyingAsset,
        address[] memory routers
    ) internal returns (address) {
        Aggregator aggregatorInstance = new Aggregator(
            provider,
            underlyingAsset,
            routers
        );
        return address(aggregatorInstance);
    }
}
