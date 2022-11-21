// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

import {IPool} from './IPool.sol';
import {IAaveIncentivesController} from './IAaveIncentivesController.sol';

interface ITokenizationHelper {

  function executeInitAToken(
    IPool pool, 
    address treasury,
    address underlyingAsset,
    IAaveIncentivesController incentivesController, 
    uint8 underlyingAssetDecimals,
    string memory aTokenName,
    string memory aTokenSymbol
  ) external returns (address);

  function executeInitVariableDebtToken(
    IPool pool, 
    address underlyingAsset,
    IAaveIncentivesController incentivesController,
    uint8 underlyingAssetDecimals,
    string memory variableDebtTokenName,
    string memory variableDebtTokenSymbol
  ) external returns (address);

  function executeInitStableDebtToken(
    IPool pool, 
    address underlyingAsset,
    IAaveIncentivesController incentivesController,
    uint8 underlyingAssetDecimals,
    string memory stableDebtTokenName,
    string memory stableDebtTokenSymbol
  ) external returns (address);

}
