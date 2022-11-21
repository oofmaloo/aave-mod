// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {ITransferStrategyBase} from '../interfaces/ITransferStrategyBase.sol';

library DividendsDataTypes {
  struct UserData {
    uint104 index; // matches dividend index
    uint128 accrued;
  }

  struct DividendsConfigInput {
    uint88 emissionPerSecond;
    uint256 totalSupply;
    address dividend;
    ITransferStrategyBase transferStrategy;
  }

  struct DividendData {
    // DividendData dividendData;
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
