// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.10;

interface IPool {
  /**
   * @notice Mints the assets accrued through the reserve factor to the treasury in the form of aTokens
   * @param assets The list of reserves for which the minting needs to be executed
   **/
  function mintToTreasury(address[] calldata assets) external;
}
