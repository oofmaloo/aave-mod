// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

interface IVaultToken {
  function mint(
    address caller,
    address onBehalfOf,
    uint256 amount
  ) external returns (bool);

  function burn(
    address from,
    address receiverOfUnderlying,
    uint256 amount
  ) external;

  function rescueTokens(
    address token,
    address to,
    uint256 amount
  ) external;
}
