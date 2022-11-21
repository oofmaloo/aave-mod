import hre from "hardhat";

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const aaveAToken = require("../../artifacts/contracts/mocks/aave/IAToken.sol/IAToken.json");
const aaveProtocolDataProvider = require("../../artifacts/contracts/mocks/aave/IAaveProtocolDataProvider.sol/IAaveProtocolDataProvider.json");

const { ethers } = hre;

export async function repay(
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
    underlyingAddress
  ) {


  const mintableERC20 = await ethers.getContractFactory("MintableERC20");
  const _underlyingErc20 = await mintableERC20.attach(underlyingAddress);
  const underlyingDecimals = await _underlyingErc20.decimals();
  // const poolDataProvider = await ethers.getContractFactory("PoolDataProvider");
  // const _poolDataProvider = await poolDataProvider.attach(poolDataProviderAddress);

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
  const repayAmount = ethers.utils.parseUnits("40", underlyingDecimals);

  await _underlyingErc20.connect(borrower).approve(_pool.address, repayAmount);
  await _underlyingErc20.connect(borrower)["mint(uint256)"](repayAmount)
  console.log("b4 repay")
  await _pool.connect(borrower).repay(
    underlyingAddress,
    repayAmount,
    2,
    borrowerAddress
  )
  console.log("after repay")
  // const reserveTokenAddresses = await _poolDataProvider.getReserveTokensAddresses(underlyingAddress);
  // const variableDebtTokenAddress = reserveTokenAddresses[1];

  // const variableDebtToken = await ethers.getContractFactory("VariableDebtToken");
  // const _variableDebtToken = await variableDebtToken.attach(variableDebtTokenAddress);
  // const balance = await _variableDebtToken.balanceOf(borrowerAddress);
  // console.log("borrower variable debt balance", ethers.utils.formatUnits(balance, underlyingDecimals));

  // const variableBorrowRate = await _poolDataProvider.getVariableBorrowRate(underlyingAddress);
  // console.log("variableBorrowRate", ethers.utils.formatUnits(variableBorrowRate, "27"));


}