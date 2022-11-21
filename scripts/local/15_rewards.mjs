import hre from "hardhat";
import { getDepositAmount } from "./00__deploy.mjs"

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method

const { ethers } = hre;

export async function rewards(
    provider, 
    depositor,
    depositorAddress,
    poolDataProviderAddress,
    underlyingAddress,
    wethAddress
  ) {

	const mintableERC20 = await ethers.getContractFactory("MintableERC20");
	const _underlyingErc20 = await mintableERC20.attach(underlyingAddress);
	const underlyingDecimals = await _underlyingErc20.decimals();

	const AaveProtocolDataProvider = await ethers.getContractFactory("AaveProtocolDataProvider");
	const _aaveProtocolDataProvider = await AaveProtocolDataProvider.attach(poolDataProviderAddress);

	// ensure user has deposited prior
	const aTokenReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(underlyingAddress);
	const aTokenUnderlying = aTokenReserveData[0]

	const AToken = await ethers.getContractFactory("AToken");
	const _aToken = await AToken.attach(aTokenUnderlying);

	const rewardsControllerAddress = await _aToken.getIncentivesController()
	console.log("rewardsControllerAddress", rewardsControllerAddress)

	const RewardsController = await ethers.getContractFactory("RewardsController");
	const _rewardsController = await RewardsController.attach(rewardsControllerAddress);

	const userRewards = await _rewardsController.getUserRewards(
		[aTokenUnderlying],
		depositorAddress,
		wethAddress
	)

	console.log("userRewards", userRewards)
}