import { Contract, utils } from "ethers";
import { ethers } from "hardhat";
import { tokens } from '../constants/tokens';
import { insertProtocolContractInJsonDb } from '../helpers/contract-helpers';
import { saveToJson, readJson } from '../../helpers/misc';

export async function setupReserves(
	assets: string[],
	account: string,
	treasury: string,
    poolDataProviderAddress: string,
    poolAddress: string,
    poolAddressesProviderAddress: string,
    aggregatorConfiguratorAddress: string,
    poolConfiguratorAddress: string,
    aclManagerAddress: string,
    routers: string[],
    strategy: boolean,
    configuratorLogicAddress: string,
    poolLogicAddress: string,
    supplyLogicAddress: string,
    borrowLogicAddress: string,
    flashLoanLogicAddress: string,
    liquidationLogicAddress: string,
    eModeLogicAddress: string,
    aTokenConfiguratorLogicAddress: string,
    variableDebtConfiguratorLogicAddress: string,
    stableDebtConfiguratorLogicAddress: string,
    dividendsVaultAddress: string,
    dividendManagerAddress: string,
    addiTokenAddress: string

) {
	const vaultTokenConfiguratorLogic = await readJson("VaultTokenConfiguratorLogic")
	const poolConfigurator = await ethers.getContractFactory("PoolConfigurator", {
		libraries: {
			ATokenConfiguratorLogic: aTokenConfiguratorLogicAddress,
			VariableDebtConfiguratorLogic: variableDebtConfiguratorLogicAddress,
			StableDebtConfiguratorLogic: stableDebtConfiguratorLogicAddress,
			VaultTokenConfiguratorLogic: vaultTokenConfiguratorLogic.address
		},
	});
	const _poolConfigurator = await poolConfigurator.attach(poolConfiguratorAddress);

	const aggregatorConfigurator = await ethers.getContractFactory("AggregatorConfigurator")

	const _aggregatorConfigurator = await aggregatorConfigurator.attach(aggregatorConfiguratorAddress);

	const pool = await ethers.getContractFactory("Pool", {
		libraries: {
			PoolLogic: poolLogicAddress,
			SupplyLogic: supplyLogicAddress,
			BorrowLogic: borrowLogicAddress,
			FlashLoanLogic: flashLoanLogicAddress,
			LiquidationLogic: liquidationLogicAddress,
			EModeLogic: eModeLogicAddress,
		},
	});
	const _pool = await pool.attach(poolAddress);

	const poolAddressesProvider = await ethers.getContractFactory("PoolAddressesProvider");
	const _poolAddressesProvider = await poolAddressesProvider.attach(poolAddressesProviderAddress);

	// stable asset
	const DefaultReserveInterestRateStrategy = await ethers.getContractFactory("DefaultReserveInterestRateStrategy");
	const _stableReserveInterestRateStrategy = await DefaultReserveInterestRateStrategy.deploy(
		_poolAddressesProvider.address,
		ethers.utils.parseUnits(".6", 27),
		"0",
		ethers.utils.parseUnits(".04", 27),
		ethers.utils.parseUnits(".6", 27),
		ethers.utils.parseUnits(".04", 27),
		ethers.utils.parseUnits(".6", 27),
		"0",
		"0",
		"0"
	);
	await _stableReserveInterestRateStrategy.deployed();

	const EmissionManager = await ethers.getContractFactory("EmissionManager");
	const _emissionManager = await EmissionManager.deploy(ethers.constants.AddressZero, account);
    saveToJson({title: "EmissionManager", address: _emissionManager.address, description: ""})

	const RewardsController = await ethers.getContractFactory("RewardsController");
	const _rewardsController = await RewardsController.deploy(_emissionManager.address);
    saveToJson({title: "RewardsController", address: _rewardsController.address, description: ""})

	await _emissionManager.setRewardsController(_rewardsController.address)

	await _emissionManager.setEmissionAdmin(addiTokenAddress, account)

	const PullRewardsTransferStrategy = await ethers.getContractFactory("PullRewardsTransferStrategy");
	const _pullRewardsTransferStrategy = await PullRewardsTransferStrategy.deploy(
		_rewardsController.address, // incentivesController
		account, // rewardsAdmin
		account // rewardsVault
	);
    saveToJson({title: "PullRewardsTransferStrategy", address: _pullRewardsTransferStrategy.address, description: ""})

	const reserveParamsUnderlying = []

	const mintableERC20 = await ethers.getContractFactory("MintableERC20");

	for (let i = 0; i < assets.length; i++) {
		await _emissionManager.setEmissionAdmin(assets[i], account)

		let _underlyingErc20 = await mintableERC20.attach(assets[i]);
		let underlyingDecimals = await _underlyingErc20.decimals();
		let underlyingName = await _underlyingErc20.name();
		let underlyingSymbol = await _underlyingErc20.symbol();
		saveToJson({title: "underlyingSymbol", address: assets[i], description: ""})

		reserveParamsUnderlying.push({
			aTokenImpl: ethers.constants.AddressZero,
			stableDebtTokenImpl: ethers.constants.AddressZero,
			variableDebtTokenImpl: ethers.constants.AddressZero,
			vaultTokenImpl: ethers.constants.AddressZero,
			underlyingAssetDecimals: underlyingDecimals,
			interestRateStrategyAddress: _stableReserveInterestRateStrategy.address,
			underlyingAsset: assets[i],
			treasury: treasury,
			incentivesController: _rewardsController.address,
			aTokenName: 'Interest Bearing ' + underlyingName,
			aTokenSymbol: 'a' + underlyingSymbol,
			variableDebtTokenName: 'Variable Debt Token ' + underlyingSymbol,
			variableDebtTokenSymbol: 'var' + underlyingSymbol,
			stableDebtTokenName: 'Stable Debt Token ' + underlyingName,
			stableDebtTokenSymbol: 'sta' + underlyingSymbol,
			vaultTokenName: 'Vault Token ' + underlyingName,
			vaultTokenSymbol: 'vault' + underlyingSymbol,
			params: []
		})
	}
	const initLiquidityReserveTx = await _poolConfigurator.initLiquidityReserves(reserveParamsUnderlying);
	initLiquidityReserveTx.wait();



	for (let i = 0; i < assets.length; i++) {
		await _poolConfigurator.configureReserveAsCollateral(
			assets[i],
			'8500', // ltv
			'9000', // liq thres
			'10500' // liq bonus (over 100%)
		);

		await _poolConfigurator.setReserveFactor(
			assets[i], 
			'500' // 0.5%
		)
		await _poolConfigurator.setRewardFactor(
			assets[i], 
			'5000' // 50% of reserveFactor
		)

		await _poolConfigurator.setDividendsVaultAddress(
			assets[i], 
			dividendsVaultAddress
		)
	}

	const initBorrowReserveTx = await _poolConfigurator.initVariableBorrowReserves(reserveParamsUnderlying);

	initBorrowReserveTx.wait();

	const initStableReserveTx = await _poolConfigurator.initStableBorrowReserves(reserveParamsUnderlying);

	initStableReserveTx.wait();

	const initVaultReserveTx = await _poolConfigurator.initVaultReserves(reserveParamsUnderlying);

	initVaultReserveTx.wait();

	for (let i = 0; i < assets.length; i++) {
		await _poolConfigurator.setReserveBorrowing(assets[i], true)
	}

	const AaveProtocolDataProvider = await ethers.getContractFactory("AaveProtocolDataProvider");
	const _aaveProtocolDataProvider = await AaveProtocolDataProvider.attach(poolDataProviderAddress);

	// add rewards

	const ONE_MILLION = '1000000'
	const tokenRewardsAmount = ethers.utils.parseUnits(ONE_MILLION, 18)

	const Addi = await ethers.getContractFactory("Addi");
	const _addi = await Addi.attach(addiTokenAddress);


	const ONE_YEAR = 31556926
	const emissionsPerSecond = Number(tokenRewardsAmount) / ONE_YEAR
	const blockNumBefore = await ethers.provider.getBlockNumber();
	const blockBefore = await ethers.provider.getBlock(blockNumBefore);
	const timestampBefore = blockBefore.timestamp;
	const distributionEnd = timestampBefore + ONE_YEAR


	const rewardsConfigInput = []
	for (let i = 0; i < assets.length; i++) {

		await _addi.approve(_pullRewardsTransferStrategy.address, tokenRewardsAmount);

		let aTokenReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(assets[i]);
		let aTokenUnderlying = aTokenReserveData[0]

		rewardsConfigInput.push({
			emissionPerSecond: emissionsPerSecond.toString(),
			totalSupply: '0',
			distributionEnd: distributionEnd,
			asset: aTokenUnderlying,
			reward: addiTokenAddress,
			transferStrategy: _pullRewardsTransferStrategy.address,
			rewardOracle: ethers.constants.AddressZero
		})
	}
	await _emissionManager.configureAssets(rewardsConfigInput)

	const aclManager = await ethers.getContractFactory("ACLManager");
	const _aclManager = await aclManager.attach(aclManagerAddress);

	const InterestRateOracle = await ethers.getContractFactory("InterestRateOracle");
	const StandardStrategy = await ethers.getContractFactory("StandardStrategy");
	const Aggregator = await ethers.getContractFactory("Aggregator")

	const owner = await ethers.provider.getSigner(0);
	const ownerAddress = await owner.getAddress();
	for (let i = 0; i < assets.length; i++) {
		let aTokenReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(assets[i]);
		let aTokenUnderlying = aTokenReserveData[0]


		const AToken = await ethers.getContractFactory("AToken");

		let _aToken = await AToken.attach(aTokenUnderlying);
		let aTokenSymbol = await _aToken.symbol();
		// store atoken
		saveToJson({
			title: aTokenSymbol, 
			address: aTokenUnderlying, 
			description: "tokenization"
		})


		let _interestRateOracleUnderlying = await InterestRateOracle.deploy(
			_poolAddressesProvider.address,
			_aclManager.address,
			assets[i],
		);

		let aggregatorInterestRateOracleTitle = aTokenSymbol + "-" + "AggregatorInterestRateOracle"

		saveToJson({title: aggregatorInterestRateOracleTitle, address: _interestRateOracleUnderlying.address, description: ""})

		/// when using multiple platforms make sure the array has 2
		await _aggregatorConfigurator.initAggregator(
			_pool.address,
			_interestRateOracleUnderlying.address,
			_aclManager.address, 
			_poolAddressesProvider.address,
			assets[i],
			aTokenUnderlying,
			routers
		)

		let avasTokenAggregatorAddress = await _aaveProtocolDataProvider.getAggregatorAddress(assets[i]);
		await _interestRateOracleUnderlying.setAggregator(avasTokenAggregatorAddress)
		let aggregatorTitle = aTokenSymbol + "-" + "Aggregator"

		saveToJson({title: aggregatorTitle, address: avasTokenAggregatorAddress, description: ""})

		let _standardStrategy = await StandardStrategy.deploy(
			avasTokenAggregatorAddress,
			ownerAddress,
			_interestRateOracleUnderlying.address
		);

		const _aggregator = await Aggregator.attach(avasTokenAggregatorAddress);
		await _aggregator.setAggregatorStrategy(_standardStrategy.address)

	}

	// dividends
	const dividendsConfigInput = []
	for (let i = 0; i < assets.length; i++) {
		let aTokenReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(assets[i]);
		let aTokenUnderlying = aTokenReserveData[0]
		dividendsConfigInput.push(
			{
				emissionPerSecond: '0',
				totalSupply: '0',
				reward: aTokenUnderlying,
				transferStrategy: ethers.constants.AddressZero
			}
		)
	}

	const DividendManager = await ethers.getContractFactory("DividendManager");
	const _dividendManager = await DividendManager.attach(dividendManagerAddress);

	await _dividendManager.configureAssets(dividendsConfigInput)

	// const usdcDividendsConfigInput = [
	// 	{
	// 		emissionPerSecond: '0',
	// 		totalSupply: '0',
	// 		reward: aTokenUnderlying,
	// 		transferStrategy: ethers.constants.AddressZero
	// 	}
	// ]

	// const wethDividendsConfigInput = [
	// 	{
	// 		emissionPerSecond: '0',
	// 		totalSupply: '0',
	// 		reward: aTokenCollateral,
	// 		transferStrategy: ethers.constants.AddressZero
	// 	}
	// ]

	// await _dividendManager.connect(owner).configureAssets(usdcDividendsConfigInput)

	// await _dividendManager.connect(owner).configureAssets(wethDividendsConfigInput)
}
