// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {StakedToken} from './StakedToken.sol';
// import {IRewardsController} from '../periphery/incentives/rewards/interfaces/IRewardsController.sol';
import {IDividendsController} from '../periphery/incentives/rewards/interfaces/IDividendsController.sol';

/**
 * @title StakedAddi
 * @notice StakedAddi with ADDI token as staked token
 * @author Aave
 **/
contract StakedAddi is StakedToken {
  string internal constant NAME = 'Staked Addi';
  string internal constant SYMBOL = 'stkADDI';
  uint8 internal constant DECIMALS = 18;

  constructor(
    IERC20 stakedToken,
    IDividendsController incentivesController,
    uint256 cooldownSeconds,
    uint256 unstakeWindow
  ) StakedToken(
      stakedToken,
      incentivesController,
      cooldownSeconds,
      unstakeWindow,
      NAME,
      SYMBOL,
      DECIMALS
    )
  {}
}
