// npx hardhat run scripts/set_new_reserves.ts --network buidlerevm_docker

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
  const pullRewardsTransferStrategyAddress = (await deployments.get('PullRewardsTransferStrategy')).address;

  // rewards
  const ONE_MILLION = '1000000'
  const ONE_YEAR = 31556926
  const tokenRewardsAmount = ethers.utils.parseUnits(ONE_MILLION, 18)
  const emissionsPerSecond = Number(tokenRewardsAmount) / ONE_YEAR
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  const timestampBefore = blockBefore.timestamp;
  const distributionEnd = timestampBefore + ONE_YEAR

  const rewardsConfigInput = []
  const addiAddress = (await deployments.get('Addi')).address;
  for (let i = 0; i < deploymentData[chainIdKey].length; i++) {

    await execute('Addi', { from: deployer }, 'approve', pullRewardsTransferStrategyAddress, tokenRewardsAmount);

    let aTokenReserveData = await read('AaveProtocolDataProvider', { from: deployer }, 'getReserveTokensAddresses', deploymentData[chainIdKey][i].address);
    console.log("aTokenReserveData", aTokenReserveData)
    let aTokenUnderlying = aTokenReserveData[0]

    rewardsConfigInput.push({
      emissionPerSecond: emissionsPerSecond.toString(),
      totalSupply: '0',
      distributionEnd: distributionEnd,
      asset: aTokenUnderlying,
      reward: addiAddress,
      transferStrategy: pullRewardsTransferStrategyAddress,
      rewardOracle: ethers.constants.AddressZero
    })
  }
  console.log("configureAssets")
  await execute('EmissionManager', { from: deployer }, 'configureAssets', rewardsConfigInput);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
