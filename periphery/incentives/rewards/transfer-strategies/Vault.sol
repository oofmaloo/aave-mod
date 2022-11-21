// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

interface IVault {
  function callApprove(    
    address to,
    address asset,
    uint256 amount
  ) external;

}

// make upgadeable in production
contract Vault is IVault {

  address internal vaultAdmin;
  address internal transferStrategy;

  constructor(
    address vaultAdmin_,
    address transferStrategy_
  ) {
    vaultAdmin = vaultAdmin_;
    transferStrategy = transferStrategy_;
  }

  modifier onlyVaultAdmin() {
    require(msg.sender == vaultAdmin, 'ONLY_VAULT_ADMIN');
    _;
  }

  modifier onlyTransferStrategy() {
    require(msg.sender == transferStrategy, 'ONLY_STRATEGY_CONTRACT');
    _;
  }

  function setDividendsVaultAdmin(address vaultAdmin_) external onlyVaultAdmin {
    require(vaultAdmin_ != address(0), 'VAULT_CAN_NOT_BE_ZERO');
    vaultAdmin = vaultAdmin_;
  }

  function setTransferStrategy(address transferStrategy_) external onlyVaultAdmin {
    require(transferStrategy_ != address(0), 'STRATEGY_CAN_NOT_BE_ZERO');
    require(Address.isContract(transferStrategy_) == true, 'STRATEGY_MUST_BE_CONTRACT');
    transferStrategy = transferStrategy_;
  }

  function callApprove(    
    address to,
    address asset,
    uint256 amount
  ) public override onlyTransferStrategy {
    IERC20(asset).approve(transferStrategy, amount);
  }

}