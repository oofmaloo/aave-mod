import hre from "hardhat";

import { createRequire } from "module"; // Bring in the ability to create the 'require' method

import { getTokenMintAmount } from "./00__deploy.mjs"

const require = createRequire(import.meta.url); // construct the require method

const { ethers } = hre;

export async function token_dividends_setup(
    provider,
    owner,
    ownerAddress,
    poolAddressesProviderAddress
  ) {


  const mintAmount = getTokenMintAmount();
  
  const Addi = await ethers.getContractFactory("Addi");
  const _addi = await Addi.deploy(mintAmount);
  console.log("2")

  const StakedAddi = await ethers.getContractFactory("StakedAddi");
  const _stakedAddi = await StakedAddi.deploy(
    _addi.address,
    ethers.constants.AddressZero,
    '2629743',
    '2629743'
  );
  console.log("3")

  await _stakedAddi.setStakedAdmin(ownerAddress)
  console.log("4")

  const DividendsVault = await ethers.getContractFactory("DividendsVault");
  const _dividendsVault = await DividendsVault.deploy(
    ownerAddress, // dividendsVaultAdmin_
    ethers.constants.AddressZero // transferStrategy_
  );
  console.log("2")


  const DividendManager = await ethers.getContractFactory("DividendManager");
  const _dividendManager = await DividendManager.deploy(ethers.constants.AddressZero, ownerAddress);
  console.log("5")
  const DividendsController = await ethers.getContractFactory("DividendsController");
  const _dividendsController = await DividendsController.deploy(_dividendManager.address, poolAddressesProviderAddress, _stakedAddi.address);
  console.log("6")

  await _stakedAddi.setRewardsController(_dividendsController.address)
  console.log("7")

  await _dividendManager.setDividendAdmin(ownerAddress)
  console.log("8")
  await _dividendManager.setDividendsController(_dividendsController.address)
  console.log("9")

  const DividendsTransferStrategy = await ethers.getContractFactory("DividendsTransferStrategy");
  const _dividendsTransferStrategy = await DividendsTransferStrategy.deploy(
    _dividendsController.address, // incentivesController
    ownerAddress, // rewardsAdmin
    _dividendsVault.address // dividendsVault - address holding token rewards
  );
  console.log("10")

  await _dividendManager.setTransferStrategy(ethers.constants.AddressZero, _dividendsTransferStrategy.address)
  console.log("11")

  await _dividendsVault.setTransferStrategy(_dividendsTransferStrategy.address);
  console.log("12")

  return {
    "dividendManagerAddress": _dividendManager.address,
    "dividendsControllerAddress": _dividendsController.address,
    "stakedAddiAddress": _stakedAddi.address,
    "addiTokenAddress": _addi.address,
    "dividendsVaultAddress": _dividendsVault.address
  }
}