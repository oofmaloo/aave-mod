// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IPoolAddressesProvider} from '../../interfaces/IPoolAddressesProvider.sol';
import {IAggregatorConfigurator} from '../../interfaces/IAggregatorConfigurator.sol';
import {AggregatorLogic} from '../libraries/logic/AggregatorLogic.sol';
import {IPool} from '../../interfaces/IPool.sol';
import {IACLManager} from '../../interfaces/IACLManager.sol';

contract AggregatorConfigurator is IAggregatorConfigurator {

  IPoolAddressesProvider internal _addressesProvider;
  IPool internal _pool;

  /**
   * @dev Only pool admin can call functions marked by this modifier.
   **/
  modifier onlyPoolAdmin() {
    _onlyPoolAdmin();
    _;
  }

  constructor(IPoolAddressesProvider provider) {
    _addressesProvider = provider;
    _pool = IPool(_addressesProvider.getPool());
  }

  function initAggregator(
    IPool pool, 
    address provider,
    address underlyingAsset,
    address[] memory routers
  )
    external
    override
    onlyPoolAdmin
  {
    AggregatorLogic.executeInitAggregator(
      pool,
      provider,
      underlyingAsset,
      routers
    );
  }

  function _onlyPoolAdmin() internal view {
    IACLManager aclManager = IACLManager(_addressesProvider.getACLManager());
    require(aclManager.isPoolAdmin(msg.sender), "Errors.CALLER_NOT_POOL_ADMIN");
  }
}
