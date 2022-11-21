// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IPool} from '../../../interfaces/IPool.sol';
import {IAaveIncentivesController} from '../../../interfaces/IAaveIncentivesController.sol';
import {ReserveConfiguration} from '../configuration/ReserveConfiguration.sol';
import {DataTypes} from '../types/DataTypes.sol';
import {ConfiguratorInputTypes} from '../types/ConfiguratorInputTypes.sol';
import '../../tokenization/AToken.sol';

/**
 * @title ConfiguratorLogic library
 * @author Aave
 * @notice Implements the functions to initialize reserves and update aTokens and debtTokens
 */
library ATokenConfiguratorLogic {
  using ReserveConfiguration for DataTypes.ReserveConfigurationMap;

  // See `IPoolConfigurator` for descriptions
  event ReserveInitialized(
    address indexed asset,
    address indexed aToken,
    address stableDebtToken,
    address variableDebtToken,
    address interestRateStrategyAddress
  );

  /**
   * @notice Initialize a reserve by creating and initializing aToken, stable debt token and variable debt token
   * @dev Emits the `ReserveInitialized` event
   * @param pool The Pool in which the reserve will be initialized
   * @param input The needed parameters for the initialization
   */
  function executeInitLiquidityReserve(IPool pool, ConfiguratorInputTypes.InitReserveInput calldata input)
    public
  {

    address aTokenAddress = _executeInitAToken(
      pool,
      input.treasury,
      input.underlyingAsset,
      IAaveIncentivesController(input.incentivesController),
      input.underlyingAssetDecimals,
      input.aTokenName,
      input.aTokenSymbol
    );

    pool.initReserve(
      input.underlyingAsset,
      aTokenAddress,
      address(0), //stableDebtTokenAddress,
      address(0), //variableDebtTokenAddress,
      input.interestRateStrategyAddress
    );

    DataTypes.ReserveConfigurationMap memory currentConfig = DataTypes.ReserveConfigurationMap(0);

    currentConfig.setDecimals(input.underlyingAssetDecimals);

    currentConfig.setActive(true);
    currentConfig.setPaused(false);
    currentConfig.setFrozen(false);

    pool.setConfiguration(input.underlyingAsset, currentConfig);

    // emit ReserveInitialized(
    //   input.underlyingAsset,
    //   aTokenProxyAddress,
    //   stableDebtTokenProxyAddress,
    //   variableDebtTokenProxyAddress,
    //   input.interestRateStrategyAddress
    // );
  }

  function _executeInitAToken(
    IPool pool, 
    address treasury,
    address underlyingAsset,
    IAaveIncentivesController incentivesController, 
    uint8 underlyingAssetDecimals,
    string memory aTokenName,
    string memory aTokenSymbol
  ) internal returns (address) {
    AToken aTokenInstance = new AToken(
      pool,
      treasury,
      underlyingAsset,
      incentivesController,
      underlyingAssetDecimals,
      aTokenName,
      aTokenSymbol
    );
    return address(aTokenInstance);
  }
}