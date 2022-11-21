import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy, execute} = deployments;

  const {deployer} = await getNamedAccounts();

  await deploy('PoolAddressesProvider', {
    from: deployer,
    args: ["1", deployer],
    log: true,
  });

  await execute('PoolAddressesProvider', { from: deployer }, 'setACLAdmin', deployer);

  const poolAddressesProviderRegistryAddress = (await deployments.get('PoolAddressesProviderRegistry')).address;
  const poolAddressesProviderAddress = (await deployments.get('PoolAddressesProvider')).address;

  await execute('PoolAddressesProviderRegistry', { from: deployer }, 'registerAddressesProvider', poolAddressesProviderAddress, '1');


};
export default func;
