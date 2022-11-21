// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.10;

import {ITransferStrategyBase} from './ITransferStrategyBase.sol';

interface IDividendsTransferStrategy is ITransferStrategyBase {
  function getBalance(address asset) external view returns (uint256);

  function getDividendsVault() external view returns (address);
}
