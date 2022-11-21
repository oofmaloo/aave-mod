import { Contract, utils } from "ethers";
import { iRouterInputParams } from '../constants/pools';
import { ethers } from "hardhat";
import { saveToJson, readJsonByDesc, readJson } from '../../helpers/misc';
import { tokenAddressesArr, tokens } from '../constants/tokens';

export async function deployAllocator(
  account: string,
  assets: string[],
  routers: string[],
  interestRateStrategies: string[],
  poolAddressesProviderAddress: string,
  dividendsVaultAddress: string,
  stakedAddiAddress: string
) {

  const AllocatorManager = await ethers.getContractFactory("AllocatorManager");
  const _allocatorManager = await AllocatorManager.deploy(ethers.constants.AddressZero, account);
  saveToJson({title: "AllocatorManager", address: _allocatorManager.address, description: ""})
  
  const AllocatorController = await ethers.getContractFactory("AllocatorController");
  const _allocatorController = await AllocatorController.deploy(
    poolAddressesProviderAddress,
    stakedAddiAddress,
    _allocatorManager.address
  );
  saveToJson({title: "AllocatorController", address: _allocatorController.address, description: ""})
  
  await _allocatorManager.setAllocatorController(_allocatorController.address);

  const allocatorConfigsInput = [
    {
      asset: assets[0],
      minBalance: '0',
      minStakedBalance: '1',
      submitTimeRequirement: '1000',
      maxAllocators: '1000',
      maxAllocatorsPeriod: '1000',
    },
    {
      asset: assets[1],
      minBalance: '0',
      minStakedBalance: '1',
      submitTimeRequirement: '1000',
      maxAllocators: '1000',
      maxAllocatorsPeriod: '1000',
    }
  ]

  // const routers = []
  // const interestRateStrategies = []

  for (let i = 0; i < assets.length; i++) {
    const token = tokens.find(obj => obj.address == assets[i])
    const aggregatorTitle = "a" + token?.name + "-" + "Aggregator"
    const aggregatorData = await readJson(aggregatorTitle)
    const Aggregator = await ethers.getContractFactory("Aggregator");
    const _aggregator = await Aggregator.attach(aggregatorData.address);

    await _aggregator.addAuthorized(_allocatorController.address);

  }


  await _allocatorManager.configureAssets(allocatorConfigsInput);

  await _allocatorController.configureRouterModels(routers, interestRateStrategies);

  return {
    _allocatorManager,
    _allocatorController
  }

}