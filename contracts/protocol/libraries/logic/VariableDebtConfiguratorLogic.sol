// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IPool} from '../../../interfaces/IPool.sol';
import {IAaveIncentivesController} from '../../../interfaces/IAaveIncentivesController.sol';
import {ReserveConfiguration} from '../configuration/ReserveConfiguration.sol';
import {DataTypes} from '../types/DataTypes.sol';
import {ConfiguratorInputTypes} from '../types/ConfiguratorInputTypes.sol';
import '../../tokenization/VariableDebtToken.sol';
import "hardhat/console.sol";


/**
 * @title ConfiguratorLogic library
 * @author Aave
 * @notice Implements the functions to initialize reserves and update aTokens and debtTokens
 */
library VariableDebtConfiguratorLogic {
  using ReserveConfiguration for DataTypes.ReserveConfigurationMap;

  // See `IPoolConfigurator` for descriptions
  event ReserveInitialized(
    address indexed asset,
    address indexed aToken,
    address stableDebtToken,
    address variableDebtToken,
    address interestRateStrategyAddress
  );

  function executeInitVariableBorrowReserve(IPool pool, ConfiguratorInputTypes.InitReserveInput calldata input)
    public
  {
    console.log("executeInitVariableBorrowReserve");
    address variableDebtTokenAddress = _executeInitVariableDebtToken(
      pool,
      input.underlyingAsset,
      IAaveIncentivesController(input.incentivesController),
      input.underlyingAssetDecimals,
      input.variableDebtTokenName,
      input.variableDebtTokenSymbol
    );

    pool.setVariableDebtToken(input.underlyingAsset, variableDebtTokenAddress);
    console.log("executeInitBorrowReserve 4");
  }

  function _executeInitVariableDebtToken(
    IPool pool, 
    address underlyingAsset,
    IAaveIncentivesController incentivesController,
    uint8 underlyingAssetDecimals,
    string memory variableDebtTokenName,
    string memory variableDebtTokenSymbol
  ) internal returns (address) {
    VariableDebtToken variableDebtTokenInstance = new VariableDebtToken(
      pool,
      underlyingAsset,
      incentivesController,
      underlyingAssetDecimals,
      variableDebtTokenName,
      variableDebtTokenSymbol
    );
    return address(variableDebtTokenInstance);
  }
}