// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IPool} from '../../../interfaces/IPool.sol';
import {ReserveConfiguration} from '../configuration/ReserveConfiguration.sol';
import {DataTypes} from '../types/DataTypes.sol';
import {ConfiguratorInputTypes} from '../types/ConfiguratorInputTypes.sol';
import '../../tokenization/VaultToken.sol';
import "hardhat/console.sol";


/**
 * @title ConfiguratorLogic library
 * @author Aave
 * @notice Implements the functions to initialize reserves and update aTokens and debtTokens
 */
library VaultTokenConfiguratorLogic {
  using ReserveConfiguration for DataTypes.ReserveConfigurationMap;

  // See `IPoolConfigurator` for descriptions
  // event ReserveInitialized(
  //   address indexed asset,
  //   address indexed aToken,
  //   address stableDebtToken,
  //   address variableDebtToken,
  //   address interestRateStrategyAddress
  // );

  function executeInitVaultTokenReserve(IPool pool, ConfiguratorInputTypes.InitReserveInput calldata input)
    public
  {
    require(true, 'ERROR_ATOKEN_NOT_INITIALIZED');
    address vaultTokenAddress = _executeInitVaultToken(
      pool,
      input.underlyingAsset,
      input.underlyingAssetDecimals,
      input.vaultTokenName,
      input.vaultTokenSymbol
    );

    pool.setVaultToken(input.underlyingAsset, vaultTokenAddress);
  }

  function _executeInitVaultToken(
    IPool pool, 
    address underlyingAsset,
    uint8 underlyingAssetDecimals,
    string memory vaultTokenName,
    string memory vaultTokenSymbol
  ) internal returns (address) {
    VaultToken vaultTokenInstance = new VaultToken(
      pool,
      underlyingAsset,
      underlyingAssetDecimals,
      vaultTokenName,
      vaultTokenSymbol
    );
    return address(vaultTokenInstance);
  }
}