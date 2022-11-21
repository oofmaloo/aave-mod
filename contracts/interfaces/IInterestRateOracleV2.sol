// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

interface IInterestRateOracleV2 {
    function getBestRateIndex(address aggregator) external returns (uint256 bestIndex);

    function getWorstRateIndex(address aggregator) external returns (uint256 worstIndex);

    function getWorstRateArray(address aggregator, uint256 amount) external view returns (uint256[] memory);

    function getAverageBorrowRate(address aggregator) external returns (uint256);

    function getLastAverageBorrowRate(address aggregator) external view returns (uint256);

    function getGoalBorrowRate(address aggregator) external returns (uint256);

    function getLastGoalBorrowRate(address aggregator) external view returns (uint256);

}