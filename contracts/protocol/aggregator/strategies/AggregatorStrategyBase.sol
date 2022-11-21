// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.10;

import {IAggregatorStrategyBase} from '../../../interfaces/IAggregatorStrategyBase.sol';
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AggregatorStrategyBase
 * @author Addi
 */
 abstract contract AggregatorStrategyBase is IAggregatorStrategyBase {
  using SafeERC20 for IERC20;

  address internal AGGREGATOR;
  address internal ADMIN;

  constructor(address aggregator, address admin) {
    AGGREGATOR = aggregator;
    ADMIN = admin;
  }

  /**
   * @dev Modifier for incentives controller only functions
   */
  modifier onlyAggregator() {
    require(AGGREGATOR == msg.sender, 'CALLER_NOT_AGGREGATOR');
    _;
  }

  /**
   * @dev Modifier for reward admin only functions
   */
  modifier onlyAdmin() {
    require(msg.sender == ADMIN, 'ONLY_ADMIN');
    _;
  }

  function getAggregator() external view override returns (address) {
    return AGGREGATOR;
  }

  function setAggregator(address aggregator) external onlyAdmin {
    AGGREGATOR = aggregator;
  }

  function getAdmin() external view override returns (address) {
    return ADMIN;
  }

  function performSupply(
    address asset,
    uint256 amount
  ) external virtual returns (bool);

  function performWithdraw(
    address asset,
    uint256 amount
  ) external virtual returns (bool);

  function performBorrow(
    address router, 
    address asset, 
    uint256 amount
  ) external virtual returns (bool);

  function performRepay(
    address router, 
    address asset, 
    uint256 amount
  ) external virtual returns (bool);

  function emergencyWithdrawal(
    address token,
    address to,
    uint256 amount
  ) external {
    IERC20(token).safeTransfer(to, amount);
    // emit EmergencyWithdrawal(msg.sender, token, to, amount);
  }
}
