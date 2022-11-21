// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IPoolAddressesProvider} from '../../../interfaces/IPoolAddressesProvider.sol';
import {IACLManager} from '../../../interfaces/IACLManager.sol';
import {IPoolDataProvider} from '../../../interfaces/IPoolDataProvider.sol';
import {IAggregator} from '../../../interfaces/IAggregator.sol';
import {IAllocatorController} from './interfaces/IAllocatorController.sol';
import {IInterestRateModelStandard} from './interfaces/IInterestRateModelStandard.sol';
import {AllocatorDataTypes} from './libraries/AllocatorDataTypes.sol';
import {QuickSort} from './libraries/QuickSort.sol';
import {MockAllocatorKeeperMaker} from './MockAllocatorKeeperMaker.sol';
import {IPriceOracle} from '../../../interfaces/IPriceOracle.sol';
import {WadRayMath} from '../../../protocol/libraries/math/WadRayMath.sol';
import {IRouter} from "../../../interfaces/IRouter.sol";

// import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";


/*
    1: Tx for redistr
    2: Keeper checks latest distr submit
        - Checks if better than current
    3: If previous check is true, redistr on new redistr parameters

    Each asset has its own guidelines, such as frequency of redistr submits, time since redistr to execute, etc.
*/

/**
 * @title MockAllocatorKeeperController
 */
contract MockAllocatorKeeperController is MockAllocatorKeeperMaker, IAllocatorController {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using WadRayMath for uint256;

    IPoolAddressesProvider internal _addressesProvider;
    IACLManager internal _aclManager;
    IPoolDataProvider internal _poolDataProvider;

    // pause entire allocator
    bool internal pause;

	constructor(
		IPoolAddressesProvider addressesProvider,
        address _allocatorManager
	) MockAllocatorKeeperMaker(_allocatorManager) {
        console.log("_allocatorManager constructor", _allocatorManager);
		_addressesProvider = addressesProvider;
		_aclManager = IACLManager(_addressesProvider.getACLManager());
		_poolDataProvider = IPoolDataProvider(_addressesProvider.getPoolDataProvider());
	}

    modifier whenNotPaused() {
        require(!pause, 'WHEN_NOT_PAUSED');
        _;
    }

    function configureAssets(AllocatorDataTypes.AllocatorConfigsInput[] memory config) external override onlyAllocatorManager {
        // for (uint256 i = 0; i < config.length; i++) {
            // (,,,,,,,, bool isActive,) = 
            //     _poolDataProvider.getReserveConfigurationData(config[i].asset);
            // require(isActive, "ERROR_ASSET_NOT_ACTIVE");
        // }
        _configureAssets(config);
    }

    function configureRouterModels(address[] memory routers, address[] memory models) external override {
        require(routers.length == models.length, "ERROR_ROUTER_MODEL_MISMATCH");
        _configureRouterModels(routers, models);
    }

    // function getBestRatios(address asset) external view returns (address[] memory, uint256[] memory) {
    //     address aggregator = _poolDataProvider.getAggregatorAddress(asset);
    //     uint256 currentTotalBalance = IAggregator(aggregator).getRoutersBalance();
    //     console.log("currentTotalBalance", currentTotalBalance);

    //     (address[] memory routersToSupply, uint256[] memory routersMaxToSupply, uint256 availableSum) = _getBestRatios(asset);

    //     uint256 liquidity = currentTotalBalance;
    //     if (availableSum > liquidity) {
    //         for (uint256 i = 0; i < routersToSupply.length; i++) {
    //             console.log(" - routersToSupply");
    //             uint256 ratio = routersMaxToSupply[i].rayDiv(availableSum);
    //             console.log("ratio", ratio);

    //             console.log("routersMaxToSupply.length", routersMaxToSupply.length);
    //             console.log("i+1", i+1);
    //             console.log("i", i);

    //             uint256 next = routersMaxToSupply[i];
    //             if (i+1 != routersMaxToSupply.length) {
    //                 console.log("i+1 != routersMaxToSupply.length");
    //                 next = routersMaxToSupply[i] - routersMaxToSupply[i+1];
    //             }
    //             // uint256 next = i+1 == routersMaxToSupply.length ? routersMaxToSupply[i] : 
    //             //     routersMaxToSupply[i] - routersMaxToSupply[i+1];
    //             console.log("next", next);

    //             uint256 resultDelta = routersMaxToSupply[i] - next; // 64.5

    //             console.log("resultDelta", resultDelta);
    //             uint256 amount = availableSum.rayMul(liquidity); // 68.3
    //             console.log("amount", amount);
    //             bool _break;
    //             // 64.5 > 55.5
    //             if (resultDelta > next) 
    //                 amount  = resultDelta; // 64.5
    //             if (liquidity < amount)
    //                 _break = true;

    //             console.log("amount", amount);
    //             // deposit(amount);
    //             // after 1 iteration
    //             // --- liquidity = 35.5
    //         }
    //     }
    // }

    // function _getBestRatios(address asset) internal view returns (address[] memory, uint256[] memory, uint256) {
    //     address aggregator = _poolDataProvider.getAggregatorAddress(asset);
    //     console.log("aggregator", aggregator);

    //     ( , uint256 currentInterestRate) = IAggregator(aggregator).getRouterWeightedInterestRate();
    //     console.log("currentInterestRate", currentInterestRate);


    //     address[] memory routers = IAggregator(aggregator).getRoutersDataList();

    //     address[] memory routersToSupply = new address[](routers.length);
    //     // uint256[] memory routersMaxToSupply = new uint256[](routers.length);
    //     console.log("routers.length", routers.length);

    //     QuickSort.StructSortParams[] memory routersData = new QuickSort.StructSortParams[](routers.length);


    //     uint256 availableSum;

    //     for (uint256 i = 0; i < routers.length; i++) {
    //         address router = routers[i];
    //         console.log("router", router);
    //         if (router == address(0)) {
    //             continue;
    //         }

    //         console.log("_routersInterestRateModels[router]", _routersInterestRateModels[router]);
    //         uint256 currentRate = IRouter(router).getSimulatedInterestRate(asset, 0, 0);
    //         console.log("currentRate", currentRate);

    //         // routersToSupply[i] = router;
    //         routersData[i].structAddress = router;

    //         uint256 max = IInterestRateModelStandard(_routersInterestRateModels[router]).getMaxSupply(asset, currentInterestRate);
    //         console.log("max", max);
    //         // routersMaxToSupply[i] = max;
    //         routersData[i].value = max;
    //         availableSum += max;
    //     }

    //     QuickSort.sortDesc(routersMaxToSupply);
    //     // available sum is how much liquidity can be provided in max of all protocols sum(routersMaxToSupply1,routersMaxToSupply2...)
    //     return (routersToSupply, routersMaxToSupply, availableSum);
    // }

    function getBestRatios(address asset) external view returns (address[] memory, uint256[] memory) {
        address aggregator = _poolDataProvider.getAggregatorAddress(asset);
        uint256 currentTotalBalance = IAggregator(aggregator).getRoutersBalance();
        console.log("currentTotalBalance", currentTotalBalance);


        (QuickSort.StructSortParams[] memory routersDataSorted, uint256 availableSum) = _getBestRatios(asset);

        uint256 liquidity = currentTotalBalance;
        if (availableSum > liquidity) {
            for (uint256 i = 0; i < routersDataSorted.length; i++) {
                console.log(" - routersToSupply");
                uint256 ratio = routersDataSorted[i].value.rayDiv(availableSum);
                console.log("ratio                           ", ratio);

                console.log("routersDataSorted[i].value      ", routersDataSorted[i].value);
                uint256 next = routersDataSorted[i].value;
                if (i+1 != routersDataSorted.length) {
                    console.log("i+1 != routersMaxToSupply.length");
                    console.log("routersDataSorted[i].value  ", routersDataSorted[i].value);
                    console.log("routersDataSorted[i+1].value", routersDataSorted[i+1].value);
                    next = routersDataSorted[i].value - routersDataSorted[i+1].value;
                }
                console.log("next       ", next);

                uint256 resultDelta = routersDataSorted[i].value - next; // 64.5

                console.log("resultDelta", resultDelta);
                uint256 amount = availableSum.rayMul(liquidity); // 68.3
                console.log("amount1    ", amount);
                bool _break;
                // 64.5 > 55.5
                if (resultDelta > next) 
                    amount  = resultDelta; // 64.5
                // if (liquidity < amount)
                //     _break = true;

                console.log("amount2    ", amount);
                // deposit(amount);
                // after 1 iteration
                // --- liquidity = 35.5
            }
        }
    }


    function _getBestRatios(address asset) internal view returns (QuickSort.StructSortParams[] memory, uint256) {
        address aggregator = _poolDataProvider.getAggregatorAddress(asset);
        console.log("aggregator", aggregator);

        ( , uint256 currentInterestRate) = IAggregator(aggregator).getRouterWeightedInterestRate();
        console.log("currentInterestRate", currentInterestRate);


        address[] memory routers = IAggregator(aggregator).getRoutersDataList();


        QuickSort.StructSortParams[] memory routersData = new QuickSort.StructSortParams[](routers.length);


        uint256 availableSum;

        for (uint256 i = 0; i < routers.length; i++) {
            address router = routers[i];
            console.log("router", router);
            if (router == address(0)) {
                continue;
            }

            console.log("_routersInterestRateModels[router]", _routersInterestRateModels[router]);
            // uint256 currentRate = IRouter(router).getSimulatedInterestRate(asset, 0, 0);
            // console.log("currentRate", currentRate);

            routersData[i].structAddress = router;

            uint256 max = IInterestRateModelStandard(_routersInterestRateModels[router]).getMaxSupply(asset, currentInterestRate);
            console.log("max", max);

            routersData[i].value = max;
            availableSum += max;
        }

        QuickSort.StructSortParams[] memory routersDataSorted = QuickSort.sortDescStruct(routersData);
        // available sum is how much liquidity can be provided in max of all protocols sum(routersMaxToSupply1,routersMaxToSupply2...)
        return (routersDataSorted, availableSum);
    }

    /// Submits if it beats both the current distr and the queued distr, if exists
    // function checkQueueAndSubmit(AllocatorDataTypes.AllocatorSubmitParams memory params) external {
    //     AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit = _allocatorSubmits[params.asset][allocatorSubmitsCount[params.asset]-1];

    //     AllocatorDataTypes.AssetData storage asset = _assets[params.asset];
    //     require(asset.active, "Asset not active");

    //     bool enoughTimePassed = block.timestamp - 
    //         _allocatorSubmits[params.asset][allocatorSubmitsCount[params.asset]-1].timestampSubmitted > 
    //         asset.submitTimeRequirementDelta;

    //     console.log("enoughTimePassed", enoughTimePassed);
    //     uint256 queueRate;
    //     if (enoughTimePassed) {
    //         queueRate = _allocatorCheckQueue(
    //             allocatorSubmit
    //         );
    //     }
    //     console.log("queueRate", queueRate);

    //     _allocatorSubmitPlain(params);

    //     AllocatorDataTypes.AllocatorSubmit storage allocatorSubmitNew = _allocatorSubmits[params.asset][allocatorSubmitsCount[params.asset]-1];
    //     uint256 newRate =  _allocatorCheckQueue(
    //         allocatorSubmitNew
    //     );

    //     console.log("newRate", newRate);
    //     // ensure new allocation works or revert
    //     require(newRate > queueRate, "ERROR_NEW_ALLOCATION_IS_LESSER");
    // }

    // function checkQueueVersusNew(AllocatorDataTypes.AllocatorSubmitParams memory params) external view returns (bool) {
    //     AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit = _allocatorSubmits[params.asset][allocatorSubmitsCount[params.asset]-1];

    //     uint256 queueRate = _allocatorCheckQueue(
    //         allocatorSubmit
    //     );

    //     // submit new allocation
    //     AllocatorDataTypes.AssetData storage asset = _assets[params.asset];
    //     require(asset.active, "Asset not active");

    //     _allocatorSubmitPlain(asset, params);

    //     AllocatorDataTypes.AllocatorSubmit storage allocatorSubmitNew = _allocatorSubmits[params.asset][allocatorSubmitsCount[params.asset]-1];
    //     uint256 newRate =  _allocatorCheckQueue(
    //         allocatorSubmitNew
    //     );
    //     // ensure new allocation works or revert
    //     return newRate > queueRate;
    // }


    function allocatorSubmit(AllocatorDataTypes.AllocatorSubmitParams memory params) external override whenNotPaused {
        AllocatorDataTypes.AssetData storage asset = _assets[params.asset];
        require(asset.active, "Asset not active");

        console.log("b4 enoughTimePassed");
        console.log("block.timestamp                    ", block.timestamp);
        console.log("b4 enoughTimePassed                ", _allocatorSubmits[params.asset][allocatorSubmitsCount[params.asset]].timestampSubmitted);
        console.log("b4 asset.submitTimeRequirementDelta", asset.submitTimeRequirementDelta);

        // bool enoughTimePassed = block.timestamp - 
        //     _allocatorSubmits[params.asset][allocatorSubmitsCount[params.asset]-1].timestampSubmitted > 
        //     asset.submitTimeRequirementDelta;

        // console.log("enoughTimePassed", enoughTimePassed);
        // require(enoughTimePassed, "ERROR_NOT_ENOUGH_TIME_PASSED");

        uint256 routersLength = params.routers.length;
        uint256 ladderPercentagesLength = params.ladderPercentages.length;

        require(routersLength == ladderPercentagesLength, "ERROR_PARAMS_LENGTH_MISMATCH");
        params.caller = msg.sender;

        // get aggregator from asset to match underlying asset with correct aggregator
        params.aggregator = _poolDataProvider.getAggregatorAddress(params.asset);
        console.log("params.aggregator", params.aggregator);
        // store allocation
        _allocatorSubmitPlain(params);

        // // with check 
        // bool isBetter = _allocatorChecker(
        //     _allocatorSubmits[params.asset][allocatorSubmitsCount[params.asset]-1]
        // );
        // require(isBetter, "ERROR_ALLOCATION_IS_LESSER");
    }

    // function allocatorSubmit(AllocatorDataTypes.AllocatorSubmitParams memory params) external override whenNotPaused {
    //     AllocatorDataTypes.AssetData storage asset = _assets[params.asset];
    //     require(asset.active, "Asset not active");


    //     bool enoughTimePassed = block.timestamp - 
    //         _allocatorSubmits[params.asset][allocatorSubmitsCount[params.asset]].timestampSubmitted > 
    //         asset.submitTimeRequirementDelta;

    //     require(enoughTimePassed, "ERROR_NOT_ENOUGH_TIME_PASSED");

    //     uint256 routersLength = params.routers.length;
    //     uint256 ladderPercentagesLength = params.ladderPercentages.length;

    //     require(routersLength == ladderPercentagesLength, "ERROR_PARAMS_LENGTH_MISMATCH");
    //     params.caller = msg.sender;
    //     // get aggregator from asset
    //     params.aggregator = _poolDataProvider.getAggregatorAddress(params.asset);
    //     _allocatorSubmitPlain(asset, params);
    // }

    function allocatorChecker(address asset) external view override returns (bool) {
        // last submit
        AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit = _allocatorSubmits[asset][allocatorSubmitsCount[asset]];

        // return if better than current allocation
        return _allocatorChecker(
            allocatorSubmit
        );
    }

    function allocatorParamsChecker(AllocatorDataTypes.AllocatorSubmitParams memory params) external view returns (bool) {
        console.log("allocatorParamsChecker");
        params.aggregator = _poolDataProvider.getAggregatorAddress(params.asset);
        // return if better than current allocation
        return _allocatorParamsChecker(
            params
        );
    }

    function executeAllocator(address asset, uint256 allocatorId) external override whenNotPaused {
        uint256 startGas = gasleft();



        console.log("executeAllocator");
        // AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit = _allocatorSubmits[asset][allocatorId];
        AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit = _allocatorSubmits[asset][allocatorSubmitsCount[asset]];
        // require(allocatorSubmit.allocator == address(0), "Allocator executed");

        AllocatorDataTypes.AssetData storage asset = _assets[allocatorSubmit.asset];

        // require(!allocatorSubmit.executed, "ERROR_ALLOCATION_EXECUTED");
        // allocatorSubmit.executed = true;

        uint256 timeAlloted = block.timestamp - allocatorSubmit.timestampSubmitted;
        require(timeAlloted > asset.executeTimeRequirement, "Error: Time requirement");

        _execute(
            allocatorSubmit
        );

        // _checkAndExecute(
        //     allocatorSubmit
        // );
        uint256 ethPrice = IPriceOracle(_addressesProvider.getPriceOracle()).getAssetPrice(wethAddress);
        uint256 gasPrice = tx.gasprice;
        console.log("gasPrice", gasPrice);
        uint256 gasUsed = startGas - gasleft();
        console.log("gasUsed", gasUsed);
        uint256 value = gasPrice * gasUsed * (ethPrice / 1e8);
        console.log("executeAllocator value", value);

    }

    // function submitAndExecuteAllocator(AllocatorDataTypes.AllocatorSubmitParams memory params) external whenNotPaused {
    //     uint256 startGas = gasleft();

    //     AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit = _allocatorSubmits[params.asset][allocatorSubmitsCount[params.asset]];

    //     AllocatorDataTypes.AssetData storage asset = _assets[params.asset];

    //     params.caller = msg.sender;

    //     params.aggregator = _poolDataProvider.getAggregatorAddress(params.asset);

    //     _allocatorSubmitPlain(params);

    //     // usd version
    //     uint256 assetPrice = IPriceOracle(_addressesProvider.getPriceOracle()).getAssetPrice(params.asset);
    //     uint256 accruedSince = IAggregator(params.aggregator).getLastAllocatedAccrued();
    //     uint256 _decimals = IERC20Metadata(params.asset).decimals();
    //     uint256 accruedValueSince = accruedSince * assetPrice / (10**_decimals);

    //     // gets previously updated accrue amount
    //     // uint256 accruedSince = IAggregator(params.aggregator).getLastAllocatedAccrued();
    //     // uint256 assetPrice = IPriceOracle(_addressesProvider.getPriceOracle()).getAssetEthPrice(params.asset);
    //     // uint256 assetPrice = 53451821000000000;
    //     // uint256 assetValue = accruedSince * (assetPrice / 1e8);
    //     // uint256 assetValue2 = accruedSince * assetPrice / 1e8;

    //     _checkAndExecute(
    //         _allocatorSubmits[params.asset][allocatorSubmitsCount[params.asset]]
    //     );

    //     allocatorSubmit.timestampAllocated = block.timestamp;

    //     // uint256 gasPrice = tx.gasprice;
    //     // console.log("gasPrice", gasPrice);
    //     // uint256 gasUsed = startGas - gasleft();
    //     // console.log("gasUsed", gasUsed);
    //     // uint256 value = gasPrice * gasUsed * assetPrice;
    //     // console.log("value", value);
    //     // console.log("value2", gasPrice * gasUsed);
    //     // console.log("value2", gasPrice * gasUsed / assetPrice);
    //     // console.log("assetPrice", assetPrice);
    //     // console.log("assetValue", assetValue);
    //     // console.log("assetValue2", assetValue2);
    //     // console.log("accruedSince", accruedSince);
    //     // console.log("value", value);
    //     // console.log("submitAndExecuteAllocator value", value);
    //     // uint256 value2 = gasPrice * gasUsed * assetPrice;
    //     // console.log("value2", value2);

    //     // uint256 value3 = gasPrice * gasUsed * assetPrice / 1e8;
    //     // console.log("value3", value3);

    //     // uint256 _decimals = IERC20Metadata(params.asset).decimals();
    //     // console.log("_decimals", _decimals);
    //     // uint256 value4;
    //     // if (18 < _decimals) {
    //     //     value4 = assetPrice * 10**uint256(_decimals - 18);
    //     //     console.log("if");
    //     // } else if (18 > _decimals) {
    //     //     value4 = assetPrice / 10**uint256(18 - _decimals);
    //     //     console.log("else if");
    //     // }
    //     // console.log("value4", value4);
    //     // console.log("value4", gasPrice * gasUsed * value4);
    //     // console.log("value4", gasPrice * gasUsed * value4 / (10**(18-6)));

    //     // usd way
    //     uint256 ethPrice = IPriceOracle(_addressesProvider.getPriceOracle()).getAssetPrice(wethAddress);
    //     uint256 ethDecimals = 18;
    //     uint256 gasPrice = tx.gasprice;
    //     console.log("gasPrice", gasPrice);
    //     uint256 gasUsed = startGas - gasleft();
    //     console.log("gasUsed", gasUsed);
    //     uint256 value4;
    //     if (8 < ethDecimals) {
    //         value4 = assetPrice * 10**uint256(ethDecimals - 8);
    //         console.log("if");
    //     } else if (8 > ethDecimals) {
    //         value4 = assetPrice / 10**uint256(8 - ethDecimals);
    //         console.log("else if");
    //     }

    //     uint256 value = gasPrice * gasUsed * (ethPrice / 1e8);
    //     uint256 value2 = gasPrice * gasUsed * ethPrice / 10**18;
    //     console.log("value ", value);
    //     console.log("value2", value2);
    //     console.log("value4", value4);
    //     console.log("assetPrice", assetPrice);
    //     console.log("accruedSince", accruedSince);
    //     console.log("accruedValueSince", accruedValueSince);
    //     console.log("accruedValueSince", accruedValueSince);
    //     console.log("submitAndExecuteAllocator value", value);
    // }

    struct GasParams {
        uint256 previousGasValue;
        uint256 assetPrice;
        uint256 accruedSince;
        uint256 accruedValueSince;
        uint256 ethPrice;
        uint256 gasPrice;
        uint256 gasUsed;
        uint256 gasValue;
    }

    // function submitAndExecuteAllocator(AllocatorDataTypes.AllocatorSubmitParams memory params) external whenNotPaused {
    //     uint256 startGas = gasleft();

    //     GasParams memory vars;

    //     AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit = _allocatorSubmits[params.asset][allocatorSubmitsCount[params.asset]];

    //     // AllocatorDataTypes.AssetData storage asset = _assets[params.asset];

    //     // params.caller = msg.sender;
    //     params.aggregator = _poolDataProvider.getAggregatorAddress(params.asset);

    //     vars.previousGasValue = allocatorSubmit.gasValue;
    //     console.log("previousGasValue", vars.previousGasValue);

    //     _allocatorSubmitPlain(params);

    //     // usd version
    //     vars.assetPrice = IPriceOracle(_addressesProvider.getPriceOracle()).getAssetPrice(params.asset);
    //     vars.accruedSince = IAggregator(params.aggregator).getLastAllocatedAccrued();
    //     uint256 _decimals = IERC20Metadata(params.asset).decimals();
    //     vars.accruedValueSince = vars.accruedSince * vars.assetPrice / (10**_decimals);
    //     console.log("accruedValueSince", vars.accruedValueSince);

    //     _checkAndExecute(
    //         _allocatorSubmits[params.asset][allocatorSubmitsCount[params.asset]]
    //     );

    //     // allocatorSubmit.timestampAllocated = block.timestamp;

    //     // usd way
    //     vars.ethPrice = IPriceOracle(_addressesProvider.getPriceOracle()).getAssetPrice(wethAddress);

    //     vars.gasPrice = tx.gasprice;
    //     console.log("gasPrice", vars.gasPrice);
    //     vars.gasUsed = startGas - gasleft();
    //     console.log("gasUsed", vars.gasUsed);

    //     vars.gasValue = vars.gasPrice * vars.gasUsed * vars.ethPrice / 10**18;
    //     _allocatorSubmits[params.asset][allocatorSubmitsCount[params.asset]].gasValue = vars.gasValue;

    //     console.log("gasValue         ", vars.gasValue);
    //     console.log("accruedValueSince", vars.accruedValueSince);

    //     // ensure redistr is profitable
    //     require(vars.accruedValueSince >= vars.previousGasValue, "ERROR.NEW_DISTR_NOT_PROFITABLE");
    // }


    function execute(AllocatorDataTypes.AllocatorSubmitParams memory params) external whenNotPaused {
        uint256 startGas = gasleft();

        GasParams memory vars;

        AllocatorDataTypes.AllocatorSubmit storage prevAllocatorSubmit = _allocatorSubmits[params.asset][allocatorSubmitsCount[params.asset]];

        params.aggregator = _poolDataProvider.getAggregatorAddress(params.asset);

        vars.previousGasValue = prevAllocatorSubmit.gasValue;

        // usd version
        vars.assetPrice = IPriceOracle(_addressesProvider.getPriceOracle()).getAssetPrice(params.asset);
        vars.accruedSince = IAggregator(params.aggregator).getLastAllocatedAccrued();
        uint256 _decimals = IERC20Metadata(params.asset).decimals();
        vars.accruedValueSince = vars.accruedSince * vars.assetPrice / (10**_decimals);

        _executeWithCheck2(params);

        // usd way
        vars.ethPrice = IPriceOracle(_addressesProvider.getPriceOracle()).getAssetPrice(wethAddress);

        vars.gasPrice = tx.gasprice;
        // console.log("gasPrice", vars.gasPrice);
        vars.gasUsed = startGas - gasleft();
        console.log("gasUsed", vars.gasUsed);

        vars.gasValue = vars.gasPrice * vars.gasUsed * vars.ethPrice / 10**18;
        _allocatorSubmits[params.asset][allocatorSubmitsCount[params.asset]].gasValue = vars.gasValue;

        console.log("gasValue         ", vars.gasValue);
        console.log("accruedValueSince", vars.accruedValueSince);
        console.log("previousGasValue", vars.previousGasValue);

        // ensure redistr is profitable
        require(vars.accruedValueSince >= vars.previousGasValue, "ERROR.NEW_DISTR_NOT_PROFITABLE");
    }


    // function checkQueue(AllocatorDataTypes.AllocatorSubmitParams memory params) external returns (uint256) {

    //     AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit = _allocatorSubmits[params.asset][allocatorSubmitsCount[params.asset]];

    //     uint256 timeAlloted = block.timestamp - allocatorSubmit.timestampSubmitted;

    //     uint256 queueRate;
    //     if (timeAlloted > _assets[params.asset].executeTimeRequirement && !allocatorSubmit.executed) {
    //         queueRate = _allocatorCheckQueue(
    //             allocatorSubmit
    //         );
    //     }
    //     return queueRate;

    // }

    // function getMinYieldIncrease(address asset) public view returns (uint256) {
    //     console.log("getMinYieldIncrease");
    //     AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit = _allocatorSubmits[asset][allocatorSubmitsCount[asset]];
    //     address aggregator = _poolDataProvider.getAggregatorAddress(asset);
    //     if (allocatorSubmit.id == 0) {
    //         return type(uint256).max;
    //     } else {
    //         return _getMinYieldIncrease(
    //             allocatorSubmit,
    //             _addressesProvider.getPriceOracle()
    //         );
    //     }
    //     // address aggregator = _poolDataProvider.getAggregatorAddress(asset);
    //     // (uint256 totalRoutedBalance, uint256 weightedRate) = IAggregator(aggregator).getRouterWeightedInterestRate();

    //     // return _getMinYieldIncrease(
    //     //     asset,
    //     //     totalRoutedBalance.rayMul(weightedRate),
    //     //     _allocatorSubmits[asset][allocatorSubmitsCount[asset]].timestampAllocated,
    //     //     _poolDataProvider.getPriceOracle()
    //     // );
    // }

    // function getMinYieldIncreaseTx(address asset) public returns (uint256) {
    //     console.log("getMinYieldIncrease");
    //     AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit = _allocatorSubmits[asset][allocatorSubmitsCount[asset]];
    //     address aggregator = _poolDataProvider.getAggregatorAddress(asset);
    //     // bytes memory result = "okay";

    //     bytes memory result = bytes(Strings.toString(type(uint256).max));

    //     // require(false, string (result));
    //     // revert(string (result));

    //     if (allocatorSubmit.id == 0) {
    //         require(false, string(result));
    //     } else {

    //         uint256 minYieldIncrease = _getMinYieldIncrease(
    //             allocatorSubmit,
    //             _addressesProvider.getPriceOracle()
    //         );
    //         bytes memory result = bytes(Strings.toString(minYieldIncrease));
    //         require(false, string(result));
    //     }
    // }

    // // get last submit that hasn't been executed
    // function getLastAllocatorSubmitInTimeRequirement(address asset) 
    //     external 
    //     view 
    //     returns 
    //     (AllocatorDataTypes.AllocatorSubmit memory) 
    // {
    //     AllocatorDataTypes.AllocatorSubmit storage allocatorSubmit = _allocatorSubmits[asset][allocatorSubmitsCount[asset]-1];
    //     uint256 timeAlloted = block.timestamp - allocatorSubmit.timestampSubmitted;

    //     if (timeAlloted > asset.executeTimeRequirement && !allocatorSubmit.executed) {
    //         return _allocatorCheckLastAllocatorSubmit(allocatorSubmit);
    //     } else {
    //         return 0;
    //     }
    //     return _allocatorSubmits[asset][allocatorSubmitsCount[asset]-1];
    // }

    function getLastAllocatorSubmit(address asset) 
        external 
        view 
        returns 
        (AllocatorDataTypes.AllocatorSubmit memory) 
    {
        return _allocatorSubmits[asset][allocatorSubmitsCount[asset]];
    }

    function getAllocatorSubmit(address asset, uint256 allocatorId) 
        external 
        view 
        returns 
        (AllocatorDataTypes.AllocatorSubmit memory) 
    {
        return _allocatorSubmits[asset][allocatorId];
    }

    function getPause() external view override returns (bool) {
        return pause;
    }

    function setPause() external override onlyAllocatorManager {
        pause = !pause;
    }

    function getPauseAsset(address asset) external view override returns (bool) {
        return _assets[asset].pause;
    }

    function setPauseAsset(address asset, bool pause) external override onlyAllocatorManager {
        AllocatorDataTypes.AssetData storage asset = _assets[asset];
        require(asset.active, "ERROR_ASSET_NOT_ACTIVE");
        asset.pause = pause;
    }

    function getExecuteTimeRequirement(address asset) external view override returns (uint256) {
        return _assets[asset].executeTimeRequirement;
    }

    function setExecuteTimeRequirement(address asset, uint256 executeTimeRequirement) external override onlyAllocatorManager {
        AllocatorDataTypes.AssetData storage asset = _assets[asset];
        require(asset.active, "ERROR_ASSET_NOT_ACTIVE");
        asset.executeTimeRequirement = executeTimeRequirement;
    }

    function getSubmitTimeRequirementDelta(address asset) external view override returns (uint256) {
        return _assets[asset].submitTimeRequirementDelta;
    }

    function setSubmitTimeRequirementDelta(address asset, uint256 submitTimeRequirementDelta) external override onlyAllocatorManager {
        AllocatorDataTypes.AssetData storage asset = _assets[asset];
        require(asset.active, "ERROR_ASSET_NOT_ACTIVE");
        asset.submitTimeRequirementDelta = submitTimeRequirementDelta;
    }

}