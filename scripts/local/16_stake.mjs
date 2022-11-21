import hre from "hardhat";
import { getDepositAmount } from "./00__deploy.mjs"
import { getTokenMintAmount } from "./00__deploy.mjs"

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const ierc20 = require("../../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json");

const { ethers } = hre;

export async function stake(
    provider, 
    owner,
    ownerAddress,
    poolDataProviderAddress,
    underlyingAddress,
    wethAddress,
    dividendsControllerAddress,
    stakedAddiAddress,
    addiTokenAddress
  ) {

	// const AaveProtocolDataProvider = await ethers.getContractFactory("AaveProtocolDataProvider");
	// const _aaveProtocolDataProvider = await AaveProtocolDataProvider.attach(poolDataProviderAddress);

	// const aTokenUnderlyingReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(underlyingAddress);
	// const aTokenUnderlying = aTokenUnderlyingReserveData[0]

	// const aTokenWethReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(wethAddress);
	// const aTokenWeth = aTokenWethReserveData[0]

  	// stake

	const Addi = await ethers.getContractFactory("Addi");
	const _addi = await Addi.attach(addiTokenAddress);
	console.log("_addi", _addi.address)


	const StakedAddi = await ethers.getContractFactory("StakedAddi");
	const _stakedAddi = await StakedAddi.attach(stakedAddiAddress);
	console.log("_stakedAddi", _stakedAddi.address)

	const balance = await _addi.balanceOf(ownerAddress)

	const balanceFormatted = ethers.utils.formatUnits(balance.toString(), 18)
	console.log("balanceFormatted", balanceFormatted)

 	let stakeAmount = Number(balanceFormatted)*.9
	console.log("stakeAmount", stakeAmount)

	stakeAmount = ethers.utils.parseUnits(stakeAmount.toString(), 18)
	console.log("stakeAmount2", stakeAmount)

	await _addi.approve(_stakedAddi.address, stakeAmount)

	await _stakedAddi.stake(ownerAddress, stakeAmount);

	const DividendsController = await ethers.getContractFactory("DividendsController");
	const _dividendsController = await DividendsController.attach(dividendsControllerAddress);

	const userDividends = await _dividendsController.getAllUserRewards(ownerAddress)
	console.log("userDividends", userDividends)

}