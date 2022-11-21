import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { assets, deploymentData } from '../scripts/constants/addresses'
import hre from "hardhat";
const { ethers } = hre;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts, getChainId} = hre;
  const {deploy, execute} = deployments;

  const {deployer} = await getNamedAccounts();
  const chainId = await getChainId()
  const chainIdKey = parseInt(chainId)

  console.log("chainIdKey", chainIdKey)

  await deploy('PriceOracle', {
    from: deployer,
    args: [],
    log: true,
  });

  const priceOracleAddress = (await deployments.get('PriceOracle')).address;
  const poolAddressesProviderAddress = (await deployments.get('PoolAddressesProvider')).address;

  // IPoolAddressesProvider provider,
  // address[] memory assets,
  // address[] memory sources,
  // address fallbackOracle,
  // address baseCurrency,
  // uint256 baseCurrencyUnit

  const underlyings = []
  const oracleSources = []
  for (let i = 0; i < assets.length; i++) {
    underlyings.push(deploymentData[chainIdKey][i].address);
    // if (chainIdKey == 31337) {
    if (false) {
      await execute('PriceOracle', { from: deployer }, 'setAssetPrice', deploymentData[chainIdKey][i].address, deploymentData[chainIdKey][i].price);
      oracleSources.push(priceOracleAddress);
    } else {
      oracleSources.push(deploymentData[chainIdKey][i].oracleAddresses);
    }
  }
  // avalanche testnet uses usdt for stables because no other stable oracles exists
  // usdt = 0x7898AcCC83587C3C55116c5230C17a6Cd9C71bad
  await deploy('AaveOracle', {
    from: deployer,
    args: [
      poolAddressesProviderAddress, 
      underlyings,
      oracleSources,
      priceOracleAddress,
      ethers.constants.AddressZero,
      "100000000"
    ],
    log: true,
  });

  const aaveOracleAddress = (await deployments.get('AaveOracle')).address;

  await execute('PoolAddressesProvider', { from: deployer }, 'setPriceOracle', aaveOracleAddress);

};
export default func;
