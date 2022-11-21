// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IAllocatorController} from './IAllocatorController.sol';
import {AllocatorDataTypes} from '../libraries/AllocatorDataTypes.sol';

interface IAllocatorManager {

    function configureAssets(AllocatorDataTypes.AllocatorConfigsInput[] memory config) external;

    function setPause() external;

    function setVoterWeight(address account, uint256 weight) external;

    function setPauseAsset(address asset, bool pause) external;

    function setMinBalance(address asset, uint256 minBalance) external;

    function setMinStakedBalance(address asset, uint256 minStakedBalance) external;

    function setSubmitTimeRequirement(address asset, uint256 submitTimeRequirement) external;

    function setMaxAllocators(address asset, uint256 maxAllocators) external;

    function setMaxAllocatorsPeriod(address asset, uint256 maxAllocatorsPeriod) external;

    function getAllocatorController() external view returns (IAllocatorController);

    function setAllocatorController(address controller) external;
}