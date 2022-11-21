// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IPool} from '../../../interfaces/IPool.sol';
// import {IInitializableAToken} from '../../../interfaces/IInitializableAToken.sol';
// import {IInitializableDebtToken} from '../../../interfaces/IInitializableDebtToken.sol';
import {IAaveIncentivesController} from '../../../interfaces/IAaveIncentivesController.sol';
// import {InitializableImmutableAdminUpgradeabilityProxy} from '../aave-upgradeability/InitializableImmutableAdminUpgradeabilityProxy.sol';
import {ReserveConfiguration} from '../configuration/ReserveConfiguration.sol';
import {DataTypes} from '../types/DataTypes.sol';
import {ConfiguratorInputTypes} from '../types/ConfiguratorInputTypes.sol';
import '../../tokenization/AToken.sol';
import '../../tokenization/StableDebtToken.sol';
import '../../tokenization/VariableDebtToken.sol';

import {ITokenizationHelper} from '../../../interfaces/ITokenizationHelper.sol';
import "hardhat/console.sol";


/**
 * @title ConfiguratorLogic library
 * @author Aave
 * @notice Implements the functions to initialize reserves and update aTokens and debtTokens
 */
library ConfiguratorLogic {
  using ReserveConfiguration for DataTypes.ReserveConfigurationMap;

  // See `IPoolConfigurator` for descriptions
  event ReserveInitialized(
    address indexed asset,
    address indexed aToken,
    address stableDebtToken,
    address variableDebtToken,
    address interestRateStrategyAddress
  );
  // event ATokenUpgraded(
  //   address indexed asset,
  //   address indexed proxy,
  //   address indexed implementation
  // );
  // event StableDebtTokenUpgraded(
  //   address indexed asset,
  //   address indexed proxy,
  //   address indexed implementation
  // );
  // event VariableDebtTokenUpgraded(
  //   address indexed asset,
  //   address indexed proxy,
  //   address indexed implementation
  // );

  /**
   * @notice Initialize a reserve by creating and initializing aToken, stable debt token and variable debt token
   * @dev Emits the `ReserveInitialized` event
   * @param pool The Pool in which the reserve will be initialized
   * @param input The needed parameters for the initialization
   */
  function executeInitLiquidityReserve(IPool pool, ITokenizationHelper tokenizationHelper, ConfiguratorInputTypes.InitReserveInput calldata input)
    public
  {
    console.log("executeInitReserve");
    // address aTokenAddress = tokenizationHelper.executeInitAToken(
    //   pool,
    //   input.treasury,
    //   input.underlyingAsset,
    //   IAaveIncentivesController(input.incentivesController),
    //   input.underlyingAssetDecimals,
    //   input.aTokenName,
    //   input.aTokenSymbol
    // );

    // address stableDebtTokenAddress = tokenizationHelper.executeInitStableDebtToken(
    //   pool,
    //   input.underlyingAsset,
    //   IAaveIncentivesController(input.incentivesController),
    //   input.underlyingAssetDecimals,
    //   input.stableDebtTokenName,
    //   input.stableDebtTokenSymbol
    // );

    // address variableDebtTokenAddress = tokenizationHelper.executeInitVariableDebtToken(
    //   pool,
    //   input.underlyingAsset,
    //   IAaveIncentivesController(input.incentivesController),
    //   input.underlyingAssetDecimals,
    //   input.variableDebtTokenName,
    //   input.variableDebtTokenSymbol
    // );


    address aTokenAddress = _executeInitAToken(
      pool,
      input.treasury,
      input.underlyingAsset,
      IAaveIncentivesController(input.incentivesController),
      input.underlyingAssetDecimals,
      input.aTokenName,
      input.aTokenSymbol
    );

    // address stableDebtTokenAddress = _executeInitStableDebtToken(
    //   pool,
    //   input.underlyingAsset,
    //   IAaveIncentivesController(input.incentivesController),
    //   input.underlyingAssetDecimals,
    //   input.stableDebtTokenName,
    //   input.stableDebtTokenSymbol
    // );

    // address variableDebtTokenAddress = _executeInitVariableDebtToken(
    //   pool,
    //   input.underlyingAsset,
    //   IAaveIncentivesController(input.incentivesController),
    //   input.underlyingAssetDecimals,
    //   input.variableDebtTokenName,
    //   input.variableDebtTokenSymbol
    // );

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

  function executeInitVariableBorrowReserve(IPool pool, ITokenizationHelper tokenizationHelper, ConfiguratorInputTypes.InitReserveInput calldata input)
    public
  {
    // console.log("executeInitVariableBorrowReserve");
    // address stableDebtTokenAddress = tokenizationHelper.executeInitStableDebtToken(
    //   pool,
    //   input.underlyingAsset,
    //   IAaveIncentivesController(input.incentivesController),
    //   input.underlyingAssetDecimals,
    //   input.stableDebtTokenName,
    //   input.stableDebtTokenSymbol
    // );

    console.log("executeInitVariableBorrowReserve 1");
    // address variableDebtTokenAddress = tokenizationHelper.executeInitVariableDebtToken(
    //   pool,
    //   input.underlyingAsset,
    //   IAaveIncentivesController(input.incentivesController),
    //   input.underlyingAssetDecimals,
    //   input.variableDebtTokenName,
    //   input.variableDebtTokenSymbol
    // );

    // console.log("executeInitVariableBorrowReserve 2");
    // address stableDebtTokenAddress = _executeInitStableDebtToken(
    //   pool,
    //   input.underlyingAsset,
    //   IAaveIncentivesController(input.incentivesController),
    //   input.underlyingAssetDecimals,
    //   input.stableDebtTokenName,
    //   input.stableDebtTokenSymbol
    // );

    // pool.setStableDebtToken(input.underlyingAsset, stableDebtTokenAddress);
    // console.log("executeInitBorrowReserve 3");

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

  function executeInitStableBorrowReserve(IPool pool, ITokenizationHelper tokenizationHelper, ConfiguratorInputTypes.InitReserveInput calldata input)
    public
  {
    console.log("executeInitStableBorrowReserve");
    address stableDebtTokenAddress = tokenizationHelper.executeInitStableDebtToken(
      pool,
      input.underlyingAsset,
      IAaveIncentivesController(input.incentivesController),
      input.underlyingAssetDecimals,
      input.stableDebtTokenName,
      input.stableDebtTokenSymbol
    );


    pool.setStableDebtToken(input.underlyingAsset, stableDebtTokenAddress);
    console.log("executeInitStableBorrowReserve 3");
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

  // function _executeInitStableDebtToken(
  //   IPool pool, 
  //   address underlyingAsset,
  //   IAaveIncentivesController incentivesController,
  //   uint8 underlyingAssetDecimals,
  //   string memory stableDebtTokenName,
  //   string memory stableDebtTokenSymbol
  // ) internal returns (address) {
  //   StableDebtToken stableDebtTokenInstance = new StableDebtToken(
  //     pool,
  //     underlyingAsset,
  //     incentivesController,
  //     underlyingAssetDecimals,
  //     stableDebtTokenName,
  //     stableDebtTokenSymbol
  //   );
  //   return address(stableDebtTokenInstance);
  // }
}