// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import {WadRayMath} from '../libraries/math/WadRayMath.sol';
import {IPoolAddressesProvider} from '../../interfaces/IPoolAddressesProvider.sol';
import {IACLManager} from '../../interfaces/IACLManager.sol';
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IRouter} from "../../interfaces/IRouter.sol";
import {IAggregator} from "../../interfaces/IAggregator.sol";
import {IPoolDataProvider} from '../../interfaces/IPoolDataProvider.sol';
import {DataTypes} from '../libraries/types/DataTypes.sol';
import {IAggregatorStrategyBase} from '../../interfaces//IAggregatorStrategyBase.sol';
import {IRewardsClaimer} from "../../interfaces/IRewardsClaimer.sol";

// import "hardhat/console.sol";

/**
 * @title Aggregator
 * Aggregator is the main point of contact on addTokens
 * The Aggregator contacts the Router, the Router is the main point of contact to outside protocols
 * @author Addi
 */
contract Aggregator is IAggregator {
    // using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using WadRayMath for uint256;

    // address internal AGGREGATOR_VAULT;

    IPoolAddressesProvider private _addressesProvider;
    IRewardsClaimer private _rewardsClaimer;

    IAggregatorStrategyBase internal _aggregatorStrategy;

    IERC20 private _underlying;
    /**
     * @dev Included for possible asset aggregating
    **/
    uint256 private underlyingDecimals;

    /**
     * @dev addToken aggregator is deployed for
    **/
    // address private aTokenAddress;
    /**
     * @dev Last updated sub router balance reduced sum
     * Adj for underlyingDecimals
    **/
    uint256 public override balance;

    uint256 internal routersDataCount;
    mapping(uint256 => address) internal routersDataList;
    mapping(address => RouterData) internal routersData;

    // assets enabled for borrowing on a specific router
    mapping(address => mapping(uint256 => address)) internal borrowingEnabledAssets;

    // addresses able to make calls on movement of funds
    // creates a modular strategy architecture
    // account => TRUE/FALSE
    mapping(address => bool) internal _authorized;
    mapping(uint256 => address) internal authorizedList;
    uint256 internal authorizedCount;

    // most prev timestamp of reallocation from authorized allocator
    // tracks appreciation before new distr

    struct LastAllocation {
        uint256 timestampAllocated;
        uint256 accrued;
        uint256 decreased;
    }

    LastAllocation public lastAllocated;

    function getAuthorizedList() public view returns (address[] memory) {
        uint256 _authorizedCount = authorizedCount;
        uint256 droppedAuthorizedCount = 0;
        address[] memory _authorizedList = new address[](_authorizedCount);

        for (uint256 i = 0; i < _authorizedCount; i++) {
            if (authorizedList[i] != address(0)) {
                _authorizedList[i - droppedAuthorizedCount] = authorizedList[i];
            } else {
                droppedAuthorizedCount++;
            }
        }

        // Reduces the length of the routers array by `droppedRoutersCount`
        assembly {
            mstore(_authorizedList, sub(_authorizedCount, droppedAuthorizedCount))
        }
        return _authorizedList;
    }

    function addAuthorized(address account) public returns (bool) {
        require(account != address(0), 'Errors.ACCOUNT_IS_ZEROS');
        if (_addAuthorizedToListInternal(account)) {
            authorizedCount++;
        }
        emit NewAuthorized(account);
    }

    function _addAuthorizedToListInternal(address account) internal returns (bool) {
        uint256 _authorizedCount = authorizedCount;
        bool authorizedAlreadyAdded = false;
        for (uint16 i = 0; i < _authorizedCount; i++) {
            if (authorizedList[i] == account) {
                authorizedAlreadyAdded = true;
            }
        }
        require(!authorizedAlreadyAdded, 'Errors.ACCOUNT_ALREADY_ADDED');

        for (uint16 i = 0; i < _authorizedCount; i++) {
            if (authorizedList[i] == address(0)) {
                // replace removed account
                authorizedList[i] = account;
                // don't increase authorizedCount
                return false;
            }
        }

        _authorized[account] = true;
        authorizedList[authorizedCount] = account;
        return true;
    }

    function removeAuthorized(address account) external {
        // require account is authorized
        require(_authorized[account], 'Errors.ACCOUNT_IS_FALSE');
        _authorized[account] = false;

        bool accountExists = false;
        for (uint16 i = 0; i < authorizedCount; i++) {
            if (authorizedList[i] == account) {
                // find the account in the list
                accountExists = true;
                // remove account from list
                // this will be replace on next authorized account added
                authorizedList[i] = address(0);
            }
        }
        require(accountExists, 'ERROR.ACCOUNT_NOT_FOUND');
        emit RemoveAuthorized(account);
    }

    function _routersDataCount() external view override returns (uint256) {
        return routersDataCount;
    }

    function _routersDataList(uint256 i) external view override returns (address) {
        return routersDataList[i];
    }

    function getRoutersDataList() external view override returns (address[] memory) {
        address[] memory routers = new address[](routersDataCount);
        for (uint256 i = 0; i < routersDataCount; i++) {
            routers[i] = routersDataList[i];
        }
        return routers;
    }

    function getActiveRoutersDataList() external view override returns (address[] memory) {
        address[] memory routers = new address[](routersDataCount);
        for (uint256 i = 0; i < routersDataCount; i++) {
            if (routersData[routersDataList[i]].active) {
                routers[i] = routersDataList[i];
            } else {
                routers[i] = address(0);
            }
        }
        return routers;
    }

    function getRoutersList() public view returns (address[] memory) {
        uint256 routersListCount = routersDataCount;
        uint256 droppedRoutersCount = 0;
        address[] memory routersList = new address[](routersListCount);

        for (uint256 i = 0; i < routersListCount; i++) {
            if (routersDataList[i] != address(0)) {
                routersList[i - droppedRoutersCount] = routersDataList[i];
            } else {
                droppedRoutersCount++;
            }
        }

        // Reduces the length of the routers array by `droppedRoutersCount`
        assembly {
            mstore(routersList, sub(routersListCount, droppedRoutersCount))
        }
        return routersList;
    }

    function isRouterActiveByIndex(uint256 index) external view override returns (bool) {
        return routersData[routersDataList[index]].active;
    }

    function getRouterData(address router) external view override returns (RouterData memory) {
        return routersData[router];
    }

    function addRoutersData(
        address[] memory routers
    ) public onlyPoolAdmin {
        _addRoutersData(routers);
    }

    function _addRoutersData(
        address[] memory routers
    ) internal {
        for (uint256 i = 0; i < routers.length; i++) {
            address underlying = IRouter(routers[i]).underlying(address(_underlying));
            require(underlying != address(0), "Error: Token zero");
            addRouterData(underlying, routers[i]);
        }

        emit NewRouter(routers);
    }

    /**
     * @dev Adds underlying asset to accept
     * Maybe add a vault to store balances
     **/
    function addRouterData(
        address asset,
        address router
    ) internal {
        RouterData storage routerData = routersData[router];
        routerData.router = router;
        routerData.active = true;
        routerData.exists = true;
        if (_addRouterDataToListInternal(router)) {
            routersDataCount = routersDataCount + 1;
        }
        // address token = IRouter(router).depositToken(asset);
        // IERC20(asset).safeIncreaseAllowance(router, type(uint256).max);
        // IERC20(token).safeIncreaseAllowance(router, type(uint256).max);
    }

    function _addRouterDataToListInternal(address router) internal returns (bool) {
        uint256 _routersDataCount = routersDataCount;
        bool routerAlreadyAdded = false;

        // make sure not to duplicate
        for (uint16 i = 0; i < _routersDataCount; i++) {
            if (routersDataList[i] == router) {
                routerAlreadyAdded = true;
            }
        }

        require(!routerAlreadyAdded, 'Errors.ROUTER_ALREADY_ADDED');

        // replace previously dropped routers
        for (uint16 i = 0; i < _routersDataCount; i++) {
            if (routersDataList[i] == address(0)) {
                // override dropped router
                routersData[router].id = uint8(i);
                routersDataList[i] = router;
                // _interestRateOracle.setRouters();
                return false;
            }
        }

        routersDataList[routersDataCount] = router;
        return true;
    }

    // distr strategy functions on deposit / withdraw tx's

    function setAggregatorStrategy(IAggregatorStrategyBase aggregatorStrategy)
        external 
        onlyPoolAdmin
    {
        _installAggregatorStrategy(aggregatorStrategy);
    }

    function _installAggregatorStrategy(IAggregatorStrategyBase aggregatorStrategy)
        internal
    {
        require(address(aggregatorStrategy) != address(0), 'STRATEGY_CAN_NOT_BE_ZERO');
        require(Address.isContract(address(aggregatorStrategy)) == true, 'STRATEGY_MUST_BE_CONTRACT');
        _aggregatorStrategy = aggregatorStrategy;
        addAuthorized(address(aggregatorStrategy));
    }

    function getAggregatorStrategy() external view override returns (address) {
        return address(_aggregatorStrategy);
    }

    function _supply(
        uint256 amount
    ) internal {
        // if there is no strategy the amount stays in the aggregator
        if (amount != 0 && address(_aggregatorStrategy) != address(0)) {
            bool success = _aggregatorStrategy.performSupply(
                address(_underlying), 
                amount
            );
            require(success == true, 'SUPPLY_ERROR');
        }
    }

    function _withdraw(
        uint256 amount
    ) internal {
        // strategy should withdraw funds into the aggregator
        if (amount != 0 && address(_aggregatorStrategy) != address(0)) {
            bool success = _aggregatorStrategy.performWithdraw(address(_underlying), amount);
            require(success == true, 'WITHDRAW_ERROR');
        }

        // if there is no withdraw strategy, run default withdraw
        if (amount != 0 && address(_aggregatorStrategy) == address(0)) {
            _defaultWithdraw(amount);
        }
    }

    // default withdraw function so users can always remove funds or at least attempt to
    function _defaultWithdraw(
        uint256 amount
    ) internal {
        uint256 amount_ = amount;
        for (uint256 i = 0; i < routersDataCount && amount_ > 0; i++) {
            if (routersDataList[i] == address(0)) {
                continue;
            }
            uint256 balance = IRouter(routersDataList[i]).getBalance(address(_underlying), address(this));
            if (balance == 0) {
                continue;
            }
            uint256 liquidity = IRouter(routersDataList[i]).getLiquidity(address(_underlying));
            uint256 redeemAmount = amount_ > liquidity ? liquidity : amount_;
            redeemFromRouter(routersDataList[i], amount_);
            amount_ = amount_ - redeemAmount;
        }
    }

    function _borrow(
        address router,
        uint256 amount
    ) internal {
        //
        // if (amount != 0 && address(_aggregatorStrategy) != address(0)) {
        //     bool success = _aggregatorStrategy.performBorrow(router, address(_underlying), amount);
        //     require(success == true, 'WITHDRAW_ERROR');
        // }
    }

    function _repay(
        address router,
        uint256 amount
    ) internal {
        //
        // if (amount != 0 && address(_aggregatorStrategy) != address(0)) {
        //     bool success = _aggregatorStrategy.performRepay(router, address(_underlying), amount);
        //     require(success == true, 'WITHDRAW_ERROR');
        // }
    }

    function transferTo(
        address to,
        uint256 amount
    ) external override onlyStrategy {
        _underlying.safeTransfer(to, amount);
    }

    /// to drop a router
    /// set to active false - setActive(address router, bool val)
    /// withdrawRouter() to balance == 0
    /// - continue withdrawing until 0
    /// dropRouter(address) - requires 0 balance
    function withdrawRouter(address router) public onlyPoolAdmin {
        RouterData storage routerData = routersData[router];
        // ensure router not active
        require(!routerData.active, 'Error: Router still active');

        uint256 balance = IRouter(router).getBalance(address(_underlying), address(this));
        require(balance > 0, 'Error: Router balance zero');

        uint256 liquidity = IRouter(router).getLiquidity(address(_underlying));

        uint256 redeemAmount = balance > liquidity ? liquidity : balance;
        address token = IRouter(router).depositToken(address(_underlying));
        (bool success,) = router.delegatecall(
            abi.encodeWithSignature("redeem(address,address,uint256,address)",address(_underlying),token,redeemAmount,address(this))
        );
    }

    function dropRouter(address router) external onlyPoolAdmin {
        require(router != address(0), 'Error: Zero address');

        // to drop a router, router must have no balance
        require(
            IRouter(router).getBalance(address(_underlying), address(this)) == 0, 
            'Error: Router has balance cannot drop'
        );

        routersDataList[routersData[router].id] = address(0);
        delete routersData[router];

        emit DropRouter(
            router
        );
    }

    constructor(
        address addressesProvider,
        address underlyingAssetAddress,
        address[] memory routers
    ) {
        _addressesProvider = IPoolAddressesProvider(addressesProvider);
        _underlying = IERC20(underlyingAssetAddress);
        _addRoutersData(routers);
    }

    modifier onlyPoolAdmin() {
        require(IACLManager(_addressesProvider.getACLManager()).isPoolAdmin(msg.sender));
        _;
    }

    // modifier onlyPoolAdmin() {
    //     IACLManager aclManager = IACLManager(_addressesProvider.getACLManager());
    //     require(aclManager.isPoolAdmin(msg.sender), "Errors.CALLER_NOT_POOL_ADMIN");
    //     _;
    // }


    modifier onlyPool() {
        require(msg.sender == _addressesProvider.getPool());
        _;
    }

    modifier onlyStrategy() {
        require(msg.sender == address(_aggregatorStrategy));
        _;
    }

    /**
     * @dev mapping of authorized contracts that can call routers on behalf of the aggregator
     **/
    modifier onlyAuthorized() {
        require(_authorized[msg.sender], "Not authorized");
        _;
    }

    /**
     * @dev harvesting strategy contract
     * Should redeem rewards and swap into underlying asset into aggregator
     **/
    modifier onlyRewardsClaimer() {
        require(msg.sender == address(_rewardsClaimer));
        _;
    }

    /**
     * @dev how much accrued since last allocation/redistr used by allocator
     **/
    function getLastAllocatedAccrued() external view override returns (uint256) {
        return lastAllocated.accrued;
        if (lastAllocated.accrued > lastAllocated.decreased) {
            return (lastAllocated.accrued - lastAllocated.decreased);
        } else {
            // return lowest number possible if decreased
            return 0;
        }
    }

    /**
     * @dev resets accrued called by the redistr strategy contract
     **/
    function setLastAllocated() external override onlyAuthorized {
        lastAllocated.timestampAllocated = block.timestamp;
        lastAllocated.accrued = 0;
        lastAllocated.decreased = 0;
    }

    function setSupplyCieling(address router, uint256 _supplyCieling) public onlyPoolAdmin {
        RouterData storage routerData = routersData[router];
        require(routerData.active, 'Error: active');
        routerData.supplyCieling = _supplyCieling;
    }

    function getSupplyCieling(address router) public override returns (uint256) {
        return routersData[router].supplyCieling;
    }

    function setBorrowingEnabled(address router, bool _borrowingEnabled) public onlyPoolAdmin {
        RouterData storage routerData = routersData[router];
        require(routerData.active, 'Error: active');
        routerData.borrowingEnabled = _borrowingEnabled;
    }

    function getBorrowingEnabled(address router) public override returns (bool) {
        return routersData[router].borrowingEnabled;
    }

    function setAddressesProvider(address addressesProviderAddress) public onlyPoolAdmin {
        _addressesProvider = IPoolAddressesProvider(addressesProviderAddress);
    }

    /// Set router to active mode allowing functions
    /// unnactive routers still count in balance
    function setActive(address router, bool val) public onlyPoolAdmin {
        RouterData storage routerData = routersData[router];
        if (val == false) {
            uint256 balance = IRouter(routerData.router).getBalance(address(_underlying), address(this));
            require(balance == 0);
            routerData.active = val;
        } else {
            require(routerData.exists && routerData.active);
            routerData.active = val;
        }
    }

    function getUnderlyingAsset() public view override returns (address) {
        return address(_underlying);
    }

    /**
    * @dev Simulation - not expected to be accurate to block - way to get balance without tx query
    */
    function accrueSim() public view override returns (uint256, uint256) {
        // if there are no router deposits
        //      exchange rate doens't require increasing
        //      interest rate is required for debt interest rate
        if (balance == 0) {
            return (0, 0);
        }

        // see how much router accrued
        uint256 _lastUpdatedBalance = balance;
        // get updated routed balance
        uint256 routerBalance = getBalanceStored();

        // if no increase, return previous values
        //      this is possible is protocols arent updated before our called block 
        // if (routerBalance == _lastUpdatedBalance) {
        //     return (balance, routerBalance);
        // }

        return (
            routerBalance,
            _lastUpdatedBalance
        );
    }

    /**
     * @dev Get accurate balance of tokens and update state, onlyPool caller
     */
    function accrue() public override onlyPool returns (uint256, uint256) {
        // if there are no router deposits
        //      exchange rate doens't require increasing
        //      interest rate is required for debt interest rate
        if (balance == 0) {
            return (0, 0);
        }

        // see how much router accrued
        uint256 _lastUpdatedBalance = balance;
        
        // get updated routed balance
        uint256 routerBalance = getBalance();

        balance = routerBalance;


        // update accrued or decreased for allocation
        if (routerBalance < _lastUpdatedBalance) {
            lastAllocated.decreased += _lastUpdatedBalance - routerBalance;
        } else {
            lastAllocated.accrued += routerBalance - _lastUpdatedBalance;
        }

        emit Accrue(
            address(_underlying),
            _lastUpdatedBalance,
            routerBalance
        );

        return (
            routerBalance,
            _lastUpdatedBalance
        );
    }

    /// LP balance + any balance in contract
    /// Only check balance before and after sequences, never after deposits/withdraws ahead of updating `balance`
    /// If balance includes harvesting or other assets, do not include that here
    /// - the balance must only include the underlying asset redeemable balance
    function getBalance() public override returns (uint256) {
        uint256 totalRoutedBalance = _underlying.balanceOf(address(this));
        for (uint256 i = 0; i < routersDataCount; i++) {
            if (routersDataList[i] == address(0)) {
                continue;
            }
            // RouterData storage routerData = routersData[routersDataList[i]];
            // it is the routers duty to convert to correct decimals
            totalRoutedBalance += 
                IRouter(routersDataList[i]).getBalance(address(_underlying), address(this));
        }
        return totalRoutedBalance;
    }

    function getBalanceStored() public view override returns (uint256) {
        uint256 totalRoutedBalance = _underlying.balanceOf(address(this));
        for (uint256 i = 0; i < routersDataCount; i++) {
            if (routersDataList[i] == address(0)) {
                continue;
            }
            // RouterData storage routerData = routersData[routersDataList[i]];
            // it is the routers duty to convert to correct decimals
            totalRoutedBalance += 
                IRouter(routersDataList[i]).getBalanceStored(address(_underlying), address(this));
        }
        return totalRoutedBalance;
    }

    /// router only balance used to find total distributed balance
    function getRoutersBalance() public view override returns (uint256) {
        uint256 totalRoutedBalance;
        for (uint256 i = 0; i < routersDataCount; i++) {
            if (routersDataList[i] == address(0)) {
                continue;
            }
            // RouterData storage routerData = routersData[routersDataList[i]];
            totalRoutedBalance += 
                IRouter(routersDataList[i]).getBalanceStored(address(_underlying), address(this));
        }
        return totalRoutedBalance;
    }

    /// get total liquidity from all deposited routers + contract
    function getLiquidity() public view override returns (uint256) {
        uint256 totalLiquidity = _underlying.balanceOf(address(this));
        for (uint256 i = 0; i < routersDataCount; i++) {
            if (routersDataList[i] == address(0)) {
                continue;
            }
            // RouterData storage routerData = routersData[routersDataList[i]];
            if (IRouter(routersDataList[i]).getBalanceStored(address(_underlying), address(this)) == 0) {
                continue;
            }
            totalLiquidity += IRouter(routersDataList[i]).getLiquidity(address(_underlying));
        }
        return totalLiquidity;
    }

    /// info
    function getRouterWeightedInterestRate() public view override returns (uint256, uint256) {
        if (balance == 0) {
            return (0,0);
        }
        uint256 weightedBalance;
        // uint256 totalRoutedBalance = _underlying.balanceOf(address(this));
        uint256 totalRoutedBalance;
        for (uint256 i = 0; i < routersDataCount; i++) {
            if (routersDataList[i] == address(0)) {
                continue;
            }
            // RouterData storage routerData = routersData[routersDataList[i]];
            // get scaled balance of token
            uint256 balance = IRouter(routersDataList[i]).getBalanceStored(address(_underlying), address(this));
            if (balance == 0) {
                continue;
            }
            // get ER as ray
            uint256 rate = IRouter(routersDataList[i]).getPreviousInterestRate(address(_underlying));
            totalRoutedBalance += balance;
            weightedBalance += balance.rayMul(rate);
        }

        if (totalRoutedBalance == 0) {
            return (0,0);
        }
        uint256 weightedRate = weightedBalance.rayDiv(totalRoutedBalance);
        return (totalRoutedBalance, weightedRate);
    }

    /// info
    function getRouterWeightedInterestRateSimulated() public view returns (uint256, uint256) {
        if (balance == 0) {
            return (0,0);
        }
        uint256 weightedBalance;
        // uint256 totalRoutedBalance = _underlying.balanceOf(address(this));
        uint256 totalRoutedBalance;
        for (uint256 i = 0; i < routersDataCount; i++) {
            if (routersDataList[i] == address(0)) {
                continue;
            }
            // get scaled balance of token
            uint256 balance = IRouter(routersDataList[i]).getBalanceStored(address(_underlying), address(this));
            if (balance == 0) {
                continue;
            }
            // get ER as ray
            uint256 rate = IRouter(routersDataList[i]).getSimulatedInterestRate(address(_underlying), 0, 0);
            totalRoutedBalance += balance;
            weightedBalance += balance.rayMul(rate);
        }

        if (totalRoutedBalance == 0) {
            return (0,0);
        }
        uint256 weightedRate = weightedBalance.rayDiv(totalRoutedBalance);
        return (totalRoutedBalance, weightedRate);
    }

    /// info
    // function getRouterRates() external view returns (address[] memory, uint256[] memory) {
    //     address[] memory routers = new address[](routersDataCount);
    //     uint256[] memory rates = new uint256[](routersDataCount);
    //     for (uint256 i = 0; i < routersDataCount; i++) {
    //         if (routersDataList[i] == address(0)) {
    //             routers[i] = address(0);
    //             rates[i] = 0;
    //             continue;
    //         }
    //         // RouterData storage routerData = routersData[routersDataList[i]];
    //         uint256 rate = IRouter(routersDataList[i]).getPreviousInterestRate(address(_underlying));
    //         routers[i] = routersDataList[i];
    //         rates[i] = rate;
    //     }
    //     return (routers, rates);
    // }

    /// info
    // function getRouterRatesSimulated(uint256 liquidityAdded, uint256 liquidityTaken) external view returns (uint256[] memory) {
    //     uint256[] memory rates = new uint256[](routersDataCount);
    //     for (uint256 i = 0; i < routersDataCount; i++) {
    //         if (routersDataList[i] == address(0)) {
    //             continue;
    //         }
    //         // RouterData storage routerData = routersData[routersDataList[i]];
    //         uint256 rate = IRouter(routersDataList[i]).getSimulatedInterestRate(address(_underlying), liquidityAdded, liquidityTaken);
    //         rates[i] = rate;
    //     }
    //     return rates;
    // }

    function deposit(uint256 amount) public override onlyPool returns (uint256) {
        uint256 _balance = _underlying.balanceOf(address(this));
        // deposit amount + contract _balance
        // amount transferred in must be >= to _balance
        if (_balance > amount) {
            amount = _balance;
        } else if (amount < _balance) {
            revert();
        }

        _supply(amount);

        // balance before transferFrom into this
        uint256 _lastUpdatedBalance = balance;

        balance += amount;

        uint256 amountBack = balance - _lastUpdatedBalance;

        return amountBack;
    }

    /**
     * @dev Used by allocator and strategy for consensus asset allocation onlyAuthorized
     */
    function depositRouter(address router, uint256 amount) external override onlyAuthorized returns (uint256) {
        // _underlying.safeTransferFrom(AGGREGATOR_VAULT,  address(this), amount);
        address token = IRouter(router).depositToken(address(_underlying));
        (bool success,) = router.delegatecall(
            abi.encodeWithSignature("deposit(address,address,uint256)",address(_underlying),token,amount)
        );
        require(success, "Error: delegatecall depositRouter");
        return 0;
    }

    function redeem(uint256 amount, address to) public override onlyPool returns (uint256) {
        uint256 _balance = _underlying.balanceOf(address(this));
        // remove amount based on what is available to redeem in this contract
        if (_balance != 0) {
            amount -= _balance > amount ? amount : _balance;
        }

        _withdraw(amount);

        // trips revert if not enough was redeemed
        _underlying.safeTransfer(to, amount);

        uint256 _lastUpdatedBalance = balance;
        balance -= amount;
        uint256 amountBack = _lastUpdatedBalance - balance;

        return amountBack;
    }

    /**
     * @dev Logic for redeeming when a user is borrowing
     * - Can be used to scale borrowing into using leverage across routers
     */
    function redeemOnBorrow(uint256 amount, address to) public override onlyPool returns (uint256) {
        uint256 _balance = _underlying.balanceOf(address(this));
        // remove amount based on what is available to redeem in this contract
        if (_balance != 0) {
            amount -= _balance > amount ? amount : _balance;
        }

        _withdraw(amount);

        // trips revert if not enough was redeemed
        _underlying.safeTransfer(to, amount);

        uint256 _lastUpdatedBalance = balance;
        balance -= amount;
        uint256 amountBack = _lastUpdatedBalance - balance;

        return amountBack;
    }

    /**
     * @dev Redeems balance from aggregator through router
     */
    function redeemFromRouter(address from, uint256 amount) public override onlyAuthorized returns (uint256) {
        address token = IRouter(from).depositToken(address(_underlying));
        (bool success,) = from.delegatecall(
            abi.encodeWithSignature("redeem(address,address,uint256,address)",address(_underlying),token,amount,address(this))
        );
        require(success, "Error: delegatecall redeemFromRouter");
    }


    function borrow(address from, address to, uint256 amount) external override onlyPool {
        //
    }

    function borrowFromRouter(address from, uint256 amount) external override onlyAuthorized {
        //
    }

    function repay(address from, address to, uint256 amount) external override onlyPool {
        //
    }

    function repayFromRouter(address from, uint256 amount) external override onlyAuthorized {
        //
    }

    /**
     * @dev Optionally remove ability for supply to be used as collateral
     * This may lessen gas fees
     */
    function setUseAsCollateral(address router, bool useAsCollateral) external onlyPoolAdmin {
        (bool success,) = router.delegatecall(
            abi.encodeWithSignature("setUserUseReserveAsCollateral(address,bool)",address(_underlying),useAsCollateral)
        );
        require(success, "Error: delegatecall setUseAsCollateral");
    }

    /**
     * @dev Simplified redeem logic for flash loans
     */
    function redeemOnFlash(uint256 amount, address to) external override onlyAuthorized returns (uint256) {
        uint256 _balance = _underlying.balanceOf(address(this));
        if (_balance != 0) {
            amount -= _balance > amount ? amount : _balance;
        }

        _withdraw(amount);

        // uint256 amount_ = amount;


        // for (uint256 i = 0; i < routersDataCount && amount_ > 0; i++) {
        //     if (routersDataList[i] == address(0)) {
        //         continue;
        //     }

        //     uint256 liquidity = IRouter(routersDataList[i]).getLiquidity(address(_underlying));
        //     uint256 redeemAmount = amount_ > liquidity ? liquidity : amount_;

        //     (bool success,) = routersDataList[i].delegatecall(
        //         abi.encodeWithSignature("redeem(address,uint256,address)",address(_underlying),redeemAmount,address(this))
        //     );

        //     // ? need ? ? ?
        //     require(success, "Error: delegatecall redeemOnFlash");

        //     amount_ -= redeemAmount;
        // }
        // trips revert if not enough was redeemed
        _underlying.safeTransfer(to, amount);
    }

    function emergencyRemoveAll() external override {
        for (uint256 i = 0; i < routersDataCount; i++) {
            if (routersDataList[i] == address(0)) {
                continue;
            }

            RouterData storage routerData = routersData[routersDataList[i]];

            uint256 balance = IRouter(routerData.router).getBalance(address(_underlying), address(this));
            if (balance == 0) {
                continue;
            }
            uint256 liquidity = IRouter(routerData.router).getLiquidity(address(_underlying));

            uint256 redeemAmount = balance > liquidity ? liquidity: balance;
            address token = IRouter(routersDataList[i]).depositToken(address(_underlying));
            IRouter(routerData.router).redeem(
                address(_underlying),
                token,
                redeemAmount,
                address(this)
            );
        }

        balance = getBalance();
    }

    function emergencyRemove(address[] memory routers) external override onlyPoolAdmin {

        for (uint256 i = 0; i < routers.length; i++) {

            RouterData storage routerData = routersData[routersDataList[i]];

            uint256 balance = IRouter(routerData.router).getBalance(address(_underlying), address(this));
            if (balance == 0) {
                continue;
            }
            uint256 liquidity = IRouter(routerData.router).getLiquidity(address(_underlying));

            uint256 redeemAmount = balance > liquidity ? liquidity: balance;
            address token = IRouter(routersDataList[i]).depositToken(address(_underlying));
            IRouter(routerData.router).redeem(
                address(_underlying),
                token,
                redeemAmount,
                address(this)
            );
        }
        _aggregatorStrategy = IAggregatorStrategyBase(address(0));
        balance = getBalance();
    }

    /**
     * @dev Migrate underlying and tokenized assets to new aggregator
     * Call from migrator contract
     */
    function migrate(uint256 amount, address asset) external onlyPoolAdmin {
        IPoolDataProvider _dataProvider = IPoolDataProvider(_addressesProvider.getPoolDataProvider());
        bool paused = _dataProvider.getPaused(address(_underlying));
        require(paused, "ERROR_RESERVE_MUST_BE_PAUSED_TO_MIGRATE");

        address newAggregatorAddress = _dataProvider.getAggregatorAddress(address(_underlying));
        require(
            newAggregatorAddress != address(0) || 
            newAggregatorAddress != address(this), 
            "ERROR_RESERVE_IS_ZERO_OR_THIS"
        );
        IERC20(asset).transfer(newAggregatorAddress, amount);
    }

    // function rescueTokens(
    //     address token_,
    //     address to,
    //     uint256 amount
    // ) public onlyPoolAdmin {
    //     for (uint256 i = 0; i < routersDataCount; i++) {
    //         RouterData storage routerData = routersData[routersDataList[i]];
    //         address token = IRouter(routersDataList[i]).depositToken(routerData);
    //         if (token_ == routerData.depositToken) {
    //             require(!routerData.active, "Error: Token matches underlying or IBT");
    //         }
    //     }

    //     uint256 balance = IERC20(token_).balanceOf(address(this));
    //     if (amount > balance) {
    //         amount = balance;
    //     }
    //     IERC20(token_).safeTransfer(to, amount);
    // }

    // ---- harvester functions ----
    // harvesting is done in whitelisted contract
    // - this allows for highly robust strategy possibilities
    function setRewardsClaimer(IRewardsClaimer rewardsClaimer)
        external 
        onlyPoolAdmin
    {
        _installRewardsClaimer(rewardsClaimer);
        emit NewRewardsClaimer(address(rewardsClaimer));
    }

    function _installRewardsClaimer(IRewardsClaimer rewardsClaimer)
        internal
    {
        require(address(rewardsClaimer) != address(0), 'STRATEGY_CAN_NOT_BE_ZERO');
        require(Address.isContract(address(rewardsClaimer)) == true, 'STRATEGY_MUST_BE_CONTRACT');
        _rewardsClaimer = rewardsClaimer;
    }

    function singleClaimRewardsFromRouter(
        address router,
        address token, 
        uint256 amount, 
        address to, 
        address rewardToken
    ) 
        external 
        override 
        onlyRewardsClaimer 
        returns (uint256)
    {
        (bool success,) = router.delegatecall(
            abi.encodeWithSignature("claimSingleReward(address,address,uint256,address,address)",address(_underlying),token,amount,to,rewardToken)
        );
        require(success, "Error: delegatecall singleClaimRewardsFromRouter");
        // transfer to rewards claimer
        // rewards claimer swaps to underlying and transfers back into aggregator
        uint256 _balance = IERC20(rewardToken).balanceOf(address(this));
        IERC20(rewardToken).transfer(address(_rewardsClaimer), _balance);
        return _balance;
    }
}
