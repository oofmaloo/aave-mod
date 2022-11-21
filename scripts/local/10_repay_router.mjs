import hre from "hardhat";

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const iRouter = require("../../artifacts/contracts/interfaces/IRouter.sol/IRouter.json");
const ierc20 = require("../../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json");
const iaavelendingpool = require("../../artifacts/contracts/mocks/aave/ILendingPool.sol/ILendingPool.json");

const { ethers } = hre;

export async function repay_router(
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
    underlyingBorrowAddress,
    underlyingDepositAddress,
    routerAddress
  ) {

  const mintableERC20 = await ethers.getContractFactory("MintableERC20");
  const _underlyingBorrowErc20 = await mintableERC20.attach(underlyingBorrowAddress);
  const underlyingBorrowDecimals = await _underlyingBorrowErc20.decimals();
  console.log("repay_router", underlyingBorrowDecimals);

  const _underlyingDepositErc20 = await mintableERC20.attach(underlyingDepositAddress);
  const underlyingDepositDecimals = await _underlyingDepositErc20.decimals();

  const poolDataProvider = await ethers.getContractFactory("PoolDataProvider");
  const _poolDataProvider = await poolDataProvider.attach(poolDataProviderAddress);

  const _router = await ethers.getContractAt(iRouter.abi, routerAddress, provider);
  console.log("_router", _router.address);

  const routerPool = await _router.getRouterPool()

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

  const routerRToken = await _router.getRToken(underlyingDepositAddress); // weth
  console.log("routerRToken", routerRToken);
  const routerRDebtToken = await _router.getRDebtToken(underlyingBorrowAddress);
  console.log("routerRDebtToken", routerRDebtToken);

  const _routerRToken = await ethers.getContractAt(ierc20.abi, routerRToken, provider);
  const _routerRDebtToken = await ethers.getContractAt(ierc20.abi, routerRDebtToken, provider);



  const borrowerRouterDepositBalance_before = await _routerRToken.balanceOf(borrowerAddress);
  const borrowerRouterDebtBalance_before = await _routerRDebtToken.balanceOf(borrowerAddress);



  console.log("borrowerRouterDepositBalance_before", ethers.utils.formatUnits(borrowerRouterDepositBalance_before, underlyingDepositDecimals));
  console.log("borrowerRouterDebtborrowerRouterDebtBalance_beforeBalance", ethers.utils.formatUnits(borrowerRouterDebtBalance_before, underlyingBorrowDecimals));

  // Repay Underlying
  // const repayAmount = borrowerRouterDebtBalance_before;
  const repayAmount = ethers.utils.parseUnits("1000", underlyingBorrowDecimals);
  // const borrowDebtBalance = await _underlyingBorrowErc20.balanceOf(borrowerAddress);
  // console.log("Borrower Debt Asset Balance", ethers.utils.formatUnits(borrowDebtBalance, underlyingBorrowDecimals));

  await _underlyingBorrowErc20.connect(borrower).approve(_pool.address, repayAmount);
  // await _underlyingBorrowErc20.connect(borrower).mint(repayAmount);
  await _underlyingBorrowErc20.connect(borrower)["mint(uint256)"](repayAmount)

  const tx = await _pool.connect(borrower).repayRouter(
    underlyingBorrowAddress,
    routerAddress,
    repayAmount,
    "2",
    borrowerAddress
  )

  // const res = await tx.wait();
  // const hash = res.events;
  // console.log("hash", hash);

  const reserveTokenAddresses = await _poolDataProvider.getReserveTokensAddresses(underlyingBorrowAddress);
  const variableDebtTokenAddress = reserveTokenAddresses[1];

  const variableDebtToken = await ethers.getContractFactory("VariableDebtToken");
  const _variableDebtToken = await variableDebtToken.attach(variableDebtTokenAddress);
  const balance = await _variableDebtToken.balanceOf(borrowerAddress);
  console.log("borrower variable debt balance", ethers.utils.formatUnits(balance, underlyingBorrowDecimals));

  const variableBorrowRate = await _poolDataProvider.getVariableBorrowRate(underlyingBorrowAddress);
  console.log("variableBorrowRate", ethers.utils.formatUnits(variableBorrowRate, "27"));

  const borrowerRouterDepositBalance = await _routerRToken.balanceOf(borrowerAddress);
  const borrowerRouterDebtBalance = await _routerRDebtToken.balanceOf(borrowerAddress);




  console.log("borrowerRouterDepositBalance", ethers.utils.formatUnits(borrowerRouterDepositBalance, underlyingDepositDecimals));
  console.log("borrowerRouterDebtBalance", ethers.utils.formatUnits(borrowerRouterDebtBalance, underlyingBorrowDecimals));


  // const _aaveLendingPool = await ethers.getContractAt(iaavelendingpool.abi, routerPool, provider);

  // _aaveLendingPool.filters.Borrow(null)

  // increase block
  // const evMine = await provider.send("evm_mine");
  // await provider.send("evm_increaseTime", [2000]);
  // const evMine2 = await provider.send("evm_mine");

}