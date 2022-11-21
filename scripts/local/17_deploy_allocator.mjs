import hre from "hardhat";
import { getDepositAmount } from "./00__deploy.mjs"

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method

const { ethers } = hre;

export async function deploy_allocator(
    provider, 
    owner,
    ownerAddress,
    poolAddressesProviderAddress,
    [underlyingAddress1, underlyingAddress2],
    stakedAddiAddress
  ) {

	const AllocatorManager = await ethers.getContractFactory("AllocatorManager");
	const _allocatorManager = await AllocatorManager.deploy(ethers.constants.AddressZero, ownerAddress);
	console.log("deploy_allocator 1")

	const AllocatorController = await ethers.getContractFactory("AllocatorController");
	const _allocatorController = await AllocatorController.deploy(
		poolAddressesProviderAddress,
		stakedAddiAddress,
		_allocatorManager.address
	);
	console.log("deploy_allocator 2")

	await _allocatorManager.setAllocatorController(_allocatorController.address);
	console.log("deploy_allocator 3")

	const allocatorConfigsInput = [
		{
			asset: underlyingAddress1,
			minBalance: '0',
			minStakedBalance: '1',
			submitTimeRequirement: '1000',
			maxAllocators: '1000',
			maxAllocatorsPeriod: '1000',
		},
		{
			asset: underlyingAddress2,
			minBalance: '0',
			minStakedBalance: '1',
			submitTimeRequirement: '1000',
			maxAllocators: '1000',
			maxAllocatorsPeriod: '1000',
		}
	]
	console.log("deploy_allocator 4")

	await _allocatorManager.configureAssets(allocatorConfigsInput);
	console.log("deploy_allocator 5")
	return {
		"allocatorManagerAddress": _allocatorManager.address,
		"allocatorControllerAddress": _allocatorController.address,
	}
}