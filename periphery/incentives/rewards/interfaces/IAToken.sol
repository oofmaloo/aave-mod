// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.10;

/**
 * @title IAToken
 * @author Aave
 * @notice Defines the basic interface for an AToken.
 **/
interface IAToken {

  /**
   * @notice Returns the address of the underlying asset of this aToken (E.g. WETH for aWETH)
   * @return The address of the underlying asset
   **/
  function UNDERLYING_ASSET_ADDRESS() external view returns (address);
}
