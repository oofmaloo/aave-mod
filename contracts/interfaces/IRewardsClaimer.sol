// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

interface IRewardsClaimer {

    struct RewardClaimParams {
        address router;
        address asset;
        uint256 amount;
        address to;
        address rewardToken;
    }

    function getAggregator() external view returns (address);

    function setAggregator(address aggregator) external;

    function getAdmin() external view returns (address);

    function performSingleRewardsClaim(
        RewardClaimParams[] memory rewardClaims
    ) external returns (bool);

}