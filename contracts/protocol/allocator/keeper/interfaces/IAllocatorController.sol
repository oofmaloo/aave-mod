// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {AllocatorDataTypes} from '../libraries/AllocatorDataTypes.sol';

interface IAllocatorController {

    function configureAssets(AllocatorDataTypes.AllocatorConfigsInput[] memory config) external;

    function allocatorSubmit(AllocatorDataTypes.AllocatorSubmitParams memory params) external;

    function allocatorChecker(address asset) external view returns (bool);
    
    function executeAllocator(address asset, uint256 allocatorId) external;

    function getPause() external view returns (bool);

    function setPause() external;

    function getPauseAsset(address asset) external view returns (bool);

    function setPauseAsset(address asset, bool pause) external;

    function getExecuteTimeRequirement(address asset) external view returns (uint256);

    function setExecuteTimeRequirement(address asset, uint256 executeTimeRequirement) external;

    function getSubmitTimeRequirementDelta(address asset) external view returns (uint256);

    function setSubmitTimeRequirementDelta(address asset, uint256 submitTimeRequirementDelta) external;

}