import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import hre from "hardhat";
const { ethers } = hre;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy, execute} = deployments;

  const {deployer} = await getNamedAccounts();

  const poolAddressesProviderAddress = (await deployments.get('PoolAddressesProvider')).address;

  const mintAmount = ethers.utils.parseUnits("1000000000000", 18);
  
  await deploy('Addi', {
    from: deployer,
    args: [mintAmount],
    log: true,
  });

  const addiAddress = (await deployments.get('Addi')).address;

  await deploy('StakedAddi', {
    from: deployer,
    args: [
      addiAddress,
      ethers.constants.AddressZero,
      '2629743',
      '2629743'
    ],
    log: true,
  });

  await execute('StakedAddi', { from: deployer }, 'setStakedAdmin', deployer);

  await deploy("DividendsVault", {
    from: deployer,
    contract: 'Vault',
    args: [
      deployer, // vaultAdmin_
      ethers.constants.AddressZero, // transferStrategy_
    ],
  });

  await deploy('DividendManager', {
    from: deployer,
    args: [ethers.constants.AddressZero, deployer],
    log: true,
  });

  const dividendManagerAddress = (await deployments.get('DividendManager')).address;
  const stakedAddiAddress = (await deployments.get('StakedAddi')).address;

  await deploy('DividendsController', {
    from: deployer,
    args: [dividendManagerAddress, poolAddressesProviderAddress, stakedAddiAddress],
    log: true,
  });

  const dividendsControllerAddress = (await deployments.get('DividendsController')).address;

  await execute('StakedAddi', { from: deployer }, 'setRewardsController', dividendsControllerAddress);

  await execute('DividendManager', { from: deployer }, 'setDividendAdmin', deployer);
  await execute('DividendManager', { from: deployer }, 'setDividendsController', dividendsControllerAddress);

  const dividendsVaultAddress = (await deployments.get('DividendsVault')).address;

  await deploy('DividendsTransferStrategy', {
    from: deployer,
    args: [dividendsControllerAddress, deployer, dividendsVaultAddress],
    log: true,
  });
  const dividendsTransferStrategyAddress = (await deployments.get('DividendsTransferStrategy')).address;

  await execute('DividendManager', { from: deployer }, 'setTransferStrategy', ethers.constants.AddressZero, dividendsTransferStrategyAddress);

  await execute('DividendsVault', { from: deployer }, 'setTransferStrategy', dividendsTransferStrategyAddress);

};
export default func;
