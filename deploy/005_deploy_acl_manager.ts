import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy, execute} = deployments;

  const {deployer} = await getNamedAccounts();

  const poolAddressesProviderAddress = (await deployments.get('PoolAddressesProvider')).address;

  await deploy('ACLManager', {
    from: deployer,
    args: [poolAddressesProviderAddress],
    log: true,
  });

  const aCLManagerAddress = (await deployments.get('ACLManager')).address;

  await execute('PoolAddressesProvider', { from: deployer }, 'setACLManager', aCLManagerAddress);

  await execute('ACLManager', { from: deployer }, 'addRiskAdmin', deployer);
  await execute('ACLManager', { from: deployer }, 'addAssetListingAdmin', deployer);
  await execute('ACLManager', { from: deployer }, 'addPoolAdmin', deployer);
};
export default func;
