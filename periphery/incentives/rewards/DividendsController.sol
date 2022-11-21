// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {IScaledBalanceToken} from '../../../../contracts/interfaces/IScaledBalanceToken.sol';
import {DividendsDistributor} from './DividendsDistributor.sol';
import {IDividendsController} from './interfaces/IDividendsController.sol';
import {ITransferStrategyBase} from './interfaces/ITransferStrategyBase.sol';
import {IPoolAddressesProvider} from './interfaces/IPoolAddressesProvider.sol';
import {DividendsDataTypes} from './libraries/DividendsDataTypes.sol';
import {IEACAggregatorProxy} from '../misc/interfaces/IEACAggregatorProxy.sol';
import {IPool} from './interfaces/IPool.sol';
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "hardhat/console.sol";

//  each aToken has 1 DividendsController && 1 EmissionManager
//  each DividendsController deploys 1 DividendsDistributor
//  each DividendsDistributor has_many dividends assets

/**
 * @title DividendsController
 * @notice Abstract contract template to build Distributors contracts for ERC20 dividends to protocol participants
 * @author Aave
 **/
// contract DividendsController is DividendsDistributor, VersionedInitializable, IDividendsController {
contract DividendsController is DividendsDistributor, IDividendsController {
  using SafeCast for uint256;

  // uint256 public constant REVISION = 1;

  // This mapping allows whitelisted addresses to claim on behalf of others
  // useful for contracts that hold tokens to be dividended but don't have any native logic to claim Liquidity Mining dividends
  mapping(address => address) internal _authorizedClaimers;

  // dividend => transfer strategy implementation contract
  // The TransferStrategy contract abstracts the logic regarding
  // the source of the dividend and how to transfer it to the user.
  // mapping(address => ITransferStrategyBase) internal _transferStrategy;
  ITransferStrategyBase internal _transferStrategy;
  // This mapping contains the price oracle per dividend.
  // A price oracle is enforced for integrators to be able to show incentives at
  // the current Aave UI without the need to setup an external price registry
  // At the moment of dividend configuration, the Incentives Controller performs
  // a check to see if the provided dividend oracle contains `latestAnswer`.
  mapping(address => IEACAggregatorProxy) internal _dividendOracle;

  IPoolAddressesProvider internal _addressesProvider;

  modifier onlyAuthorizedClaimers(address claimer, address user) {
    require(_authorizedClaimers[user] == claimer, 'CLAIMER_UNAUTHORIZED');
    _;
  }

  // constructor(address emissionManager) DividendsDistributor(emissionManager) {}

  // /**
  //  * @dev Initialize for DividendsController
  //  * @param emissionManager address of the EmissionManager
  //  **/
  // function initialize(address emissionManager) external initializer {
  //   _setEmissionManager(emissionManager);
  // }

  constructor(
    address emissionManager, 
    address addressesProvider,
    address stakedToken
  ) DividendsDistributor(emissionManager) {
    _setDividendManager(emissionManager);
    _setStakedToken(stakedToken);
    _addressesProvider = IPoolAddressesProvider(addressesProvider);
  }

  function getClaimer(address user) external view override returns (address) {
    return _authorizedClaimers[user];
  }

  function getAddressesProvider() external view returns (address) {
    return address(_addressesProvider);
  }

  function getPool() external view returns (address) {
    return _addressesProvider.getPool();
  }

  // function getRevision() internal pure override returns (uint256) {
  //   return REVISION;
  // }

  function getDividendOracle(address dividend) external view override returns (address) {
    return address(_dividendOracle[dividend]);
  }

  function getTransferStrategy() external view override returns (address) {
    return address(_transferStrategy);
  }

  function configureAssets(DividendsDataTypes.DividendsConfigInput[] memory config)
    external
    override
    onlyDividendManager
  {
    console.log("configureAssets");
    console.log("configureAssets _stakedToken", _stakedToken);
    for (uint256 i = 0; i < config.length; i++) {
      // Get the current Scaled Total Supply of AToken or Debt token
      // config[i].totalSupply = IScaledBalanceToken(config[i].asset).scaledTotalSupply();
      config[i].totalSupply = IScaledBalanceToken(_stakedToken).scaledTotalSupply();
      console.log("configureAssets config[i].totalSupply", config[i].totalSupply);
      // Install TransferStrategy logic at IncentivesController
      // _installTransferStrategy(config[i].dividend, config[i].transferStrategy);

      // Set dividend oracle, enforces input oracle to have latestPrice function
      // _setDividendOracle(config[i].dividend, config[i].dividendOracle);
    }
    _configureAssets(config);
  }

  function setTransferStrategy(address dividend, ITransferStrategyBase transferStrategy)
    external
    onlyDividendManager
  {
    _installTransferStrategy(dividend, transferStrategy);
  }

  function setDividendOracle(address dividend, IEACAggregatorProxy dividendOracle)
    external
    onlyDividendManager
  {
    _setDividendOracle(dividend, dividendOracle);
  }

  function handleMintToTreasury() external override {
    console.log("handleMintToTreasury");
    IPool(_addressesProvider.getPool()).mintToTreasury(
      _dividendAssetsList
    );
    uint256 _dividendDividendsListLength = _dividendDividendsList.length;
    for (uint256 i = 0; i < _dividendDividendsListLength; i++) {
      address dividendAddress = _dividendDividendsList[i];
      DividendsDataTypes.DividendData storage dividendData = _dividendDividends[dividendAddress];
      _updateDividendData(
        dividendAddress,
        dividendData,
        IScaledBalanceToken(_stakedToken).scaledTotalSupply(),
        10**dividendData.decimals
      );
    }
  }

  /// called by staked token contract
  function handleAction(
    address user,
    uint256 totalSupply,
    uint256 userBalance
  ) external override {
    console.log("handleAction dividends");
    require(msg.sender == _stakedToken, 'Error: Sender must be staked token');
    
    IPool(_addressesProvider.getPool()).mintToTreasury(
      _dividendAssetsList
    );
    // _updateData(msg.sender, user, userBalance, totalSupply);
    _updateDataMultiple(
      user,
      userBalance,
      totalSupply
    );
  }

  function claimDividends(
    uint256 amount,
    address to,
    address dividend // aToken
  ) external override returns (uint256) {
    require(to != address(0), 'INVALID_TO_ADDRESS');
    return _claimDividends(amount, msg.sender, msg.sender, to, dividend);
  }

  function claimDividendsOnBehalf(
    uint256 amount,
    address user,
    address to,
    address dividend
  ) external override onlyAuthorizedClaimers(msg.sender, user) returns (uint256) {
    require(user != address(0), 'INVALID_USER_ADDRESS');
    require(to != address(0), 'INVALID_TO_ADDRESS');
    return _claimDividends(amount, msg.sender, user, to, dividend);
  }

  function claimDividendsToSelf(
    uint256 amount,
    address dividend
  ) external override returns (uint256) {
    return _claimDividends(amount, msg.sender, msg.sender, msg.sender, dividend);
  }

  function claimAllDividends(address to)
    external
    override
    returns (address[] memory _dividendDividendsList, uint256[] memory claimedAmounts)
  {
    require(to != address(0), 'INVALID_TO_ADDRESS');
    return _claimAllDividends(msg.sender, msg.sender, to);
  }

  function claimAllDividendsOnBehalf(
    address user,
    address to
  )
    external
    override
    onlyAuthorizedClaimers(msg.sender, user)
    returns (address[] memory _dividendDividendsList, uint256[] memory claimedAmounts)
  {
    require(user != address(0), 'INVALID_USER_ADDRESS');
    require(to != address(0), 'INVALID_TO_ADDRESS');
    return _claimAllDividends(msg.sender, user, to);
  }

  function claimAllDividendsToSelf()
    external
    override
    returns (address[] memory _dividendDividendsList, uint256[] memory claimedAmounts)
  {
    return _claimAllDividends(msg.sender, msg.sender, msg.sender);
  }

  function setClaimer(address user, address caller) external override onlyDividendManager {
    _authorizedClaimers[user] = caller;
    emit ClaimerSet(user, caller);
  }

  /**
   * @dev Claims one type of dividend for a user on behalf, on all the assets of the pool, accumulating the pending dividends.
   * @param amount Amount of dividends to claim
   * @param claimer Address of the claimer who claims dividends on behalf of user
   * @param user Address to check and claim dividends
   * @param to Address that will be receiving the dividends
   * @param dividend Address of the dividend token
   * @return Dividends claimed
   **/
  function _claimDividends(
    uint256 amount,
    address claimer,
    address user,
    address to,
    address dividend
  ) internal returns (uint256) {
    if (amount == 0) {
      return 0;
    }
    uint256 totalDividends;

    (uint256 userBalance, uint256 totalSupply) = IScaledBalanceToken(
      _stakedToken
    ).getScaledUserBalanceAndSupply(user);

    address[] memory _dividendsList = new address[](1);
    // get underlying asset for reserveData to retrieve aToken
    _dividendsList[0] = _dividendDividends[dividend].underlyingAssetAddress;
    IPool(_addressesProvider.getPool()).mintToTreasury(
      _dividendsList
    );

    _updateDataMultiple(user, userBalance, totalSupply);
    if (totalDividends <= amount) {
      _dividendDividends[dividend].usersData[user].accrued = 0;
    } else {
      uint256 difference = totalDividends - amount;
      totalDividends -= difference;
      _dividendDividends[dividend].usersData[user].accrued = difference.toUint128();
    }

    if (totalDividends == 0) {
      return 0;
    }

    _dividendDividends[dividend].lastUpdateBalance -= totalDividends; 

    _transferDividends(to, dividend, totalDividends);
    emit DividendsClaimed(user, dividend, to, claimer, totalDividends);

    return totalDividends;
  }

  /**
   * @dev Claims one type of dividend for a user on behalf, on all the assets of the pool, accumulating the pending dividends.
   * @param claimer Address of the claimer on behalf of user
   * @param user Address to check and claim dividends
   * @param to Address that will be receiving the dividends
   * @return
   *   _dividendDividendsList List of dividend addresses
   *   claimedAmount List of claimed amounts, follows "_dividendDividendsList" items order
   **/
  function _claimAllDividends(
    address claimer,
    address user,
    address to
  ) internal returns (address[] memory _dividendDividendsList, uint256[] memory claimedAmounts) {
    uint256 _dividendDividendsListLength = _dividendDividendsList.length;
    _dividendDividendsList = new address[](_dividendDividendsListLength);
    claimedAmounts = new uint256[](_dividendDividendsListLength);

    (uint256 userBalance, uint256 totalSupply) = IScaledBalanceToken(
      _stakedToken
    ).getScaledUserBalanceAndSupply(user);

    IPool(_addressesProvider.getPool()).mintToTreasury(
      _dividendAssetsList
    );

    _updateDataMultiple(user, userBalance, totalSupply);
    for (uint256 j = 0; j < _dividendDividendsListLength; j++) {
      if (_dividendDividendsList[j] == address(0)) {
        _dividendDividendsList[j] = _dividendDividendsList[j];
      }
      uint256 dividendAmount = _dividendDividends[_dividendDividendsList[j]].usersData[user].accrued;
      if (dividendAmount != 0) {
        claimedAmounts[j] += dividendAmount;
        _dividendDividends[_dividendDividendsList[j]].usersData[user].accrued = 0;
        _dividendDividends[_dividendDividendsList[j]].lastUpdateBalance = _dividendsTransfersStrategy.getBalance(_dividendDividendsList[j]);
      }
    }

    for (uint256 i = 0; i < _dividendDividendsListLength; i++) {
      _transferDividends(to, _dividendDividendsList[i], claimedAmounts[i]);
      emit DividendsClaimed(user, _dividendDividendsList[i], to, claimer, claimedAmounts[i]);
    }
    return (_dividendDividendsList, claimedAmounts);
  }

  /**
   * @dev Function to transfer dividends to the desired account using delegatecall and
   * @param to Account address to send the dividends
   * @param dividend Address of the dividend token
   * @param amount Amount of dividends to transfer
   */
  function _transferDividends(
    address to,
    address dividend,
    uint256 amount
  ) internal {
    ITransferStrategyBase transferStrategy = _transferStrategy;

    bool success = transferStrategy.performTransfer(to, dividend, amount);

    require(success == true, 'TRANSFER_ERROR');
  }

  /**
   * @dev Returns true if `account` is a contract.
   * @param account The address of the account
   * @return bool, true if contract, false otherwise
   */
  function _isContract(address account) internal view returns (bool) {
    // This method relies on extcodesize, which returns 0 for contracts in
    // construction, since the code is only stored at the end of the
    // constructor execution.

    uint256 size;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      size := extcodesize(account)
    }
    return size > 0;
  }

  /**
   * @dev Internal function to call the optional install hook at the TransferStrategy
   * @param dividend The address of the dividend token
   * @param transferStrategy The address of the dividend TransferStrategy
   */
  function _installTransferStrategy(address dividend, ITransferStrategyBase transferStrategy)
    internal
  {
    require(address(transferStrategy) != address(0), 'STRATEGY_CAN_NOT_BE_ZERO');
    require(_isContract(address(transferStrategy)) == true, 'STRATEGY_MUST_BE_CONTRACT');

    _transferStrategy = transferStrategy;
    _setTransferStrategy(address(transferStrategy));

    emit TransferStrategyInstalled(dividend, address(transferStrategy));
  }

  /**
   * @dev Update the Price Oracle of a dividend token. The Price Oracle must follow Chainlink IEACAggregatorProxy interface.
   * @notice The Price Oracle of a dividend is used for displaying correct data about the incentives at the UI frontend.
   * @param dividend The address of the dividend token
   * @param dividendOracle The address of the price oracle
   */

  function _setDividendOracle(address dividend, IEACAggregatorProxy dividendOracle) internal {
    require(dividendOracle.latestAnswer() > 0, 'ORACLE_MUST_RETURN_PRICE');
    _dividendOracle[dividend] = dividendOracle;
    emit DividendOracleUpdated(dividend, address(dividendOracle));
  }
}
