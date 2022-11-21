import hre from "hardhat";

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const iRouter = require("../../artifacts/contracts/interfaces/IRouter.sol/IRouter.json");
const ierc20 = require("../../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json");
const iaavelendingpool = require("../../artifacts/contracts/mocks/aave/ILendingPool.sol/ILendingPool.json");

const { ethers } = hre;

export async function liquidation(
    provider,
    borrower,
    borrowerAddress,
    liquidator,
    liquidatorAddress,
    poolDataProviderAddress,
    poolAddress,
    poolAddressesProviderAddress,
    poolLogicAddress,
    supplyLogicAddress,
    borrowLogicAddress,
    flashLoanLogicAddress,
    liquidationLogicAddress,
    eModeLogicAddress,
    underlyingCollateralAddress,
    underlyingDebtAddress
  ) {

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

  let borrowerHealth = await _pool.getUserAccountData(borrowerAddress);
  console.log("borrowerHealth", borrowerHealth);
  console.log("borrowerHealth", borrowerHealth.toString());

  const poolAddressesProvider = await ethers.getContractFactory("PoolAddressesProvider");
  const _poolAddressesProvider = await poolAddressesProvider.attach(poolAddressesProviderAddress);
  const oracleAddress = await _poolAddressesProvider.getPriceOracle();

  // update asset price lower to cause health below 1.0
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const _priceOracle = await PriceOracle.attach(oracleAddress);
  await _priceOracle.setAssetPrice(underlyingCollateralAddress, ethers.utils.parseUnits("500", 8));

  const mintableERC20 = await ethers.getContractFactory("MintableERC20");
  const _underlyingCollateralErc20 = await mintableERC20.attach(underlyingCollateralAddress);
  const underlyingCollateralDecimals = await _underlyingCollateralErc20.decimals();

  const _underlyingDebtErc20 = await mintableERC20.attach(underlyingDebtAddress);
  const underlyingDebtDecimals = await _underlyingDebtErc20.decimals();


  const poolDataProvider = await ethers.getContractFactory("PoolDataProvider");
  const _poolDataProvider = await poolDataProvider.attach(poolDataProviderAddress);


  // read health

  borrowerHealth = await _pool.getUserAccountData(borrowerAddress);
  console.log("borrowerHealth", borrowerHealth);
  console.log("borrowerHealth", borrowerHealth.toString());

  // create position

  // mint debt asset to liquidator
  // const mintAmount = ethers.utils.parseUnits("1000", underlyingDebtDecimals);
  // await _underlyingCollateralErc20.connect(liquidator).mint(mintAmount);

  // // take debt

  // address collateralAsset,
  // address debtAsset,
  // address user,
  // uint256 debtToCover,
  // bool receiveAvasToken

  const debtToCover = ethers.utils.parseUnits("10000000", underlyingDebtDecimals);

  // await _underlyingDebtErc20.connect(liquidator).mint(debtToCover);
  await _underlyingDebtErc20.connect(liquidator)["mint(uint256)"](debtToCover)

  await _underlyingDebtErc20.connect(liquidator).approve(_pool.address, debtToCover);

  await _pool.connect(liquidator).liquidationCall(
    underlyingCollateralAddress, // collateralAsset,
    underlyingDebtAddress, // debtAsset,
    borrowerAddress, // user,
    debtToCover, // debtToCover,
    true// receiveAvasToken
  );
  borrowerHealth = await _pool.getUserAccountData(borrowerAddress);
  console.log("borrowerHealth", borrowerHealth);
  console.log("borrowerHealth", borrowerHealth.toString());

}