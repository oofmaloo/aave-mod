// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IInterestRateOracle} from "../../../interfaces/IInterestRateOracle.sol";

import {IStandardStrategy} from "../../../interfaces/IStandardStrategy.sol";
import {IAggregator} from "../../../interfaces/IAggregator.sol";
import {IRouter} from "../../../interfaces/IRouter.sol";
import {PercentageMath} from '../../libraries/math/PercentageMath.sol';
import {IRewardsClaimer} from "../../../interfaces/IRewardsClaimer.sol";

import "hardhat/console.sol";

/**
* 
* Each Aggregator has a reward claimer
* Has each type of reward claim technique universal for all protocols
* Claim 1 reward asset from 1 router
* Claim >1 reward assets from 1 router
* Claim all rewards from all routers
* 
* Each call is made to a specific aggregator/underlying asset type
*   - Claim rewards
*   - Swap to underlying asset
*   - Transfer to aggregator
*/

contract AggregatorRewardClaimer is IRewardsClaimer {
    using SafeERC20 for IERC20;
    using PercentageMath for uint256;


    // ISwap internal _swap;

    address internal AGGREGATOR;
    address internal ADMIN;

    uint256 internal DEFAULT_SLIPPAGE = 300; // .3%

    constructor(address aggregator, address admin) {
        AGGREGATOR = aggregator;
        ADMIN = admin;
    }

    /**
    * @dev Modifier for incentives controller only functions
    */
    modifier onlyAggregator() {
        require(AGGREGATOR == msg.sender, 'CALLER_NOT_AGGREGATOR');
        _;
    }

    /**
    * @dev Modifier for reward admin only functions
    */
    modifier onlyAdmin() {
        require(msg.sender == ADMIN, 'ONLY_ADMIN');
        _;
    }

    function getAggregator() external view override returns (address) {
        return AGGREGATOR;
    }

    function setAggregator(address aggregator) external onlyAdmin {
        AGGREGATOR = aggregator;
    }

    function getAdmin() external view override returns (address) {
        return ADMIN;
    }

    // function claimAaveMultiRewards() external virtual override onlyAdmin returns (bool) {
    //     address underlyingAsset = IAggregator(AGGREGATOR).getUnderlyingAsset();
    //     address[] memory routers = IAggregator(AGGREGATOR).getRoutersDataList();


    //     for (uint256 i = 0; i < routers.length; i++) {
    //                 address[] memory tokenization = IRouter().getTokenization(underlyingAsset)

    //         (
    //             address[] memory rewardsList, 
    //             uint256[] memory claimedAmounts
    //         ) = IAggregator(rewardsController).multiClaimRewardsFromRouter(routers[i], address(this));

    //         for (uint256 j = 0; j < rewardsList.length; j++) {
    //             _swap(rewardsList[j], underlyingAsset, claimedAmounts[j], DEFAULT_SLIPPAGE);
    //         }  

    //     }

    // }


    // // perform every reward token from every router
    // // aggregator and router returns the reward token
    // // not all routers may perform this action
    // function performMultiRewardsClaimMultiRouters() external virtual override onlyAdmin returns (bool) {

    //     address underlyingAsset = IAggregator(AGGREGATOR).getUnderlyingAsset();
    //     address[] memory routers = IAggregator(AGGREGATOR).getRoutersDataList();

    //     for (uint256 i = 0; i < routers.length; i++) {
    //         (
    //             address[] memory rewardsList, 
    //             uint256[] memory claimedAmounts
    //         ) = IAggregator(rewardsController).multiClaimRewardsFromRouter(routers[i], address(this));

    //         for (uint256 j = 0; j < rewardsList.length; i++) {
    //             _swap(rewardsList[j], underlyingAsset, claimedAmounts[j], DEFAULT_SLIPPAGE);
    //         }  
    //     }

    //     uint256 balance = IERC20(underlyingAsset).balanceOf(address(this));
    //     IERC20(underlyingAsset).safeTransfer(AGGREGATOR, balance);
    //     return true;
    // }

    // // claim each reward token available from 1 router
    // function performMultiRewardsClaimSingleRouter(
    //     address router
    // ) external virtual override onlyAdmin returns (bool) {

    //     address underlyingAsset = IAggregator(AGGREGATOR).getUnderlyingAsset();

    //     (
    //         address[] memory rewardsList, 
    //         uint256[] memory claimedAmounts
    //     ) = IAggregator(rewardsController).multiClaimRewardsFromRouter(router, assets, address(this));

    //     for (uint256 j = 0; j < rewardsList.length; j++) {
    //         _swap(rewardsList[j], underlyingAsset, claimedAmounts[j], DEFAULT_SLIPPAGE);
    //     }

    //     uint256 balance = IERC20(underlyingAsset).balanceOf(address(this));
    //     IERC20(underlyingAsset).safeTransfer(AGGREGATOR, balance);
    //     return true;
    // }

    // claim single reward asset from single router
    function performSingleRewardsClaim(
        IRewardsClaimer.RewardClaimParams[] memory rewardClaims
    ) external override onlyAdmin returns (bool) {
        address underlyingAsset = IAggregator(AGGREGATOR).getUnderlyingAsset();

        for (uint256 i = 0; i < rewardClaims.length; i++) {
            uint256 amountClaimed = IAggregator(AGGREGATOR).singleClaimRewardsFromRouter(
                rewardClaims[i].router,
                rewardClaims[i].asset, 
                rewardClaims[i].amount, 
                rewardClaims[i].to, 
                rewardClaims[i].rewardToken
            );

            _swap(rewardClaims[i].rewardToken, underlyingAsset, amountClaimed, DEFAULT_SLIPPAGE);
        }

        uint256 balance = IERC20(underlyingAsset).balanceOf(address(this));
        IERC20(underlyingAsset).safeTransfer(AGGREGATOR, balance);
        return true;
    }

    function _swap(
        address tokenOut, 
        address tokenIn, 
        uint256 amountOut, 
        uint256 slippage
    ) internal {
        //
    }

}