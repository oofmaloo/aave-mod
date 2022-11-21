// npx hardhat run scripts/drop_routers.ts --network fuji

import {deployments, ethers, getNamedAccounts, getChainId} from 'hardhat';
import { routers, underlyings } from './constants/addresses'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
// const require = createRequire(import.meta.url); // construct the require method
const IRouter = "../artifacts/contracts/interfaces/IRouter.sol/IRouter.json"
// import IRouter from "../artifacts/contracts/interfaces/IRouter.sol/IRouter.json"

const {parseUnits} = ethers.utils;
const {deploy, get, getArtifact, save, run} = deployments;

async function main() {
  const provider = new ethers.providers.JsonRpcProvider('https://api.avax-test.network/ext/C/rpc', 43113);
  // const provider = new ethers.providers.JsonRpcProvider();
  const signer = provider.getSigner();
  // console.log("signer", signer)    

  const {deploy, execute, read} = deployments;

  const {deployer} = await getNamedAccounts();
  console.log("deployer", deployer)    
  const Aggregator = await ethers.getContractFactory("Aggregator")

  // const Router = await ethers.getContractFactory("IRouter")

  const poolAddressesProviderAddress = (await deployments.get('PoolAddressesProvider')).address;
  const aclManagerAddress = (await deployments.get('ACLManager')).address;
  const poolAddress = (await deployments.get("Pool")).address;

  for (let i = 0; i < 1; i++) {
    let aTokenAggregatorAddress = await read('AaveProtocolDataProvider', { from: deployer }, 'getAggregatorAddress', underlyings[0]);
    let _aggregator = await Aggregator.attach(aTokenAggregatorAddress);
    console.log("aTokenAggregatorAddress", aTokenAggregatorAddress)    

    let routersList = await _aggregator.getRoutersList()
    console.log("routersList", routersList)    
    // await _aggregator.dropRouter(routersList[0])

    console.log("routers", routers)    

    // let _router = await Router.attach(routersList[0]);
    // let routersBalance = await _router.getBalance()
    // console.log("routersBalance", routersBalance)

    // let _router = await ethers.getContractAt(IRouter, routersList[0], signer)
    // console.log("_router", _router)

    // let routerBalance = await _router.getBalance(underlyings[0], aTokenAggregatorAddress)
    // console.log("routerBalance", routerBalance)

    let aggregatorBalanceStored =  await _aggregator.getBalanceStored()
    console.log("aggregatorBalanceStored", aggregatorBalanceStored)

    // await _aggregator.dropRouter(routersList[0], {
    //   gasLimit: 100000
    // })

    // routersList = await _aggregator.getRoutersList()
    // console.log("routersList", routersList)
  }



}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
