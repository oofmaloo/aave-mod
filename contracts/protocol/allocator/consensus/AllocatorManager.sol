// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IAllocatorManager} from './interfaces/IAllocatorManager.sol';
import {IAllocatorController} from './interfaces/IAllocatorController.sol';
import {AllocatorDataTypes} from './libraries/AllocatorDataTypes.sol';
import "hardhat/console.sol";

// contract AllocatorController is AccessControl, IAllocatorController {

// manages caller roles and controller settings
contract AllocatorManager is Ownable, IAllocatorManager {
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

    function setVoterWeight(address account, uint256 weight) external override onlyOwner { 
        _allocatorController.setVoterWeight(account, weight);
    }

    function setPauseAsset(address asset, bool pause) external override onlyOwner {
        _allocatorController.setPauseAsset(asset, pause);
    }

    function setMinBalance(address asset, uint256 minBalance) external override onlyOwner {
        _allocatorController.setMinBalance(asset, minBalance);
    }

    function setMinStakedBalance(address asset, uint256 minStakedBalance) external override onlyOwner {
        _allocatorController.setMinStakedBalance(asset, minStakedBalance);
    }

    function setSubmitTimeRequirement(address asset, uint256 submitTimeRequirement) external override onlyOwner {
        _allocatorController.setSubmitTimeRequirement(asset, submitTimeRequirement);
    }

    function setMaxAllocators(address asset, uint256 maxAllocators) external override onlyOwner {
        _allocatorController.setMaxAllocators(asset, maxAllocators);
    }

    function setMaxAllocatorsPeriod(address asset, uint256 maxAllocatorsPeriod) external override onlyOwner {
        _allocatorController.setMaxAllocatorsPeriod(asset, maxAllocatorsPeriod);
    }

    function getAllocatorController() external view override returns (IAllocatorController) {
        return _allocatorController;
    }

    function setAllocatorController(address controller) external override onlyOwner {
        _allocatorController = IAllocatorController(controller);
    }
}