// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.10;

interface IAggregatorStrategyBase {

  /**
  * @dev Emitted on performSupply()
  * @param underlying The address of the underlying asset of the aggregator
  * @param routers The previously updated balance
  * @param amounts The updated balance
  **/
  event Supply(
      address indexed underlying,
      address[] routers,
      uint256[] amounts
  );

  /**
  * @dev Emitted on performWithdraw()
  * @param underlying The address of the underlying asset of the aggregator
  * @param routers The previously updated balance
  * @param amounts The updated balance
  **/
  event Withdraw(
      address indexed underlying,
      address[] routers,
      uint256[] amounts
  );

  /**
  * @dev Emitted on performBorrow()
  * @param underlying The address of the underlying asset of the aggregator
  * @param routers The previously updated balance
  * @param amounts The updated balance
  **/
  event Borrow(
      address indexed underlying,
      address[] routers,
      uint256[] amounts
  );

  /**
  * @dev Emitted on performRepay()
  * @param underlying The address of the underlying asset of the aggregator
  * @param routers The previously updated balance
  * @param amounts The updated balance
  **/
  event Repay(
      address indexed underlying,
      address[] routers,
      uint256[] amounts
  );

  function getAggregator() external view returns (address);

  function getAdmin() external view returns (address);

  function performSupply(
    address asset,
    uint256 amount
  ) external returns (bool);

  function performWithdraw(
    address asset,
    uint256 amount
  ) external returns (bool);

  function performBorrow(
    address router, 
    address asset, 
    uint256 amount
  ) external returns (bool);

  function performRepay(
    address router, 
    address asset, 
    uint256 amount
  ) external returns (bool);

}
