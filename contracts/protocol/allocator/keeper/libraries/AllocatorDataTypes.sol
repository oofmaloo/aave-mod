// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

library AllocatorDataTypes {


    struct AssetData {
        address asset;
    	//required avasToken balance to be a validator
    	uint256 minBalance;
    	//required staked balance to be a validator
    	uint256 minStakedBalance;
    	//time required between submit and allocator finalization
    	uint256 executeTimeRequirement;
    	//time required between submits
    	uint256 submitTimeRequirementDelta;
    	//votes required to allocate
		// uint256 votesToPass;
		//votes required to block allocator
		// uint256 votesToFail;
		//total submits
		uint256 submitsCount;
		//total allocators completed
		uint256 allocatorsCount;
		//max allocators per period
		uint256 maxAllocators;
		//period per max allocators ie. 5 allocators per 3600
		uint256 maxAllocatorsPeriod;
        //if validator role for access has been asigned
        // bool hasValidationRole;
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
		bool active;
		bool executed;
		bool cancelled;
		bool emergency;
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
		uint256 routersCount;
	}
}