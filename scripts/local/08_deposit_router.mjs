import hre from "hardhat";

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const iRouter = require("../../artifacts/contracts/interfaces/IRouter.sol/IRouter.json");
const ierc20 = require("../../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json");

const { ethers } = hre;

export async function deposit_router(
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
    routerAddress
  ) {

  const mintableERC20 = await ethers.getContractFactory("MintableERC20");
  const _underlyingErc20 = await mintableERC20.attach(underlyingAddress);
  const underlyingDecimals = await _underlyingErc20.decimals();

  const poolDataProvider = await ethers.getContractFactory("PoolDataProvider");
  const _poolDataProvider = await poolDataProvider.attach(poolDataProviderAddress);

  const _router = await ethers.getContractAt(iRouter.abi, routerAddress, provider);
  console.log("_router", _router.address);

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
  const depositAmount = ethers.utils.parseUnits("1000", underlyingDecimals);

  await _underlyingErc20.connect(borrower).approve(_pool.address, depositAmount);
  // await _underlyingErc20.connect(borrower).mint(depositAmount);
  await _underlyingErc20.connect(borrower)["mint(uint256)"](depositAmount)
  await _pool.connect(borrower).supplyRouter(
    underlyingAddress,
    routerAddress,
    depositAmount,
    borrowerAddress
  )
  const reserveTokenAddresses = await _poolDataProvider.getReserveTokensAddresses(underlyingAddress);
  const variableDebtTokenAddress = reserveTokenAddresses[1];

  const variableDebtToken = await ethers.getContractFactory("VariableDebtToken");
  const _variableDebtToken = await variableDebtToken.attach(variableDebtTokenAddress);
  const balance = await _variableDebtToken.balanceOf(borrowerAddress);
  console.log("borrower variable debt balance", ethers.utils.formatUnits(balance, underlyingDecimals));

  const variableBorrowRate = await _poolDataProvider.getVariableBorrowRate(underlyingAddress);
  console.log("variableBorrowRate", ethers.utils.formatUnits(variableBorrowRate, "27"));

  const routerRToken = await _router.getRToken(underlyingAddress);
  console.log("routerRToken", routerRToken);
  const routerRDebtToken = await _router.getRDebtToken(underlyingAddress);
  console.log("routerRDebtToken", routerRDebtToken);


  // const _routerRToken = await mintableERC20.attach(routerRToken);
  // const _routerRDebtToken = await mintableERC20.attach(routerRDebtToken);


  const _routerRToken = await ethers.getContractAt(ierc20.abi, routerRToken, provider);
  // const _routerRDebtToken = await ethers.getContractAt(ierc20.abi, routerRDebtToken, provider);



  const borrowerRouterDepositBalance = await _routerRToken.balanceOf(borrowerAddress);
  // const borrowerRouterDebtBalance = await _routerRDebtToken.balanceOf(borrowerAddress);




  console.log("borrowerRouterDepositBalance", ethers.utils.formatUnits(borrowerRouterDepositBalance, underlyingDecimals));
  // console.log("borrowerRouterDebtBalance", ethers.utils.formatUnits(borrowerRouterDebtBalance, underlyingDecimals));


  // increase block
  // const evMine = await provider.send("evm_mine");
  // await provider.send("evm_increaseTime", [2000]);
  // const evMine2 = await provider.send("evm_mine");

}