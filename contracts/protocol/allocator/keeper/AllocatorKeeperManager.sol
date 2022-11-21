// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IAllocatorManager} from './interfaces/IAllocatorManager.sol';
import {IAllocatorController} from './interfaces/IAllocatorController.sol';
import {AllocatorDataTypes} from './libraries/AllocatorDataTypes.sol';
import "hardhat/console.sol";

// contract AllocatorController is AccessControl, IAllocatorController {

// manages caller roles and controller settings
contract AllocatorKeeperManager is Ownable, IAllocatorManager {
    // asset => admin
    mapping(address => address) internal _allocatorAdmins;

    IAllocatorController internal _allocatorController;

    constructor(address controller, address owner) {
        _allocatorController = IAllocatorController(controller);
        transferOwnership(owner);
    }

    // modifier onlyAllocatorAdmin(address reward) {
    //     require(msg.sender == _allocatorAdmins[reward], 'ONLY_ALLOCATOR_ADMIN');
    //     _;
    // }

    function configureAssets(AllocatorDataTypes.AllocatorConfigsInput[] memory config) external override onlyOwner {
        _allocatorController.configureAssets(config);
    }

    function setPause() external override onlyOwner {
        return _allocatorController.setPause();
    }

    function setPauseAsset(address asset, bool pause) external override onlyOwner {
        _allocatorController.setPauseAsset(asset, pause);
    }

    function setExecuteTimeRequirement(address asset, uint256 executeTimeRequirement) external override onlyOwner {
        _allocatorController.setExecuteTimeRequirement(asset, executeTimeRequirement);
    }

    function setSubmitTimeRequirementDelta(address asset, uint256 submitTimeRequirementDelta) external override onlyOwner {
        _allocatorController.setSubmitTimeRequirementDelta(asset, submitTimeRequirementDelta);
    }

    function getAllocatorController() external view override returns (IAllocatorController) {
        return _allocatorController;
    }

    function setAllocatorController(address controller) external override onlyOwner {
        _allocatorController = IAllocatorController(controller);
    }

}