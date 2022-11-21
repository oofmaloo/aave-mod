// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {DividendsDataTypes} from '../libraries/DividendsDataTypes.sol';
import {IDividendsController} from './IDividendsController.sol';
import {ITransferStrategyBase} from './ITransferStrategyBase.sol';

interface IDividendManager {
  /**
   * @dev Emitted when the admin of a dividend emission is updated.
   * @param oldAdmin The address of the old emission admin
   * @param newAdmin The address of the new emission admin
   */
  event DividendAdminUpdated(
    address indexed oldAdmin,
    address indexed newAdmin
  );

  function configureAssets(DividendsDataTypes.DividendsConfigInput[] memory config) external;

  function setTransferStrategy(address dividend, ITransferStrategyBase transferStrategy)
    external;

  function setEmissionPerSecond(
    address asset,
    uint88 newEmissionsPerSecond
  ) external;

  function setClaimer(address user, address claimer) external;

  function setDividendManager(address emissionManager) external;

  function setDividendsController(address controller) external;

  function getDividendsController() external view returns (IDividendsController);

  function setDividendAdmin(address admin) external;

  function getDividendAdmin() external view returns (address);

}
