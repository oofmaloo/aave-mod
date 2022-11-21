import hre from "hardhat";
import { getDepositAmount } from "./00__deploy.mjs"

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const aaveAToken = require("../../artifacts/contracts/mocks/aave/IAToken.sol/IAToken.json");
const aaveProtocolDataProvider = require("../../artifacts/contracts/mocks/aave/IAaveProtocolDataProvider.sol/IAaveProtocolDataProvider.json");

const { ethers } = hre;

export async function deposit(
    provider, 
    depositor,
    depositorAddress,
    poolDataProviderAddress,
    poolAddress,
    poolLogicAddress,
    supplyLogicAddress,
    borrowLogicAddress,
    flashLoanLogicAddress,
    liquidationLogicAddress,
    eModeLogicAddress,
    underlyingAddress,
    assetAggregatorAddress
  ) {

  const mintableERC20 = await ethers.getContractFactory("MintableERC20");
  const _underlyingErc20 = await mintableERC20.attach(underlyingAddress);
  const underlyingDecimals = await _underlyingErc20.decimals();

  // const _aavePoolDataProvider = await ethers.getContractAt(aaveProtocolDataProvider.abi, aavePoolDataProviderAddress, provider);

  const AaveProtocolDataProvider = await ethers.getContractFactory("AaveProtocolDataProvider");
  const _aaveProtocolDataProvider = await AaveProtocolDataProvider.attach(poolDataProviderAddress);

  // const poolDataProvider = await ethers.getContractFactory("PoolDataProvider");
  // const _poolDataProvider = await poolDataProvider.attach(poolDataProviderAddress);

  console.log("getDepositAmount", getDepositAmount(underlyingAddress));

  const pool = await ethers.getContractFactory("Pool", {
    libraries: {
      PoolLogic: poolLogicAddress,
      SupplyLogic: supplyLogicAddress,
      BorrowLogic: borrowLogicAddress,
      FlashLoanLogic: flashLoanLogicAddress,
      LiquidationLogic: liquidationLogicAddress,
      EModeLogic: eModeLogicAddress,
    },
  });
  const _pool = await pool.attach(poolAddress);
  console.log("_pool", _pool.address);

  // Deposit Underlying
  const mintAmount = getDepositAmount(underlyingAddress);
  await _underlyingErc20.connect(depositor)["mint(uint256)"](mintAmount)

  await _underlyingErc20.connect(depositor).approve(_pool.address, mintAmount);

  const bal = await _underlyingErc20.balanceOf(depositorAddress);
  console.log("bal", bal);

  console.log("before supply");

  await _pool.connect(depositor).supply(
    underlyingAddress,
    mintAmount,
    depositorAddress,
    false,
    0
  );

  console.log("after supply");

  // const avasUnderlyingTokenAddress = await _poolDataProvider.getAvasTokenAddress(underlyingAddress);

  const reserveTokensAddresses = await _aaveProtocolDataProvider.getReserveTokensAddresses(underlyingAddress)
  const avasUnderlyingTokenAddress = reserveTokensAddresses[0];


  const avasToken = await ethers.getContractFactory("AToken");
  const _avasUnderlyingToken = await avasToken.attach(avasUnderlyingTokenAddress);
  const balance = await _avasUnderlyingToken.balanceOf(depositorAddress);
  console.log("depositor _avasUnderlyingToken balance", ethers.utils.formatUnits(balance, underlyingDecimals));

  const aggregator = await ethers.getContractFactory("Aggregator");

  const aggregatorAddress = await _aaveProtocolDataProvider.getAggregatorAddress(underlyingAddress)
  const _aggregator = await aggregator.attach(aggregatorAddress);
  // const weightedRate = await _aggregator.getRouterWeightedInterestRate();
  // console.log("weightedRate", ethers.utils.formatUnits(weightedRate[1], "27"));

  console.log("_aggregator", _aggregator.address);

  // const rates = await _aggregator.getRouterRates();

  // console.log("rates", rates, ethers.utils.formatUnits(rates[0], '27'));

  // increase block
  const evMine = await network.provider.send("evm_mine");
  await ethers.provider.send("evm_increaseTime", [2000]);
  const evMine2 = await network.provider.send("evm_mine");

  const reserveData = await _aaveProtocolDataProvider.getReserveData(underlyingAddress)

  const unbacked = reserveData[0]
  const accruedToTreasuryScaled = reserveData[1]
  const totalAToken = reserveData[2]
  const totalStableDebt = reserveData[3]
  const totalVariableDebt = reserveData[4]
  const liquidityRate = reserveData[5]
  const variableBorrowRate = reserveData[6]
  const stableBorrowRate = reserveData[7]
  const averageStableBorrowRate = reserveData[8]
  const liquidityIndex = reserveData[9]
  const variableBorrowIndex = reserveData[10]
  const lastUpdateTimestamp = reserveData[11]

  // let liquidityRate = await _poolDataProvider.getLiquidityRate(underlyingAddress);
  // let borrowRate = await _poolDataProvider.getVariableBorrowRate(underlyingAddress);
  console.log("depositor liquidityRate", ethers.utils.formatUnits(liquidityRate, '27'));
  console.log("depositor variableBorrowRate", ethers.utils.formatUnits(variableBorrowRate, '27'));
  console.log("depositor stableBorrowRate", ethers.utils.formatUnits(stableBorrowRate, '27'));


  // liquidityRate = await _poolDataProvider.getLiquidityRate("0x5FC8d32690cc91D4c39d9d3abcBD16989F875707");
  // borrowRate = await _poolDataProvider.getVariableBorrowRate("0x5FC8d32690cc91D4c39d9d3abcBD16989F875707");
  // console.log("depositor liquidityRate", ethers.utils.formatUnits(liquidityRate, '27'));
  // console.log("depositor borrowRate", ethers.utils.formatUnits(borrowRate, '27'));

}