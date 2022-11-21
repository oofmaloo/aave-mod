// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {AllocatorDataTypes} from '../libraries/AllocatorDataTypes.sol';

interface IAllocatorController {

    function configureAssets(AllocatorDataTypes.AllocatorConfigsInput[] memory config) external;

    function allocatorSubmit(AllocatorDataTypes.AllocatorSubmitParams memory params) external;

    function allocatorVote(uint256 allocatorId, uint8 support) external;

    function executeAllocator(uint256 allocatorId) external;

    function delegates(address account) external view returns (address);

    function delegate(address delegatee) external;

    function setVoterWeight(address account, uint256 weight) external;

    function hasVoted(uint256 allocatorId, address account) external view returns (bool);

    function getPause() external view returns (bool);

    function setPause() external;

    function getPauseAsset(address asset) external view returns (bool);

    function setPauseAsset(address asset, bool pause) external;

    function getMinBalance(address asset) external view returns (uint256);

    function setMinBalance(address asset, uint256 minBalance) external;

    function getMinStakedBalance(address asset) external view returns (uint256);

    function setMinStakedBalance(address asset, uint256 minStakedBalance) external;

    function getSubmitTimeRequirement(address asset) external view returns (uint256);

    function setSubmitTimeRequirement(address asset, uint256 submitTimeRequirement) external;

    function getMaxAllocators(address asset) external view returns (uint256);

    function setMaxAllocators(address asset, uint256 maxAllocators) external;

    function getMaxAllocatorsPeriod(address asset) external view returns (uint256);

    function setMaxAllocatorsPeriod(address asset, uint256 maxAllocatorsPeriod) external;
}