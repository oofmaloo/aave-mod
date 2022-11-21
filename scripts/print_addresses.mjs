import hre from "hardhat";

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const IPool = require("../artifacts/contracts/interfaces/IPool.sol/IPool.json");
const IPoolAddressesProvider = require("../artifacts/contracts/interfaces/IPoolAddressesProvider.sol/IPoolAddressesProvider.json");
const IPoolDataProvider = require("../artifacts/contracts/interfaces/IPoolDataProvider.sol/IPoolDataProvider.json");
const PoolDataProvider = require("../artifacts/contracts/protocol/pool/PoolDataProvider.sol/PoolDataProvider.json");

// npx hardhat run scripts/print_addresses.mjs --network buidlerevm_docker

async function run() {

  const provider = new ethers.providers.JsonRpcProvider();

  const accounts = await provider.listAccounts()

  const owner = await provider.getSigner(0);
  const ownerAddress = await owner.getAddress();

  // assets
  const usdcAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
  const wethAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";


  // aave 1
  const aaveLendingPoolAddress = "0xca4211da53d1bbab819B03138302a21d6F6B7647";
  const aaveAddressesProviderAddress = "0x4826533B4897376654Bb4d4AD88B7faFD0C98528";
  const aaveRewardsControllerAddress =           "0x0000000000000000000000000000000000000000";
  const aavePoolDataProviderAddress = "0x0ed64d01D0B4B655E410EF1441dD677B695639E7";

  // aave 2
  // located under libraries
  const aaveLendingPoolAddress_v2 = "0x4a057D0eaA196191D22150F22EbBA8703E8ce165";
  const aaveAddressesProviderAddress_v2 = "0x36b58F5C1969B7b6591D752ea6F5486D069010AB";
  const aaveRewardsControllerAddress_v2 =           "0x0000000000000000000000000000000000000000";
  const aavePoolDataProviderAddress_v2 = "0x8F4ec854Dd12F1fe79500a1f53D0cbB30f9b6134";

  const poolAddressesProviderAddress = "0xd9fEc8238711935D6c8d79Bef2B9546ef23FC046"
  const _poolAddressesProvider = await ethers.getContractAt(IPoolAddressesProvider.abi, poolAddressesProviderAddress, provider)

  const poolDataProviderAddress = await _poolAddressesProvider.getPoolDataProvider();
  const _poolDataProvider = await ethers.getContractAt(PoolDataProvider.abi, poolDataProviderAddress, provider)

  // const poolAddress = ""
  // const _pool = await ethers.getContractAt(IPool.abi, poolAddress, provider)

  const avasUSDCAddress = await _poolDataProvider.getAvasTokenAddress(usdcAddress);
  console.log("avasUSDCAddress", avasUSDCAddress);
  const avasWETHAddress = await _poolDataProvider.getAvasTokenAddress(wethAddress);
  console.log("avasWETHAddress", avasWETHAddress);

  const avasVDUSDCAddress = await _poolDataProvider.getVariableDebtTokenAddress(usdcAddress);
  console.log("avasVDUSDCAddress", avasVDUSDCAddress);
  const avasVDWETHAddress = await _poolDataProvider.getVariableDebtTokenAddress(wethAddress);
  console.log("avasVDWETHAddress", avasVDWETHAddress);

  let liquidityRate = await _poolDataProvider.getLiquidityRate(usdcAddress);
  let borrowRate = await _poolDataProvider.getVariableBorrowRate(usdcAddress);
  console.log("depositor liquidityRate", ethers.utils.formatUnits(liquidityRate, '27'));
  console.log("depositor borrowRate", ethers.utils.formatUnits(borrowRate, '27'));

  let usdcAg = await _poolDataProvider.getAggregatorAddress(usdcAddress);
  let wethAg = await _poolDataProvider.getAggregatorAddress(wethAddress);
  console.log("usdcAg", usdcAg);
  console.log("wethAg", wethAg);


  const mintableERC20 = await ethers.getContractFactory("MintableERC20");
  const _underlyingErc20 = await mintableERC20.attach(wethAddress);
  const mintAmount = "100000000000000000000000000000"
  await _underlyingErc20.connect(owner).approve(ownerAddress, mintAmount);
  await _underlyingErc20.connect(owner).mint(mintAmount);


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
