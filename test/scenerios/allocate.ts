import { loadFixture } from 'ethereum-waffle';
import { deployProtocol } from '../deploy/protocol';
import { deployRouters } from '../deploy/routers';
import { deployTokenAndDividends } from '../deploy/dividends';
import { setupReserves } from '../deploy/reserves';
import { deployAllocator } from '../deploy/allocator';
import { tokenAddressesArr, tokens } from '../constants/tokens';
import { pools } from '../constants/pools';
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { readJsonByDesc, readJson } from '../../helpers/misc';

const provider = new ethers.providers.JsonRpcProvider();


describe("allocate", function () {
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

		const { 
			routersAddresses,
			interestRateModelsAddresses
		} = await deployRouters(
			tokenAddressesArr,
			pools,
			_poolAddressesProvider.address,
			_aclManager.address
		)

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

		const {
			_allocatorManager,
			_allocatorController
		} = await deployAllocator(
			ownerAddress,
			tokenAddressesArr,
			routersAddresses,
			interestRateModelsAddresses,
			_poolAddressesProvider.address,
			dividendsVaultAddress,
			_stakedAddi.address
		)

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

	// it("function: supply() - approve failure", async function () {
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

	// 	const depositor = await provider.getSigner(3);
	// 	const depositorAddress = await depositor.getAddress();


	// 	const aTokenReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(tokenAddressesArr[0]);
	// 	const aTokenUnderlying = aTokenReserveData[0]

	// 	const AToken = await ethers.getContractFactory("AToken");
	// 	const _aToken = await AToken.attach(aTokenUnderlying);

	// 	const MintableERC20 = await ethers.getContractFactory("MintableERC20");
	// 	const _underlyingErc20 = await MintableERC20.attach(tokenAddressesArr[0]);
	// 	const underlyingDecimals = await _underlyingErc20.decimals();

	// 	const mintAmount = ethers.utils.parseUnits("10000", underlyingDecimals)
	// 	await _underlyingErc20.connect(depositor)["mint(uint256)"](mintAmount)

	// 	await expect(_pool.connect(depositor).supply(
	// 		tokenAddressesArr[0],
	// 		mintAmount,
	// 		depositorAddress,
	// 		false,
	// 		0
	// 	)).to.be.revertedWith("ERC20: transfer amount exceeds allowance");

	// });

	// it("function: supply() - asset failure", async function () {
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

	// 	const depositor = await provider.getSigner(3);
	// 	const depositorAddress = await depositor.getAddress();

	// 	const aTokenReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(tokenAddressesArr[0]);
	// 	const aTokenUnderlying = aTokenReserveData[0]

	// 	const AToken = await ethers.getContractFactory("AToken");
	// 	const _aToken = await AToken.attach(aTokenUnderlying);

	// 	const MintableERC20 = await ethers.getContractFactory("MintableERC20");
	// 	const _underlyingErc20 = await MintableERC20.attach(tokenAddressesArr[0]);
	// 	const underlyingDecimals = await _underlyingErc20.decimals();

	// 	const mintAmount = ethers.utils.parseUnits("10000", underlyingDecimals)
	// 	await _underlyingErc20.connect(depositor)["mint(uint256)"](mintAmount)

	// 	await expect(_pool.connect(depositor).supply(
	// 		_aToken.address,
	// 		mintAmount,
	// 		depositorAddress,
	// 		false,
	// 		0
	// 	)).to.be.reverted;
	// });

	it("function: allocate()", async function () {
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

		const aggregator = await readJsonByDesc("ausdcaggregator");
		const Aggregator = await ethers.getContractFactory("Aggregator");
		const _aggregator = await Aggregator.attach(aggregator);


		const routers = await _aggregator.getRoutersDataList()

		const totalBalance = await _aggregator.getBalanceStored();

		const allocator_aaveRouterAddress_percentage = 0.50;
		const allocator_aaveRouterAddress_v2_percentage = 0.50;

		// % method
		const router_1_router = ethers.utils.parseUnits("0.50", 4);
		const router_2_router = ethers.utils.parseUnits("0.50", 4);

		const allocatorSubmitParams = {
			asset: tokenAddressesArr[0],
			routers: routers,
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

		const allocatorSubmitsCount = await _allocatorController.submitsCount()

		const allocatorSubmitsQueryiD = allocatorSubmitsCount.sub(1).toString()
		let allocatorData = await _allocatorController.getAllocatorSubmit(allocatorSubmitsQueryiD);

		await _allocatorController.allocatorVote(allocatorSubmitsQueryiD, 1)

		let allocatorVote = await _allocatorController.getAllocatorVote(allocatorSubmitsQueryiD);

		await _allocatorController.executeAllocator(allocatorSubmitsQueryiD);

	});

});
