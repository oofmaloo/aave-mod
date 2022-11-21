// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

import {QuickSort} from './helpers/QuickSort.sol';

import {IInterestRateOracleV2} from "../../interfaces/IInterestRateOracleV2.sol";
import {IRouter} from "../../interfaces/IRouter.sol";
import {IAggregator} from "../../interfaces/IAggregator.sol";
import {IPoolAddressesProvider} from '../../interfaces/IPoolAddressesProvider.sol';
import {IACLManager} from '../../interfaces/IACLManager.sol';
import "hardhat/console.sol";

/**
 * @title InterestRateOracle
 * Retrieves best interest rate to supply and redeem for the Aggregator
 * Each aggregator represents an asset and protocol integrations
 * All oracles are based on aggregators and not assets as aggregators may have unique algorithms
 * @author ADDIs
 * Each aggregator has its own oracle
 */
contract InterestRateOracleV2 is IInterestRateOracleV2 {
	using SafeMath for uint256;
	using QuickSort for uint256[];

	IPoolAddressesProvider internal _addressesProvider;

    struct AggregatorData {
        uint8 id;
        /// main caller of functions
        IAggregator _aggregator;
        /// underlying asset reps aggregator
        address underlyingAddress;
        /// last timestamp of updated best index of routers within aggregator mapping
        uint256 lastBestRateUpdate;
        /// interim time delta to run best function
        uint256 bestDelta;
        /// last update of best index of routers interest rates within aggregator mapping
        uint256 _bestIndex;
        /// last timestamp of updated worst index of routers within aggregator mapping
        uint256 lastWorstUpdate;
        /// interim time delta to run worst function
        uint256 worstDelta;
        /// last update of worst index of routers interest rates within aggregator mapping
        uint256 _worstIndex;
        /// last timestamp of updated best index of routers within aggregator mapping
        uint256 lastAverageBorrowRateUpdate;
        /// interim time delta to run worst function
        uint256 averageDelta;
        /// interim time delta to run best function
        uint256 _averageBorrowRate;
        /// last timestamp of updated best index of routers within aggregator mapping
        uint256 lastGoalBorrowRateUpdate;
        /// interim time delta to run best function
        uint256 _goalBorrowRate;
    }

    mapping(address => AggregatorData) internal _aggregatorData;
    mapping(uint256 => address) internal aggregatorsDataList;
    uint256 internal aggregatorDataCount;

    function addAggregatorsData(
        address[] memory aggregators
    ) public onlyPoolAdmin {
        for (uint16 i = 0; i < aggregators.length; i++) {
            _addAggregatorData(aggregators[i]);
        }
    }

    function addAggregatorData(
        address aggregator
    ) public onlyPoolAdmin {
        _addAggregatorData(aggregator);
    }

    function _addAggregatorData(
        address aggregator
    ) internal {
        AggregatorData storage aggregatorData = _aggregatorData[aggregator];
        aggregatorData._aggregator = IAggregator(aggregator);
        aggregatorData.underlyingAddress = IAggregator(aggregator).getUnderlyingAsset();

        if (_addAggregatorDataToListInternal(aggregator)) {
            aggregatorDataCount = aggregatorDataCount + 1;
        }
    }

    function _addAggregatorDataToListInternal(address aggregator) internal returns (bool) {
        uint256 _aggregatorDataCount = aggregatorDataCount;
        bool aggregatorAlreadyAdded = false;

        // make sure not to duplicate
        for (uint16 i = 0; i < _aggregatorDataCount; i++) {
            if (aggregatorsDataList[i] == aggregator) {
                aggregatorAlreadyAdded = true;
            }
        }

        require(!aggregatorAlreadyAdded, 'Errors.AGGREGATOR_ALREADY_ADDED');

        // replace previously dropped aggregators
        for (uint16 i = 0; i < _aggregatorDataCount; i++) {
            if (aggregatorsDataList[i] == address(0)) {
                // override dropped router
                _aggregatorData[aggregator].id = uint8(i);
                aggregatorsDataList[i] = aggregator;

                return false;
            }
        }

        aggregatorsDataList[aggregatorDataCount] = aggregator;
        return true;
    }

	constructor(
		IPoolAddressesProvider addressesProvider_
	) {
        _addressesProvider = addressesProvider_;
	}

    modifier onlyPoolAdmin() {
        require(IACLManager(_addressesProvider.getACLManager()).isPoolAdmin(msg.sender));
        _;
    }

    modifier onlyPool() {
        require(msg.sender == _addressesProvider.getPool());
        _;
    }

	/// sets and returns bestIndex from routers of an Aggregator contract
    function getBestRateIndex(address aggregator) external override returns (uint256 bestIndex) {
        AggregatorData storage aggregatorData = _aggregatorData[aggregator];
        require(aggregatorData.underlyingAddress != address(0), "ERROR_AGGREGATOR_ADDRESS_ZERO");
    	// return last update if time delta reached
        console.log("getBestRateIndex block.timestamp", block.timestamp);
        console.log("getBestRateIndex lastBestRateUpdate", aggregatorData.lastBestRateUpdate);

  //   	if ((block.timestamp - lastBestRateUpdate) > bestDelta &&
  //   		_aggregator.isRouterActiveByIndex(_bestIndex)
		// ) {
  //           console.log("getBestRateIndex return _bestIndex", _bestIndex);
  //   		return _bestIndex;
  //   	}

    	address[] memory routers = aggregatorData._aggregator.getActiveRoutersDataList();

        uint256 bestIndex = 0;
        uint256 bestRate = 0;
        for (uint256 i = 0; i < routers.length; i++) {
            if (routers[i] == address(0)) {
                continue;
            }
            // get cached rate instead of using strategy functions
            uint256 rate = IRouter(routers[i]).getPreviousInterestRate(aggregatorData.underlyingAddress);
            console.log("getBestRateIndex rate", rate);
            if (rate > bestRate) {
                bestRate = rate;
                bestIndex = i;
            }
        }
        aggregatorData.lastBestRateUpdate = block.timestamp;
        aggregatorData._bestIndex = bestIndex;
        return bestIndex;
    }

	/// sets and returns worstIndex from routers of an Aggregator contract
    function getWorstRateIndex(address aggregator) external override returns (uint256 worstIndex) {
        AggregatorData storage aggregatorData = _aggregatorData[aggregator];
    	// return last update if time passed too low
  //   	if (block.timestamp.sub(lastWorstUpdate) > worstDelta &&
  //   		_aggregator.isRouterActiveByIndex(_worstIndex)
		// ) {
  //   		return _worstIndex;
  //   	}

    	address[] memory routers = aggregatorData._aggregator.getActiveRoutersDataList();

        uint256 worstIndex = 0;
        uint256 worstRate = type(uint256).max;
        for (uint256 i = 0; i < routers.length; i++) {
            uint256 rate = 0;
            if (routers[i] != address(0)) {
                // get cached rate instead of using strategy functions
                rate = IRouter(routers[i]).getPreviousInterestRate(aggregatorData.underlyingAddress);
            }
            if (rate < worstRate && rate != 0) {
                worstRate = rate;
                worstIndex = i;
            }
        }
        aggregatorData.lastWorstUpdate = block.timestamp;
        aggregatorData._worstIndex = worstIndex;
    }

	/// sets and returns worstIndexes as array in order from low-high from routers of an Aggregator contract
    /// for withdrawing
    function getWorstRateArray(address aggregator, uint256 amount) external view override returns (uint256[] memory) {
        AggregatorData storage aggregatorData = _aggregatorData[aggregator];

        address[] memory routers = aggregatorData._aggregator.getActiveRoutersDataList();
        uint256[] memory rates = new uint256[](routers.length);
        for (uint256 i = 0; i < routers.length; i++) {
            // uint256 balance = IRouter(routers[i]).getBalance(aggregatorData.underlyingAddress, address(this));
            uint256 balance = IRouter(routers[i]).getBalanceStored(aggregatorData.underlyingAddress, address(this));
            if (routers[i] == address(0) || balance == 0) {
                rates[i] = type(uint256).max;
            }
            uint256 rate = IRouter(routers[i]).getSimulatedInterestRate(aggregatorData.underlyingAddress, 0, amount);
            rates[i] = rate;
        }

        uint256[] memory ratesDesc = rates.sortDesc();

        uint256[] memory ratesIndexes = new uint256[](ratesDesc.length);

        for (uint256 i = 0; i < ratesDesc.length; i++) {
	        for (uint256 j = 0; j < routers.length; j++) {
	        	if (ratesDesc[i] == ratesIndexes[j]) {
	        		ratesIndexes[j] == j;
	        	}
	        }
        }

        return ratesIndexes;

    }

    // get average borrow rate
    // does not account for weight
    function getAverageBorrowRate(address aggregator) external override returns (uint256) {
        AggregatorData storage aggregatorData = _aggregatorData[aggregator];
        if (block.timestamp.sub(aggregatorData.lastAverageBorrowRateUpdate) > aggregatorData.averageDelta) {
            return aggregatorData._averageBorrowRate;
        }

        console.log("getAverageBorrowRate");
        address[] memory routers = aggregatorData._aggregator.getActiveRoutersDataList();
        console.log("getAverageBorrowRate 1");
        uint256 total;
        for (uint256 i = 0; i < routers.length; i++) {
            total += IRouter(routers[i]).getPreviousInterestRate(aggregatorData.underlyingAddress);
            console.log("getAverageBorrowRate 2");
        }
        console.log("getAverageBorrowRate 3");
        return (total / routers.length);
    }

    function getLastAverageBorrowRate(address aggregator) external view override returns (uint256) {
        AggregatorData storage aggregatorData = _aggregatorData[aggregator];
        uint256 lastAverageBorrowRate = type(uint256).max;
        if (aggregatorData.lastAverageBorrowRateUpdate > 0 && 
            aggregatorData.lastAverageBorrowRateUpdate < lastAverageBorrowRate
        ) {
            lastAverageBorrowRate = aggregatorData.lastAverageBorrowRateUpdate;
        }
        return lastAverageBorrowRate;
    }

    // get goal borrow rate called by interest rate model
    function getGoalBorrowRate(address aggregator) external override returns (uint256) {
        AggregatorData storage aggregatorData = _aggregatorData[aggregator];
        // if (block.timestamp.sub(aggregatorData.lastGoalBorrowRateUpdate) > aggregatorData.averageDelta) {
        //     return aggregatorData._goalBorrowRate;
        // }

        uint256 lastGoalBorrowRateUpdate = aggregatorData.lastGoalBorrowRateUpdate;

        console.log("getGoalBorrowRate");
        address[] memory routers = aggregatorData._aggregator.getActiveRoutersDataList();
        console.log("getGoalBorrowRate 1");
        uint256 total;
        for (uint256 i = 0; i < routers.length; i++) {
            total += IRouter(routers[i]).getPreviousInterestRate(aggregatorData.underlyingAddress);
            console.log("getGoalBorrowRate 2");
        }
        console.log("getGoalBorrowRate 3");

        if (lastGoalBorrowRateUpdate != 0) {
            // return a weighted avg
            return (((total / routers.length) + lastGoalBorrowRateUpdate) / 2);
        } else {
            return (total / routers.length);
        }
    }

    function getLastGoalBorrowRate(address aggregator) external view override returns (uint256) {
        AggregatorData storage aggregatorData = _aggregatorData[aggregator];
        uint256 lastGoalBorrowRate = type(uint256).max;
        if (aggregatorData.lastGoalBorrowRateUpdate > 0 && 
            aggregatorData.lastGoalBorrowRateUpdate < lastAverageBorrowRate
        ) {
            lastGoalBorrowRate = aggregatorData.lastGoalBorrowRateUpdate;
        }
        return lastGoalBorrowRate;
    }

}