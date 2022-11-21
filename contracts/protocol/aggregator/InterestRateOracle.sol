// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

import {QuickSort} from './helpers/QuickSort.sol';

import {IInterestRateOracle} from "../../interfaces/IInterestRateOracle.sol";
import {IRouter} from "../../interfaces/IRouter.sol";
import {IAggregator} from "../../interfaces/IAggregator.sol";
import {IPoolAddressesProvider} from '../../interfaces/IPoolAddressesProvider.sol';
import {IACLManager} from '../../interfaces/IACLManager.sol';
import "hardhat/console.sol";

/**
 * @title InterestRateOracle
 * Retrieves best interest rate to supply and redeem for the Aggregator
 * @author ADDIs
 * Each aggregator has its own oracle
 */
contract InterestRateOracle is IInterestRateOracle {
	using SafeMath for uint256;
	using QuickSort for uint256[];

	IPoolAddressesProvider internal _addressesProvider;
	IACLManager internal _aclManager;
	/// main caller of functions
	IAggregator internal _aggregator;
	/// underlying asset reps aggregator
	address internal _underlying;
	/// last timestamp of updated best index of routers within aggregator mapping
	uint256 internal lastBestRateUpdate;
	/// interim time delta to run best function
	uint256 internal bestDelta;
	/// last update of best index of routers interest rates within aggregator mapping
	uint256 internal _bestIndex;
	/// last timestamp of updated worst index of routers within aggregator mapping
	uint256 internal lastWorstUpdate;
	/// interim time delta to run worst function
	uint256 internal worstDelta;
	/// last update of worst index of routers interest rates within aggregator mapping
	uint256 internal _worstIndex;
    /// last timestamp of updated best index of routers within aggregator mapping
    uint256 internal lastAverageBorrowRateUpdate;
    /// interim time delta to run worst function
    uint256 internal averageDelta;
    /// interim time delta to run best function
    uint256 internal _averageBorrowRate;

    mapping(uint256 => address) internal routersDataList;
    uint256 internal routersDataCount;


	constructor(
		IPoolAddressesProvider addressesProvider_,
		IACLManager aclManager_,
		address underlying_
	) {
        _addressesProvider = addressesProvider_;
        _aclManager = aclManager_;
		_underlying = underlying_;
		bestDelta = 0; // 1/2Hr
		worstDelta = 0; // 1/2Hr
        averageDelta = 0;
	}

    modifier onlyPoolAdmin() {
        require(_aclManager.isPoolAdmin(msg.sender));
        _;
    }

    modifier onlyPool() {
        require(msg.sender == _addressesProvider.getPool());
        _;
    }

    function setAggregator(IAggregator aggregator_) external {
        require(aggregator_.getUnderlyingAsset() == _underlying, "Error: Match underlying asset");
        _aggregator = aggregator_;
    }

	function setBestRateDelta(uint256 value) external onlyPoolAdmin {
		bestDelta = value;
	}

	function setWorstRateDelta(uint256 value) external onlyPoolAdmin {
		worstDelta = value;
	}

    function setRouters() external override {
        address[] memory routers = _aggregator.getActiveRoutersDataList();
        for (uint256 i = 0; i < routers.length; i++) {
        }

        for (uint256 i = 0; i < routers.length; i++) {
        }
    }

	/// sets and returns bestIndex from routers of an Aggregator contract
    function getBestRateIndex() external override returns (uint256 bestIndex) {
    	// return last update if time delta reached
        console.log("getBestRateIndex block.timestamp", block.timestamp);
        console.log("getBestRateIndex lastBestRateUpdate", lastBestRateUpdate);

  //   	if ((block.timestamp - lastBestRateUpdate) > bestDelta &&
  //   		_aggregator.isRouterActiveByIndex(_bestIndex)
		// ) {
  //           console.log("getBestRateIndex return _bestIndex", _bestIndex);
  //   		return _bestIndex;
  //   	}

    	address[] memory routers = _aggregator.getActiveRoutersDataList();

        uint256 bestIndex = 0;
        uint256 bestRate = 0;
        for (uint256 i = 0; i < routers.length; i++) {
            if (routers[i] == address(0)) {
                continue;
            }
            // get cached rate instead of using strategy functions
            uint256 rate = IRouter(routers[i]).getPreviousInterestRate(_underlying);
            console.log("getBestRateIndex rate", rate);
            if (rate > bestRate) {
                bestRate = rate;
                bestIndex = i;
            }
        }
        lastBestRateUpdate = block.timestamp;
        _bestIndex = bestIndex;
        return bestIndex;
    }

	/// sets and returns worstIndex from routers of an Aggregator contract
    function getWorstRateIndex() external override returns (uint256 worstIndex) {
    	// return last update if time passed too low
  //   	if (block.timestamp.sub(lastWorstUpdate) > worstDelta &&
  //   		_aggregator.isRouterActiveByIndex(_worstIndex)
		// ) {
  //   		return _worstIndex;
  //   	}

    	address[] memory routers = _aggregator.getActiveRoutersDataList();

        uint256 worstIndex = 0;
        uint256 worstRate = type(uint256).max;
        for (uint256 i = 0; i < routers.length; i++) {
            uint256 rate = 0;
            if (routers[i] != address(0)) {
                // get cached rate instead of using strategy functions
                rate = IRouter(routers[i]).getPreviousInterestRate(_underlying);
            }
            if (rate < worstRate && rate != 0) {
                worstRate = rate;
                worstIndex = i;
            }
        }
        lastWorstUpdate = block.timestamp;
        _worstIndex = worstIndex;
    }

	/// sets and returns worstIndexes as array in order from low-high from routers of an Aggregator contract
    /// for withdrawing
    function getWorstRateArray(uint256 amount) external view returns (uint256[] memory) {

        address[] memory routers = _aggregator.getActiveRoutersDataList();
        uint256[] memory rates = new uint256[](routers.length);
        for (uint256 i = 0; i < routers.length; i++) {
            // uint256 balance = IRouter(routers[i]).getBalance(_underlying, address(this));
            uint256 balance = IRouter(routers[i]).getBalanceStored(_underlying, address(this));
            if (routers[i] == address(0) || balance == 0) {
                rates[i] = type(uint256).max;
            }
            uint256 rate = IRouter(routers[i]).getSimulatedInterestRate(_underlying, 0, amount);
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
    function getAverageBorrowRate() external override returns (uint256) {
        if (block.timestamp.sub(lastAverageBorrowRateUpdate) > averageDelta) {
            return _averageBorrowRate;
        }

        console.log("getAverageBorrowRate");
        address[] memory routers = _aggregator.getActiveRoutersDataList();
        console.log("getAverageBorrowRate 1");
        uint256 total;
        for (uint256 i = 0; i < routers.length; i++) {
            total += IRouter(routers[i]).getPreviousInterestRate(_underlying);
            console.log("getAverageBorrowRate 2");
        }
        console.log("getAverageBorrowRate 3");
        return (total / routers.length);
    }

    function getLastAverageBorrowRate() external view override returns (uint256) {
        uint256 lastAverageBorrowRate = type(uint256).max;
        if (lastAverageBorrowRateUpdate > 0 && 
            lastAverageBorrowRateUpdate < lastAverageBorrowRate
        ) {
            lastAverageBorrowRate = lastAverageBorrowRateUpdate;
        }
        return lastAverageBorrowRate;
    }

}