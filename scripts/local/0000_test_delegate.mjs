import hre from "hardhat";


import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const aaveLendingPool = require("../../artifacts/contracts/mocks/aave/ILendingPool.sol/ILendingPool.json");
const aaveAToken = require("../../artifacts/contracts/mocks/aave/IAToken.sol/IAToken.json");
const aaveProtocolDataProvider = require("../../artifacts/contracts/mocks/aave/IAaveProtocolDataProvider.sol/IAaveProtocolDataProvider.json");


const { ethers } = hre;

export async function testDelegate(
    provider,
    underlyingAddress,
    aave_depositor,
    aave_depositorAddress,
    aavePoolDataProviderAddress,
    aaveLendingPoolAddress
  ) {
  await provider.send("evm_increaseTime", [3600]);
  await provider.send("evm_mine");

  const TestRouter = await ethers.getContractFactory("TestRouter");
  const _testRouter = await TestRouter.deploy(aaveLendingPoolAddress, underlyingAddress);

  const TestRoutee = await ethers.getContractFactory("TestRoutee");
  const _testRoutee = await TestRoutee.deploy(_testRouter.address, underlyingAddress, aaveLendingPoolAddress);


  const mintableERC20 = await ethers.getContractFactory("MintableERC20");
  const _aavePoolDataProvider = await ethers.getContractAt(aaveProtocolDataProvider.abi, aavePoolDataProviderAddress, provider);
  console.log("_aavePoolDataProvider", _aavePoolDataProvider.address);

  const _underlyingErc20 = await mintableERC20.attach(underlyingAddress);
  const underlyingDecimals = await _underlyingErc20.decimals();
  console.log("underlyingDecimals", underlyingDecimals);

  const aaveUnderlyingAddresses = await _aavePoolDataProvider.getReserveTokensAddresses(underlyingAddress)
  const aaveATokenUnderlyingAddress = aaveUnderlyingAddresses[0];
  const _aaveATokenUnderlying = await ethers.getContractAt(aaveAToken.abi, aaveATokenUnderlyingAddress, provider);

  const checkBalance_before = await _aaveATokenUnderlying.balanceOf(aave_depositorAddress);

  console.log("checkBalance_before", ethers.utils.formatUnits(checkBalance_before, underlyingDecimals));

  //         //
  // deposit //
  //         //
  const mintAmount = ethers.utils.parseUnits("10000", underlyingDecimals);
  // await _underlyingErc20.connect(aave_depositor).mint(mintAmount);

  // await _underlyingErc20.connect(aave_depositor).approve(aaveLendingPoolAddress, mintAmount);
  await _underlyingErc20.connect(aave_depositor).approve(_testRoutee.address, mintAmount);

  const allowance = await _underlyingErc20.connect(aave_depositor).allowance(aave_depositorAddress, aaveLendingPoolAddress);
  console.log("allowance", ethers.utils.formatUnits(allowance, underlyingDecimals));
  await provider.send("evm_increaseTime", [3600]);
  await provider.send("evm_mine");


  const aaveUnderlyingDepositTx = await _testRoutee.connect(aave_depositor).deposit(
    underlyingAddress,
    mintAmount,
    aaveLendingPoolAddress
  );


  // const aaveUnderlyingDepositTx = await _testRouter.connect(aave_depositor).deposit(
  //   underlyingAddress,
  //   mintAmount
  // );

  // const aaveUnderlyingDepositTx = await _testRouter.connect(aave_depositor).deposit2(
  //   underlyingAddress,
  //   mintAmount,
  //   aaveLendingPoolAddress
  // );

  // await aaveUnderlyingDepositTx.wait();

  // await provider.send("evm_increaseTime", [5]);
  // await provider.send("evm_mine");

  // const checkRouteeBalance = await _aaveATokenUnderlying.balanceOf(_testRoutee.address);

  // console.log("checkRouteeBalance", ethers.utils.formatUnits(checkRouteeBalance, underlyingDecimals));


  // // await provider.send("evm_increaseTime", [3600]);
  // // await provider.send("evm_mine");

  // const checkBalance = await _aaveATokenUnderlying.balanceOf(aave_depositorAddress);
  // console.log("checkBalance", checkBalance)
  // console.log("checkBalance", ethers.utils.formatUnits(checkBalance, underlyingDecimals));

}