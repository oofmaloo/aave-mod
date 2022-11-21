// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

interface IAggregator {

    /**
    * @dev Emitted on _addRoutersData()
    * @param routers The array addresses of the new routers
    **/
    event NewRouter(
        address[] routers
    );

    /**
    * @dev Emitted on _addRoutersData()
    * @param router The address of dropped router
    **/
    event DropRouter(
        address indexed router
    );

    /**
    * @dev Emitted on accrue()
    * @param underlying The address of the underlying asset of the aggregator
    * @param previousBalance The previously updated balance
    * @param updatedBalance The updated balance
    **/
    event Accrue(
        address indexed underlying,
        uint256 previousBalance,
        uint256 updatedBalance
    );

    /**
    * @dev Emitted on addAuthorized()
    * @param account The address of the authorized account
    **/
    event NewAuthorized(
        address indexed account
    );

    /**
    * @dev Emitted on addAuthorized()
    * @param account The address of the authorized account
    **/
    event RemoveAuthorized(
        address indexed account
    );

    /**
    * @dev Emitted on setRewardsClaimer()
    * @param rewardsClaimer The address of the rewards claimer contract
    **/
    event NewRewardsClaimer(
        address indexed rewardsClaimer
    );

    struct RouterData {
        uint8 id;
        address router;
        uint256 supplyCieling;
        bool hasBalance;
        bool borrowingEnabled; // if aggregator can borrow from this router
        bool exists; // if initiated
        bool active; // can be used
    }

    function balance() external view returns (uint256);

    function _routersDataCount() external view returns (uint256);

    function _routersDataList(uint256 i) external view returns (address);

    function getRoutersDataList() external view returns (address[] memory);

    function getActiveRoutersDataList() external view returns (address[] memory);

    function getRouterData(address router) external view returns (RouterData memory);

    function isRouterActiveByIndex(uint256 index) external view returns (bool);

    function getSupplyCieling(address router) external returns (uint256);

    function getUnderlyingAsset() external view returns (address);

    function getAggregatorStrategy() external view returns (address);
    
    function transferTo(address to, uint256 amount) external;

    function getLastAllocatedAccrued() external view returns (uint256);

    function setLastAllocated() external;

    /**
    * @dev Simulation - not accurate to block - way to get balance without tx query
    */
    function accrueSim() external view returns (uint256, uint256);

    /**
     * @dev Get accurate balance of tokens and update state
     */
    function accrue() external returns (uint256, uint256);

    /// LP balance + any balance in contract
    function getBalance() external returns (uint256);
    
    function getBalanceStored() external view returns (uint256);

    function getRoutersBalance() external view returns (uint256);
    
    function getLiquidity() external view returns (uint256);

    function getRouterWeightedInterestRate() external view returns (uint256, uint256);

    function deposit(uint256 amount) external returns (uint256);
    
    /**
     * @dev Used by allocator for consensus asset allocation validators
     */
    function depositRouter(address router, uint256 amount) external returns (uint256);

    function redeem(uint256 amount, address to) external returns (uint256);

    function redeemOnBorrow(uint256 amount, address to) external returns (uint256);

    function redeemFromRouter(address from, uint256 amount) external returns (uint256);

    function redeemOnFlash(uint256 amount, address to) external returns (uint256);
    
    function borrow(address from, address to, uint256 amount) external;

    function borrowFromRouter(address from, uint256 amount) external;

    function repay(address from, address to, uint256 amount) external;

    function repayFromRouter(address from, uint256 amount) external;

    function singleClaimRewardsFromRouter(
        address router,
        address token, 
        uint256 amount, 
        address to, 
        address rewardToken
    ) external returns (uint256);

    function emergencyRemoveAll() external;

    function emergencyRemove(address[] memory routers) external;
}
