// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

import {IPool} from './IPool.sol';
import {IAaveIncentivesController} from './IAaveIncentivesController.sol';

interface IATokenizationHelper {

  function _executeInitAToken(
    IPool pool, 
    address treasury,
    address underlyingAsset,
    IAaveIncentivesController incentivesController, 
    uint8 underlyingAssetDecimals,
    string memory aTokenName,
    string memory aTokenSymbol
  ) external returns (address);

}
