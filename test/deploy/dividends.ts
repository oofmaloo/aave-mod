import { Contract, utils } from "ethers";
import { iRouterInputParams } from '../constants/pools';
import { ethers } from "hardhat";
import { saveToJson } from '../../helpers/misc';

export async function deployTokenAndDividends(
  account: string,
  poolAddressesProviderAddress: string,
  dividendsVaultAddress: string
) {

  const mintAmount = ethers.utils.parseUnits("1000000000000", 18);

  const Addi = await ethers.getContractFactory("Addi");
  const _addi = await Addi.deploy(mintAmount);

  saveToJson({title: "Addi", address: _addi.address, description: ""})

  const StakedAddi = await ethers.getContractFactory("StakedAddi");
  const _stakedAddi = await StakedAddi.deploy(
    _addi.address,
    ethers.constants.AddressZero,
    '2629743',
    '2629743'
  );

  saveToJson({title: "StakedAddi", address: _stakedAddi.address, description: ""})

  await _stakedAddi.setStakedAdmin(account)

  const DividendManager = await ethers.getContractFactory("DividendManager");
  const _dividendManager = await DividendManager.deploy(ethers.constants.AddressZero, account);
  const DividendsController = await ethers.getContractFactory("DividendsController");
  const _dividendsController = await DividendsController.deploy(_dividendManager.address, poolAddressesProviderAddress, _stakedAddi.address);

  await _stakedAddi.setRewardsController(_dividendsController.address)

  await _dividendManager.setDividendAdmin(account)
  await _dividendManager.setDividendsController(_dividendsController.address)

  const DividendsTransferStrategy = await ethers.getContractFactory("DividendsTransferStrategy");
  const _dividendsTransferStrategy = await DividendsTransferStrategy.deploy(
    _dividendsController.address, // incentivesController
    account, // rewardsAdmin
    dividendsVaultAddress // dividendsVault - address holding token rewards
  );

  saveToJson({title: "DividendsVault", address: dividendsVaultAddress, description: ""})

  await _dividendManager.setTransferStrategy(ethers.constants.AddressZero, _dividendsTransferStrategy.address)

  return {
    _dividendManager,
    _dividendsController,
    _stakedAddi,
    _addi
  }
}