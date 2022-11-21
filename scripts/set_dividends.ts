// npx hardhat run scripts/set_dividends.ts --network buidlerevm_docker

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
  console.log("deploymentData[chainIdKey]", deploymentData[chainIdKey].length)

  // dividends
  const dividendsConfigInput = []
  for (let i = 0; i < deploymentData[chainIdKey].length; i++) {
    let aTokenReserveData = await read('AaveProtocolDataProvider', { from: deployer }, 'getReserveTokensAddresses', deploymentData[chainIdKey][i].address);
    console.log("aTokenReserveData", aTokenReserveData)
    let aTokenUnderlying = aTokenReserveData[0]

    dividendsConfigInput.push(
      {
        emissionPerSecond: '0',
        totalSupply: '0',
        dividend: aTokenUnderlying,
        transferStrategy: ethers.constants.AddressZero
      }
    )
  }

  // const dividendManagerAddress = (await deployments.get('DividendManager')).address;
  // console.log("dividendManagerAddress", dividendManagerAddress)
  await execute('DividendManager', { from: deployer }, 'configureAssets', dividendsConfigInput);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
