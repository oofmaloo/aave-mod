// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {CErc20Interface} from './interfaces/CErc20Interface.sol';
import {CTokenInterface} from './interfaces/CTokenInterfaces.sol';
import {InterestRateModel} from './interfaces/InterestRateModel.sol';

import {IPoolAddressesProvider} from '../../../../interfaces/IPoolAddressesProvider.sol';
import {IACLManager} from '../../../../interfaces/IACLManager.sol';
import {IRouter} from "../../../../interfaces/IRouter.sol";
import {PercentageMath} from '../../../libraries/math/PercentageMath.sol';
import {WadRayMath} from '../../../libraries/math/WadRayMath.sol';

import "hardhat/console.sol";

/**
 * @title CompoundRouterTest
 * Routers are designated for underlying/supplyToken vaults
 * @author Advias
 * @title Logic to connect to AAVE
 * - This contract never changes data, only returns unaltered data
 *      - Decimals changes are required to be done in the aggregator contract
 */
contract CompoundRouterTest is IRouter {
    using WadRayMath for uint256;
    using PercentageMath for uint256;
    using SafeERC20 for IERC20;

    IPoolAddressesProvider private _addressesProvider;
    IACLManager private _aclManager;

    address public rewardsController;

    uint256 public daysPerYear = 365;
    uint256 public blocksPerDay = 6570;
    uint256 public ethMantissa = 1 * 10 ** 18;

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
        address[] memory reserves,
        address[] memory tokens
    ) external onlyPoolAdmin {
        addReservesData(reserves, tokens);
    }

    function _addReservesData(
        address[] memory reserves,
        address[] memory tokens
    ) internal {
        addReservesData(reserves, tokens);
    }

    function addReservesData(
        address[] memory reserves,
        address[] memory tokens
    ) internal {
        require(reserves.length == tokens.length, "Reserve length mismatch");
        for (uint256 i = 0; i < reserves.length; i++) {
            address underlying = CErc20Interface(tokens[i]).underlying();
            require(underlying == reserves[i], "Underlying incorrect");

            addReserveData(
                reserves[i], 
                tokens[i]
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
        reserveData.supplyCieling = 0;
        addReserveDataToListInternal(asset);
        IERC20(asset).safeIncreaseAllowance(token, type(uint256).max);
        IERC20(token).safeIncreaseAllowance(token, type(uint256).max);
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

    constructor(
        address addressesProvider_,
        address aclManager,
        address rewardsController_, // comptroller interface
        address[] memory underlyings, // asset that gets sent in to router
        address[] memory tokens // cTokens that line with underlying
    ) {
        console.log("CompoundRouter");
        _addressesProvider = IPoolAddressesProvider(addressesProvider_);
        _aclManager = IACLManager(aclManager);
        rewardsController = rewardsController_;
        _setPoolAdmin();
        _addReservesData(
            underlyings,
            tokens
        );
    }

    modifier onlyPoolAdmin() {
        require(_aclManager.isPoolAdmin(msg.sender));
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
        console.log("CompoundRouter deposit");
        console.log("CompoundRouter deposit", msg.sender);
        console.log("CompoundRouter deposit", address(this));
        console.log("CompoundRouter asset", asset);
        console.log("CompoundRouter amount", amount);
        console.log("CompoundRouter balanceOf", IERC20(asset).balanceOf(address(this)));

        IERC20(asset).approve(token, type(uint256).max);

        CErc20Interface(token).mint(amount);
        console.log("CompoundRouter deposit after");
    }

    function redeem(address asset, address token, uint256 amount, address to) public override returns (uint256) {
        console.log("CompoundRouterTest redeem asset", asset);
        console.log("CompoundRouterTest redeem amount", amount);
        console.log("CompoundRouterTest redeem to", to);
        CErc20Interface(token).redeemUnderlying(amount);
        return 0;
    }

    function setUserUseReserveAsCollateral(address asset, bool useAsCollateral) external override {
        // IPool(aavePool).setUserUseReserveAsCollateral(asset, useAsCollateral);
    }

    function getPreviousInterestRate(address asset) external view override returns (uint256) {
        ReserveData storage reserveData = reservesData[asset];
        InterestRateModel _interestRateModel = CTokenInterface(reserveData.depositToken).interestRateModel();
        // uint totalBorrows = CTokenInterface(reserveData.depositToken).totalBorrowsCurrent();
        uint totalBorrows = 0;
        uint cash = CTokenInterface(reserveData.depositToken).getCash();
        // uint reserves = IERC20(asset).balanceOf(reserveData.depositToken);
        uint reserves = CTokenInterface(reserveData.depositToken).totalReserves();

        uint rate = _interestRateModel.getSupplyRate(
            cash, 
            totalBorrows, 
            reserves, 
            CErc20Interface(reserveData.depositToken).reserveFactorMantissa()
        );

        uint256 rate265 = wadPow((uint256(rate) / ethMantissa * blocksPerDay) + 1, daysPerYear) * 100;
        console.log("rate265", rate265);

        return rate265.wadToRay();
    }

    function getSimulatedInterestRate(address asset, uint256 liquidityAdded, uint256 liquidityTaken) external view override returns (uint256) {
        ReserveData storage reserveData = reservesData[asset];

        // uint totalBorrows = CTokenInterface(reserveData.depositToken).totalBorrowsCurrent();
        uint totalBorrows = CTokenInterface(reserveData.depositToken).totalBorrows();
        uint cash = CTokenInterface(reserveData.depositToken).getCash();
        // uint reserves = IERC20(asset).balanceOf(reserveData.depositToken);
        uint reserves = CTokenInterface(reserveData.depositToken).totalReserves();

        InterestRateModel _interestRateModel = CTokenInterface(reserveData.depositToken).interestRateModel();

        uint rate = _interestRateModel.getSupplyRate(
            cash + liquidityAdded - liquidityTaken, 
            totalBorrows, 
            reserves, 
            CErc20Interface(reserveData.depositToken).reserveFactorMantissa()
        );

        // ((((rate / ethMantissa * blocksPerDay + 1) ^ Days Per Year)) - 1) * 100

        uint256 rate265 = wadPow((uint256(rate) / ethMantissa * blocksPerDay) + 1e18, daysPerYear) * 100;
        console.log("rate265", rate265);

        return rate265.wadToRay();
    }

    function wadPow(uint256 x, uint256 n) internal pure returns (uint256 z) {

        z = n % 2 != 0 ? x : WadRayMath.WAD;

        for (n /= 2; n != 0; n /= 2) {
            x = WadRayMath.wadMul(x, x);

            if (n % 2 != 0) {
                z = WadRayMath.wadMul(z, x);
            }
        }
    }


    // function utilizationRate(uint cash, uint borrows, uint reserves) internal pure returns (uint) {
    //     // Utilization rate is 0 when there are no borrows
    //     if (borrows == 0) {
    //         return 0;
    //     }

    //     return borrows.mul(1e18).div(cash.add(borrows).sub(reserves));
    // }



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
        return (
            CTokenInterface(reserveData.depositToken).balanceOfUnderlying(account) * 
            (10**reserveData.underlyingDecimals) / 
            (10**reserveData.depositTokenDecimals)
        );
    }

    function getBalanceStored(address asset, address account) external view override returns (uint256) {
        ReserveData storage reserveData = reservesData[asset];

        // uint exchangeRate = CTokenInterface(reserveData.depositToken).exchangeRateStored();


        // return CTokenInterface(reserveData.depositToken).balanceOfUnderlying(account);
        return 0;
    }

    function underlying(address asset) public view override returns (address) {
        return reservesData[asset].underlying;
    }

    function depositToken(address asset) public view override returns (address) {
        return reservesData[asset].depositToken;
    }

    function getRouterPool() external view override returns (address) {
        return address(0);
    }

    /**
     * @dev Return if router uses a bridge
     */
    function isBridge() public view override returns (bool) {
        return false;
    }

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
        // uint256 emissionsPerSecond = ComptrollerInterface(rewardsController).compSupplySpeeds(tokenAsset) / (blocksPerDay / daysPerYear);
        return 0;
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
        // ComptrollerInterface(rewardsController).compSupplySpeeds(tokenAsset);
        return 0;
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
        // ComptrollerInterface(rewardsController).claimComp(address(this)); 
        return 0;
    }

}
