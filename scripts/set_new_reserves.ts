// npx hardhat run scripts/set_rewards.ts --network buidlerevm_docker

import {deployments, ethers, getNamedAccounts, getChainId} from 'hardhat';
import { deploymentData } from './constants/addresses'
const {parseUnits} = ethers.utils;
const {deploy, get, getArtifact, save, run} = deployments;

async function main() {
  const {deploy, execute, read} = deployments;

  const {deployer} = await getNamedAccounts();

  const chainId = await getChainId()
  const chainIdKey = parseInt(chainId)
  console.log("chainIdKey", chainIdKey)

  console.log("deploymentData[chainIdKey]", deploymentData[chainIdKey])

  const poolAddressesProviderAddress = (await deployments.get('PoolAddressesProvider')).address;
  const aclManagerAddress = (await deployments.get('ACLManager')).address;
  const pullRewardsTransferStrategyAddress = (await deployments.get('PullRewardsTransferStrategy')).address;

  const reserveParamsUnderlying = []
  for (let i = 0; i < deploymentData[chainIdKey].length; i++) {

    let result = await deploy(deploymentData[chainIdKey][i].symbol+"-InterestRateStrategy", {
      from: deployer,
      contract: 'DefaultReserveInterestRateStrategy',
      args: [
        poolAddressesProviderAddress,
        ethers.utils.parseUnits(".6", 27),
        "0",
        ethers.utils.parseUnits(".04", 27),
        ethers.utils.parseUnits(".6", 27),
        ethers.utils.parseUnits(".04", 27),
        ethers.utils.parseUnits(".6", 27),
        "0",
        "0",
        "0"
      ],
    });

    let interestRateStrategyAddress = (await deployments.get(deploymentData[chainIdKey][i].symbol+"-InterestRateStrategy")).address;
    console.log("interestRateStrategyAddress", interestRateStrategyAddress)

    const rewardsControllerAddress = (await deployments.get('RewardsController')).address;

    reserveParamsUnderlying.push({
      aTokenImpl: ethers.constants.AddressZero,
      stableDebtTokenImpl: ethers.constants.AddressZero,
      variableDebtTokenImpl: ethers.constants.AddressZero,
      vaultTokenImpl: ethers.constants.AddressZero,
      underlyingAssetDecimals: deploymentData[chainIdKey][i].decimals,
      interestRateStrategyAddress: interestRateStrategyAddress,
      underlyingAsset: deploymentData[chainIdKey][i].address,
      treasury: deployer,
      incentivesController: rewardsControllerAddress,
      aTokenName: 'Interest Bearing ' + deploymentData[chainIdKey][i].name,
      aTokenSymbol: 'a' + deploymentData[chainIdKey][i].symbol,
      variableDebtTokenName: 'Variable Debt Token ' + deploymentData[chainIdKey][i].name,
      variableDebtTokenSymbol: 'var' + deploymentData[chainIdKey][i].symbol,
      stableDebtTokenName: 'Stable Debt Token ' + deploymentData[chainIdKey][i].name,
      stableDebtTokenSymbol: 'sta' + deploymentData[chainIdKey][i].symbol,
      vaultTokenName: 'Vault Token ' + deploymentData[chainIdKey][i].name,
      vaultTokenSymbol: 'vault' + deploymentData[chainIdKey][i].symbol,
      params: []
    })
  }

  console.log("initLiquidityReserves")
  await execute('PoolConfigurator', { from: deployer }, 'initLiquidityReserves', reserveParamsUnderlying);

  console.log("initVariableBorrowReserves")
  await execute('PoolConfigurator', { from: deployer }, 'initVariableBorrowReserves', reserveParamsUnderlying);

  console.log("initStableBorrowReserves")
  await execute('PoolConfigurator', { from: deployer }, 'initStableBorrowReserves', reserveParamsUnderlying);

  console.log("initVaultReserves")
  await execute('PoolConfigurator', { from: deployer }, 'initVaultReserves', reserveParamsUnderlying);

  for (let i = 0; i < deploymentData[chainIdKey].length; i++) {
    await execute('PoolConfigurator', { from: deployer }, 'configureReserveAsCollateral', deploymentData[chainIdKey][i].address, '8500', '9000', '10500');
    await execute('PoolConfigurator', { from: deployer }, 'setReserveFactor', deploymentData[chainIdKey][i].address, '500');
    await execute('PoolConfigurator', { from: deployer }, 'setRewardFactor', deploymentData[chainIdKey][i].address, '5000');
    const dividendsVaultAddress = (await deployments.get('DividendsVault')).address;
    await execute('PoolConfigurator', { from: deployer }, 'setDividendsVaultAddress', deploymentData[chainIdKey][i].address, dividendsVaultAddress);
    await execute('PoolConfigurator', { from: deployer }, 'setReserveBorrowing', deploymentData[chainIdKey][i].address, true);
  }

  // rewards
  // const ONE_MILLION = '1000000'
  // const ONE_YEAR = 31556926
  // const tokenRewardsAmount = ethers.utils.parseUnits(ONE_MILLION, 18)
  // const emissionsPerSecond = Number(tokenRewardsAmount) / ONE_YEAR
  // const blockNumBefore = await ethers.provider.getBlockNumber();
  // const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  // const timestampBefore = blockBefore.timestamp;
  // const distributionEnd = timestampBefore + ONE_YEAR

  // const rewardsConfigInput = []
  // const addiAddress = (await deployments.get('Addi')).address;
  // for (let i = 0; i < deploymentData[chainIdKey].length; i++) {
  //   await execute('EmissionManager', { from: deployer }, 'setEmissionAdmin', deploymentData[chainIdKey][i].address, deployer);

  //   await execute('Addi', { from: deployer }, 'approve', pullRewardsTransferStrategyAddress, tokenRewardsAmount);

  //   let aTokenReserveData = await read('AaveProtocolDataProvider', { from: deployer }, 'getReserveTokensAddresses', deploymentData[chainIdKey][i].address);
  //   console.log("aTokenReserveData", aTokenReserveData)
  //   let aTokenUnderlying = aTokenReserveData[0]

  //   rewardsConfigInput.push({
  //     emissionPerSecond: emissionsPerSecond.toString(),
  //     totalSupply: '0',
  //     distributionEnd: distributionEnd,
  //     asset: aTokenUnderlying,
  //     reward: addiAddress,
  //     transferStrategy: pullRewardsTransferStrategyAddress,
  //     rewardOracle: ethers.constants.AddressZero
  //   })
  // }
  // console.log("configureAssets")
  // await execute('EmissionManager', { from: deployer }, 'configureAssets', rewardsConfigInput);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
