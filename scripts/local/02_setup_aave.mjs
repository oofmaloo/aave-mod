import hre from "hardhat";

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const aaveLendingPool = require("../../artifacts/contracts/mocks/aave/ILendingPool.sol/ILendingPool.json");
const aaveAToken = require("../../artifacts/contracts/mocks/aave/IAToken.sol/IAToken.json");
const aaveProtocolDataProvider = require("../../artifacts/contracts/mocks/aave/IAaveProtocolDataProvider.sol/IAaveProtocolDataProvider.json");

const { ethers } = hre;

// export async function setupAave(
//     provider,
//     underlyingAddress,
//     wethAddress,
//     owner,
//     ownerAddress,
//     aave_depositor,
//     aave_depositorAddress,
//     aave_borrower,
//     aave_borrowerAddress,
//     aavePoolDataProviderAddress,
//     aaveLendingPoolAddress
//   ) {

//   const mintableERC20 = await ethers.getContractFactory("MintableERC20");
//   const _aavePoolDataProvider = await ethers.getContractAt(aaveProtocolDataProvider.abi, aavePoolDataProviderAddress, provider);

//   const _underlyingErc20 = await mintableERC20.attach(underlyingAddress);
//   const underlyingDecimals = await _underlyingErc20.decimals();

//   const aaveUnderlyingAddresses = await _aavePoolDataProvider.getReserveTokensAddresses(underlyingAddress)
//   const aaveATokenUnderlyingAddress = aaveUnderlyingAddresses[0];
//   const _aaveATokenUnderlying = await ethers.getContractAt(aaveAToken.abi, aaveATokenUnderlyingAddress, provider);

//   const aaveVariableDebtTokenUnderlyingAddress = aaveUnderlyingAddresses[2];
//   const _aaveVariableDebtUnderlying = await ethers.getContractAt(aaveAToken.abi, aaveVariableDebtTokenUnderlyingAddress, provider);

//   const aaveUnderlyingDepositReserveData = await _aavePoolDataProvider.getReserveData(underlyingAddress)
//   // const aavaATokenUnderlyingDeposit_availableLiquidity = aaveUnderlyingDepositReserveData[0];
//   // const aavaATokenUnderlyingDeposit_totalStableDebt = aaveUnderlyingDepositReserveData[1];
//   // const aavaATokenUnderlyingDeposit_totalVariableDebt = aaveUnderlyingDepositReserveData[2];
//   // const aavaATokenUnderlyingDeposit_liquidityRate = aaveUnderlyingDepositReserveData[3];
//   // const aavaATokenUnderlyingDeposit_variableBorrowRate = aaveUnderlyingDepositReserveData[4];
//   // const aavaATokenUnderlyingDeposit_aaveLendingPoolnderlying_stableBorrowRate = aaveUnderlyingDepositReserveData[5];
//   // const aavaATokenUnderlyingDeposit_averageStableBorrowRate = aaveUnderlyingDepositReserveData[6];
//   // const aavaATokenUnderlyingDeposit_liquidityIndex = aaveUnderlyingDepositReserveData[7];
//   // const aavaATokenUnderlyingDeposit_variableBorrowIndex = aaveUnderlyingDepositReserveData[8];
//   // const aavaATokenUnderlyingDeposit_lastUpdateTimestamp = aaveUnderlyingDepositReserveData[9];

//   // create interest rates on aave v2
//   const _aaveLendingPool = await ethers.getContractAt(aaveLendingPool.abi, aaveLendingPoolAddress, provider);

//   //         //
//   // deposit //
//   //         //
//   const aaveMintAmount = ethers.utils.parseUnits("10000000", underlyingDecimals);

//   await _underlyingErc20.connect(aave_depositor)["mint(uint256)"](aaveMintAmount)

//   const aave_depositorBalance = await _underlyingErc20.balanceOf(aave_depositorAddress)

//   await _underlyingErc20.connect(aave_depositor).approve(_aaveLendingPool.address, aaveMintAmount);
//   const aave_depositorAllowance = await _underlyingErc20.connect(aave_depositor).allowance(aave_depositorAddress, _aaveLendingPool.address);
//   const aaveUnderlyingDepositTx = await _aaveLendingPool.connect(aave_depositor).deposit(
//     underlyingAddress,
//     aaveMintAmount,
//     aave_depositorAddress,
//     "0"
//   );

//   await aaveUnderlyingDepositTx.wait();

//   // await provider.send("evm_increaseTime", [3600]);
//   // await provider.send("evm_mine");

  
//   // borrow
//   //    deposit and borrow
//   //

//   const aaveWethAddresses = await _aavePoolDataProvider.getReserveTokensAddresses(wethAddress)
//   const aaveATokenWethAddress = aaveWethAddresses[0];
//   const _aaveATokenWeth = await ethers.getContractAt(aaveAToken.abi, aaveATokenWethAddress, provider);

//   // const aave_borrowerATokenWethBalance = await _aaveATokenWeth.balanceOf(aave_borrowerAddress)
//   // const aave_depositorATokenBalance = await _aaveATokenUnderlying.balanceOf(aave_depositorAddress)
//   // const aaveUnderlyingReserveData = await _aavePoolDataProvider.getReserveData(underlyingAddress)

//   const _weth = await mintableERC20.attach(wethAddress);
//   const aaveWethMintAmount = ethers.utils.parseUnits("10000000", "18");
//   await _weth.connect(aave_borrower)["mint(uint256)"](aaveWethMintAmount)

//   // const aave_borrowerBalance = await _weth.balanceOf(aave_borrowerAddress)
//   await _weth.connect(aave_borrower).approve(_aaveLendingPool.address, aaveWethMintAmount);

//   await _aaveLendingPool.connect(aave_borrower).deposit(
//     wethAddress,
//     aaveWethMintAmount,
//     aave_borrowerAddress,
//     "0"
//   );
//   // console.log("after deposit");


//   await provider.send("evm_increaseTime", [3600]);
//   await provider.send("evm_mine");

//   // const aave_borrowerATokenWethBalance_after = await _aaveATokenWeth.balanceOf(aave_borrowerAddress)
//   // const aaveBorrowWethData = await _aavePoolDataProvider.getUserReserveData(wethAddress, aave_borrowerAddress)

//   // borrow 70%
//   const aaveUnderlyingBorrowAmount = ethers.utils.parseUnits("9100000", underlyingDecimals);

//   await _aaveLendingPool.connect(aave_borrower).borrow(
//     underlyingAddress,
//     aaveUnderlyingBorrowAmount,
//     "2",
//     "0",
//     aave_borrowerAddress
//   );

//   // const borrowUnderlyingDebtBalance = await _aaveVariableDebtUnderlying.balanceOf(aave_borrowerAddress);
//   // const aaveUnderlyingDepositReserveData_after = await _aavePoolDataProvider.getReserveData(underlyingAddress)
//   // const aavaATokenUnderlyingDeposit_liquidityRate_after = aaveUnderlyingDepositReserveData[3];

//   let wethLiquidity = await _weth.balanceOf(_aaveATokenWeth.address)

//   const borrowAmount = Number(Number(ethers.utils.formatUnits(wethLiquidity, "18")) * .1).toFixed(0)


//   const aaveWethBorrowAmount = ethers.utils.parseUnits(borrowAmount.toString(), "18");

//   await _aaveLendingPool.connect(aave_borrower).borrow(
//     wethAddress,
//     aaveWethBorrowAmount,
//     "2",
//     "0",
//     aave_borrowerAddress
//   );
//   const aaveWethDepositReserveData_after = await _aavePoolDataProvider.getReserveData(wethAddress)

//   const aavaATokenWethDeposit_liquidityRate_after = aaveWethDepositReserveData_after[3];

//   console.log("aavaATokenWethDeposit_liquidityRate_after", ethers.utils.formatUnits(aavaATokenWethDeposit_liquidityRate_after, "27"));

// }

export async function setupAave(
    provider,
    underlyingAddress,
    wethAddress,
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
    

    let aaveWethAddresses = await _aavePoolDataProvider.getReserveTokensAddresses(wethAddress)
    let aaveATokenWethAddress = aaveWethAddresses[0];
    let _aaveATokenWeth = await ethers.getContractAt(aaveAToken.abi, aaveATokenWethAddress, provider);

    let _weth = await MintableERC20.attach(wethAddress);
    let aaveWethMintAmount = ethers.utils.parseUnits("10000000", "18");
    await _weth.connect(aave_borrower)["mint(uint256)"](aaveWethMintAmount)
    await _weth.connect(aave_borrower).approve(_aaveLendingPool.address, aaveWethMintAmount);

    await _aaveLendingPool.connect(aave_borrower).deposit(
      wethAddress,
      aaveWethMintAmount,
      aave_borrowerAddress,
      "0"
    );


    await provider.send("evm_increaseTime", [3600]);
    await provider.send("evm_mine");

    // borrow 70%
    let aaveUnderlyingBorrowAmount = ethers.utils.parseUnits("9100000", underlyingDecimals);

    await _aaveLendingPool.connect(aave_borrower).borrow(
      underlyingAddress,
      aaveUnderlyingBorrowAmount,
      "2",
      "0",
      aave_borrowerAddress
    );

    let wethLiquidity = await _weth.balanceOf(_aaveATokenWeth.address)

    let borrowAmount = Number(Number(ethers.utils.formatUnits(wethLiquidity, "18")) * .1).toFixed(0)


    let aaveWethBorrowAmount = ethers.utils.parseUnits(borrowAmount.toString(), "18");

    await _aaveLendingPool.connect(aave_borrower).borrow(
      wethAddress,
      aaveWethBorrowAmount,
      "2",
      "0",
      aave_borrowerAddress
    );
    let aaveWethDepositReserveData_after = await _aavePoolDataProvider.getReserveData(wethAddress)

    let aavaATokenWethDeposit_liquidityRate_after = aaveWethDepositReserveData_after[3];

    await provider.send("evm_mine");
    await provider.send("evm_increaseTime", [100]);
    await provider.send("evm_mine");

  }
}