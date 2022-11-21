// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {ERC20} from '../../dependencies/openzeppelin/contracts/ERC20.sol';
// import {ERC20} from '@openzeppelin/contracts/tokens/ERC20/ERC20.sol';
import {Errors} from '../libraries/helpers/Errors.sol';
import {SafeCast} from '../../dependencies/openzeppelin/contracts/SafeCast.sol';
import {IACLManager} from '../../interfaces/IACLManager.sol';
import {IPool} from '../../interfaces/IPool.sol';
import {IPoolAddressesProvider} from '../../interfaces/IPoolAddressesProvider.sol';
import {IERC20} from '../../dependencies/openzeppelin/contracts/IERC20.sol';
import {GPv2SafeERC20} from '../../dependencies/gnosis/contracts/GPv2SafeERC20.sol';
import {IVaultToken} from '../../interfaces/IVaultToken.sol';
import {MintableIncentivizedERC20} from './base/MintableIncentivizedERC20.sol';
import "hardhat/console.sol";

// contract VaultToken is ERC20, IVaultToken {
contract VaultToken is MintableIncentivizedERC20, IVaultToken {
  using GPv2SafeERC20 for IERC20;
  using SafeCast for uint256;

  // IPoolAddressesProvider internal immutable _addressesProvider;
  // IPool public immutable POOL;

  // constructor(
  //   IPool pool,
  //   address underlyingAsset,
  //   uint8 vaultTokenDecimals,
  //   string memory vaultTokenName,
  //   string memory vaultTokenSymbol
  // ) ERC20(vaultTokenName, vaultTokenSymbol) {
  //   POOL = pool;
  //   _addressesProvider = pool.ADDRESSES_PROVIDER();
  //   _decimals = vaultTokenDecimals;
  // }

  constructor(
    IPool pool,
    address underlyingAsset,
    uint8 vaultTokenDecimals,
    string memory vaultTokenName,
    string memory vaultTokenSymbol
  ) MintableIncentivizedERC20(pool, vaultTokenName, vaultTokenSymbol, vaultTokenDecimals) {
    // POOL = pool;
    // _addressesProvider = pool.ADDRESSES_PROVIDER();
    // _decimals = vaultTokenDecimals;
    _underlyingAsset = underlyingAsset;
  }



  address internal _underlyingAsset;
  // uint8 private _decimals;

  // modifier onlyPoolAdmin() {
  //   IACLManager aclManager = IACLManager(_addressesProvider.getACLManager());
  //   require(aclManager.isPoolAdmin(msg.sender), Errors.CALLER_NOT_POOL_ADMIN);
  //   _;
  // }

  // modifier onlyPool() {
  //   require(_msgSender() == address(POOL), Errors.CALLER_MUST_BE_POOL);
  //   _;
  // }

  // function decimals() public view override virtual returns (uint8) {
  //   return _decimals;
  // }

  function mint(
    address caller,
    address onBehalfOf,
    uint256 amount
  ) external virtual override onlyPool returns (bool) {
    uint256 previousBalance = super.balanceOf(onBehalfOf);
    _mint(onBehalfOf, amount.toUint128());
    return previousBalance == 0;
  }

  function burn(
    address from,
    address receiverOfUnderlying,
    uint256 amount
  ) external virtual override onlyPool {
    console.log("vault burn 1");
    _burn(from, amount.toUint128());
    console.log("vault burn 2");
    IERC20(_underlyingAsset).safeTransfer(receiverOfUnderlying, amount);
    console.log("vault burn 3");
  }

  function rescueTokens(
    address token,
    address to,
    uint256 amount
  ) external override onlyPoolAdmin {
    require(token != _underlyingAsset, Errors.UNDERLYING_CANNOT_BE_RESCUED);
    IERC20(token).safeTransfer(to, amount);
  }


  /**
   * @notice Overrides the parent _transfer to force validated transfer() and transferFrom()
   * @param from The source address
   * @param to The destination address
   * @param amount The amount getting transferred
   **/
  function _transfer(
    address from,
    address to,
    uint128 amount
  ) internal override {
    _transfer(from, to, amount, true);
  }

  /**
   * @notice Transfers the aTokens between two users. Validates the transfer
   * (ie checks for valid HF after the transfer) if required
   * @param from The source address
   * @param to The destination address
   * @param amount The amount getting transferred
   * @param validate True if the transfer needs to be validated, false otherwise
   **/
  function _transfer(
    address from,
    address to,
    uint256 amount,
    bool validate
  ) internal {
    address underlyingAsset = _underlyingAsset;

    uint256 fromBalanceBefore = super.balanceOf(from);
    uint256 toBalanceBefore = super.balanceOf(to);

    super._transfer(from, to, amount.toUint128());

    if (validate) {
      POOL.finalizeTransfer(underlyingAsset, from, to, amount, fromBalanceBefore, toBalanceBefore);
    }

    // emit BalanceTransfer(from, to, amount, index);
  }

}
