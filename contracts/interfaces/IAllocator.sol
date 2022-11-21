// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

interface IAllocator {
	struct AllocationSubmits {
		uint256 id;
		address submitter;
		// address[] voters;
		mapping(address => bool) voters; // if voted
		uint256 votesCounts;
		// bool[] votes;
		mapping(address => bool) votes; // vote per validator
		address underlyingAsset;
		address[] routers;
		uint256[] amounts;
		uint256[] ladderPercentages;
		uint256 onSubmitWeightedYield;
		uint256 onSubmitSimulatedWeightedYield;
		uint256 submittedFinalizedWeightedYield;
		address allocator;
		uint256 votesPass;
		uint256 votesFail;
		uint256 timestampSubmitted;
		uint256 timestampAllocated;
		bool active;
		bool emergency;
	}

    /**
     * @dev Allocation submitted by validators
     * - routers - Address of routers to use
     * - ladderPercentages - Percentage of total balance
     **/
	function submitAllocation(
		address underlyingAsset,
		address[] memory routers,
		uint256[] memory ladderPercentages
	) external;

	function voteAllocation(uint256 id, bool vote) external;

	function finalizeAllocation(uint256 id) external;

	// function getAllocation(uint256 id) external view returns (AllocationSubmits calldata);
}