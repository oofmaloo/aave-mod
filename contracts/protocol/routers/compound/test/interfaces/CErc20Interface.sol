// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

interface CErc20Interface {
    function mint(uint mintAmount) external returns (uint);
    function redeem(uint redeemTokens) external returns (uint);
    function redeemUnderlying(uint redeemAmount) external returns (uint);
    function borrow(uint borrowAmount) external returns (uint);
    function repayBorrow(uint repayAmount) external returns (uint);
    function repayBorrowBehalf(address borrower, uint repayAmount) external returns (uint);
    // function liquidateBorrow(address borrower, uint repayAmount, CTokenInterface cTokenCollateral) external returns (uint);
    // function sweepToken(EIP20NonStandardInterface token) external;

    /*** Added Functions ***/

    function reserveFactorMantissa() external view returns (uint);
    function underlying() external view returns (address);
}
