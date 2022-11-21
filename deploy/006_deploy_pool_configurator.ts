import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy, execute} = deployments;

  const {deployer} = await getNamedAccounts();

  await deploy('ATokenConfiguratorLogic', {
    from: deployer,
    log: true,
  });
  await deploy('VariableDebtConfiguratorLogic', {
    from: deployer,
    log: true,
  });
  await deploy('StableDebtConfiguratorLogic', {
    from: deployer,
    log: true,
  });
  await deploy('VaultTokenConfiguratorLogic', {
    from: deployer,
    log: true,
  });

  const poolAddressesProviderAddress = (await deployments.get('PoolAddressesProvider')).address;

  const aTokenConfiguratorLogicAddress = (await deployments.get('ATokenConfiguratorLogic')).address;
  const variableDebtConfiguratorLogicAddress = (await deployments.get('VariableDebtConfiguratorLogic')).address;
  const stableDebtConfiguratorLogicAddress = (await deployments.get('StableDebtConfiguratorLogic')).address;
  const vaultTokenConfiguratorLogicAddress = (await deployments.get('VaultTokenConfiguratorLogic')).address;

  await deploy('PoolConfigurator', {
    from: deployer,
    args: [poolAddressesProviderAddress],
    libraries: {
      ATokenConfiguratorLogic: aTokenConfiguratorLogicAddress,
      VariableDebtConfiguratorLogic: variableDebtConfiguratorLogicAddress,
      StableDebtConfiguratorLogic: stableDebtConfiguratorLogicAddress,
      VaultTokenConfiguratorLogic: vaultTokenConfiguratorLogicAddress
    },
    log: true,
  });

  const poolConfiguratorAddress = (await deployments.get('PoolConfigurator')).address;

  await execute('PoolAddressesProvider', { from: deployer }, 'setPoolConfigurator', poolConfiguratorAddress);
};
export default func;
