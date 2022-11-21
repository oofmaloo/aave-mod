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
import {AllocatorMaker} from './AllocatorMaker.sol';

import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";

// contract AllocatorController is AccessControl, IAllocatorController {

contract AllocatorController is AllocatorMaker, IAllocatorController {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IPoolAddressesProvider internal _addressesProvider;
    IACLManager internal _aclManager;
    IPoolDataProvider internal _poolDataProvider;
    // IAllocatorRewardsController internal _allocatorRewardsController;

    IERC20 internal _stakedToken;
    uint256 internal minStakedBalance;

    uint256 internal DEFAULT_VOTER_WEIGHT;
    mapping(address => uint256) internal _voterWeight;

    mapping(address => address) private _delegation;

    // pause entire allocator
    bool internal pause;


	constructor(
		IPoolAddressesProvider addressesProvider,
        address stakedToken,
        address _allocatorManager
	) AllocatorMaker(_allocatorManager) {
        console.log("_allocatorManager constructor", _allocatorManager);
		_addressesProvider = addressesProvider;
		_aclManager = IACLManager(_addressesProvider.getACLManager());
		_poolDataProvider = IPoolDataProvider(_addressesProvider.getPoolDataProvider());
        _stakedToken = IERC20(stakedToken);
        DEFAULT_VOTER_WEIGHT = 1;
	}

    modifier whenNotPaused() {
        require(!pause, 'WHEN_NOT_PAUSED');
        _;
    }

    function configureAssets(AllocatorDataTypes.AllocatorConfigsInput[] memory config) external override onlyAllocatorManager {
        console.log("_allocatorManager", _allocatorManager);
        console.log("configureAssets msg.sender", msg.sender);
        // for (uint256 i = 0; i < config.length; i++) {
            // (,,,,,,,, bool isActive,) = 
            //     _poolDataProvider.getReserveConfigurationData(config[i].asset);
            // require(isActive, "ERROR_ASSET_NOT_ACTIVE");
        // }
        _configureAssets(config);
    }

    function allocatorSubmit(AllocatorDataTypes.AllocatorSubmitParams memory params) external override whenNotPaused {
        console.log("allocatorSubmit");
        AllocatorDataTypes.AssetData storage asset = _assets[params.asset];
        require(asset.active, "Asset not active");

        address delegate = delegates(msg.sender);
        if (delegate == address(0)) {
            delegate = msg.sender;
        }
        // console.log("allocatorSubmit delegate", delegate);

        require(_validateAllocator(delegate, params.asset), "ALLOCATOR_NOT_VALID");

        uint256 routersLength = params.routers.length;
        uint256 ladderPercentagesLength = params.ladderPercentages.length;
        // console.log("allocatorSubmit routersLength", routersLength);
        // console.log("allocatorSubmit ladderPercentagesLength", ladderPercentagesLength);

        require(routersLength == ladderPercentagesLength, "ERROR_PARAMS_LENGTH_MISMATCH");
        params.caller = msg.sender;
        params.delegator = delegate;
        params.aggregator = _poolDataProvider.getAggregatorAddress(params.asset);
        _allocatorSubmit(asset, delegate, params);
    }

    function allocatorVote(uint256 allocatorId, uint8 support) external override whenNotPaused {
        AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit = _allocatorSubmits[allocatorId];

        require(allocatorSubmit.active, "ERROR_ALLOCATOR_SUBMIT_NOT_ACTIVE");
        require(!allocatorSubmit.executed, "ERROR_ALLOCATOR_SUBMIT_EXECUTED");

        address delegate = delegates(msg.sender);
        if (delegate == address(0)) {
            delegate = msg.sender;
        }

        require(_validateAllocator(delegate, allocatorSubmit.asset), "VOTER_NOT_VALID");

        AllocatorDataTypes.AllocatorVote storage allocatorVote = _allocatorVotes[allocatorId];
        require(!_allocatorVotes[allocatorId].hasVoted[delegate], "ALREADY_VOTED");

        _allocatorVote(
            allocatorVote,
            support,
            DEFAULT_VOTER_WEIGHT + _voterWeight[delegate]
        );
    }

    function executeAllocator(uint256 allocatorId) external override whenNotPaused {
        AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit = _allocatorSubmits[allocatorId];
        require(allocatorSubmit.allocator == address(0), "Allocator executed");

        AllocatorDataTypes.AssetData storage asset = _assets[allocatorSubmit.asset];

        require(_voteSucceeded(allocatorId), "ERROR_VOTE_NOT_SUCCESSFUL");

        uint256 timeAlloted = block.timestamp.sub(allocatorSubmit.timestampSubmitted);
        require(timeAlloted > asset.submitTimeRequirement, "Error: Time requirement");

        allocatorSubmit.allocator = msg.sender;

        address aggregator = _poolDataProvider.getAggregatorAddress(allocatorSubmit.asset);

        _execute(
            allocatorSubmit,
            aggregator
        );

        // send participation rewards
        // IAllocatorRewardsController allocatorRewardsController = _allocatorRewardsController;
        // if (address(allocatorRewardsController) != address(0)) {
        //     allocatorRewardsController.handleAction(
        //         msg.sender, 
        //         allocatorSubmit.allocator,
        //         allocatorSubmit.voters,
        //     );
        // }
    }

    function delegates(address account) public view virtual override returns (address) {
        return _delegation[account];
    }

    function delegate(address delegatee) public virtual override {
        address account = msg.sender;
        _delegate(account, delegatee);
    }

    function setVoterWeight(address account, uint256 weight) external override onlyAllocatorManager {
        _voterWeight[account] = weight;
    }

    function hasVoted(uint256 allocatorId, address account) public view override returns (bool) {
        return _allocatorVotes[allocatorId].hasVoted[account];
    }

    function getAllocatorSubmit(uint256 allocatorId) 
        external 
        view 
        returns 
        (AllocatorDataTypes.AllocatorSubmit memory) 
    {
        return _allocatorSubmits[allocatorId];
    }

    function getAllocatorVote(uint256 allocatorId) 
        external 
        view 
        returns 
        (uint256, uint256) 
    {
        AllocatorDataTypes.AllocatorVote storage allocatorVote = _allocatorVotes[allocatorId];

        return (
            allocatorVote.forVotes, 
            allocatorVote.againstVotes
        );
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

    function getMinBalance(address asset) external view override returns (uint256) {
        return _assets[asset].minBalance;
    }

    function setMinBalance(address asset, uint256 minBalance) external override onlyAllocatorManager {
        AllocatorDataTypes.AssetData storage asset = _assets[asset];
        require(asset.active, "ERROR_ASSET_NOT_ACTIVE");
        asset.minBalance = minBalance;
    }

    function getMinStakedBalance(address asset) external view override returns (uint256) {
        return _assets[asset].minStakedBalance;
    }

    function setMinStakedBalance(address asset, uint256 minStakedBalance) external override onlyAllocatorManager {
        AllocatorDataTypes.AssetData storage asset = _assets[asset];
        require(asset.active, "ERROR_ASSET_NOT_ACTIVE");
        asset.minStakedBalance = minStakedBalance;
    }

    function getSubmitTimeRequirement(address asset) external view override returns (uint256) {
        return _assets[asset].submitTimeRequirement;
    }

    function setSubmitTimeRequirement(address asset, uint256 submitTimeRequirement) external override onlyAllocatorManager {
        AllocatorDataTypes.AssetData storage asset = _assets[asset];
        require(asset.active, "ERROR_ASSET_NOT_ACTIVE");
        asset.submitTimeRequirement = submitTimeRequirement;
    }

    function getMaxAllocators(address asset) external view override returns (uint256) {
        return _assets[asset].maxAllocators;
    }

    function setMaxAllocators(address asset, uint256 maxAllocators) external override onlyAllocatorManager {
        AllocatorDataTypes.AssetData storage asset = _assets[asset];
        require(asset.active, "ERROR_ASSET_NOT_ACTIVE");
        asset.maxAllocators = maxAllocators;
    }

    function getMaxAllocatorsPeriod(address asset) external view override returns (uint256) {
        return _assets[asset].maxAllocatorsPeriod;
    }

    function setMaxAllocatorsPeriod(address asset, uint256 maxAllocatorsPeriod) external override onlyAllocatorManager {
        AllocatorDataTypes.AssetData storage asset = _assets[asset];
        require(asset.active, "ERROR_ASSET_NOT_ACTIVE");
        asset.maxAllocatorsPeriod = maxAllocatorsPeriod;
    }

    function _delegate(address account, address delegatee) internal virtual {
        address oldDelegate = delegates(account);
        _delegation[account] = delegatee;

        // emit DelegateChanged(account, oldDelegate, delegatee);
        // _moveDelegateVotes(oldDelegate, delegatee, _getVotingUnits(account));
    }

    function _validateStake(address user) internal view returns (bool) {
        return  _stakedToken.balanceOf(user) > minStakedBalance;
    }

    // validates user as allocator on specific asset
    function _validateAllocator(address user, address asset) internal view returns (bool) {
        bool stakedMin = _validateStake(user);

        (address aTokenAddress,,,) = _poolDataProvider.getReserveTokensAddresses(asset);

        AllocatorDataTypes.AssetData storage assetData = _assets[asset];

        bool tokenMin = IERC20(aTokenAddress).balanceOf(user) > assetData.minBalance;

        return stakedMin && tokenMin;
    }

    function _voteSucceeded(uint256 allocatorId) internal view returns (bool) {
        AllocatorDataTypes.AllocatorVote storage allocatorVote = _allocatorVotes[allocatorId];
        console.log("_voteSucceeded");
        console.log("_voteSucceeded forVotes", allocatorVote.forVotes);
        console.log("_voteSucceeded againstVotes", allocatorVote.againstVotes);

        return allocatorVote.forVotes > allocatorVote.againstVotes;
    }
}