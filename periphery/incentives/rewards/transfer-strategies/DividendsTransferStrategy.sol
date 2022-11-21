// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.10;

import {IDividendsTransferStrategy} from '../interfaces/IDividendsTransferStrategy.sol';
import {ITransferStrategyBase} from '../interfaces/ITransferStrategyBase.sol';
import {TransferStrategyBase} from './TransferStrategyBase.sol';
import {IVault} from './Vault.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "hardhat/console.sol";

/**
 * @title DividendsTransferStrategy
 * @notice Transfer strategy that pulls ERC20 rewards from an external account to the user address.
 * The external account could be a smart contract or EOA that must approve to the PullRewardsTransferStrategy contract address.
 * @author Aave
 **/
contract DividendsTransferStrategy is TransferStrategyBase, IDividendsTransferStrategy {
  // using GPv2SafeERC20 for IERC20;

  address internal DIVIDENDS_VAULT;

  constructor(
    address incentivesController,
    address rewardsAdmin,
    address dividendsVault
  ) TransferStrategyBase(incentivesController, rewardsAdmin) {
    DIVIDENDS_VAULT = dividendsVault;
  }

  function performTransfer(
    address to,
    address reward,
    uint256 amount
  )
    external
    override(TransferStrategyBase, ITransferStrategyBase)
    onlyIncentivesController
    returns (bool)
  {
    IVault(DIVIDENDS_VAULT).callApprove(    
      to,
      reward,
      amount
    );
    IERC20(reward).transferFrom(DIVIDENDS_VAULT, to, amount);
    return true;
  }

  function getBalance(address asset) external view override returns (uint256) {
    return IERC20(asset).balanceOf(DIVIDENDS_VAULT);
  }

  function setDividendsVault(address dividendsVault) external {
    DIVIDENDS_VAULT = dividendsVault;
  }

  function getDividendsVault() external view override returns (address) {
    return DIVIDENDS_VAULT;
  }
}