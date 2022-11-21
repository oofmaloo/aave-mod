// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

interface IDividendsDistributor {

  function getDividendsData(address dividend)
    external
    view
    returns (
      uint256,
      uint256,
      uint256,
      uint256
    );

  function getDividendsList() external view returns (address[] memory);

  function getUserDividends(
    address user,
    address dividend
  ) external view returns (uint256);

  function getUserAssetIndex(
    address user,
    address dividend
  ) external view returns (uint256);

  function getAllUserDividends(address user)
    external
    view
    returns (address[] memory dividendDividendsList, uint256[] memory unclaimedAmounts);

  function setEmissionPerSecond(
    address dividend,
    uint88 newEmissionsPerSecond
  ) external;

  function setDividendManager(address emissionManager) external;

}
