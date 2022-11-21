// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IPool} from './interfaces/ILendingPool.sol';
import {IRewardsController} from './interfaces/IRewardsController.sol';
import {IAavePoolAddressesProvider} from './interfaces/IAavePoolAddressesProvider.sol';
import {IPoolDataProvider} from './interfaces/IPoolDataProvider.sol';
import {IReserveInterestRateStrategyV3, DataTypes} from './interfaces/IReserveInterestRateStrategyV3.sol';
import {IPoolAddressesProvider} from '../../../../interfaces/IPoolAddressesProvider.sol';
import {IACLManager} from '../../../../interfaces/IACLManager.sol';
import {IRouter} from "../../../../interfaces/IRouter.sol";
import {PercentageMath} from '../../../libraries/math/PercentageMath.sol';
import {Helper} from './helpers/Helper.sol';

import "hardhat/console.sol";

/**
 * @title AaveV3RouterTest
 * Routers are designated for underlying/supplyToken vaults
 * @author Advias
 * @title Logic to connect to AAVE
 * - This contract never changes data, only returns unaltered data
 *      - Decimals changes are required to be done in the aggregator contract
 */
contract AaveV3RouterTest is Helper, IRouter {
    using SafeMath for uint256;
    using PercentageMath for uint256;
    using SafeERC20 for IERC20;

    IPoolAddressesProvider private _addressesProvider;
    IACLManager private _aclManager;

    IAavePoolAddressesProvider private _aaveAddressesProvider;

    // address public aavePool;
    address public aaveRewardsController;
    // address public aaveDataProvider;

    address private poolAdmin;

    struct ReserveData {
        address underlying;
        address depositToken;
        address interestRateStrategyAddress;
        uint256 underlyingDecimals;
        uint256 depositTokenDecimals;
        uint256 supplyCieling;
        uint256 reserveFactor;
        bool active;
    }

    uint256 internal reservesDataCount;
    mapping(uint256 => address) public reservesDataList;
    mapping(address => ReserveData) public reservesData;

    uint256 internal rewardsCount;
    mapping(uint256 => address) public rewardsList;

    modifier onlyPoolAggregatorConfigurator() {
        _onlyPoolAggregatorConfigurator();
        _;
    }

    function _onlyPoolAggregatorConfigurator() internal view virtual {
        require(
            _addressesProvider.getPoolAggregatorConfigurator() == msg.sender,
            "Errors.CALLER_NOT_POOL_AGGREGATOR_CONFIGURATOR"
        );
    }

    function _addReservesData_(
        address[] memory reserves
    ) external onlyPoolAdmin {
        addReservesData(reserves);
    }

    function _addReservesData(
        address[] memory reserves
    ) internal {
        addReservesData(reserves);
    }

    function addReservesData(
        address[] memory reserves
    ) internal {
        for (uint256 i = 0; i < reserves.length; i++) {
            require(reserves[i] != address(0), "Error: Token zero");
            (address aTokenAddress,,) = IPoolDataProvider(aaveDataProvider).getReserveTokensAddresses(reserves[i]);
            require(aTokenAddress != address(0), "Error: Token zero");

            addReserveData(
                reserves[i], 
                aTokenAddress
            );
        }
    }

    /**
     * @dev Adds underlying asset to accept
     * Maybe add a vault to store balances
     **/
    function addReserveData(
        address asset,
        address token
    ) internal {
        ReserveData storage reserveData = reservesData[asset];
        uint256 assetDecimals = IERC20Metadata(asset).decimals();
        uint256 tokenDecimals = IERC20Metadata(token).decimals();
        reserveData.underlying = asset;
        reserveData.underlyingDecimals = assetDecimals;
        reserveData.depositToken = token;
        reserveData.depositTokenDecimals = tokenDecimals;
        reserveData.active = true;
        addReserveDataToListInternal(asset);
        IERC20(asset).safeIncreaseAllowance(aavePool, type(uint256).max);
        IERC20(token).safeIncreaseAllowance(aavePool, type(uint256).max);
    }

    function addReserveDataToListInternal(address asset) internal {
        uint256 _reservesDataCount = reservesDataCount;
        bool reserveAlreadyAdded = false;
        for (uint256 i = 0; i < _reservesDataCount; i++)
            if (reservesDataList[i] == asset) {
                reserveAlreadyAdded = true;
            }
        if (!reserveAlreadyAdded) {
            reservesDataList[reservesDataCount] = asset;
            reservesDataCount = _reservesDataCount + 1;
        }
    }

    function addRewards(
        address[] memory rewards
    ) external onlyPoolAdmin {
        addReservesData(rewards);
    }

    function _addRewards(
        address[] memory rewards
    ) internal {
        for (uint256 i = 0; i < rewards.length; i++) {
            addRewardsToListInternal(rewards[i]);
        }
    }

    function addRewardsToListInternal(address reward) internal {
        uint256 _rewardsCount = rewardsCount;
        bool reserveAlreadyAdded = false;
        for (uint256 i = 0; i < _rewardsCount; i++)
            if (rewardsList[i] == reward) {
                reserveAlreadyAdded = true;
            }
        if (!reserveAlreadyAdded) {
            rewardsList[rewardsCount] = reward;
            rewardsCount = _rewardsCount + 1;
        }
    }

    function dropReward(address reward) external onlyPoolAdmin {
        require(reward != address(0), 'Error: Zero address');
        for (uint256 i = 0; i < _rewardsCount; i++) {
            if (rewardsList[i] == reward) {
                rewardsList[i] = address(0);
            }
        }
    }

    constructor(
        address aavePoolAddress,
        address aaveAddressesProviderAddress,
        address addressesProvider_,
        address aclManager,
        address rewardsController_,
        address aavePoolDataProvider_,
        address[] memory underlyings, // asset that gets sent in to router
        uint256 borrowFactor_
    ) Helper(aaveAddressesProviderAddress, aavePoolAddress, aavePoolDataProvider_) {
        _aaveAddressesProvider = IAavePoolAddressesProvider(aaveAddressesProviderAddress);
        _addressesProvider = IPoolAddressesProvider(addressesProvider_);
        _aclManager = IACLManager(aclManager);
        aaveRewardsController = rewardsController_;
        _setPoolAdmin();
        _addReservesData(
            underlyings
        );
    }

    function setAavePoolAddressesProvider(address aaveAddressesProviderAddress) external onlyPoolAdmin {
        _aaveAddressesProvider = IAavePoolAddressesProvider(aaveAddressesProviderAddress);
    }

    modifier onlyPoolAdmin() {
        require(_aclManager.isPoolAdmin(msg.sender), "ONLY_POOL_ADMIN");
        _;
    }

    function _setPoolAdmin() internal {
        poolAdmin = _addressesProvider.getACLAdmin();
    }

    function setPoolAdmin(address admin) public onlyPoolAdmin {
        poolAdmin = _addressesProvider.getACLAdmin();
    }

    function initRouterAssetData() external {

    }

    function isActive(address asset) external returns (bool) {
        return reservesData[asset].active;
    }

    /**
     * @dev Deposits underlying to a protocol
     * @param asset Asset to transfer in
     * @param amount Amount to transfer in
     * - Amount must be decimals converted ahead of call
     */
    function deposit(address asset, address token, uint256 amount) public override {
        console.log("AaveRouter deposit");
        console.log("AaveRouter deposit", msg.sender);
        console.log("AaveRouter deposit", address(this));
        console.log("AaveRouter aavePool", aavePool);
        console.log("AaveRouter asset", asset);
        console.log("AaveRouter amount", amount);
        console.log("AaveRouter balanceOf", IERC20(asset).balanceOf(address(this)));


        IERC20(asset).approve(aavePool, amount);
        console.log("AaveRouter safeApprove");

        IPool(aavePool).deposit(
            asset,
            amount,
            // msg.sender,
            address(this),
            0
        );
        console.log("AaveRouter deposit after");
    }

    function redeem(address asset, address token, uint256 amount, address to) public override returns (uint256) {
        console.log("AaveV3RouterTest redeem asset", asset);
        console.log("AaveV3RouterTest redeem amount", amount);
        console.log("AaveV3RouterTest redeem to", to);
        console.log("AaveV3RouterTest redeem aavePool", aavePool);
        uint256 amountRedeemed = IPool(aavePool).withdraw(
            asset,
            amount,
            to
        );
        console.log("AaveV3RouterTest redeem amountRedeemed", amountRedeemed);
        return amountRedeemed;
    }

    function setUserUseReserveAsCollateral(address asset, bool useAsCollateral) external override {
        IPool(aavePool).setUserUseReserveAsCollateral(asset, useAsCollateral);
    }

    function getPreviousInterestRate(address asset) external view override returns (uint256) {
        // aave v3
        console.log("AaveV3RouterTest aaveDataProvider", aaveDataProvider);
        console.log("AaveV3RouterTest asset", asset);
        (,,,,,uint256 currentLiquidityRate,,,,,,) = IPoolDataProvider(aaveDataProvider).getReserveData(asset);
        console.log("AaveV3RouterTest currentLiquidityRate", currentLiquidityRate);
        return currentLiquidityRate;
    }

    function getSimulatedInterestRate(address asset, uint256 liquidityAdded, uint256 liquidityTaken) external view override returns (uint256) {
        ReserveData storage reserveData = reservesData[asset];
        (
            uint256 unbacked,,,
            uint256 totalStableDebt,
            uint256 totalVariableDebt,,,,
            uint256 averageStableBorrowRate,,,
        ) = IPoolDataProvider(aaveDataProvider).getReserveData(asset);

        address interestRateStrategyAddress = IPoolDataProvider(aaveDataProvider).getInterestRateStrategyAddress(asset);
        (,,,,uint256 reserveFactor,,,,,) = IPoolDataProvider(aaveDataProvider).getReserveConfigurationData(asset);

        (uint256 rate, , ) = IReserveInterestRateStrategyV3(interestRateStrategyAddress).calculateInterestRates(
          DataTypes.CalculateInterestRatesParams({
            unbacked: unbacked,
            liquidityAdded: liquidityAdded,
            liquidityTaken: liquidityTaken,
            totalStableDebt: totalStableDebt,
            totalVariableDebt: totalVariableDebt,
            averageStableBorrowRate: averageStableBorrowRate,
            reserveFactor: reserveFactor,
            reserve: asset,
            aToken: reserveData.depositToken
          })
        );

        return rate;
    }

    /**
     * @dev Return how much can be withdrawn without revert
     */
    function getLiquidity(address asset) public view override returns (uint256) {
        ReserveData storage reserveData = reservesData[asset];
        return IERC20(asset).balanceOf(reserveData.depositToken);
    }

    /**
     * @dev Return underlying asset balance
     * - We run this here in case a protocol has unmatched decimals between their receipt token and underlying
     * - As well as in case balanceOf does not return balance, but the scaled instead
     */
    function getBalance(address asset, address account) external override returns (uint256) {
        ReserveData storage reserveData = reservesData[asset];
        return IERC20(reserveData.depositToken).balanceOf(account);
    }

    function getBalanceStored(address asset, address account) external view override returns (uint256) {
        ReserveData storage reserveData = reservesData[asset];
        return IERC20(reserveData.depositToken).balanceOf(account);
    }

    function underlying(address asset) public view override returns (address) {
        return reservesData[asset].underlying;
    }

    function depositToken(address asset) public view override returns (address) {
        return reservesData[asset].depositToken;
    }

    function getRouterPool() external view override returns (address) {
        return aavePool;
    }

    /**
     * @dev Return if router uses a bridge
     */
    function isBridge() public view override returns (bool) {
        return false;
    }

    /**
     * @dev Rescue tokens because there should never be assets held in here
     */
    function rescueTokens(
        address token_,
        address to,
        uint256 amount
    ) external onlyPoolAdmin {
        uint256 balance = IERC20(token_).balanceOf(address(this));
        if (amount > balance) {
            amount = balance;
        }
        IERC20(token_).safeTransfer(to, amount);
    }

    function rescueEth(uint256 amount) external onlyPoolAdmin {
        require(amount > 0);
        payable(msg.sender).transfer(amount);
        emit Recovered(address(0), amount);
    }

    // function claimAllRewards(address asset, address to) external override onlyPoolAdmin {
    //     address[] memory assets = new address[](0);
    //     assets[0] = asset;
    //     IRewardsController(aaveRewardsController).claimAllRewards(assets, to);
    // }
    
    function rewardsEmissionsPerSecond(
        address /*underlyingAsset*/,
        address tokenAsset, 
        address rewardToken
    ) 
        external 
        override 
        returns 
        (uint256) 
    {
        (, uint256 emissionPerSecond, , ) = IRewardsController(aaveRewardsController).getRewardsData(tokenAsset, rewardToken);
        return emissionPerSecond;
    }

    function rewardsBalance(
        address /*underlyingAsset*/,
        address tokenAsset, 
        uint256 amount, 
        address to, 
        address rewardToken
    ) 
        external 
        override 
        returns 
        (uint256) 
    {
        address[] memory assets = new address[](0);
        assets[0] = tokenAsset;

        uint256 rewardsBalance = IRewardsController(aaveRewardsController).getUserRewards(
            assets,
            msg.sender,
            rewardToken
        );
        return rewardsBalance;
    }

    function claimSingleReward(
        address /*underlyingAsset*/,
        address tokenAsset, 
        uint256 amount, 
        address to, 
        address rewardToken
    ) 
        external 
        override 
        returns 
        (uint256) 
    {
        address[] memory assets = new address[](0);
        assets[0] = tokenAsset;

        uint256 amountClaimed = IRewardsController(aaveRewardsController).claimRewards(
            assets, // aToken
            amount,
            to,
            rewardToken
        );
        return amountClaimed;
    }
}