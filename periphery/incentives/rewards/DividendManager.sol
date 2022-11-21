// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IEACAggregatorProxy} from '../misc/interfaces/IEACAggregatorProxy.sol';
// import {IEmissionManager} from './interfaces/IEmissionManager.sol';
import {ITransferStrategyBase} from './interfaces/ITransferStrategyBase.sol';
import {DividendsDataTypes} from './libraries/DividendsDataTypes.sol';
import {IDividendsController} from './interfaces/IDividendsController.sol';
import {IDividendManager} from './interfaces/IDividendManager.sol';
import "hardhat/console.sol";

/**
 * @title DividendManager
 * @author Aave
 * @notice It manages the list of admins of dividend emissions and provides functions to control dividend emissions.
 */
contract DividendManager is Ownable, IDividendManager {
  // dividend => emissionAdmin
  address internal _dividendAdmin;

  IDividendsController internal _dividendsController;

  /**
   * @dev Only emission admin of the given dividend can call functions marked by this modifier.
   **/
  modifier onlyDividendAdmin(address dividend) {
    require(msg.sender == _dividendAdmin, 'ONLY_EMISSION_ADMIN');
    _;
  }

  /**
   * Constructor.
   * @param controller The address of the DividendsController contract
   * @param owner The address of the owner
   */
  constructor(address controller, address owner) {
    _dividendsController = IDividendsController(controller);
    transferOwnership(owner);
  }

  function configureAssets(DividendsDataTypes.DividendsConfigInput[] memory config) external override {
    require(_dividendAdmin == msg.sender, 'ONLY_EMISSION_ADMIN');
    _dividendsController.configureAssets(config);
  }

  function setTransferStrategy(address dividend, ITransferStrategyBase transferStrategy)
    external
    override
    onlyDividendAdmin(dividend)
  {
    _dividendsController.setTransferStrategy(dividend, transferStrategy);
  }

  function setEmissionPerSecond(
    address asset,
    uint88 newEmissionsPerSecond
  ) external override {
    _dividendsController.setEmissionPerSecond(asset, newEmissionsPerSecond);
  }

  function setClaimer(address user, address claimer) external override onlyOwner {
    _dividendsController.setClaimer(user, claimer);
  }

  function setDividendManager(address dividendManager) external override onlyOwner {
    _dividendsController.setDividendManager(dividendManager);
  }

  function setDividendAdmin(address admin) external override onlyOwner {
    address oldAdmin = _dividendAdmin;
    _dividendAdmin = admin;
    emit DividendAdminUpdated(oldAdmin, admin);
  }

  function setDividendsController(address controller) external override onlyOwner {
    _dividendsController = IDividendsController(controller);
  }

  function getDividendsController() external view override returns (IDividendsController) {
    return _dividendsController;
  }

  function getDividendAdmin() external view override returns (address) {
    return _dividendAdmin;
  }
}
