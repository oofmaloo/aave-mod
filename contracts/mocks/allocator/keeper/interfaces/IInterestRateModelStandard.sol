// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

interface IInterestRateModelStandard {
	function getMaxSupply(address asset, uint256 minRate) external view returns (uint256);
}