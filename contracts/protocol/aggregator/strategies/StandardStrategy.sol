// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import {IInterestRateOracle} from "../../../interfaces/IInterestRateOracle.sol";
import {IInterestRateOracleV2} from "../../../interfaces/IInterestRateOracleV2.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import {IStandardStrategy} from "../../../interfaces/IStandardStrategy.sol";
import {IAggregator} from "../../../interfaces/IAggregator.sol";
import {IRouter} from "../../../interfaces/IRouter.sol";
import {AggregatorStrategyBase} from "./AggregatorStrategyBase.sol";
import {IAggregatorStrategyBase} from "../../../interfaces/IAggregatorStrategyBase.sol";
import "hardhat/console.sol";

/**
 * @title StandardStrategy
 * @author Addi
 * @dev Strategy is based off finding highest interest rate of protocols on deposit and depositing to that protocol
 *      On withdraw find lowest interest rate we have balance on and redeem from there
 */
contract StandardStrategy is AggregatorStrategyBase, IStandardStrategy {
    using SafeERC20 for IERC20;

    IInterestRateOracleV2 internal _interestRateOracle;

    constructor(
        address aggregator_, 
        address admin_,
        IInterestRateOracleV2 interestRateOracle
    ) 
        AggregatorStrategyBase(aggregator_, admin_) 
    {
        _interestRateOracle = interestRateOracle;
    }

    function setInterestRateOracle(IInterestRateOracleV2 interestRateOracle)
        external 
        onlyAdmin
    {
        _installInterestRateOracle(interestRateOracle);
    }

    function _installInterestRateOracle(IInterestRateOracleV2 interestRateOracle)
        internal
    {
        require(address(interestRateOracle) != address(0), 'IRO_CAN_NOT_BE_ZERO');
        require(Address.isContract(address(interestRateOracle)) == true, 'IRO_MUST_BE_CONTRACT');
        _interestRateOracle = interestRateOracle;
    }

    function getInterestRateOracle() public view override returns (address) {
        return address(_interestRateOracle);
    }

    // function setInterestRateOracle(IInterestRateOracleV2 interestRateOracle) external override {
    //     _interestRateOracle = interestRateOracle;
    // }

    function performSupply(
        address asset,
        uint256 amount
    ) external virtual override(AggregatorStrategyBase, IAggregatorStrategyBase) onlyAggregator returns (bool) {

        uint256 bestRouterIndex = _interestRateOracle.getBestRateIndex(AGGREGATOR);

        address router = IAggregator(AGGREGATOR)._routersDataList(bestRouterIndex);

        address[] memory performedRouters = new address[](1);
        uint256[] memory performedAmounts = new uint256[](1);
        performedRouters[0] = router;
        performedAmounts[0] = amount;

        IAggregator(AGGREGATOR).depositRouter(
            router,
            amount
        );

        emit Supply(
            asset,
            performedRouters,
            performedAmounts
        );
        return true;
    }

    function performWithdraw(
        address asset,
        uint256 amount
    ) external virtual override(AggregatorStrategyBase, IAggregatorStrategyBase) onlyAggregator returns (bool) {
        uint256 amount_ = amount;

        address[] memory routers = IAggregator(AGGREGATOR).getRoutersDataList();
        address[] memory performedRouters = new address[](routers.length);
        uint256[] memory performedAmounts = new uint256[](routers.length);


        for (uint256 i = 0; i < routers.length && amount_ > 0; i++) {
            uint256 balance = IRouter(routers[i]).getBalance(asset, AGGREGATOR);
            if (routers[i] == address(0) || balance == 0) {
                continue;
            }
            uint256 liquidity = IRouter(routers[i]).getLiquidity(asset);
            uint256 redeemAmount = amount_ > liquidity ? liquidity : amount_;
            IAggregator(AGGREGATOR).redeemFromRouter(routers[i], amount_);
            performedRouters[i] = routers[i];
            performedAmounts[i] = amount_;

            amount_ = amount_ - redeemAmount;
        }
        emit Withdraw(
            asset,
            performedRouters,
            performedAmounts
        );

        return true;
    }

    function performBorrow(address router, address asset, uint256 amount) 
        external 
        virtual 
        override(AggregatorStrategyBase, IAggregatorStrategyBase) 
        onlyAggregator 
        returns (bool) 
    {
        // emit Borrow(
        //     asset,
        //     performedRouters,
        //     performedAmounts
        // );

        //
    }

    function performRepay(address router, address asset, uint256 amount) 
        external 
        virtual 
        override(AggregatorStrategyBase, IAggregatorStrategyBase) 
        onlyAggregator 
        returns (bool) 
    {
        // emit Repay(
        //     asset,
        //     performedRouters,
        //     performedAmounts
        // );
        //
    }

}