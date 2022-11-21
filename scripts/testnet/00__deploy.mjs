// npx hardhat run scripts/testnet/00__deploy.mjs --network fuji
// npx hardhat run scripts/testnet/00__deploy.mjs --network hardhat -----> only for forks
import {deployProtocol} from "./00_deployProtocol.mjs"
import {setupCompRouter} from "./01_setup_comp_router.mjs"

import {setupCompound} from "./02_setup_compound.mjs"

import {setupAaveRouter} from "./01_setup_aave_router.mjs"
import {setupAave} from "./02_setup_aave.mjs"
import {setupReserve} from "./03_setup_reserve.mjs"
import {deposit} from "./04_deposit.mjs"
import {token_dividends_setup} from "./02_token_dividends_setup.mjs"
import {stake} from "./16_stake.mjs"
import {deploy_allocator} from "./17_deploy_allocator.mjs"


import hre from "hardhat";
const { ethers } = hre;

export function getAssetAddress(symbol) {
  const assets = {
    "usdc": "0x3E937B4881CBd500d05EeDAB7BA203f2b7B3f74f",
    "dai": "0xFc7215C9498Fc12b22Bc0ed335871Db4315f03d3",
  }

  return assets[symbol];
}

export function getDepositAmount(address) {
  const assets = {
    "0x3E937B4881CBd500d05EeDAB7BA203f2b7B3f74f": ethers.utils.parseUnits("10000", 6),
    "0xFc7215C9498Fc12b22Bc0ed335871Db4315f03d3": ethers.utils.parseUnits("1000", 18),
  }

  return assets[address]
}

export function getBorrowAmount(address) {
  const assets = {
    "0x3E937B4881CBd500d05EeDAB7BA203f2b7B3f74f": ethers.utils.parseUnits("7000", 6),
    "0xFc7215C9498Fc12b22Bc0ed335871Db4315f03d3": ethers.utils.parseUnits("500", 18),
  }

  return assets[address]
}

export function getTokenMintAmount(address) {
  return ethers.utils.parseUnits("1000000000000", 18)
}

export function getDepositAmountBig(address) {
  const assets = {
    "0x3E937B4881CBd500d05EeDAB7BA203f2b7B3f74f": ethers.utils.parseUnits("1000000", 6),
    "0xFc7215C9498Fc12b22Bc0ed335871Db4315f03d3": ethers.utils.parseUnits("1000000", 18),
  }
  return assets[address]
}


async function run() {

  const [owner] = await ethers.getSigners();

  // console.log("borrower_1", borrower_1)
  const ownerAddress = await owner.address;

  const provider = new ethers.providers.JsonRpcProvider('https://api.avax-test.network/ext/C/rpc', 43113);

  const accounts = await provider.listAccounts()

  // avalanche fiji
  // assets
  const usdcAddress = "0x3E937B4881CBd500d05EeDAB7BA203f2b7B3f74f";
  const daiAddress = "0xFc7215C9498Fc12b22Bc0ed335871Db4315f03d3";


  // aave V3 - ACTUAL
  const aaveLendingPoolAddress = "0xb47673b7a73D78743AFF1487AF69dBB5763F00cA";
  const aaveAddressesProviderAddress = "0x1775ECC8362dB6CaB0c7A9C0957cF656A5276c29";
  const aaveRewardsControllerAddress =           "0x0000000000000000000000000000000000000000";
  const aavePoolDataProviderAddress = "0x8e0988b28f9CdDe0134A206dfF94111578498C63";

  // aave 2
  const aaveLendingPoolAddress_v2 = "0x72A2e04a66336BC6A394a7808402968D65e9335A";
  const aaveAddressesProviderAddress_v2 = "0x8bEe2037448F096900Fd9affc427d38aE6CC0350";
  const aaveRewardsControllerAddress_v2 =           "0x0000000000000000000000000000000000000000";
  const aavePoolDataProviderAddress_v2 = "0xc0Bb1650A8eA5dDF81998f17B5319afD656f4c11";

  // aave 3
  const aaveLendingPoolAddress_v3 = "0x54aF7945f9CbAD79Cb8Afc02fC46080195139F22";
  const aaveAddressesProviderAddress_v3 = "0x06786bCbc114bbfa670E30A1AC35dFd1310Be82f";
  const aaveRewardsControllerAddress_v3 =           "0x0000000000000000000000000000000000000000";
  const aavePoolDataProviderAddress_v3 = "0xD69BC314bdaa329EB18F36E4897D96A3A48C3eeF";

  // aave 3
  const aaveLendingPoolAddress_v4 = "0xA4d82217474460D3250F2Be0C8E58FDf60cd21De";
  const aaveAddressesProviderAddress_v4 = "0x840748F7Fd3EA956E5f4c88001da5CC1ABCBc038";
  const aaveRewardsControllerAddress_v4 =           "0x0000000000000000000000000000000000000000";
  const aavePoolDataProviderAddress_v4 = "0x057cD3082EfED32d5C907801BF3628B27D88fD80";

  // how many protocols/copies/forks summed
  const aaveCount = 1;

  const cUSDC = "0xf971ecBb85c3e1d3Cb3eEeD68a67f1ee49Fa9244"
  const cDAI = "0xfa03939eE7354e633Fba8783E1305973C32FaE0D"
  const compCount = 1

  console.log("\n * deployProtocol *");
  const {
    poolConfiguratorAddress,
    aggregatorConfiguratorAddress,
    poolDataProviderAddress,
    poolAddress,
    poolAddressesProviderAddress,
    aclManagerAddress,
    configuratorLogicAddress,
    aggregatorLogicAddress,
    poolLogicAddress,
    supplyLogicAddress,
    borrowLogicAddress,
    flashLoanLogicAddress,
    liquidationLogicAddress,
    eModeLogicAddress,
    allocatorAddress,
    aTokenConfiguratorLogicAddress,
    variableDebtConfiguratorLogicAddress,
    stableDebtConfiguratorLogicAddress,
    vaultTokenConfiguratorLogicAddress
  } = await deployProtocol(
    provider,
    ownerAddress,
    usdcAddress,
    daiAddress,
    aaveLendingPoolAddress,
    aaveAddressesProviderAddress,
    aaveRewardsControllerAddress,
    aavePoolDataProviderAddress
  );

  console.log("\n * setupCompRouter *");

  await setupCompRouter(
    [usdcAddress, daiAddress],
    [cUSDC, cDAI],
    poolAddressesProviderAddress,
    aclManagerAddress,
    compCount
  )
  console.log("\n * setupAaveRouter *");

  const aaveRouterAddressesses = await setupAaveRouter(
    [usdcAddress, daiAddress],
    poolAddressesProviderAddress,
    aclManagerAddress,
    [aaveLendingPoolAddress, aaveLendingPoolAddress_v2, aaveLendingPoolAddress_v3, aaveLendingPoolAddress_v4],
    [aaveAddressesProviderAddress, aaveAddressesProviderAddress_v2, aaveAddressesProviderAddress_v3, aaveAddressesProviderAddress_v4],
    [aaveRewardsControllerAddress, aaveRewardsControllerAddress_v2, aaveRewardsControllerAddress_v3, aaveRewardsControllerAddress_v4],
    [aavePoolDataProviderAddress, aavePoolDataProviderAddress_v2, aavePoolDataProviderAddress_v3, aavePoolDataProviderAddress_v4],
    aaveCount
  );

  // console.log("aaveRouterAddressesses 1 ", aaveRouterAddressesses)

  console.log("\n * token_dividends_setup *");
  const { 
    dividendManagerAddress,
    dividendsControllerAddress,
    stakedAddiAddress,
    addiTokenAddress
  } = await token_dividends_setup(
    provider,
    owner,
    ownerAddress,
    poolAddressesProviderAddress,
    dividendsVaultAddress
  )

  // console.log("\n * deploy_allocator *");
  // const { 
  //   allocatorManagerAddress,
  //   allocatorControllerAddress
  // } = await deploy_allocator(
  //   provider,
  //   owner,
  //   ownerAddress,
  //   poolAddressesProviderAddress,
  //   [usdcAddress, daiAddress],
  //   stakedAddiAddress
  // )

  console.log("\n * setupReserve *");
  const { avasTokenAggregatorAddress } = await setupReserve(
    provider,
    usdcAddress,
    daiAddress,
    owner,
    ownerAddress,
    poolConfiguratorAddress,
    aggregatorConfiguratorAddress,
    poolDataProviderAddress,
    poolAddress,
    poolAddressesProviderAddress,
    aclManagerAddress,
    // [aaveRouterAddress, aaveRouterAddress_v2],
    aaveRouterAddressesses,
    configuratorLogicAddress,
    aggregatorLogicAddress,
    poolLogicAddress,
    supplyLogicAddress,
    borrowLogicAddress,
    flashLoanLogicAddress,
    liquidationLogicAddress,
    eModeLogicAddress,
    aTokenConfiguratorLogicAddress,
    variableDebtConfiguratorLogicAddress,
    stableDebtConfiguratorLogicAddress,
    vaultTokenConfiguratorLogicAddress,
    dividendsVaultAddress,
    dividendManagerAddress,
    addiTokenAddress
  );

  // // creates interest rate --- should be done in aave folder
  // console.log("\n * setupCompound *");

  // await setupCompound(
  //   provider,
  //   owner,
  //   ownerAddress,
  //   [usdcAddress, daiAddress],
  //   [cUSDC, cDAI],
  //   compCount
  // )

  // console.log("\n * setupAave *");
  // // only use if self deployed fork 
  // await setupAave(
  //   provider,
  //   usdcAddress,
  //   daiAddress,
  //   owner,
  //   ownerAddress,
  //   aave_depositor,
  //   aave_depositorAddress,
  //   aave_borrower,
  //   aave_borrowerAddress,
  //   [aaveLendingPoolAddress, aaveLendingPoolAddress_v2, aaveLendingPoolAddress_v3, aaveLendingPoolAddress_v4],
  //   [aavePoolDataProviderAddress, aavePoolDataProviderAddress_v2, aavePoolDataProviderAddress_v3, aavePoolDataProviderAddress_v4],
  //   aaveCount
  // );


  console.log("\n * stake *");
  await stake(
    provider,
    owner,
    ownerAddress,
    poolDataProviderAddress,
    usdcAddress,
    daiAddress,
    dividendsControllerAddress,
    stakedAddiAddress,
    addiTokenAddress
  )


  console.log("\n * deposit *");
  await deposit(
    provider, 
    owner,
    ownerAddress,
    poolDataProviderAddress,
    poolAddress,
    poolLogicAddress,
    supplyLogicAddress,
    borrowLogicAddress,
    flashLoanLogicAddress,
    liquidationLogicAddress,
    eModeLogicAddress,
    usdcAddress,
    avasTokenAggregatorAddress
  );

  // console.log("\n * deposit collateral- to setup borrow *");
  // await deposit(
  //   provider, 
  //   owner,
  //   ownerAddress,
  //   poolDataProviderAddress,
  //   poolAddress,
  //   poolLogicAddress,
  //   supplyLogicAddress,
  //   borrowLogicAddress,
  //   flashLoanLogicAddress,
  //   liquidationLogicAddress,
  //   eModeLogicAddress,
  //   daiAddress,
  //   avasTokenAggregatorAddress
  // );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
