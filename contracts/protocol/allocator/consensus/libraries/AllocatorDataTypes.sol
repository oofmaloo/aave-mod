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
    	uint256 submitTimeRequirement;
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
		address delegator;
		// address[] voters;
		// mapping(address => bool) voters; // if voted
		// uint256 votesCounts;
		// // bool[] votes;
		// mapping(address => bool) votes; // vote per validator
		address asset;
		address[] routers;
		uint256[] amounts;
		uint256[] ladderPercentages;
		uint256 onSubmitWeightedYield;
		uint256 onSubmitSimulatedWeightedYield;
		uint256 submittedFinalizedWeightedYield;
		address allocator;
		// uint256 votesPass;
		// uint256 votesFail;
		uint256 timestampSubmitted;
		uint256 timestampAllocated;
		bool active;
		bool executed;
		bool cancelled;
		bool emergency;
	}

    // struct ValidatorData {
    // 	// address delegator;
    // 	address delegatee;
    // 	// timestamp of initialization
    // 	uint256 startTimestamp;
    // 	// total weight per vote
    // 	uint256 voteWeight;
    // 	// total votes
    // 	// uint256 votes;
    // 	// total allocator submits
    // 	uint256 totalSubmits;
    // 	// if initialized
    // 	bool active;
    // 	// check if user has role, can add/remove
    // 	// bool hasRole;
    // 	bool isDelegated;
    // }

	struct AllocatorConfigsInput {
		address asset;
    	uint256 minBalance;
    	uint256 minStakedBalance;
    	uint256 submitTimeRequirement;
		uint256 maxAllocators;
		uint256 maxAllocatorsPeriod;
	}

	struct AllocatorSubmitParams {
		address asset;
		address[] routers;
		uint256[] ladderPercentages;
		address caller;
		address delegator;
		address aggregator;
		uint256 currentTotalBalance;
		uint256 currentWeightedBalance;
		uint256 simulatedWeightedBalance;
		uint256 totalRoutedBalance;
		uint256 routersCount;
	}

    enum VoteType {
        Against,
        For
    }

    struct AllocatorVote {
        uint256 againstVotes;
        uint256 forVotes;
        mapping(address => bool) hasVoted;
    }
}