import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy, execute} = deployments;

  const {deployer} = await getNamedAccounts();

  const poolAddressesProviderAddress = (await deployments.get('PoolAddressesProvider')).address;

  await deploy('AaveProtocolDataProvider', {
    from: deployer,
    args: [poolAddressesProviderAddress],
    log: true,
  });

  const protocolDataProviderAddress = (await deployments.get('AaveProtocolDataProvider')).address;

  await execute('PoolAddressesProvider', { from: deployer }, 'setPoolDataProvider', protocolDataProviderAddress);
};
export default func;
