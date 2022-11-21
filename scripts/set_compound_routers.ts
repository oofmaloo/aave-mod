// npx hardhat run scripts/set_compound_routers.ts --network buidlerevm_docker

import {deployments, ethers, getNamedAccounts, getChainId} from 'hardhat';
import { underlyings, cTokens } from './constants/addresses'
const {parseUnits} = ethers.utils;
const {deploy, get, getArtifact, save, run} = deployments;

// const underlyings = ["0x5FC8d32690cc91D4c39d9d3abcBD16989F875707", "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"]
// const cTokens = ["0x0753ba18e716B0B4fA42aD0e66FdbBCcA0392A20", "0x2b761D3d44b48Be4Fec0C4aF895EB549f9e255A3"]

const compCount = 1 ;

async function main() {
  const {deployer} = await getNamedAccounts();
  const chainId = await getChainId()
  const chainIdKey = parseInt(chainId)

  const poolAddressesProviderAddress = (await deployments.get('PoolAddressesProvider')).address;
  const aclManagerAddress = (await deployments.get('ACLManager')).address;

  for (let i = 0; i < compCount; i++) {
    let result = await deploy('CompoundRouterTest', {
      from: deployer,
      args: [
        poolAddressesProviderAddress, //
        aclManagerAddress, //
        "0x0000000000000000000000000000000000000000",
        underlyings,
        cTokens
      ],
      log: true,
    });
    console.log("CompoundRouterTest", 'deployed at:', result.address);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
