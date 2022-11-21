// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

import {IPool} from './IPool.sol';
import {IAaveIncentivesController} from './IAaveIncentivesController.sol';

interface IDebtTokenizationHelper {

  function _executeInitVariableDebtToken(
    IPool pool, 
    address underlyingAsset,
    IAaveIncentivesController incentivesController,
    uint8 underlyingAssetDecimals,
    string memory variableDebtTokenName,
    string memory variableDebtTokenSymbol
  ) external returns (address);

  function _executeInitStableDebtToken(
    IPool pool, 
    address underlyingAsset,
    IAaveIncentivesController incentivesController,
    uint8 underlyingAssetDecimals,
    string memory stableDebtTokenName,
    string memory stableDebtTokenSymbol
  ) external returns (address);

}
