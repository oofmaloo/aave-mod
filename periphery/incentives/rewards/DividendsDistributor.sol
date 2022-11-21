// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {IDividendsDistributor} from './interfaces/IDividendsDistributor.sol';
import {DividendsDataTypes} from './libraries/DividendsDataTypes.sol';
import {WadRayMath} from './libraries/WadRayMath.sol';
import {IScaledBalanceToken} from '../../../../contracts/interfaces/IScaledBalanceToken.sol';
import {ITransferStrategyBase} from './interfaces/ITransferStrategyBase.sol';
import {IDividendsTransferStrategy} from './interfaces/IDividendsTransferStrategy.sol';
import {IAToken} from './interfaces/IAToken.sol';
import "hardhat/console.sol";

/**
 * @title DividendsDistributor
 * @notice Accounting contract to manage distributing dividends to stakers
 * @author Addi
 **/
abstract contract DividendsDistributor is IDividendsDistributor {
  using SafeCast for uint256;
  using WadRayMath for uint256;
  // manager of incentives
  address internal _emissionManager;

  // ITransferStrategyBase internal _dividendsVault;
  IDividendsTransferStrategy internal _dividendsTransfersStrategy;

  // aTokens => DividendData
  mapping(address => DividendsDataTypes.DividendData) internal _dividendDividends; // asset mapping

  // dividend => enabled
  mapping(address => bool) internal _isDividendEnabled;

  // global dividends list
  address[] internal _dividendDividendsList;

  address[] internal _dividendAssetsList;

  //global assets list
  address internal _stakedToken;
  uint256 internal _stakedAssetUnits = 10**18;

  modifier onlyDividendManager() {
    require(msg.sender == _emissionManager, 'ONLY_EMISSION_MANAGER');
    _;
  }

  constructor(address emissionManager) {
    _setDividendManager(emissionManager);
  }

  function getDividendsData(address dividend)
    public
    view
    override
    returns (
      uint256,
      uint256,
      uint256,
      uint256
    )
  {
    return (
      _dividendDividends[dividend].index,
      _dividendDividends[dividend].emissionPerSecond,
      _dividendDividends[dividend].lastUpdateTimestamp,
      _dividendDividends[dividend].lastUpdateBalance
    );
  }

  function getDividendsList() external view override returns (address[] memory) {
    return _dividendDividendsList;
  }

  function getUserAssetIndex(
    address user,
    address dividend
  ) public view override returns (uint256) {
    return _dividendDividends[dividend].usersData[user].index;
  }

  // function getUserAccruedDividends(address user, address dividend)
  //   external
  //   view
  //   override
  //   returns (uint256)
  // {
  //   uint256 totalAccrued;
  //   for (uint256 i = 0; i < _dividendsList.length; i++) {
  //     totalAccrued += _assets[_dividendsList[i]].usersData[user].accrued;
  //   }
  //   return totalAccrued;
  // }

  function getUserDividends(
    address user,
    address dividend
  ) external view override returns (uint256) {
    return _getUserDividend(user, dividend);
  }

  function getAllUserDividends(address user)
    external
    view
    override
    returns (address[] memory dividendDividendsList, uint256[] memory unclaimedAmounts)
  {
    dividendDividendsList = new address[](_dividendDividendsList.length);
    unclaimedAmounts = new uint256[](dividendDividendsList.length);

    // Add unrealized dividends from user to unclaimedDividends
    for (uint256 r = 0; r < _dividendDividendsList.length; r++) {
      dividendDividendsList[r] = _dividendDividendsList[r];
      console.log("getAllUserDividends dividendDividendsList[r]", dividendDividendsList[r]);
      unclaimedAmounts[r] += _dividendDividends[dividendDividendsList[r]]
        .usersData[user]
        .accrued;

      console.log("getAllUserDividends unclaimedAmounts[r]", unclaimedAmounts[r]);
      unclaimedAmounts[r] += _getPendingDividends(user, dividendDividendsList[r]);
      console.log("getAllUserDividends unclaimedAmounts[r]", unclaimedAmounts[r]);
    }
    return (dividendDividendsList, unclaimedAmounts);
  }

  function setEmissionPerSecond(
    address dividend, // aToken dividend
    uint88 newEmissionsPerSecond
  ) external override onlyDividendManager {

    DividendsDataTypes.DividendData storage dividendData = _dividendDividends[dividend];

    uint256 decimals = dividendData.decimals;
    require(
      decimals != 0 && dividendData.lastUpdateTimestamp != 0,
      'DISTRIBUTION_DOES_NOT_EXIST'
    );

    (uint256 newIndex, ) = _updateDividendData(
      dividend,
      dividendData,
      IERC20Metadata(_stakedToken).totalSupply(),
      10**decimals
    );

    uint256 oldEmissionPerSecond = dividendData.emissionPerSecond;
    dividendData.emissionPerSecond = newEmissionsPerSecond;

    // emit AssetConfigUpdated(
    //   dividend,
    //   dividends,
    //   oldEmissionPerSecond,
    //   newEmissionsPerSecond[i],
    //   dividendData.distributionEnd,
    //   dividendData.distributionEnd,
    //   newIndex
    // );
  }

  /**
   * @dev Configure the _assets for a specific emission
   * @param dividendsInput The array of each asset configuration
   **/
  function _configureAssets(DividendsDataTypes.DividendsConfigInput[] memory dividendsInput) internal {
    console.log("distributor _configureAssets");
    for (uint256 i = 0; i < dividendsInput.length; i++) {

      // aToken decimals
      uint256 decimals = _dividendDividends[dividendsInput[i].dividend].decimals = IERC20Metadata(
        dividendsInput[i].dividend
      ).decimals();

      console.log("distributor _configureAssets decimals", decimals);

      DividendsDataTypes.DividendData storage dividendData = _dividendDividends[dividendsInput[i].dividend];
      // dividendData.dividend = dividendsInput[i].dividend;

      address underlyingAsset = IAToken(dividendsInput[i].dividend).UNDERLYING_ASSET_ADDRESS();

      // Add dividend address to global dividends list if still not enabled
      // Indicates if dividend has been initiated, cannot be undone
      if (_isDividendEnabled[dividendsInput[i].dividend] == false) {
        _isDividendEnabled[dividendsInput[i].dividend] = true;
        _dividendDividendsList.push(dividendsInput[i].dividend);
        // underlying used for calling mint on pool
        _dividendAssetsList.push(underlyingAsset);
        dividendData.index = uint104(WadRayMath.RAY);
      }

      console.log("distributor _configureAssets after push");

      // Due emissions is still zero, updates only latestUpdateTimestamp
      // totalSupply grabbed from controller
      (uint256 newIndex, ) = _updateDividendData(
        dividendsInput[i].dividend,
        dividendData,
        dividendsInput[i].totalSupply,
        10**decimals
      );

      console.log("distributor _configureAssets after _updateDividendData");

      dividendData.underlyingAssetAddress = underlyingAsset;

      console.log("distributor _configureAssets after dividendData.underlyingAssetAddress");

      // Configure emission and distribution end of the dividend per asset
      uint88 oldEmissionsPerSecond = dividendData.emissionPerSecond;
      dividendData.emissionPerSecond = dividendsInput[i].emissionPerSecond;

      // emit AssetConfigUpdated(
      //   dividendsInput[i].asset,
      //   dividendsInput[i].dividend,
      //   oldEmissionsPerSecond,
      //   dividendsInput[i].emissionPerSecond,
      //   oldDistributionEnd,
      //   dividendsInput[i].distributionEnd,
      //   newIndex
      // );
    }
  }

  /**
   * @dev Updates the state of the distribution for the specified dividend
   * @param dividendData Storage pointer to the distribution dividend config
   * @param totalSupply Current total of staked tokens
   * @param assetUnit One unit of asset (10**decimals)
   * @return The new distribution index
   * @return True if the index was updated, false otherwise
   **/
  function _updateDividendData(
    address dividend,
    DividendsDataTypes.DividendData storage dividendData,
    uint256 totalSupply,
    uint256 assetUnit
  ) internal returns (uint256, bool) {
    console.log("_updateDividendData dividend", dividend);
    console.log("_updateDividendData _dividendsTransfersStrategy", address(_dividendsTransfersStrategy));
    uint256 balance = _dividendsTransfersStrategy.getBalance(dividend);
    console.log("_updateDividendData getBalance", balance);
    (uint256 oldIndex, uint256 newIndex) = _getAssetIndex(
      dividendData,
      balance,
      totalSupply,
      assetUnit
    );
    console.log("_updateDividendData oldIndex", oldIndex);
    console.log("_updateDividendData newIndex", newIndex);
    bool indexUpdated;
    if (newIndex != oldIndex) {
      require(newIndex <= type(uint104).max, 'INDEX_OVERFLOW');
      indexUpdated = true;

      //optimization: storing one after another saves one SSTORE
      dividendData.index = uint104(newIndex);
      dividendData.lastUpdateTimestamp = block.timestamp.toUint32();
      dividendData.lastUpdateBalance = balance;
    } else {
      dividendData.lastUpdateTimestamp = block.timestamp.toUint32();
    }
    console.log("_updateDividendData end");

    return (newIndex, indexUpdated);
  }

  /**
   * @dev Updates the state of the distribution for the specific user
   * @param dividendData Storage pointer to the distribution dividend config
   * @param user The address of the user
   * @param userBalance The user balance of the asset
   * @param newAssetIndex The new index of the asset distribution
   * @param assetUnit One unit of asset (10**decimals)
   * @return The dividends accrued since the last update
   **/
  function _updateUserData(
    DividendsDataTypes.DividendData storage dividendData,
    address user,
    uint256 userBalance,
    uint256 newAssetIndex,
    uint256 assetUnit
  ) internal returns (uint256, bool) {
    uint256 userIndex = dividendData.usersData[user].index;
    uint256 dividendsAccrued;
    bool dataUpdated;
    if ((dataUpdated = userIndex != newAssetIndex)) {
      // already checked for overflow in _updateDividendData
      dividendData.usersData[user].index = uint104(newAssetIndex);
      if (userBalance != 0) {
        dividendsAccrued = _getDividends(userBalance, newAssetIndex, userIndex, assetUnit, _stakedAssetUnits);

        dividendData.usersData[user].accrued += dividendsAccrued.toUint128();
      }
    }
    return (dividendsAccrued, dataUpdated);
  }

  function _updateDataMultiple(
    address user,
    uint256 userBalance,
    uint256 totalSupply
  ) internal {
    for (uint256 i = 0; i < _dividendDividendsList.length; i++) {
      _updateData(
        _dividendDividendsList[i],
        user,
        userBalance,
        totalSupply
      );
    }
  }

  /**
   * @dev Iterates and accrues all the dividends for the staked token of the specific user
   * @param dividend The address of the reference asset of the distribution
   * @param user The user address
   * @param userBalance The current user asset balance
   * @param totalSupply Total supply of staked tokens
   **/
  function _updateData(
    address dividend,
    address user,
    uint256 userBalance,
    uint256 totalSupply
  ) internal {

    DividendsDataTypes.DividendData storage dividendData = _dividendDividends[dividend];
    uint256 assetUnit = 10**dividendData.decimals;

    (uint256 newAssetIndex, bool dividendDataUpdated) = _updateDividendData(
      dividend,
      dividendData,
      totalSupply,
      assetUnit
    );

    (uint256 dividendsAccrued, bool userDataUpdated) = _updateUserData(
      dividendData,
      user,
      userBalance,
      newAssetIndex,
      assetUnit
    );
  }

  /**
   * @dev Return the accrued unclaimed amount of a dividend from a user over a list of distribution
   * @param user The address of the user
   * @param dividend The address of the dividend token
   **/
  function _getUserDividend(
    address user,
    address dividend
  ) internal view returns (uint256 unclaimedDividends) {
    // Add unrealized dividends
    unclaimedDividends +=
      _getPendingDividends(user, dividend) +
      _dividendDividends[dividend].usersData[user].accrued;

    return unclaimedDividends;
  }

  /**
   * @dev Calculates the pending (not yet accrued) dividends since the last user action
   * @param user The address of the user
   * @param dividend The address of the dividend token
   * @return The pending dividends for the user since the last user action
   **/
  function _getPendingDividends(
    address user,
    address dividend
  ) internal view returns (uint256) {
    DividendsDataTypes.DividendData storage dividendData = _dividendDividends[dividend];

    (uint256 userBalance, uint256 totalSupply) = IScaledBalanceToken(
      _stakedToken
    ).getScaledUserBalanceAndSupply(user);

    uint256 assetUnit = 10**_dividendDividends[dividend].decimals;
    (, uint256 nextIndex) = _getAssetIndex(
      dividendData, 
      _dividendsTransfersStrategy.getBalance(dividend), 
      totalSupply, 
      assetUnit
    );

    return
      _getDividends(
        userBalance,
        nextIndex,
        dividendData.usersData[user].index,
        assetUnit,
        _stakedAssetUnits
      );
  }

  /**
   * @dev Internal function for the calculation of user's dividends on a distribution
   * @param userBalance Balance of the user asset on a distribution
   * @param reserveIndex Current index of the distribution
   * @param userIndex Index stored for the user, representation his staking moment
   * @param assetUnit One unit of asset (10**decimals)
   * @return The dividends
   **/
  function _getDividends(
    uint256 userBalance,
    uint256 reserveIndex,
    uint256 userIndex,
    uint256 assetUnit,
    uint256 stakedAssetUnit
  ) internal view returns (uint256) {
    uint256 result = userBalance.rayMul(reserveIndex - userIndex) * assetUnit / stakedAssetUnit;
    return result;
    // uint256 result = userBalance * (reserveIndex - userIndex);
    // assembly {
    //   result := div(result, assetUnit)
    // }
    // return result;
  }

  /**
   * @dev Calculates the next value of an specific distribution index, with validations
   * @param totalSupply of the asset being dividended
   * @param assetUnit One unit of asset (10**decimals)
   * @return The new index.
   **/
  function _getAssetIndex(
    DividendsDataTypes.DividendData storage dividendData,
    uint256 balance,
    uint256 totalSupply,
    uint256 assetUnit
  ) internal view returns (uint256, uint256) {
    uint256 oldIndex = dividendData.index;
    uint256 emissionPerSecond = dividendData.emissionPerSecond;
    uint256 lastUpdateTimestamp = dividendData.lastUpdateTimestamp;
    uint256 lastUpdateBalance = dividendData.lastUpdateBalance;

    console.log("_getAssetIndex oldIndex", oldIndex);
    console.log("_getAssetIndex emissionPerSecond", emissionPerSecond);
    console.log("_getAssetIndex lastUpdateTimestamp", lastUpdateTimestamp);
    console.log("_getAssetIndex block.timestamp    ", block.timestamp);
    console.log("_getAssetIndex lastUpdateBalance", lastUpdateBalance);
    console.log("_getAssetIndex balance", balance);
    console.log("_getAssetIndex totalSupply", totalSupply);

    if (
      totalSupply == 0 ||
      lastUpdateTimestamp == block.timestamp ||
      lastUpdateBalance >= balance
    ) {
      return (oldIndex, oldIndex);
    }

    // get max drip
    // uint256 timeDelta = block.timestamp - lastUpdateTimestamp;
    // uint256 maxAccrue = emissionPerSecond * timeDelta;


    // get total accrue
    uint256 accrued = (balance - lastUpdateBalance) * _stakedAssetUnits / assetUnit;
    console.log("_getAssetIndex accrued", accrued);

    // reserve based system using max APR
    // uint256 reserveBalance = dividendData.reservedBalance;
    // // adj accrue and reserve
    // if (accrued >= maxAccrue) {
    //   dividendData.reservedBalance += accrued - maxAccrue;
    //   accrued = maxAccrue;
    // } else {
    //   if (reserveBalance != 0) {
    //     uint256 wantedReserves = maxAccrue - accrued;
    //     if (reserveBalance >= wantedReserves) {
    //       dividendData.reservedBalance -= wantedReserves;
    //       accrued = maxAccrue;
    //     } else {
    //       dividendData.reservedBalance = 0;
    //       accrued += reserveBalance;
    //     }
    //   }
    // }


    // uint256 dividendAccrueInterest = accrued.rayDiv(lastUpdateBalance);
    uint256 dividendAccrueInterest = accrued.rayDiv(totalSupply);
    console.log("_getAssetIndex dividendAccrueInterest", dividendAccrueInterest);

    uint256 newIndex = dividendAccrueInterest.rayMul(
        oldIndex) + oldIndex;

    return (oldIndex, newIndex);
  }

  function getDividendsDecimals(address asset) external view returns (uint8) {
    return _dividendDividends[asset].decimals;
  }

  function getEmissionManager() external view returns (address) {
    return _emissionManager;
  }

  function setDividendManager(address emissionManager) external onlyDividendManager {
    _setDividendManager(emissionManager);
  }

  /**
   * @dev Updates the address of the emission manager
   * @param emissionManager The address of the new EmissionManager
   */
  function _setDividendManager(address emissionManager) internal {
    address previousEmissionManager = _emissionManager;
    _emissionManager = emissionManager;
    // emit EmissionManagerUpdated(previousEmissionManager, emissionManager);
  }


  function setStakedToken(address stakedToken) external onlyDividendManager {
    _setStakedToken(stakedToken);
  }

  /**
   * @dev Updates the address of the emission manager
   * @param stakedToken The address of the new EmissionManager
   */
  function _setStakedToken(address stakedToken) internal {
    address previousStakedToken = _stakedToken;
    _stakedToken = stakedToken;
    // emit EmissionManagerUpdated(previousEmissionManager, emissionManager);
  }


  function _setTransferStrategy(address transferStrategy) internal {
    _dividendsTransfersStrategy = IDividendsTransferStrategy(transferStrategy);
  }
}
