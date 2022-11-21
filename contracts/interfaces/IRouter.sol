// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface IRouter {

    // function setCaller(address caller_) external;

    /**
     * @dev Deposits underlying to a protocol
     * @param asset Asset to transfer in
     * @param token Token of tokenized underlying asset, if required
     * @param amount Amount to transfer in
     * - Amount must be decimals converted ahead of call
     */
    function deposit(address asset, address token, uint256 amount) external;

    // function deposit(address token0, address token1, uint256 amount0, uint256 amount1) external;

    /**
     * @dev Deposits wrapped to Anchor or Vault and returns underlying to `to`
     * @param amount Amount underlying to transfer in
     * @param to Address to send underlying to, usually avasToken or user ir account
     * 
     * note: for aggregation routers, redeem will for loop all wrapped tokens, redeem, and swap is needed
     * - Amount must be decimals converted ahead of call
     */
    function redeem(address asset, address token, uint256 amount, address to) external returns (uint256);

    function setUserUseReserveAsCollateral(address asset, bool useAsCollateral) external;

    function getPreviousInterestRate(address asset) external view returns (uint256);

    function getSimulatedInterestRate(address asset, uint256 liquidityAdded, uint256 liquidityTaken) external view returns (uint256);

    /**
     * @dev Return how much can be withdrawn without revert
     */
    function getLiquidity(address asset) external view returns (uint256);

    /**
     * @dev Return underlying asset balance
     * - We run this here in case a protocol has unmatched decimals between their receipt token and underlying
     * - As well as in case balanceOf does not return balance, but the scaled instead
     */
    function getBalance(address asset, address account) external returns (uint256);

    function getBalanceStored(address asset, address account) external view returns (uint256);

    function getDebtBalance(address asset, address account) external returns (uint256);

    function getDebtBalanceStored(address asset, address account) external view returns (uint256);

    function underlying(address asset) external view returns (address);

    function depositToken(address asset) external view returns (address);

    function borrowToken(address asset) external view returns (address);

    function getRouterPool() external view returns (address);

    /**
     * @dev Return if router uses a bridge
     */
    function isBridge() external view returns (bool);

    /**
     * @notice Use of underlyingAsset and or tokenAsset depend on protocols
     */
    function rewardsEmissionsPerSecond(
        address underlyingAsset,
        address tokenAsset, 
        address rewardToken
    ) external returns (uint256);

    function rewardsBalance(
        address underlyingAsset,
        address tokenAsset, 
        uint256 amount, 
        address to, 
        address rewardToken
    ) external returns (uint256);

    function claimSingleReward(
        address underlyingAsset,
        address tokenAsset, 
        uint256 amount, 
        address to, 
        address rewardToken
    ) external returns (uint256);
}
