// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {ITransferStrategyBase} from '../interfaces/ITransferStrategyBase.sol';
import {IEACAggregatorProxy} from '../../misc/interfaces/IEACAggregatorProxy.sol';

library RewardsDataTypes {
  // on config
  // the amount emissionsPerSecond is dependent on the distribution length and timestamp of config
  // emissionsPerSecond = transferToControllerAmount / (distributionEnd - block.timestamp)
  struct RewardsConfigInput {
    uint88 emissionPerSecond;
    uint256 totalSupply;
    uint32 distributionEnd;
    address asset;
    address reward;
    ITransferStrategyBase transferStrategy;
    IEACAggregatorProxy rewardOracle;
  }

  struct UserAssetBalance {
    address asset;
    uint256 userBalance;
    uint256 totalSupply;
  }

  struct UserData {
    uint104 index; // matches reward index
    uint128 accrued;
  }

  struct RewardData {
    uint104 index;
    uint88 emissionPerSecond;
    uint32 lastUpdateTimestamp;
    uint32 distributionEnd;
    mapping(address => UserData) usersData; // user indexes
  }

  struct AssetData {
    mapping(address => RewardData) rewards; // aToken => {erc20's}
    mapping(uint128 => address) availableRewards; // map of each reward erc20
    uint128 availableRewardsCount; // count of each reward erc20
    uint8 decimals;
  }

  //

  struct DividendsConfigInput {
    uint88 emissionPerSecond;
    uint256 totalSupply;
    address reward;
    ITransferStrategyBase transferStrategy;
  }

  struct DividendData {
    // RewardData rewardData;
    address underlyingAssetAddress;
    uint128 index;
    uint256 lastUpdateBalance;
    uint256 reservedBalance;
    uint32 lastUpdateTimestamp;
    uint88 emissionPerSecond;
    uint8 decimals;
    // uint32 distributionEnd;
    mapping(address => UserData) usersData; // user indexes
  }
}
