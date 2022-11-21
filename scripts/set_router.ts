// npx hardhat run scripts/set_router.ts --network buidlerevm_docker
// npx hardhat run scripts/set_router.ts --network hardhat

import {deployments, ethers, getNamedAccounts, getChainId} from 'hardhat';
import { underlyings, aaveRouters } from './constants/addresses'
const {parseUnits} = ethers.utils;
const {deploy, get, getArtifact, save, run} = deployments;

async function main() {
  const {deploy, execute, read} = deployments;

  const {deployer} = await getNamedAccounts();
  const chainId = await getChainId()
  const chainIdKey = parseInt(chainId)

  const poolAddressesProviderAddress = (await deployments.get('PoolAddressesProvider')).address;
  const aclManagerAddress = (await deployments.get('ACLManager')).address;

  let aTokenAggregatorAddress = await read('AaveProtocolDataProvider', { from: deployer }, 'getAggregatorAddress', deploymentData[chainIdKey][i].address);


  const Aggregator = await ethers.getContractFactory("Aggregator")
  const _aggregator = await Aggregator.attach(aTokenAggregatorAddress);

  const routersToAdd = [routers]
  await _aggregator.addRoutersData(routersToAdd)

  for (let i = 0; i < aaveRouters.length; i++) {
  }


}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
