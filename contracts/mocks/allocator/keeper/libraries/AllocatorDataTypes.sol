// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

library AllocatorDataTypes {


    struct AssetData {
        address asset;
    	//time required between submit and allocator finalization
    	uint256 executeTimeRequirement;
    	//time required between submits
    	uint256 submitTimeRequirementDelta;
		//total submits
		uint256 submitsCount;
        bool pause;
    	bool active;
    }

	struct AllocatorSubmit {
		uint256 id;
		address submitter;
		address asset;
		address aggregator;
		address[] routers;
		uint256[] amounts;
		uint256[] ladderPercentages;
		uint256 onSubmitWeightedYield;
		uint256 onSubmitSimulatedWeightedYield;
		uint256 submittedFinalizedWeightedYield;
		address allocator;
		uint256 timestampSubmitted;
		uint256 timestampAllocated;
		uint256 gasValue;
		bool active;
		bool executed;
		bool cancelled;
		bool emergency;
	}

	struct AllocatorSubmitLight {
		uint256 id;
		address asset;
		address aggregator;
		address caller;
		uint256 gasValue;
	}

	struct AllocatorConfigsInput {
		address asset;
    	uint256 executeTimeRequirement;
    	uint256 submitTimeRequirementDelta;
	}

	struct AllocatorSubmitParams {
		address asset;
		address[] routers;
		uint256[] ladderPercentages;
		address caller;
		address aggregator;
		uint256 currentTotalBalance;
		uint256 currentWeightedBalance;
		uint256 simulatedWeightedBalance;
		uint256 totalRoutedBalance;
	}
}