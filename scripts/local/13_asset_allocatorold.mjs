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

export async function asset_allocatorold(
    provider,
    validator,
    validatorAddress,
    allocatorCaller,
    allocatorCallerAddress,
    allocatorAddress,
    underlyingAddress,
    aaveRouterAddress,
    aaveRouterAddress_v2,
    assetAggregatorAddress
  ) {

  const evMine = await provider.send("evm_mine");
  await provider.send("evm_increaseTime", [2000]);
  const evMine2 = await provider.send("evm_mine");

  const allocator = await ethers.getContractFactory("Allocator");
  const _allocator = await allocator.attach(allocatorAddress);

  const aggregator = await ethers.getContractFactory("Aggregator");
  const _aggregator = await aggregator.attach(assetAggregatorAddress);

  // const routers = await _aggregator._routersDataList();

  const routers = await _aggregator["_routersDataList()"]()
  console.log("routers", routers);

  const totalBalance = await _aggregator.getBalance();
  console.log("totalBalance", totalBalance);

  const allocator_aaveRouterAddress_percentage = 0.50;
  const allocator_aaveRouterAddress_v2_percentage = 0.50;

  // ladder method
  let oneHundred = 1.0;
  const allocator_aaveRouterAddress_ladder_percentage = 0.50/oneHundred;
  oneHundred = oneHundred - allocator_aaveRouterAddress_percentage;
  const allocator_aaveRouterAddress_v2_ladder_percentage = 0.50/oneHundred;
  oneHundred = oneHundred - allocator_aaveRouterAddress_v2_percentage;
  // const router_1_router = ethers.utils.parseUnits(allocator_aaveRouterAddress_ladder_percentage.toString(), 4);
  // const router_2_router = ethers.utils.parseUnits(allocator_aaveRouterAddress_v2_ladder_percentage.toString(), 4);


  // % method
  const router_1_router = ethers.utils.parseUnits("0.50", 4);
  const router_2_router = ethers.utils.parseUnits("0.50", 4);
  // const router_1_router = ethers.utils.parseUnits("0.50", 27);
  // const router_2_router = ethers.utils.parseUnits("0.50", 27);

  // console.log("router_1_router", router_1_router.toString());
  // console.log("router_2_router", router_2_router.toString());

  // console.log("allocator_aaveRouterAddress_ladder_percentage", allocator_aaveRouterAddress_ladder_percentage);
  // console.log("allocator_aaveRouterAddress_v2_ladder_percentage", allocator_aaveRouterAddress_v2_ladder_percentage);

    // validatorAddress,
    // allocatorCallerAddress,

  await _allocator.connect(allocatorCaller).submitAllocator(
    underlyingAddress,
    [aaveRouterAddress, aaveRouterAddress_v2],
    [router_1_router, router_2_router]
  );

  const allocatorSubmitsCount = await _allocator.getAllocatorSubmitsCount()
  console.log("allocatorSubmitsCount", allocatorSubmitsCount.toString());

  const allocatorSubmitsQuery = allocatorSubmitsCount.sub(1).toString()
  const allocatorData = await _allocator.getAllocator(allocatorSubmitsQuery);
  console.log("allocatorData", allocatorData);
  console.log("allocatorData", allocatorData.toString());

  await provider.send("evm_mine");
  await provider.send("evm_increaseTime", [2000]);
  await provider.send("evm_mine");

  await _allocator.connect(validator).voteAllocator(allocatorSubmitsQuery, true);
  const allocatorData_a_vote = await _allocator.getAllocator(allocatorSubmitsQuery);
  console.log("allocatorData_a_vote", allocatorData_a_vote);
  console.log("allocatorData_a_vote", allocatorData_a_vote.toString());

  await _allocator.connect(validator).finalizeAllocator(allocatorSubmitsQuery);

}