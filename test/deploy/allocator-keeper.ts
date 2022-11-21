import { Contract, utils } from "ethers";
import { iRouterInputParams } from '../constants/pools';
import { ethers } from "hardhat";
import { saveToJson, readJsonByDesc, readJson } from '../../helpers/misc';
import { tokenAddressesArr, tokens } from '../constants/tokens';

export async function deployAllocatorKeeper(
  account: string,
  assets: string[],
  poolAddressesProviderAddress: string,
  dividendsVaultAddress: string,
  stakedAddiAddress: string
) {

  const AllocatorKeeperManager = await ethers.getContractFactory("AllocatorKeeperManager");
  const _allocatorManager = await AllocatorKeeperManager.deploy(ethers.constants.AddressZero, account);
  saveToJson({title: "AllocatorManager", address: _allocatorManager.address, description: ""})
  
  const AllocatorKeeperController = await ethers.getContractFactory("AllocatorKeeperController");
  const _allocatorController = await AllocatorKeeperController.deploy(
    poolAddressesProviderAddress,
    stakedAddiAddress,
    _allocatorManager.address
  );
  saveToJson({title: "AllocatorKeeperController", address: _allocatorController.address, description: ""})
  
  await _allocatorManager.setAllocatorController(_allocatorController.address);

  const allocatorConfigsInput = [
    {
      asset: assets[0],
      executeTimeRequirement: '1',
      submitTimeRequirementDelta: '1',
    },
    {
      asset: assets[1],
      executeTimeRequirement: '1',
      submitTimeRequirementDelta: '1',
    },
  ]

  for (let i = 0; i < assets.length; i++) {
    const token = tokens.find(obj => obj.address == assets[i])
    const aggregatorTitle = "a" + token?.name + "-" + "Aggregator"
    const aggregatorData = await readJson(aggregatorTitle)
    const Aggregator = await ethers.getContractFactory("Aggregator");
    const _aggregator = await Aggregator.attach(aggregatorData.address);

    await _aggregator.addAuthorized(_allocatorController.address);
  }

  await _allocatorManager.configureAssets(allocatorConfigsInput);

  return {
    _allocatorManager,
    _allocatorController
  }

}