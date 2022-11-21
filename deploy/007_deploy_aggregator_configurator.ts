import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy, execute} = deployments;

  const {deployer} = await getNamedAccounts();

  const poolAddressesProviderAddress = (await deployments.get('PoolAddressesProvider')).address;

  await deploy('AggregatorConfigurator', {
    from: deployer,
    args: [poolAddressesProviderAddress],
    log: true,
  });

  const aggregatorConfiguratorAddress = (await deployments.get('AggregatorConfigurator')).address;

  await execute('PoolAddressesProvider', { from: deployer }, 'setPoolAggregatorConfigurator', aggregatorConfiguratorAddress);
};
export default func;
