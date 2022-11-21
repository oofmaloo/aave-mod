import hre from "hardhat";

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const iRouter = require("../../artifacts/contracts/interfaces/IRouter.sol/IRouter.json");
const ierc20 = require("../../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json");
const iaavelendingpool = require("../../artifacts/contracts/mocks/aave/ILendingPool.sol/ILendingPool.json");

const { ethers } = hre;

export async function flash_reborrow(
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
    [underlyingBorrowAddress_1],
    [underlyingCollateralAddress_1],
    fromRouterAddress,
    toRouterAddress
  ) {

  const mintableERC20 = await ethers.getContractFactory("MintableERC20");
  const _underlyingErc20 = await mintableERC20.attach(underlyingBorrowAddress_1);
  const underlyingDecimals = await _underlyingErc20.decimals();

  console.log("underlyingBorrowAddress_1", underlyingBorrowAddress_1);
  console.log("underlyingCollateralAddress_1", underlyingCollateralAddress_1);

  const poolDataProvider = await ethers.getContractFactory("PoolDataProvider");
  const _poolDataProvider = await poolDataProvider.attach(poolDataProviderAddress);

  const _router = await ethers.getContractAt(iRouter.abi, fromRouterAddress, provider);

  const routerRToken = await _router.getRToken(underlyingCollateralAddress_1);
  console.log("routerRToken", routerRToken);
  const routerRDebtToken = await _router.getRDebtToken(underlyingBorrowAddress_1);
  console.log("routerRDebtToken", routerRDebtToken);
  const _routerRToken = await ethers.getContractAt(ierc20.abi, routerRToken, provider);
  const _routerRDebtToken = await ethers.getContractAt(ierc20.abi, routerRDebtToken, provider);

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

  console.log("_router", _router.address);
  // let borrowAmounts = new Array(underlyingBorrowAddresses.length);
  let borrowAmounts = []
  console.log("_router2", _router.address);

  for (let i = 0; i < 1; i++) {
    let borrowAmount = await _routerRDebtToken.balanceOf(borrowerAddress);
    // let borrowAmount = ethers.utils.parseUnits("99.9", underlyingDecimals);
    borrowAmounts.push(borrowAmount.toString())
  }
  console.log("borrowAmounts", borrowAmounts);

  let collateralAmounts = [];
  console.log("_router4", _router.address);

  // removing total balance may not work due to aave logic
  // dust must be left behind  for a lot of protocols
  for (let i = 0; i < 1; i++) {
    // let collateralAmount = await _routerRToken.balanceOf(borrowerAddress);
    let collateralAmount = ethers.utils.parseUnits("999.9", 18);
    collateralAmounts.push(collateralAmount.toString())
  }

  let userData = await _pool.getUserAccountData(borrowerAddress)

  console.log("userData b4", userData.toString());

  console.log("collateralAmounts", collateralAmounts);

  await _pool.connect(borrower).flashLoanReborrow(
    [underlyingCollateralAddress_1],
    [underlyingBorrowAddress_1],
    collateralAmounts,
    borrowAmounts,
    fromRouterAddress,
    "0x0000000000000000000000000000000000000000",
    borrowerAddress
  );


  userData = await _pool.getUserAccountData(borrowerAddress)
  console.log("userData", userData);
  console.log("userData a4", userData.toString());

}