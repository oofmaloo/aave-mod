// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

import {IAggregatorStrategyBase} from './IAggregatorStrategyBase.sol';
// import {IInterestRateOracle} from "./IInterestRateOracle.sol";
import {IInterestRateOracleV2} from "./IInterestRateOracleV2.sol";
interface IStandardStrategy is IAggregatorStrategyBase {

    function getInterestRateOracle() external view returns (address);

    function setInterestRateOracle(IInterestRateOracleV2 interestRateOracle) external;
}