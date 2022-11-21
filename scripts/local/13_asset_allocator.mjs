import hre from "hardhat";

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const iRouter = require("../../artifacts/contracts/interfaces/IRouter.sol/IRouter.json");
const ierc20 = require("../../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json");
const iaavelendingpool = require("../../artifacts/contracts/mocks/aave/ILendingPool.sol/ILendingPool.json");

const { ethers } = hre;
const {
    BigNumber,
    FixedFormat,
    FixedNumber,
    formatFixed,
    parseFixed,
    // Types
    BigNumberish
} = require("@ethersproject/bignumber");

export async function asset_allocator(
    provider,
    validator,
    validatorAddress,
    allocatorCaller,
    allocatorCallerAddress,
    allocatorControllerAddress,
    underlyingAddress,
    aaveRouterAddress,
    aaveRouterAddress_v2,
    assetAggregatorAddress
  ) {

    // const evMine = await provider.send("evm_mine");
    // await provider.send("evm_increaseTime", [2000]);
    // const evMine2 = await provider.send("evm_mine");

    const AllocatorController = await ethers.getContractFactory("AllocatorController");
    const _allocatorController = await AllocatorController.attach(allocatorControllerAddress);



    // 
    const aggregator = await ethers.getContractFactory("Aggregator");
    const _aggregator = await aggregator.attach(assetAggregatorAddress);

    const routers = await _aggregator.getRoutersDataList()
    console.log("routers", routers);

    const totalBalance = await _aggregator.getBalance();
    console.log("totalBalance", totalBalance);

    const allocator_aaveRouterAddress_percentage = 0.50;
    const allocator_aaveRouterAddress_v2_percentage = 0.50;
    console.log("allocator_aaveRouterAddress_v2_percentage", allocator_aaveRouterAddress_v2_percentage);

    // ladder method
    let oneHundred = 1.0;
    const allocator_aaveRouterAddress_ladder_percentage = 0.50/oneHundred;
    oneHundred = oneHundred - allocator_aaveRouterAddress_percentage;
    const allocator_aaveRouterAddress_v2_ladder_percentage = 0.50/oneHundred;
    oneHundred = oneHundred - allocator_aaveRouterAddress_v2_percentage;
    console.log("oneHundred", oneHundred);

    // % method
    const router_1_router = ethers.utils.parseUnits("0.50", 4);
    const router_2_router = ethers.utils.parseUnits("0.50", 4);
    console.log("router_2_router", router_2_router);

    const allocatorSubmitParams = {
        asset: underlyingAddress,
        routers: [aaveRouterAddress, aaveRouterAddress_v2],
        ladderPercentages: [router_1_router, router_2_router],
        caller: ethers.constants.AddressZero,
        delegator: ethers.constants.AddressZero,
        aggregator: ethers.constants.AddressZero,
        currentTotalBalance: '0',
        currentWeightedBalance: '0',
        simulatedWeightedBalance: '0',
        totalRoutedBalance: '0',
        routersCount: '0'
    }

    await _allocatorController.allocatorSubmit(allocatorSubmitParams);
    console.log("allocatorSubmit");

    const allocatorSubmitsCount = await _allocatorController.submitsCount()
    console.log("allocatorSubmitsCount", allocatorSubmitsCount.toString());

    const allocatorSubmitsQueryiD = allocatorSubmitsCount.sub(1).toString()
    let allocatorData = await _allocatorController.getAllocatorSubmit(allocatorSubmitsQueryiD);
    console.log("allocatorData", allocatorData.toString());

    await provider.send("evm_mine");
    await provider.send("evm_increaseTime", [2000]);
    await provider.send("evm_mine");

    await _allocatorController.allocatorVote(allocatorSubmitsQueryiD, 1)
    // allocatorData = await _allocatorController.getAllocatorSubmit(allocatorSubmitsQueryiD);
    // console.log("allocatorData 2", allocatorData.toString());

    let allocatorVote = await _allocatorController.getAllocatorVote(allocatorSubmitsQueryiD);
    console.log("allocatorVote", allocatorVote.toString());

    await _allocatorController.executeAllocator(allocatorSubmitsQueryiD);
    console.log("allocatorSubmit end");

}