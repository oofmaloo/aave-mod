// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

import {IStakedToken} from './interfaces/IStakedToken.sol';
// import {IRewardsController} from '../periphery/incentives/rewards/interfaces/IRewardsController.sol';
import {IDividendsController} from '../periphery/incentives/rewards/interfaces/IDividendsController.sol';
import "hardhat/console.sol";

/**
 * @title StakedToken
 * @notice Inspired by Aave Staked Token and Open Zeppelin library
 * @author Aave
 **/
contract StakedToken is ERC20, ERC20Permit, ERC20Votes, Ownable, IStakedToken {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  mapping(address => bool) internal _stakedAdmins;

  /**
   * @dev Only emission admin of the given reward can call functions marked by this modifier.
   **/
  modifier isStakedAdmin() {
    require(_stakedAdmins[msg.sender], 'ONLY_STAKED_ADMINS');
    _;
  }

  uint8 private _decimals;

  // responsible for giving stakers protocol dividends
  IDividendsController internal _rewardsController;

  IERC20 public immutable STAKED_TOKEN;
  uint256 public immutable COOLDOWN_SECONDS;

  /// @notice Seconds available to redeem once the cooldown period is fullfilled
  uint256 public immutable UNSTAKE_WINDOW;

  mapping(address => uint256) public stakersCooldowns;

  event Staked(address indexed from, address indexed onBehalfOf, uint256 amount);
  event Redeem(address indexed from, address indexed to, uint256 amount);

  event Cooldown(address indexed user);

  constructor(
    IERC20 stakedToken,
    IDividendsController rewardsController,
    uint256 cooldownSeconds,
    uint256 unstakeWindow,
    string memory name,
    string memory symbol,
    uint8 decimals
  ) ERC20(name, symbol) ERC20Permit(name) {
    STAKED_TOKEN = stakedToken;
    COOLDOWN_SECONDS = cooldownSeconds;
    UNSTAKE_WINDOW = unstakeWindow;
    _decimals = decimals;
    _rewardsController = rewardsController;
  }

  function stake(address onBehalfOf, uint256 amount) external override {
    require(amount != 0, 'INVALID_ZERO_AMOUNT');
    uint256 balanceOfUser = balanceOf(onBehalfOf);

    stakersCooldowns[onBehalfOf] = getNextCooldownTimestamp(0, amount, onBehalfOf, balanceOfUser);

    _mint(onBehalfOf, amount);
    IERC20(STAKED_TOKEN).safeTransferFrom(msg.sender, address(this), amount);

    emit Staked(msg.sender, onBehalfOf, amount);
  }

  /**
   * @dev Redeems staked tokens, and stop earning rewards
   * @param to Address to redeem to
   * @param amount Amount to redeem
   **/
  function redeem(address to, uint256 amount) external override {
    require(amount != 0, 'INVALID_ZERO_AMOUNT');
    //solium-disable-next-line
    uint256 cooldownStartTimestamp = stakersCooldowns[msg.sender];
    require(
      block.timestamp > cooldownStartTimestamp.add(COOLDOWN_SECONDS),
      'INSUFFICIENT_COOLDOWN'
    );
    require(
      block.timestamp.sub(cooldownStartTimestamp.add(COOLDOWN_SECONDS)) <= UNSTAKE_WINDOW,
      'UNSTAKE_WINDOW_FINISHED'
    );
    uint256 balanceOfMessageSender = balanceOf(msg.sender);

    uint256 amountToRedeem = (amount > balanceOfMessageSender) ? balanceOfMessageSender : amount;

    _burn(msg.sender, amountToRedeem);

    if (balanceOfMessageSender.sub(amountToRedeem) == 0) {
      stakersCooldowns[msg.sender] = 0;
    }

    IERC20(STAKED_TOKEN).safeTransfer(to, amountToRedeem);

    emit Redeem(msg.sender, to, amountToRedeem);
  }

  /**
   * @dev Activates the cooldown period to unstake
   * - It can't be called if the user is not staking
   **/
  function cooldown() external override {
    require(balanceOf(msg.sender) != 0, 'INVALID_BALANCE_ON_COOLDOWN');
    //solium-disable-next-line
    stakersCooldowns[msg.sender] = block.timestamp;

    emit Cooldown(msg.sender);
  }

  /**
   * @dev Internal ERC20 _transfer of the tokenized staked tokens
   * @param from Address to transfer from
   * @param to Address to transfer to
   * @param amount Amount to transfer
   **/
  function _transfer(
    address from,
    address to,
    uint256 amount
  ) internal override {
    uint256 balanceOfFrom = balanceOf(from);
    // Sender

    // Recipient
    uint256 balanceOfTo;
    if (from != to) {
      balanceOfTo = balanceOf(to);

      uint256 previousSenderCooldown = stakersCooldowns[from];
      stakersCooldowns[to] = getNextCooldownTimestamp(
        previousSenderCooldown,
        amount,
        to,
        balanceOfTo
      );
      // if cooldown was set and whole balance of sender was transferred - clear cooldown
      if (balanceOfFrom == amount && previousSenderCooldown != 0) {
        stakersCooldowns[from] = 0;
      }
    }

    // added?
    IDividendsController rewardsControllerLocal = _rewardsController;
    if (address(rewardsControllerLocal) != address(0)) {
      uint256 currentTotalSupply = totalSupply();
      rewardsControllerLocal.handleAction(from, currentTotalSupply, balanceOfFrom);
      if (from != to) {
        rewardsControllerLocal.handleAction(to, currentTotalSupply, balanceOfTo);
      }
    }

    super._transfer(from, to, amount);
  }

  /**
   * @dev Calculates the how is gonna be a new cooldown timestamp depending on the sender/receiver situation
   *  - If the timestamp of the sender is "better" or the timestamp of the recipient is 0, we take the one of the recipient
   *  - Weighted average of from/to cooldown timestamps if:
   *    # The sender doesn't have the cooldown activated (timestamp 0).
   *    # The sender timestamp is expired
   *    # The sender has a "worse" timestamp
   *  - If the receiver's cooldown timestamp expired (too old), the next is 0
   * @param fromCooldownTimestamp Cooldown timestamp of the sender
   * @param amountToReceive Amount
   * @param toAddress Address of the recipient
   * @param toBalance Current balance of the receiver
   * @return The new cooldown timestamp
   **/
  function getNextCooldownTimestamp(
    uint256 fromCooldownTimestamp,
    uint256 amountToReceive,
    address toAddress,
    uint256 toBalance
  ) public view returns (uint256) {
    uint256 toCooldownTimestamp = stakersCooldowns[toAddress];
    if (toCooldownTimestamp == 0) {
      return 0;
    }

    uint256 minimalValidCooldownTimestamp =
      block.timestamp.sub(COOLDOWN_SECONDS).sub(UNSTAKE_WINDOW);

    if (minimalValidCooldownTimestamp > toCooldownTimestamp) {
      toCooldownTimestamp = 0;
    } else {
      uint256 fromCooldownTimestamp =
        (minimalValidCooldownTimestamp > fromCooldownTimestamp)
          ? block.timestamp
          : fromCooldownTimestamp;

      if (fromCooldownTimestamp < toCooldownTimestamp) {
        return toCooldownTimestamp;
      } else {
        toCooldownTimestamp = (
          amountToReceive.mul(fromCooldownTimestamp).add(toBalance.mul(toCooldownTimestamp))
        )
          .div(amountToReceive.add(toBalance));
      }
    }

    return toCooldownTimestamp;
  }

  /**
   * @notice Returns the address of the Incentives Controller contract
   * @return The address of the Incentives Controller
   **/
  function getRewardsController() external view returns (IDividendsController) {
    return _rewardsController;
  }

  /**
   * @notice Sets a new Incentives Controller
   * @param controller the new Incentives controller
   **/
  function setRewardsController(IDividendsController controller) external isStakedAdmin {
    _rewardsController = controller;
  }

  function setStakedAdmin(address account) external onlyOwner {
    _stakedAdmins[account] = true;
  }

  function removeStakedAdmin(address account) external onlyOwner {
    _stakedAdmins[account] = false;
  }

  /// override for rewards dividends
  function _mint(address account, uint256 amount) internal virtual override(ERC20, ERC20Votes) {
    uint256 oldTotalSupply = totalSupply();

    uint256 oldAccountBalance = balanceOf(account);

    IDividendsController rewardsControllerLocal = _rewardsController;
    if (address(rewardsControllerLocal) != address(0)) {
      rewardsControllerLocal.handleAction(account, oldTotalSupply, oldAccountBalance);
    }
    super._mint(account, amount);
  }

  /// override for rewards dividends
  function _burn(address account, uint256 amount) internal virtual override(ERC20, ERC20Votes) {
    uint256 oldTotalSupply = totalSupply();

    uint256 oldAccountBalance = balanceOf(account);

    IDividendsController rewardsControllerLocal = _rewardsController;

    if (address(rewardsControllerLocal) != address(0)) {
      rewardsControllerLocal.handleAction(account, oldTotalSupply, oldAccountBalance);
    }
    super._burn(account, amount);
  }

  function scaledTotalSupply() public view returns (uint256) {
    return totalSupply();
  }

  function getScaledUserBalanceAndSupply(address user) public view override returns (uint256, uint256) {
    return (balanceOf(user), totalSupply());
  }

  function _afterTokenTransfer(address from, address to, uint256 amount)
      internal
      override(ERC20, ERC20Votes)
  {
      super._afterTokenTransfer(from, to, amount);
  }

}
