// npx hardhat run scripts/set_aggregators.ts --network buidlerevm_docker

import {deployments, ethers, getNamedAccounts, getChainId} from 'hardhat';
import { deploymentData, routers } from './constants/addresses'
const {parseUnits} = ethers.utils;
const {deploy, get, getArtifact, save, run} = deployments;

async function main() {
  const {deploy, execute, read} = deployments;

  const {deployer} = await getNamedAccounts();
  const chainId = await getChainId()
  const chainIdKey = parseInt(chainId)

  const poolAddressesProviderAddress = (await deployments.get('PoolAddressesProvider')).address;
  const aclManagerAddress = (await deployments.get('ACLManager')).address;
  const poolAddress = (await deployments.get("Pool")).address;

  await deploy('1' + "InterestRateOracleV2", {
    from: deployer,
    contract: 'InterestRateOracleV2',
    args: [
      poolAddressesProviderAddress
    ],
  });
  const interestRateOracleAddress = (await deployments.get('1' + "InterestRateOracleV2")).address;

  for (let i = 0; i < deploymentData[chainIdKey].length; i++) {

    let aTokenReserveData = await read('AaveProtocolDataProvider', { from: deployer }, 'getReserveTokensAddresses', deploymentData[chainIdKey][i].address);
    let aTokenUnderlying = aTokenReserveData[0]

    // await deploy(deploymentData[chainIdKey][i].symbol + "InterestRateOracle", {
    //   from: deployer,
    //   contract: 'InterestRateOracle',
    //   args: [
    //     poolAddressesProviderAddress,
    //     aclManagerAddress,
    //     deploymentData[chainIdKey][i].address
    //   ],
    // });

    // let interestRateOracleAddress = (await deployments.get(deploymentData[chainIdKey][i].symbol + "InterestRateOracle")).address;


    await execute('AggregatorConfigurator', { from: deployer }, 'initAggregator', 
      poolAddress,
      poolAddressesProviderAddress,
      deploymentData[chainIdKey][i].address,
      routers
    );

    let aTokenAggregatorAddress = await read('AaveProtocolDataProvider', { from: deployer }, 'getAggregatorAddress', deploymentData[chainIdKey][i].address);
    // await execute(deploymentData[chainIdKey][i].symbol + "InterestRateOracle", { from: deployer }, 'setAggregator', aTokenAggregatorAddress);

    await deploy(deploymentData[chainIdKey][i].symbol + "StandardStrategy", {
      from: deployer,
      contract: 'StandardStrategy',
      args: [
        aTokenAggregatorAddress,
        deployer,
        interestRateOracleAddress
      ],
    });

    let standardStrategyAddress = (await deployments.get(deploymentData[chainIdKey][i].symbol + "StandardStrategy")).address;

    // await execute(deploymentData[chainIdKey][i].symbol + "InterestRateOracle", { from: deployer }, 'setAggregator', aTokenAggregatorAddress);
    await execute('1' + "InterestRateOracleV2", { from: deployer }, 'addAggregatorData', aTokenAggregatorAddress);

    const Aggregator = await ethers.getContractFactory("Aggregator")
    const _aggregator = await Aggregator.attach(aTokenAggregatorAddress);
    await _aggregator.setAggregatorStrategy(standardStrategyAddress)

  }

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
