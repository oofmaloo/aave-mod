import hre from "hardhat";
import { getBorrowAmount } from "./00__deploy.mjs"

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const aaveAToken = require("../../artifacts/contracts/mocks/aave/IAToken.sol/IAToken.json");
const aaveProtocolDataProvider = require("../../artifacts/contracts/mocks/aave/IAaveProtocolDataProvider.sol/IAaveProtocolDataProvider.json");

const { ethers } = hre;

export async function borrow(
    provider, 
    borrower,
    borrowerAddress,
    poolDataProviderAddress,
    poolAddress,
    poolLogicAddress,
    supplyLogicAddress,
    borrowLogicAddress,
    flashLoanLogicAddress,
    liquidationLogicAddress,
    eModeLogicAddress,
    underlyingAddress,
    aaveLendingPoolAddress,
    aavePoolDataProviderAddress,
    assetAggregatorAddress
  ) {

  const mintableERC20 = await ethers.getContractFactory("MintableERC20");
  const _underlyingErc20 = await mintableERC20.attach(underlyingAddress);
  const underlyingDecimals = await _underlyingErc20.decimals();
  // const poolDataProvider = await ethers.getContractFactory("PoolDataProvider");
  // const _poolDataProvider = await poolDataProvider.attach(poolDataProviderAddress);
  const AaveProtocolDataProvider = await ethers.getContractFactory("AaveProtocolDataProvider");
  const _aaveProtocolDataProvider = await AaveProtocolDataProvider.attach(poolDataProviderAddress);

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

  // Borrow Underlying
  const borrowAmount = getBorrowAmount(underlyingAddress);

  // address asset,
  // uint256 amount,
  // uint256 interestRateMode,
  // uint16 referralCode,
  // address onBehalfOf
  const borrowerUnderlyingBalance_before = await _underlyingErc20.balanceOf(borrowerAddress);
  const borrowTx = await _pool.connect(borrower).borrow(
    underlyingAddress,
    borrowAmount,
    2,
    0,
    borrowerAddress
  );
  console.log(" after borrow ");
  await borrowTx.wait();
  // console.log(" borrowTx ", borrowTx);

  const borrowerUnderlyingBalance_after = await _underlyingErc20.balanceOf(borrowerAddress);
  console.log("borrower borrowerUnderlyingBalance_after", ethers.utils.formatUnits(borrowerUnderlyingBalance_after, underlyingDecimals));

  const borrowerDebt = borrowerUnderlyingBalance_after - borrowerUnderlyingBalance_before
  console.log("borrower underlying debt borrowed", ethers.utils.formatUnits(borrowerDebt, underlyingDecimals));


  let reserveData = await _aaveProtocolDataProvider.getReserveData(underlyingAddress);
  console.log("reserveData", reserveData);

  const reserveTokenAddresses = await _aaveProtocolDataProvider.getReserveTokensAddresses(underlyingAddress);
  const variableDebtTokenAddress = reserveTokenAddresses[1];

  const variableDebtToken = await ethers.getContractFactory("VariableDebtToken");
  const _variableDebtToken = await variableDebtToken.attach(variableDebtTokenAddress);
  const balance = await _variableDebtToken.balanceOf(borrowerAddress);
  console.log("borrower debt balance", ethers.utils.formatUnits(balance, underlyingDecimals));

  reserveData = await _aaveProtocolDataProvider.getReserveData(underlyingAddress)

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

}