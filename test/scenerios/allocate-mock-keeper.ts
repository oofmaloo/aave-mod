import { loadFixture } from 'ethereum-waffle';
import { deployProtocol } from '../deploy/protocol';
import { deployRouters } from '../deploy/routers';
import { deployTokenAndDividends } from '../deploy/dividends';
import { setupReserves } from '../deploy/reserves';
import { deployMockAllocatorKeeper } from '../deploy/allocator-mock-keeper';
import { tokenAddressesArr, tokens } from '../constants/tokens';
import { pools } from '../constants/pools';
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { readJsonByDesc, readJson } from '../../helpers/misc';
import { updateAaveInterestRate } from '../helpers/contract-helpers';



const provider = new ethers.providers.JsonRpcProvider();


describe("allocate-mock-keeper", function () {
	async function deploy() {
		const owner = await provider.getSigner(0);
		const ownerAddress = await owner.getAddress();
		const treasury = await provider.getSigner(1);
		const treasuryAddress = await treasury.getAddress();
		const dividendsVault = await provider.getSigner(2);
		const dividendsVaultAddress = await dividendsVault.getAddress();

		const {
			_poolAddressesProvider,
			_priceOracle,
			_pool,
			_aclManager,
			_poolConfigurator,
			_aaveProtocolDataProvider,
			_aggregatorConfigurator,
			poolLogicAddress,
			supplyLogicAddress,
			borrowLogicAddress,
			flashLoanLogicAddress,
			liquidationLogicAddress,
			eModeLogicAddress,
			configuratorLogicAddress,
			aTokenConfiguratorLogicAddress,
			variableDebtConfiguratorLogicAddress,
			stableDebtConfiguratorLogicAddress
		} =  await deployProtocol(ownerAddress);
		console.log("- deployProtocol")

		const { 
			routersAddresses,
			interestRateModelsAddresses
		} = await deployRouters(
			tokenAddressesArr,
			pools,
			_poolAddressesProvider.address,
			_aclManager.address
		)
		console.log("- deployRouters")

		const {
			_dividendManager,
			_dividendsController,
			_stakedAddi,
			_addi
		} = await deployTokenAndDividends(
			ownerAddress,
			_poolAddressesProvider.address,
			dividendsVaultAddress
		)
		console.log("- deployTokenAndDividends")

		await setupReserves(
			tokenAddressesArr,
			ownerAddress,
			treasuryAddress,
			_aaveProtocolDataProvider.address,
			_pool.address,
			_poolAddressesProvider.address,
			_aggregatorConfigurator.address,
			_poolConfigurator.address,
			_aclManager.address,
			routersAddresses,
			true,
			configuratorLogicAddress,
			poolLogicAddress,
			supplyLogicAddress,
			borrowLogicAddress,
			flashLoanLogicAddress,
			liquidationLogicAddress,
			eModeLogicAddress,
			aTokenConfiguratorLogicAddress,
			variableDebtConfiguratorLogicAddress,
			stableDebtConfiguratorLogicAddress,
			dividendsVaultAddress,
			_dividendManager.address,
			_addi.address
		)
		console.log("- setupReserves")

		const {
			_allocatorManager,
			_allocatorController
		} = await deployMockAllocatorKeeper(
			ownerAddress,
			tokenAddressesArr,
			routersAddresses,
			interestRateModelsAddresses,
			_poolAddressesProvider.address
		)
		console.log("- deployMockAllocatorKeeper")

		return {
			_poolAddressesProvider,
			_priceOracle,
			_pool,
			_aclManager,
			_poolConfigurator,
			_aaveProtocolDataProvider,
			_allocatorManager,
			_allocatorController
		}
	}

  it("function: supply()", async function () {
    const {
      _poolAddressesProvider,
      _priceOracle,
      _pool,
      _aclManager,
      _poolConfigurator,
      _aaveProtocolDataProvider
    } = await loadFixture(deploy);

    const depositor = await provider.getSigner(3);
    const depositorAddress = await depositor.getAddress();

    const tokenAddress = tokenAddressesArr[0]

    const token = tokens.find(obj => obj.address == tokenAddress)

    const aggregatorTitle = "a" + token?.name + "-" + "Aggregator"
    const aggregatorData = await readJson(aggregatorTitle)


    const Aggregator = await ethers.getContractFactory("Aggregator");
    const _aggregator = await Aggregator.attach(aggregatorData.address);

    let aggregatorBalance = await _aggregator.getBalanceStored();
    expect(aggregatorBalance).to.equal('0');

    let aggregatorStoredBalance = await _aggregator.balance();
    expect(aggregatorStoredBalance).to.equal(aggregatorBalance);

    let routerRates = await _aggregator.getRouterRates()

    const aTokenReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(tokenAddress);
    const aTokenUnderlying = aTokenReserveData[0]

    const AToken = await ethers.getContractFactory("AToken");
    const _aToken = await AToken.attach(aTokenUnderlying);
    let aTokenBalance = await _aToken.balanceOf(depositorAddress);

    expect(aTokenBalance).to.equal('0');

    const MintableERC20 = await ethers.getContractFactory("MintableERC20");
    const _underlyingErc20 = await MintableERC20.attach(tokenAddress);
    const underlyingDecimals = await _underlyingErc20.decimals();

    const mintAmount = ethers.utils.parseUnits("10000", underlyingDecimals)
    await _underlyingErc20.connect(depositor)["mint(uint256)"](mintAmount);
    await _underlyingErc20.connect(depositor).approve(_pool.address, mintAmount);

    await _pool.connect(depositor).supply(
      tokenAddress,
      mintAmount,
      depositorAddress,
      false,
      0
    )
    aTokenBalance = await _aToken.balanceOf(depositorAddress);

    expect(aTokenBalance).to.equal(mintAmount);

    aggregatorBalance = await _aggregator.getBalanceStored();
    expect(aggregatorBalance).to.be.at.least(mintAmount);

    aggregatorStoredBalance = await _aggregator.balance();
    expect(aggregatorStoredBalance).to.equal(aggregatorBalance);

    const reserveData = await _aaveProtocolDataProvider.getReserveData(tokenAddress)

    routerRates = await _aggregator.getRouterRates()
  });

	// it("function: allocate() - tokenAddressesArr[0]", async function () {
	// 	const {
	// 		_poolAddressesProvider,
	// 		_priceOracle,
	// 		_pool,
	// 		_aclManager,
	// 		_poolConfigurator,
	// 		_aaveProtocolDataProvider,
	// 		_allocatorManager,
	// 		_allocatorController
	// 	} = await loadFixture(deploy);

 //    const depositor = await provider.getSigner(3);
 //    const depositorAddress = await depositor.getAddress();

 //    const tokenAddress = tokenAddressesArr[0]
 //    const token = tokens.find(obj => obj.address == tokenAddress)

 //    const aggregatorTitle = "a" + token?.name + "-" + "Aggregator"
 //    const aggregatorData = await readJson(aggregatorTitle)
 //    const Aggregator = await ethers.getContractFactory("Aggregator");
 //    const _aggregator = await Aggregator.attach(aggregatorData.address);

	// 	const beforeRouterWeightedInterestRate = await _aggregator.getRouterWeightedInterestRate()
	// 	console.log("beforeRouterWeightedInterestRate", beforeRouterWeightedInterestRate)

	// 	const routers = await _aggregator.getRoutersDataList()
	// 	console.log("routers", routers)

 //    const AaveRouterTest = await ethers.getContractFactory("AaveRouterTest");
	// 	for (let i = 0; i < routers.length; i++) {
	// 	    let _router = await AaveRouterTest.attach(routers[i]);

	// 			let rate = await _router.getPreviousInterestRate(tokenAddressesArr[0])
	// 			console.log("rate", rate)

	// 	    let balance = await _router.getBalanceStored(tokenAddressesArr[0], _aggregator.address);
	// 	    console.log("balance", balance)
	// 	    if (balance == 0) {
	// 				await updateAaveInterestRate(
	// 					routers[i],
	// 					tokenAddressesArr[1], 
	// 					tokenAddressesArr[0], 
	// 					true
	// 				)
	// 	    }
	// 	}

	// 	// check if rate changed
	// 	await (ethers.provider as any).send("evm_increaseTime", [100]);
	// 	await (ethers.provider as any).send('evm_mine');
	// 	for (let i = 0; i < routers.length; i++) {
	//     let _router = await AaveRouterTest.attach(routers[i]);

	// 		let rate = await _router.getPreviousInterestRate(tokenAddressesArr[0])
	// 		console.log("rate", rate)
	// 	}


	// 	// let minYieldIncrease = await _allocatorController.getMinYieldIncrease(tokenAddressesArr[0])
	// 	// console.log("minYieldIncrease", minYieldIncrease)

	// 	// let getMinYieldIncreaseTx = await _allocatorController.getMinYieldIncreaseTx(tokenAddressesArr[0])
	// 	// console.log("getMinYieldIncreaseTx", getMinYieldIncreaseTx)


	// 	const totalBalance = await _aggregator.getBalanceStored();
	// 	console.log("totalBalance", totalBalance)

	// 	const allocator_aaveRouterAddress_percentage = 0.50;
	// 	const allocator_aaveRouterAddress_v2_percentage = 0.50;

	// 	// % method
	// 	const router_1_router = ethers.utils.parseUnits("0.33", 4);
	// 	const router_2_router = ethers.utils.parseUnits("0.33", 4);
	// 	const router_3_router = ethers.utils.parseUnits("0.33", 4);
	// 	const router_4_router = ethers.utils.parseUnits("0.01", 4);

	// 	const allocatorSubmitParams = {
	// 		asset: tokenAddressesArr[0],
	// 		routers: [routers[0], routers[1], routers[2], routers[3]],
	// 		ladderPercentages: [router_1_router, router_2_router, router_3_router, router_4_router],
	// 		caller: ethers.constants.AddressZero,
	// 		aggregator: ethers.constants.AddressZero,
	// 		currentTotalBalance: '0',
	// 		currentWeightedBalance: '0',
	// 		simulatedWeightedBalance: '0',
	// 		totalRoutedBalance: '0',
	// 		routersCount: '0'
	// 	}

	// 	// await _allocatorController.allocatorSubmit(allocatorSubmitParams);

	// 	// const allocatorSubmitsCount = await _allocatorController.allocatorSubmitsCount(tokenAddressesArr[0])
	// 	// console.log("allocatorSubmitsCount", allocatorSubmitsCount)

	// 	// // const allocatorSubmitsQueryiD = allocatorSubmitsCount.sub(1).toString()
	// 	// let allocatorData = await _allocatorController.getLastAllocatorSubmit(tokenAddressesArr[0]);
	// 	// console.log("allocatorData", allocatorData)

	// 	// const allocatorChecker = await _allocatorController.allocatorChecker(tokenAddressesArr[0]);
	// 	// console.log("allocatorChecker", allocatorChecker)
	// 	const allocatorChecker = await _allocatorController.allocatorParamsChecker(allocatorSubmitParams);
	// 	console.log("allocatorChecker", allocatorChecker)

	// 	// const allocatorChecker = true
	// 	// increase timestamp to be greater than executeTimeRequirement
	// 	await (ethers.provider as any).send("evm_increaseTime", [2]);
	// 	await (ethers.provider as any).send('evm_mine');

	// 	if (allocatorChecker) {
	// 		console.log("executeAllocator")
	// 		// let tx = await _allocatorController.executeAllocator(tokenAddressesArr[0], 0);
	// 		// let tx = await _allocatorController.submitAndExecuteAllocator(allocatorSubmitParams);
	// 		let tx = await _allocatorController.execute(allocatorSubmitParams);
	// 		const receipt = await tx.wait();
	// 		const effectiveGasPrice = receipt.effectiveGasPrice
	// 		const cumulativeGasUsed = receipt.cumulativeGasUsed
	// 		const gasCostForTxn = cumulativeGasUsed.mul(effectiveGasPrice)
	// 		const gasCostForTxnUsd = cumulativeGasUsed.mul(effectiveGasPrice)* 1000
	// 		console.log('gasCostForTxnUsd:', ethers.utils.formatEther(gasCostForTxn.toString()) )
	// 		console.log('gasCostForTxnUsd:', ethers.utils.formatEther(gasCostForTxnUsd.toString()) )
	// 	} else {
	// 		console.log("new execution isn't better")
	// 	}

	// 	// // accrue with a deposit
 //  //   const MintableERC20 = await ethers.getContractFactory("MintableERC20");
 //  //   const _underlyingErc20 = await MintableERC20.attach(tokenAddress);
 //  //   const underlyingDecimals = await _underlyingErc20.decimals();

 //  //   const mintAmount = ethers.utils.parseUnits("10000", underlyingDecimals)
 //  //   await _underlyingErc20.connect(depositor)["mint(uint256)"](mintAmount);
 //  //   await _underlyingErc20.connect(depositor).approve(_pool.address, mintAmount);

	// 	// await (ethers.provider as any).send("evm_increaseTime", [50000]);
	// 	// await (ethers.provider as any).send('evm_mine');

 //  //   await _pool.connect(depositor).supply(
 //  //     tokenAddress,
 //  //     mintAmount,
 //  //     depositorAddress,
 //  //     false,
 //  //     0
 //  //   );
 //  //   // accrue with a deposit


	// 	// if (allocatorChecker) {
	// 	// 	console.log("executeAllocator")
	// 	// 	// let tx = await _allocatorController.executeAllocator(tokenAddressesArr[0], 0);
	// 	// 	// let tx = await _allocatorController.submitAndExecuteAllocator(allocatorSubmitParams);
	// 	// 	let tx = await _allocatorController.execute(allocatorSubmitParams);
	// 	// 	const receipt = await tx.wait();
	// 	// 	const effectiveGasPrice = receipt.effectiveGasPrice
	// 	// 	const cumulativeGasUsed = receipt.cumulativeGasUsed
	// 	// 	const gasCostForTxn = cumulativeGasUsed.mul(effectiveGasPrice)
	// 	// 	const gasCostForTxnUsd = cumulativeGasUsed.mul(effectiveGasPrice)* 1000
	// 	// 	console.log('gasCostForTxnUsd:', ethers.utils.formatEther(gasCostForTxn.toString()) )
	// 	// 	console.log('gasCostForTxnUsd:', ethers.utils.formatEther(gasCostForTxnUsd.toString()) )
	// 	// } else {
	// 	// 	console.log("new execution isn't better")
	// 	// }

	// 	// const afterRouterWeightedInterestRate = await _aggregator.getRouterWeightedInterestRate()
	// 	// console.log("beforeRouterWeightedInterestRate", beforeRouterWeightedInterestRate)
	// 	// console.log("afterRouterWeightedInterestRate ", afterRouterWeightedInterestRate)

	// 	// minYieldIncrease = await _allocatorController.getMinYieldIncrease(tokenAddressesArr[0])
	// 	// console.log("minYieldIncrease", minYieldIncrease)

 //    // let getMinYieldIncreaseTx = await expect(_allocatorController.getMinYieldIncreaseTx(tokenAddressesArr[0])).to.be.reverted

	// 	// let getMinYieldIncreaseTx = await _allocatorController.getMinYieldIncreaseTx(tokenAddressesArr[0])
	// 	// console.log("getMinYieldIncreaseTx", getMinYieldIncreaseTx)

	// });

	it("function: allocate() - tokenAddressesArr[0]", async function () {
		const {
			_poolAddressesProvider,
			_priceOracle,
			_pool,
			_aclManager,
			_poolConfigurator,
			_aaveProtocolDataProvider,
			_allocatorManager,
			_allocatorController
		} = await loadFixture(deploy);

    const depositor = await provider.getSigner(3);
    const depositorAddress = await depositor.getAddress();

    const tokenAddress = tokenAddressesArr[0]
    const token = tokens.find(obj => obj.address == tokenAddress)

    const aggregatorTitle = "a" + token?.name + "-" + "Aggregator"
    const aggregatorData = await readJson(aggregatorTitle)
    const Aggregator = await ethers.getContractFactory("Aggregator");
    const _aggregator = await Aggregator.attach(aggregatorData.address);

		const beforeRouterWeightedInterestRate = await _aggregator.getRouterWeightedInterestRate()
		console.log("beforeRouterWeightedInterestRate", beforeRouterWeightedInterestRate)

		const routers = await _aggregator.getRoutersDataList()
		console.log("routers", routers)

		const bestRatios = await _allocatorController.getBestRatios(tokenAddress);
		console.log("bestRatios", bestRatios)

	});
});
