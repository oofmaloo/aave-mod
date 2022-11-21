// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IPoolAddressesProvider} from '../../../interfaces/IPoolAddressesProvider.sol';
import {IACLManager} from '../../../interfaces/IACLManager.sol';
import {IPoolDataProvider} from '../../../interfaces/IPoolDataProvider.sol';

import {IAllocatorController} from './interfaces/IAllocatorController.sol';
import {AllocatorDataTypes} from './libraries/AllocatorDataTypes.sol';
import {AllocatorKeeperMaker} from './AllocatorKeeperMaker.sol';
import {OpsReady} from './OpsReady.sol';

import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";


/*
    1: Tx for redistr
    2: Keeper checks latest distr submit
        - Checks if better than current
    3: If previous check is true, redistr on new redistr parameters

    Each asset has its own guidelines, such as frequency of redistr submits, time since redistr to execute, etc.
*/
contract AllocatorKeeperController is OpsReady, AllocatorKeeperMaker, IAllocatorController {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IPoolAddressesProvider internal _addressesProvider;
    IACLManager internal _aclManager;
    IPoolDataProvider internal _poolDataProvider;

    // pause entire allocator
    bool internal pause;

	constructor(
        address payable _ops,
		IPoolAddressesProvider addressesProvider,
        address _allocatorManager
	) OpsReady(_ops) AllocatorKeeperMaker(_allocatorManager) {
        console.log("_allocatorManager constructor", _allocatorManager);
		_addressesProvider = addressesProvider;
		_aclManager = IACLManager(_addressesProvider.getACLManager());
		_poolDataProvider = IPoolDataProvider(_addressesProvider.getPoolDataProvider());
	}

    modifier whenNotPaused() {
        require(!pause, 'WHEN_NOT_PAUSED');
        _;
    }

    function configureAssets(AllocatorDataTypes.AllocatorConfigsInput[] memory config) external override onlyAllocatorManager {
        // for (uint256 i = 0; i < config.length; i++) {
            // (,,,,,,,, bool isActive,) = 
            //     _poolDataProvider.getReserveConfigurationData(config[i].asset);
            // require(isActive, "ERROR_ASSET_NOT_ACTIVE");
        // }
        _configureAssets(config);
    }

    function allocatorSubmit(AllocatorDataTypes.AllocatorSubmitParams memory params) external override onlyOps whenNotPaused {
        AllocatorDataTypes.AssetData storage asset = _assets[params.asset];
        require(asset.active, "Asset not active");


        bool enoughTimePassed = block.timestamp - 
            _allocatorSubmits[params.asset][_allocatorSubmitCounts[params.asset]].timestampSubmitted > 
            asset.submitTimeRequirementDelta;

        require(enoughTimePassed, "ERROR_NOT_ENOUGH_TIME_PASSED");

        uint256 routersLength = params.routers.length;
        uint256 ladderPercentagesLength = params.ladderPercentages.length;

        require(routersLength == ladderPercentagesLength, "ERROR_PARAMS_LENGTH_MISMATCH");
        params.caller = msg.sender;
        // get aggregator from asset
        params.aggregator = _poolDataProvider.getAggregatorAddress(params.asset);
        _allocatorSubmitPlain(asset, params);
    }

    function allocatorChecker(address asset) external view override returns (bool) {
        AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit = _allocatorSubmits[asset][_allocatorSubmitCounts[asset]];

        _allocatorChecker(
            allocatorSubmit
        );
    }

    function executeAllocator(address asset, uint256 allocatorId) external override whenNotPaused {
        AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit = _allocatorSubmits[asset][allocatorId];
        require(allocatorSubmit.allocator == address(0), "Allocator executed");

        AllocatorDataTypes.AssetData storage asset = _assets[allocatorSubmit.asset];

        uint256 timeAlloted = block.timestamp.sub(allocatorSubmit.timestampSubmitted);
        require(timeAlloted > asset.executeTimeRequirement, "Error: Time requirement");

        allocatorSubmit.allocator = msg.sender;

        address aggregator = _poolDataProvider.getAggregatorAddress(allocatorSubmit.asset);

        _execute(
            allocatorSubmit,
            aggregator
        );
    }

    function getAllocatorSubmit(address asset, uint256 allocatorId) 
        external 
        view 
        returns 
        (AllocatorDataTypes.AllocatorSubmit memory) 
    {
        return _allocatorSubmits[asset][allocatorId];
    }

    function getPause() external view override returns (bool) {
        return pause;
    }

    function setPause() external override onlyAllocatorManager {
        pause = !pause;
    }

    function getPauseAsset(address asset) external view override returns (bool) {
        return _assets[asset].pause;
    }

    function setPauseAsset(address asset, bool pause) external override onlyAllocatorManager {
        AllocatorDataTypes.AssetData storage asset = _assets[asset];
        require(asset.active, "ERROR_ASSET_NOT_ACTIVE");
        asset.pause = pause;
    }

    function getExecuteTimeRequirement(address asset) external view override returns (uint256) {
        return _assets[asset].executeTimeRequirement;
    }

    function setExecuteTimeRequirement(address asset, uint256 executeTimeRequirement) external override onlyAllocatorManager {
        AllocatorDataTypes.AssetData storage asset = _assets[asset];
        require(asset.active, "ERROR_ASSET_NOT_ACTIVE");
        asset.executeTimeRequirement = executeTimeRequirement;
    }

    function getSubmitTimeRequirementDelta(address asset) external view override returns (uint256) {
        return _assets[asset].submitTimeRequirementDelta;
    }

    function setSubmitTimeRequirementDelta(address asset, uint256 submitTimeRequirementDelta) external override onlyAllocatorManager {
        AllocatorDataTypes.AssetData storage asset = _assets[asset];
        require(asset.active, "ERROR_ASSET_NOT_ACTIVE");
        asset.submitTimeRequirementDelta = submitTimeRequirementDelta;
    }

}