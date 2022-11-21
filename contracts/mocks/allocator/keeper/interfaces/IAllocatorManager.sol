// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {AllocatorDataTypes} from '../libraries/AllocatorDataTypes.sol';
import {IAllocatorController} from './IAllocatorController.sol';

interface IAllocatorManager {

    function configureAssets(AllocatorDataTypes.AllocatorConfigsInput[] memory config) external;

    function setPause() external;

    function setPauseAsset(address asset, bool pause) external;

    function setExecuteTimeRequirement(address asset, uint256 executeTimeRequirement) external;

    function setSubmitTimeRequirementDelta(address asset, uint256 submitTimeRequirementDelta) external;

    function getAllocatorController() external view returns (IAllocatorController);

    function setAllocatorController(address controller) external;

}