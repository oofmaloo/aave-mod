// npx hardhat run scripts/set_aave_routers.ts --network buidlerevm_docker
// npx hardhat run scripts/set_aave_routers.ts --network hardhat

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

  for (let i = 0; i < aaveRouters.length; i++) {
    // v2
    // let result = await deploy('AaveRouterTest', {
    //   from: deployer,
    //   args: [
    //     aaveRouters[i].aaveLendingPoolAddress, //aavePoolAddress
    //     aaveRouters[i].aaveAddressesProviderAddress, //aaveAddressesProviderAddress
    //     poolAddressesProviderAddress, // addressesProvider_
    //     aclManagerAddress, // _aclManager
    //     aaveRouters[i].aaveRewardsControllerAddress, //aaveRewardsController
    //     aaveRouters[i].aavePoolDataProviderAddress, //aavePoolDataProvider_
    //     underlyings, // underlyings
    //     "10000" // borrowFactor_
    //   ],
    //   log: true,
    // });
    // console.log("AaveRouterTest", 'deployed at:', result.address);

    // v3
    let result = await deploy('AaveV3RouterTest', {
      from: deployer,
      args: [
        aaveRouters[i].aaveLendingPoolAddress, //aavePoolAddress
        aaveRouters[i].aaveAddressesProviderAddress, //aaveAddressesProviderAddress
        poolAddressesProviderAddress, // addressesProvider_
        aclManagerAddress, // _aclManager
        aaveRouters[i].aaveRewardsControllerAddress, //aaveRewardsController
        aaveRouters[i].aavePoolDataProviderAddress, //aavePoolDataProvider_
        underlyings, // underlyings
        "10000" // borrowFactor_
      ],
      log: true,
    });
    console.log("AaveV3RouterTest", 'deployed at:', result.address);

    // await execute('AaveRouterTest', { from: deployer }, '_addReservesData_', [underlyings[0]]);
  }


}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
