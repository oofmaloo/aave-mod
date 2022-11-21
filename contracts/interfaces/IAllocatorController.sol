// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

interface IAllocatorController {

    struct AssetData {
        address underlyingAsset;
    	//required avasToken balance to be a validator
    	uint256 minBalance;
    	//required staked balance to be a validator
    	uint256 minStakedBalance;
    	//time required between submit and allocation finalization
    	uint256 allocationSubmitTimeRequirement;
    	//votes required to allocate
		uint256 votesToPass;
		//votes required to block allocation
		uint256 votesToFail;
		//total submits
		uint256 allocationSubmitsCount;
		//total allocations completed
		uint256 allocationAllocationsCount;
		//max allocations per period
		uint256 maxAllocations;
		//period per max allocations ie. 5 allocations per 3600
		uint256 maxAllocationsPeriod;
        //if validator role for access has been asigned
        bool hasValidationRole;
        bool pause;
    	bool active;
    }

    struct ValidatorData {
    	address delegator;
    	address delegatee;
    	uint256 startTimestamp;
    	uint256 points;
    	uint256 votes;
    	uint256 allocationSubmits;
    	bool active;
    }

    function delegateAllocationValidator(address asset, address delegatee) external;

    function setUnderlyingAssets(
    	address[] memory underlyingAssets,
    	uint256[] memory minBalance_,
		uint256[] memory minStakedBalance_
	) external;

    function getValidatorRole(address asset, address account) external view returns (bool);

    function setValidator(address[] memory assets) external;

    function setValidatorPoints(address asset, address validator_, uint256 _points) external;

    function removeValidatorRole(address asset, address account) external;

    function getAllocatorRole(address asset, address account) external view returns (bool);

    function setAllocatorRole(address asset, address account) external;

    function removeAllocatorRole(address asset, address account) external;

    function setAccessMembership(address asset_, bytes memory name) external;

    function getAssetData(address asset) external view returns (AssetData memory);

    function getValidatorData(address asset, address account) external view returns (ValidatorData memory);

    function getDelegateeData(address asset, address account) external view returns (ValidatorData memory);

    function setMinBalance(address asset, uint256 minBalance_) external;

    function setMinStakedBalance(address asset, uint256 minStakedBalance_) external;

    function setAllocationSubmitTimeRequirement(address asset, uint256 allocationSubmitTimeRequirement_) external;

    function setVotesToPass(address asset, uint256 votesToPass_) external;

    function setVotesToFail(address asset, uint256 votesToFail_) external;

    function setMaxAllocations(address asset, uint256 maxAllocations_) external;

    function setMaxAllocationsPeriod(address asset, uint256 maxAllocationsPeriod_) external;

    function setAssetPause(address asset, bool pause_) external;

    function setPause() external;

}