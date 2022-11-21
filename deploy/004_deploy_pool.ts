import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy, execute} = deployments;

  const {deployer} = await getNamedAccounts();

  await deploy('PoolLogic', {
    from: deployer,
    log: true,
  });
  await deploy('SupplyLogic', {
    from: deployer,
    log: true,
  });
  await deploy('BorrowLogic', {
    from: deployer,
    log: true,
  });

  const borrowLogicAddress = (await deployments.get('BorrowLogic')).address;
  
  await deploy('FlashLoanLogic', {
    from: deployer,
    libraries: {
      BorrowLogic: borrowLogicAddress,
    },
    log: true,
  });
  await deploy('LiquidationLogic', {
    from: deployer,
    log: true,
  });
  await deploy('EModeLogic', {
    from: deployer,
    log: true,
  });


  const poolAddressesProviderAddress = (await deployments.get('PoolAddressesProvider')).address;

  const poolLogicAddress = (await deployments.get('PoolLogic')).address;
  const supplyLogicAddress = (await deployments.get('SupplyLogic')).address;
  
  const flashLoanLogicAddress = (await deployments.get('FlashLoanLogic')).address;
  const liquidationLogicAddress = (await deployments.get('LiquidationLogic')).address;
  const eModeLogicAddress = (await deployments.get('EModeLogic')).address;

  await deploy('Pool', {
    from: deployer,
    args: [poolAddressesProviderAddress],
    libraries: {
      PoolLogic: poolLogicAddress,
      SupplyLogic: supplyLogicAddress,
      BorrowLogic: borrowLogicAddress,
      FlashLoanLogic: flashLoanLogicAddress,
      LiquidationLogic: liquidationLogicAddress,
      EModeLogic: eModeLogicAddress,
    },
    log: true,
  });

  const poolAddress = (await deployments.get('Pool')).address;

  await execute('PoolAddressesProvider', { from: deployer }, 'setPool', poolAddress);

};
export default func;
