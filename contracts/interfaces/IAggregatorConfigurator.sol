// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

import {IPool} from './IPool.sol';

interface IAggregatorConfigurator {

  function initAggregator(
    IPool pool, 
    // address interestRateOracle,
    // address aclManager, 
    address provider,
    address underlyingAsset,
    // address aTokenAddress,
    address[] memory routers
  ) external;
}
