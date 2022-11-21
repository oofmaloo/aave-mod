import { ethers } from "hardhat";
import { Contract } from "ethers";
import { getDb } from './misc-utils';
import { readJsonByDesc, readJson } from '../../helpers/misc';
const aaveLendingPool = require("../../artifacts/contracts/mocks/aave/ILendingPool.sol/ILendingPool.json");


export const insertProtocolContractInJsonDb = async (contractName: string, contractInstance: Contract) => {
	const db = await getDb()
	console.log(db)
	// db.data ||= { posts: [] }             // Node >= 15.x

	// // Create and query items using plain JS
	// db.data.posts.push('hello world')
	// const firstPost = db.data.posts[0]
	// console.log(firstPost)

	// db.data ||= { protocol: [] }
	// const { posts } = db.data
	// posts.push('hello world')

	// db.read()
	// db.data ||= { protocol: [] }
	// db.data.protocol
	// 	.push({
	// 		name: contractName,
	// 		address: contractInstance.address
	// 	})
	// db.write();

};


// export const insertMockTokensContractInJsonDb = async (
// 	contractName: string,
// 	contractAbbr: string,
// 	contractInstance: Contract
// ) => {
	
// 	await getDb()
// 		.data.tokens
// 		.push({
// 			name: contractName,
// 			abbr: contractAbbr,
// 			address: contractInstance.addres
// 		})
// 		.write();
// };

export const updateAaveInterestRate = async (routerAddress: string, depositAsset: string, borrowAsset: string, increase: boolean) => {

	const aave_depositor = await ethers.provider.getSigner(3);
	const aave_depositorAddress = await aave_depositor.getAddress();
	const aave_borrower = await ethers.provider.getSigner(4);
	const aave_borrowerAddress = await aave_borrower.getAddress();

	// const aaveRouter = await readJson("AaveRouter");
	const AaveRouterTest = await ethers.getContractFactory("AaveRouterTest");
	const _aaveRouter = await AaveRouterTest.attach(routerAddress);
	const currentInterestRate = await _aaveRouter.getPreviousInterestRate(borrowAsset);

	const aaveLendingPoolAddress = await _aaveRouter.getRouterPool()
	const _aaveLendingPool = await ethers.getContractAt(aaveLendingPool.abi, aaveLendingPoolAddress, aave_depositor);
	console.log("_aaveLendingPool", _aaveLendingPool.address)

	const liquidity = await _aaveRouter.getLiquidity(borrowAsset);
	console.log("liquidity", liquidity)

	const borrowAmount = Number(Number(ethers.utils.formatUnits(liquidity, "6")) * .9).toFixed(0)
	console.log("borrowAmount", borrowAmount)
	const borrowAmountConverted = ethers.utils.parseUnits(borrowAmount, "6")
	// const borrowAmount = 0
	const depositAmount = 0;

	if (increase) {
		console.log("increase", increase)
		console.log("borrowAsset", borrowAsset)
		console.log("aave_borrowerAddress", aave_borrowerAddress)

		await _aaveLendingPool.connect(aave_borrower).borrow(
			borrowAsset,
			borrowAmountConverted,
			"2",
			"0",
			aave_borrowerAddress
		);
	} else {
		await _aaveLendingPool.connect(aave_depositor).deposit(
			depositAsset,
			depositAmount,
			aave_depositorAddress,
			"0"
		);
	}
};
