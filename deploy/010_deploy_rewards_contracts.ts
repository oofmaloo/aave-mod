import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import hre from "hardhat";
const { ethers } = hre;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy, execute} = deployments;

  const {deployer} = await getNamedAccounts();

  const poolAddressesProviderAddress = (await deployments.get('PoolAddressesProvider')).address;

  await deploy('EmissionManager', {
    from: deployer,
    args: [ethers.constants.AddressZero, deployer],
    log: true,
  });

  const emissionsManagerAddress = (await deployments.get('EmissionManager')).address;

  await deploy('RewardsController', {
    from: deployer,
    args: [emissionsManagerAddress],
    log: true,
  });

  const rewardsControllerAddress = (await deployments.get('RewardsController')).address;

  await execute('EmissionManager', { from: deployer }, 'setRewardsController', rewardsControllerAddress);

  const addiAddress = (await deployments.get('Addi')).address;

  await execute('EmissionManager', { from: deployer }, 'setEmissionAdmin', addiAddress, deployer);

  await deploy("RewardsVault", {
    from: deployer,
    contract: 'Vault',
    args: [
      deployer, // vaultAdmin_
      ethers.constants.AddressZero, // transferStrategy_
    ],
  });

  const rewardsVaultAddress = (await deployments.get('RewardsVault')).address;

  await deploy('PullRewardsTransferStrategy', {
    from: deployer,
    args: [rewardsControllerAddress, deployer, rewardsVaultAddress],
    log: true,
  });



};
export default func;
