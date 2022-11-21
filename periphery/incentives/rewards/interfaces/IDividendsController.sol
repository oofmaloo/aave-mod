// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

import {DividendsDataTypes} from '../libraries/DividendsDataTypes.sol';
import {ITransferStrategyBase} from './ITransferStrategyBase.sol';
import {IDividendsDistributor} from './IDividendsDistributor.sol';

interface IDividendsController is IDividendsDistributor {

  /**
   * @dev Emitted when a new address is whitelisted as claimer of dividends on behalf of a user
   * @param user The address of the user
   * @param claimer The address of the claimer
   */
  event ClaimerSet(address indexed user, address indexed claimer);

  /**
   * @dev Emitted when dividends are claimed
   * @param user The address of the user dividends has been claimed on behalf of
   * @param dividend The address of the token dividend is claimed
   * @param to The address of the receiver of the dividends
   * @param claimer The address of the claimer
   * @param amount The amount of dividends claimed
   */
  event DividendsClaimed(
    address indexed user,
    address indexed dividend,
    address indexed to,
    address claimer,
    uint256 amount
  );

  /**
   * @dev Emitted when a transfer strategy is installed for the dividend distribution
   * @param dividend The address of the token dividend
   * @param transferStrategy The address of TransferStrategy contract
   */
  event TransferStrategyInstalled(address indexed dividend, address indexed transferStrategy);

  /**
   * @dev Emitted when the dividend oracle is updated
   * @param dividend The address of the token dividend
   * @param dividendOracle The address of oracle
   */
  event DividendOracleUpdated(address indexed dividend, address indexed dividendOracle);


  function getClaimer(address user) external view returns (address);

  function getDividendOracle(address dividend) external view returns (address);

  function getTransferStrategy() external view returns (address);

  function setTransferStrategy(address dividend, ITransferStrategyBase transferStrategy) external;

  function configureAssets(DividendsDataTypes.DividendsConfigInput[] memory config)
    external;


  function handleMintToTreasury() external;

  function handleAction(
    address user,
    uint256 totalSupply,
    uint256 userBalance
  ) external;

  function claimDividends(
    uint256 amount,
    address to,
    address dividend
  ) external returns (uint256);

  function claimDividendsOnBehalf(
    uint256 amount,
    address user,
    address to,
    address dividend
  ) external returns (uint256);

  function claimDividendsToSelf(
    uint256 amount,
    address dividend
  ) external returns (uint256);

  function claimAllDividends(address to)
    external
    returns (address[] memory _dividendDividendsList, uint256[] memory claimedAmounts);

  function claimAllDividendsOnBehalf(
    address user,
    address to
  )
    external
    returns (address[] memory _dividendDividendsList, uint256[] memory claimedAmounts);

  function claimAllDividendsToSelf()
    external
    returns (address[] memory _dividendDividendsList, uint256[] memory claimedAmounts);

  function setClaimer(address user, address caller) external;

}
