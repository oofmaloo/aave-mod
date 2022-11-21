// npx hardhat run scripts/local/00__deploy.mjs --network buidlerevm_docker
// import {hre, ethers} from "hardhat";
// import  ethers from "hardhat";
import {deployProtocol} from "./00_deployProtocol.mjs"
import {setupCompRouter} from "./01_setup_comp_router.mjs"

import {setupCompound} from "./02_setup_compound.mjs"

import {setupAaveRouter} from "./01_setup_aave_router.mjs"
import {setupAave} from "./02_setup_aave.mjs"
import {setupReserve} from "./03_setup_reserve.mjs"
import {deposit} from "./04_deposit.mjs"
import {withdraw} from "./05_withdraw.mjs"
import {borrow} from "./06_borrow.mjs"
import {repay} from "./07_repay.mjs"
import {deposit_router} from "./08_deposit_router.mjs"
import {borrow_router} from "./09_borrow_router.mjs"
import {repay_router} from "./10_repay_router.mjs"
import {withdraw_router} from "./11_withdraw_router.mjs"
import {flash_reborrow} from "./12_flash_reborrow.mjs"
import {asset_allocator} from "./13_asset_allocator.mjs"
import {liquidation} from "./14_liquidation.mjs"
import {rewards} from "./15_rewards.mjs"
import {token_dividends_setup} from "./02_token_dividends_setup.mjs"
import {stake} from "./16_stake.mjs"
import {deploy_allocator} from "./17_deploy_allocator.mjs"

import {testDelegate} from "./0000_test_delegate.mjs"


import hre from "hardhat";
const { ethers } = hre;

export function getAssetAddress(symbol) {
  const assets = {
    "usdc": "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    "weth": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  }

  return assets[symbol];
}

export function getDepositAmount(address) {
  const assets = {
    "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707": ethers.utils.parseUnits("10000", 6),
    "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9": ethers.utils.parseUnits("1000", 18),
  }

  return assets[address]
}

export function getBorrowAmount(address) {
  const assets = {
    "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707": ethers.utils.parseUnits("7000", 6),
    "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9": ethers.utils.parseUnits("500", 18),
  }

  return assets[address]
}

export function getTokenMintAmount(address) {
  return ethers.utils.parseUnits("1000000000000", 18)
}

export function getDepositAmountBig(address) {
  const assets = {
    "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707": ethers.utils.parseUnits("1000000", 6),
    "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9": ethers.utils.parseUnits("1000000", 18),
  }
  return assets[address]
}


async function run() {

  const provider = new ethers.providers.JsonRpcProvider();

  const accounts = await provider.listAccounts()

  const owner = await provider.getSigner(0);
  const ownerAddress = await owner.getAddress();
  const borrower_1 = await provider.getSigner(2);
  const borrower_1Address = await borrower_1.getAddress();
  const aave_depositor = await provider.getSigner(3);
  const aave_depositorAddress = await aave_depositor.getAddress();
  const aave_borrower = await provider.getSigner(4);
  const aave_borrowerAddress = await aave_borrower.getAddress();
  const allocatorCaller = await provider.getSigner(5);
  const allocatorCallerAddress = await allocatorCaller.getAddress();
  const validator = await provider.getSigner(6);
  const validatorAddress = await validator.getAddress();
  const liquidator = await provider.getSigner(7);
  const liquidatorAddress = await liquidator.getAddress();

  // assets
  const usdcAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
  const wethAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

  // aave 1
  const aaveLendingPoolAddress = "0xca4211da53d1bbab819B03138302a21d6F6B7647";
  const aaveAddressesProviderAddress = "0x4826533B4897376654Bb4d4AD88B7faFD0C98528";
  const aaveRewardsControllerAddress =           "0x0000000000000000000000000000000000000000";
  const aavePoolDataProviderAddress = "0x0ed64d01D0B4B655E410EF1441dD677B695639E7";

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

  const aaveCount = 2;

  const cUSDC = "0x0753ba18e716B0B4fA42aD0e66FdbBCcA0392A20"
  const cWETH = "0x2b761D3d44b48Be4Fec0C4aF895EB549f9e255A3"
  const compCount = 2

  // console.log("\n * deployCompound *");
  // await deployCompound(
  //   owner,
  //   [usdcAddress, wethAddress],
  //   ["1000000000000000000000000000000", "1000000000000000000000000000000000"],
  //   ["500000000000000000", "500000000000000000"]
  // )

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
    validatorAddress,
    allocatorCallerAddress,
    usdcAddress,
    wethAddress,
    aaveLendingPoolAddress,
    aaveAddressesProviderAddress,
    aaveRewardsControllerAddress,
    aavePoolDataProviderAddress
  );

  await provider.send("evm_mine");
  await provider.send("evm_increaseTime", [1000]);
  await provider.send("evm_mine");

  await setupCompRouter(
    [usdcAddress, wethAddress],
    [cUSDC, cWETH],
    poolAddressesProviderAddress,
    aclManagerAddress,
    compCount
  )
  console.log("\n * setupAaveRouter *");
  // routers
  // v1
  // const {aaveRouterAddress, aaveRouterAddress_v2, aaveRouterAddress_v3} = await setupAaveRouter(
  //   [usdcAddress, wethAddress],
  //   poolAddressesProviderAddress,
  //   aclManagerAddress,
  //   aaveLendingPoolAddress_v3,
  //   aaveAddressesProviderAddress_v3,
  //   aaveRewardsControllerAddress_v3,
  //   aavePoolDataProviderAddress_v3
  // );

  const aaveRouterAddressesses = await setupAaveRouter(
    [usdcAddress, wethAddress],
    poolAddressesProviderAddress,
    aclManagerAddress,
    [aaveLendingPoolAddress, aaveLendingPoolAddress_v2, aaveLendingPoolAddress_v3, aaveLendingPoolAddress_v4],
    [aaveAddressesProviderAddress, aaveAddressesProviderAddress_v2, aaveAddressesProviderAddress_v3, aaveAddressesProviderAddress_v4],
    [aaveRewardsControllerAddress, aaveRewardsControllerAddress_v2, aaveRewardsControllerAddress_v3, aaveRewardsControllerAddress_v4],
    [aavePoolDataProviderAddress, aavePoolDataProviderAddress_v2, aavePoolDataProviderAddress_v3, aavePoolDataProviderAddress_v4],
    aaveCount
  );

  console.log("aaveRouterAddressesses 1 ", aaveRouterAddressesses)

  console.log("\n * token_dividends_setup *");
  const { 
    dividendManagerAddress,
    dividendsControllerAddress,
    stakedAddiAddress,
    addiTokenAddress,
    dividendsVaultAddress
  } = await token_dividends_setup(
    provider,
    owner,
    ownerAddress,
    poolAddressesProviderAddress,
  )

  await provider.send("evm_mine");
  await provider.send("evm_increaseTime", [1000]);
  await provider.send("evm_mine");

  console.log("\n * deploy_allocator *");
  const { 
    allocatorManagerAddress,
    allocatorControllerAddress
  } = await deploy_allocator(
    provider,
    owner,
    ownerAddress,
    poolAddressesProviderAddress,
    [usdcAddress, wethAddress],
    stakedAddiAddress
  )

  await provider.send("evm_mine");
  await provider.send("evm_increaseTime", [1000]);
  await provider.send("evm_mine");

  console.log("\n * setupReserve *");
  const { avasTokenAggregatorAddress } = await setupReserve(
    provider,
    usdcAddress,
    "USDC",
    "USDC",
    wethAddress,
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

  await provider.send("evm_mine");
  await provider.send("evm_increaseTime", [1000]);
  await provider.send("evm_mine");

  console.log("\n * setupAave *");
  // creates interest rate --- should be done in aave folder
  // deposits USDC and WETH and borrows USDC
  // await setupAave(
  //   provider,
  //   usdcAddress,
  //   wethAddress,
  //   owner,
  //   ownerAddress,
  //   aave_depositor,
  //   aave_depositorAddress,
  //   aave_borrower,
  //   aave_borrowerAddress,
  //   aavePoolDataProviderAddress,
  //   aaveLendingPoolAddress
  // );

  console.log("\n * setupCompound *");

  await setupCompound(
    provider,
    aave_depositor,
    aave_depositorAddress,
    [usdcAddress, wethAddress],
    [cUSDC, cWETH],
    compCount
  )

  console.log("\n * setupAave *");

  await setupAave(
    provider,
    usdcAddress,
    wethAddress,
    owner,
    ownerAddress,
    aave_depositor,
    aave_depositorAddress,
    aave_borrower,
    aave_borrowerAddress,
    [aaveLendingPoolAddress, aaveLendingPoolAddress_v2, aaveLendingPoolAddress_v3, aaveLendingPoolAddress_v4],
    [aavePoolDataProviderAddress, aavePoolDataProviderAddress_v2, aavePoolDataProviderAddress_v3, aavePoolDataProviderAddress_v4],
    aaveCount
  );

  await provider.send("evm_mine");
  await provider.send("evm_increaseTime", [1000]);
  await provider.send("evm_mine");


  console.log("\n * stake *");
  await stake(
    provider,
    owner,
    ownerAddress,
    poolDataProviderAddress,
    usdcAddress,
    wethAddress,
    dividendsControllerAddress,
    stakedAddiAddress,
    addiTokenAddress
  )

  // console.log("\n * stake as non-owner *");
  // const Addi = await ethers.getContractFactory("Addi");
  // const _addi = await Addi.attach(addiTokenAddress);
  // await _addi.connect(owner).approve(_pullRewardsTransferStrategy.address, tokenRewardsAmount);

  // await stake(
  //   provider,
  //   borrower_1,
  //   borrower_1Address,
  //   poolDataProviderAddress,
  //   usdcAddress,
  //   wethAddress,
  //   dividendsControllerAddress,
  //   stakedAddiAddress,
  //   addiTokenAddress
  // )

  // console.log("\n * setupAave 2 *");
  // // creates interest rate --- should be done in aave folder
  // // deposits USDC and WETH and borrows USDC
  // await setupAave(
  //   provider,
  //   usdcAddress,
  //   wethAddress,
  //   owner,
  //   ownerAddress,
  //   aave_depositor,
  //   aave_depositorAddress,
  //   aave_borrower,
  //   aave_borrowerAddress,
  //   aavePoolDataProviderAddress_v2,
  //   aaveLendingPoolAddress_v2
  // );

  // console.log("\n * setupAave 3 *");
  // // creates interest rate --- should be done in aave folder
  // // deposits USDC and WETH and borrows USDC
  // await setupAave(
  //   provider,
  //   usdcAddress,
  //   wethAddress,
  //   owner,
  //   ownerAddress,
  //   aave_depositor,
  //   aave_depositorAddress,
  //   aave_borrower,
  //   aave_borrowerAddress,
  //   aavePoolDataProviderAddress_v3,
  //   aaveLendingPoolAddress_v3
  // );

  await provider.send("evm_mine");
  await provider.send("evm_increaseTime", [1000]);
  await provider.send("evm_mine");

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
  // eModeLogicAddress,
  //   usdcAddress,
  //   avasTokenAggregatorAddress
  // );

  // console.log("\n * withdraw *");
  // await withdraw(
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
  // eModeLogicAddress,
  //   usdcAddress,
  //   aaveLendingPoolAddress,
  //   aavePoolDataProviderAddress,
  //   avasTokenAggregatorAddress
  // );

  await provider.send("evm_mine");
  await provider.send("evm_increaseTime", [1000]);
  await provider.send("evm_mine");

  console.log("\n * deposit - to setup borrow *");
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
    aaveLendingPoolAddress,
    aavePoolDataProviderAddress,
    avasTokenAggregatorAddress
  );

  await provider.send("evm_mine");
  await provider.send("evm_increaseTime", [1000]);
  await provider.send("evm_mine");

  console.log("\n * deposit - to setup borrow *");
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
    aaveLendingPoolAddress,
    aavePoolDataProviderAddress,
    avasTokenAggregatorAddress
  );

  // console.log("\n * testDelegate *");

  // await testDelegate(
  //   provider,
  //   usdcAddress,
  //   aave_depositor,
  //   aave_depositorAddress,
  //   aavePoolDataProviderAddress,
  //   aaveLendingPoolAddress
  // );
  // await provider.send("evm_mine");
  // await provider.send("evm_increaseTime", [1000]);
  // await provider.send("evm_mine");


  console.log("\n * deposit collateral- to setup borrow *");
  await deposit(
    provider, 
    borrower_1,
    borrower_1Address,
    poolDataProviderAddress,
    poolAddress,
    poolLogicAddress,
    supplyLogicAddress,
    borrowLogicAddress,
    flashLoanLogicAddress,
    liquidationLogicAddress,
    eModeLogicAddress,
    wethAddress,
    avasTokenAggregatorAddress
  );
  await provider.send("evm_mine");
  await provider.send("evm_increaseTime", [1000]);
  await provider.send("evm_mine");

  console.log("\n * borrow *");
  await borrow(
    provider, 
    borrower_1,
    borrower_1Address,
    poolDataProviderAddress,
    poolAddress,
    poolLogicAddress,
    supplyLogicAddress,
    borrowLogicAddress,
    flashLoanLogicAddress,
    liquidationLogicAddress,
    eModeLogicAddress,
    usdcAddress,
    aaveLendingPoolAddress,
    aavePoolDataProviderAddress,
    avasTokenAggregatorAddress
  );
  await provider.send("evm_mine");
  await provider.send("evm_increaseTime", [1000]);
  await provider.send("evm_mine");

  console.log("\n * repay *");
  await repay(
    provider, 
    borrower_1,
    borrower_1Address,
    poolDataProviderAddress,
    poolAddress,
    poolLogicAddress,
    supplyLogicAddress,
    borrowLogicAddress,
    flashLoanLogicAddress,
    liquidationLogicAddress,
    eModeLogicAddress,
    usdcAddress
  );

  // console.log("\n * flash reborrow *");
  // await flash_reborrow(
  //   provider, 
  //   borrower_1,
  //   borrower_1Address,
  //   poolDataProviderAddress,
  //   poolAddress,
  //   poolLogicAddress,
  //   supplyLogicAddress,
  //   borrowLogicAddress,
  //   flashLoanLogicAddress,
  //   liquidationLogicAddress,
  // eModeLogicAddress,
  //   [usdcAddress],
  //   [wethAddress],
  //   aaveRouterAddress,
  //   aaveRouterAddress
  // );

  // console.log("\n * asset allocator *");
  // await asset_allocator(
  //   provider, 
  //   validator,
  //   validatorAddress,
  //   allocatorCaller,
  //   allocatorCallerAddress,
  //   allocatorControllerAddress,
  //   usdcAddress,
  //   aaveRouterAddress,
  //   aaveRouterAddress,
  //   avasTokenAggregatorAddress
  // );

  // console.log("\n * liquidation *");
  // await liquidation(
  //   provider, 
  //   borrower_1,
  //   borrower_1Address,
  //   liquidator,
  //   liquidatorAddress,
  //   poolDataProviderAddress,
  //   poolAddress,
  //   poolAddressesProviderAddress,
  //   poolLogicAddress,
  //   supplyLogicAddress,
  //   borrowLogicAddress,
  //   flashLoanLogicAddress,
  //   liquidationLogicAddress,
  // eModeLogicAddress,
  //   wethAddress,
  //   usdcAddress
  // );

  // console.log("\n * get user rewards *");
  // await rewards(
  //   provider, 
  //   owner,
  //   ownerAddress,
  //   poolDataProviderAddress,
  //   usdcAddress,
  //   wethAddress
  // );

  console.log("\n * stake token *");
  await stake(
    provider,
    owner,
    ownerAddress,
    poolDataProviderAddress,
    usdcAddress,
    wethAddress,
    dividendsControllerAddress,
    stakedAddiAddress,
    addiTokenAddress
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
