import hre from "hardhat";

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const aaveLendingPool = require("../../artifacts/contracts/mocks/aave/ILendingPool.sol/ILendingPool.json");
const aaveAToken = require("../../artifacts/contracts/mocks/aave/IAToken.sol/IAToken.json");
const aaveProtocolDataProvider = require("../../artifacts/contracts/mocks/aave/IAaveProtocolDataProvider.sol/IAaveProtocolDataProvider.json");

const { ethers } = hre;

export async function setupAave(
    provider,
    underlyingAddress,
    daiAddress,
    owner,
    ownerAddress,
    aave_depositor,
    aave_depositorAddress,
    aave_borrower,
    aave_borrowerAddress,
    aaveLendingPoolAddresses,
    aavePoolDataProviderAddresses,
    aaveCount
  ) {

  const MintableERC20 = await ethers.getContractFactory("MintableERC20");

  // for (let i = 0; i < aaveLendingPoolAddresses.length; i++) {
  for (let i = 0; i < aaveLendingPoolAddresses.length && i < aaveCount; i++) {

    let _aavePoolDataProvider = await ethers.getContractAt(aaveProtocolDataProvider.abi, aavePoolDataProviderAddresses[i], provider);

    let _underlyingErc20 = await MintableERC20.attach(underlyingAddress);
    let underlyingDecimals = await _underlyingErc20.decimals();

    let aaveUnderlyingAddresses = await _aavePoolDataProvider.getReserveTokensAddresses(underlyingAddress)
    let aaveATokenUnderlyingAddress = aaveUnderlyingAddresses[0];
    let _aaveATokenUnderlying = await ethers.getContractAt(aaveAToken.abi, aaveATokenUnderlyingAddress, provider);

    let aaveVariableDebtTokenUnderlyingAddress = aaveUnderlyingAddresses[2];
    let _aaveVariableDebtUnderlying = await ethers.getContractAt(aaveAToken.abi, aaveVariableDebtTokenUnderlyingAddress, provider);

    let aaveUnderlyingDepositReserveData = await _aavePoolDataProvider.getReserveData(underlyingAddress)
    let _aaveLendingPool = await ethers.getContractAt(aaveLendingPool.abi, aaveLendingPoolAddresses[i], provider);

    //         //
    // deposit //
    //         //
    let aaveMintAmount = ethers.utils.parseUnits("10000000", underlyingDecimals);

    await _underlyingErc20.connect(aave_depositor)["mint(uint256)"](aaveMintAmount)

    let aave_depositorBalance = await _underlyingErc20.balanceOf(aave_depositorAddress)

    await _underlyingErc20.connect(aave_depositor).approve(_aaveLendingPool.address, aaveMintAmount);
    let aave_depositorAllowance = await _underlyingErc20.connect(aave_depositor).allowance(aave_depositorAddress, _aaveLendingPool.address);
    let aaveUnderlyingDepositTx = await _aaveLendingPool.connect(aave_depositor).deposit(
      underlyingAddress,
      aaveMintAmount,
      aave_depositorAddress,
      "0"
    );

    await aaveUnderlyingDepositTx.wait();
    

    let aaveDaiAddresses = await _aavePoolDataProvider.getReserveTokensAddresses(daiAddress)
    let aaveATokenDaiAddress = aaveDaiAddresses[0];
    let _aaveATokenDai = await ethers.getContractAt(aaveAToken.abi, aaveATokenDaiAddress, provider);

    let _dai = await MintableERC20.attach(daiAddress);
    let aaveDaiMintAmount = ethers.utils.parseUnits("10000000", "18");
    await _dai.connect(aave_borrower)["mint(uint256)"](aaveDaiMintAmount)
    await _dai.connect(aave_borrower).approve(_aaveLendingPool.address, aaveDaiMintAmount);

    await _aaveLendingPool.connect(aave_borrower).deposit(
      daiAddress,
      aaveDaiMintAmount,
      aave_borrowerAddress,
      "0"
    );

    // borrow 70%
    let aaveUnderlyingBorrowAmount = ethers.utils.parseUnits("9100000", underlyingDecimals);

    await _aaveLendingPool.connect(aave_borrower).borrow(
      underlyingAddress,
      aaveUnderlyingBorrowAmount,
      "2",
      "0",
      aave_borrowerAddress
    );

    let daiLiquidity = await _dai.balanceOf(_aaveATokenDai.address)

    let borrowAmount = Number(Number(ethers.utils.formatUnits(daiLiquidity, "18")) * .1).toFixed(0)


    let aaveDaiBorrowAmount = ethers.utils.parseUnits(borrowAmount.toString(), "18");

    await _aaveLendingPool.connect(aave_borrower).borrow(
      daiAddress,
      aaveDaiBorrowAmount,
      "2",
      "0",
      aave_borrowerAddress
    );
    let aaveDaiDepositReserveData_after = await _aavePoolDataProvider.getReserveData(daiAddress)

    let aavaATokenDaiDeposit_liquidityRate_after = aaveDaiDepositReserveData_after[3];
  }
}