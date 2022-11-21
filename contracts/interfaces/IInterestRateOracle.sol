// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

interface IInterestRateOracle {

    function getBestRateIndex() external returns (uint256 bestIndex);
    function getWorstRateIndex() external returns (uint256 worstIndex);
    function getAverageBorrowRate() external returns (uint256);
    function getLastAverageBorrowRate() external view returns (uint256);

function setRouters() external;
}