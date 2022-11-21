// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IPool} from '../../../interfaces/IPool.sol';
import {IAaveIncentivesController} from '../../../interfaces/IAaveIncentivesController.sol';
import {ReserveConfiguration} from '../configuration/ReserveConfiguration.sol';
import {DataTypes} from '../types/DataTypes.sol';
import {ConfiguratorInputTypes} from '../types/ConfiguratorInputTypes.sol';
import '../../tokenization/StableDebtToken.sol';
import "hardhat/console.sol";


/**
 * @title ConfiguratorLogic library
 * @author Aave
 * @notice Implements the functions to initialize reserves and update aTokens and debtTokens
 */
library StableDebtConfiguratorLogic {
  using ReserveConfiguration for DataTypes.ReserveConfigurationMap;

  // See `IPoolConfigurator` for descriptions
  event ReserveInitialized(
    address indexed asset,
    address indexed aToken,
    address stableDebtToken,
    address variableDebtToken,
    address interestRateStrategyAddress
  );

  function executeInitStableBorrowReserve(IPool pool, ConfiguratorInputTypes.InitReserveInput calldata input)
    public
  {
    console.log("executeInitStableBorrowReserve");
    address stableDebtTokenAddress = _executeInitStableDebtToken(
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

  function _executeInitStableDebtToken(
    IPool pool, 
    address underlyingAsset,
    IAaveIncentivesController incentivesController,
    uint8 underlyingAssetDecimals,
    string memory stableDebtTokenName,
    string memory stableDebtTokenSymbol
  ) internal returns (address) {
    StableDebtToken stableDebtTokenInstance = new StableDebtToken(
      pool,
      underlyingAsset,
      incentivesController,
      underlyingAssetDecimals,
      stableDebtTokenName,
      stableDebtTokenSymbol
    );
    return address(stableDebtTokenInstance);
  }
}