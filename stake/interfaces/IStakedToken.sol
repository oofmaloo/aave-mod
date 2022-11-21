// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

interface IStakedToken {

  function stake(address onBehalfOf, uint256 amount) external;

  /**
   * @dev Redeems staked tokens, and stop earning rewards
   * @param to Address to redeem to
   * @param amount Amount to redeem
   **/
  function redeem(address to, uint256 amount) external;

  /**
   * @dev Activates the cooldown period to unstake
   * - It can't be called if the user is not staking
   **/
  function cooldown() external;

  function getScaledUserBalanceAndSupply(address user) external view returns (uint256, uint256);
}
