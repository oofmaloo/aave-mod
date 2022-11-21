import hre from "hardhat";

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method

const aaveLendingPool = require("../../artifacts/contracts/mocks/aave/ILendingPool.sol/ILendingPool.json");
const aaveAToken = require("../../artifacts/contracts/mocks/aave/IAToken.sol/IAToken.json");
const aaveProtocolDataProvider = require("../../artifacts/contracts/mocks/aave/IAaveProtocolDataProvider.sol/IAaveProtocolDataProvider.json");

const { ethers } = hre;

export async function setupReserve(
    provider,
    underlyingAddress,
    daiAddress,
    owner,
    ownerAddress,
    poolConfiguratorAddress,
    aggregatorConfiguratorAddress,
    poolDataProviderAddress,
    poolAddress,
    poolAddressesProviderAddress,
    aclManagerAddress,
    // [aaveRouterAddress, aaveRouterAddress_v2],
    aaveRouterAddressesses,
    configuratorLogicAddress,
    aggregatorLogicAddress,
    poolLogicAddress,
    supplyLogicAddress,
    borrowLogicAddress,
    flashLoanLogicAddress,
    liquidationLogicAddress,
    eModeLogicAddress,
    aTokenConfiguratorLogicAddress,
    variableDebtConfiguratorLogicAddress,
    stableDebtConfiguratorLogicAddress,
    vaultTokenConfiguratorLogicAddress,
    dividendsVaultAddress,
    dividendManagerAddress,
    addiTokenAddress
  ) {
  const mintableERC20 = await ethers.getContractFactory("MintableERC20");
  const _underlyingErc20 = await mintableERC20.attach(underlyingAddress);
  const underlyingDecimals = await _underlyingErc20.decimals();

  // const aaveATokenUnderlyingAddress = aaveUnderlyingAddresses[0];
  // const _aaveATokenUnderlying = await ethers.getContractAt(aaveAToken.abi, aaveATokenUnderlyingAddress, provider);

  const _dai = await mintableERC20.attach(daiAddress);

  const poolConfigurator = await ethers.getContractFactory("PoolConfigurator", {
    libraries: {
      ATokenConfiguratorLogic: aTokenConfiguratorLogicAddress,
      VariableDebtConfiguratorLogic: variableDebtConfiguratorLogicAddress,
      StableDebtConfiguratorLogic: stableDebtConfiguratorLogicAddress,
      VaultTokenConfiguratorLogic: vaultTokenConfiguratorLogicAddress
    },
  });
  const _poolConfigurator = await poolConfigurator.attach(poolConfiguratorAddress);

  const aggregatorConfigurator = await ethers.getContractFactory("AggregatorConfigurator")

  // const aggregatorConfigurator = await ethers.getContractFactory("AggregatorConfigurator", {
  //   libraries: {
  //     AggregatorLogic: aggregatorLogicAddress,
  //   },
  // });
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


  console.log("DefaultReserveInterestRateStrategy1")

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
  console.log("DefaultReserveInterestRateStrategy2")


  const EmissionManager = await ethers.getContractFactory("EmissionManager");
  const _emissionManager = await EmissionManager.deploy(ethers.constants.AddressZero, ownerAddress);

  const RewardsController = await ethers.getContractFactory("RewardsController");
  const _rewardsController = await RewardsController.deploy(_emissionManager.address);

  console.log("_rewardsController", _rewardsController.address)

  await _emissionManager.setRewardsController(_rewardsController.address)

  await _emissionManager.setEmissionAdmin(underlyingAddress, ownerAddress)

  const PullRewardsTransferStrategy = await ethers.getContractFactory("PullRewardsTransferStrategy");
  const _pullRewardsTransferStrategy = await PullRewardsTransferStrategy.deploy(
    _rewardsController.address, // incentivesController
    ownerAddress, // rewardsAdmin
    ownerAddress // rewardsVault
  );

  const reserveParamsUnderlying = [
    {
      aTokenImpl: ethers.constants.AddressZero,
      stableDebtTokenImpl: ethers.constants.AddressZero,
      variableDebtTokenImpl: ethers.constants.AddressZero,
      vaultTokenImpl: ethers.constants.AddressZero,
      underlyingAssetDecimals: 6,
      interestRateStrategyAddress: _stableReserveInterestRateStrategy.address,
      underlyingAsset: underlyingAddress,
      treasury: ownerAddress,
      incentivesController: _rewardsController.address,
      aTokenName: 'Interest Bearing USDC',
      aTokenSymbol: 'aUSDC',
      variableDebtTokenName: 'Variable Debt Token USDC',
      variableDebtTokenSymbol: 'varUSDC',
      stableDebtTokenName: 'Stable Debt Token USDC',
      stableDebtTokenSymbol: 'staUSDC',
      vaultTokenName: 'Vault Token USDC',
      vaultTokenSymbol: 'vaultUSDC',
      params: 0,
    }
  ]

  const initLiquidityReserveTx = await _poolConfigurator.initLiquidityReserves(reserveParamsUnderlying);

  initLiquidityReserveTx.wait();

  const initVaultReserveTx = await _poolConfigurator.initVaultReserves(reserveParamsUnderlying);

  initVaultReserveTx.wait();

  console.log("DefaultReserveInterestRateStrategy3")

  await _poolConfigurator.configureReserveAsCollateral(
    underlyingAddress,
    '8500', // ltv
    '9000', // liq thres
    '10500' // liq bonus (over 100%)
  );

  await _poolConfigurator.setReserveFactor(
    underlyingAddress, 
    '500' // 0.5%
  )
  await _poolConfigurator.setRewardFactor(
    underlyingAddress, 
    '5000' // 50% of reserveFactor
  )

  await _poolConfigurator.setDividendsVaultAddress(
    underlyingAddress, 
    dividendsVaultAddress // vault that holds aTokens --- testing ownerAddress as vault but use multi owner in prod
  )

  console.log("DefaultReserveInterestRateStrategy4")

  const initBorrowReserveTx = await _poolConfigurator.initVariableBorrowReserves(reserveParamsUnderlying);

  initBorrowReserveTx.wait();
  console.log("DefaultReserveInterestRateStrategy5")

  const initStableReserveTx = await _poolConfigurator.initStableBorrowReserves(reserveParamsUnderlying);

  initStableReserveTx.wait();

  await _poolConfigurator.setReserveBorrowing(underlyingAddress, true)



  const AaveProtocolDataProvider = await ethers.getContractFactory("AaveProtocolDataProvider");
  const _aaveProtocolDataProvider = await AaveProtocolDataProvider.attach(poolDataProviderAddress);

  const aTokenReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(underlyingAddress);
  const aTokenUnderlying = aTokenReserveData[0]

  console.log("aTokenReserveData", aTokenReserveData)
  console.log("aTokenUnderlying", aTokenUnderlying)


  // add rewards

  // mint 1,000,000 ETH to owner 
  // owner is mocking as rewards vault

  const ONE_MILLION = '1000000'
  const tokenRewardsAmount = ethers.utils.parseUnits(ONE_MILLION, 18)

  const Addi = await ethers.getContractFactory("Addi");
  const _addi = await Addi.attach(addiTokenAddress);

  await _addi.connect(owner).approve(_pullRewardsTransferStrategy.address, tokenRewardsAmount);

  const ONE_YEAR = 31556926 
  const usdcEmissionsPerSecond = tokenRewardsAmount / ONE_YEAR
  console.log("usdcEmissionsPerSecond", usdcEmissionsPerSecond)

  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  const timestampBefore = blockBefore.timestamp;
  console.log("timestampBefore", timestampBefore)
  const usdcDistributionEnd = timestampBefore + ONE_YEAR
  console.log("usdcDistributionEnd", usdcDistributionEnd)

  const usdcRewardsConfigInput = [
    {
      emissionPerSecond: usdcEmissionsPerSecond.toString(),
      totalSupply: '0',
      distributionEnd: usdcDistributionEnd,
      asset: aTokenUnderlying,
      reward: addiTokenAddress,
      transferStrategy: _pullRewardsTransferStrategy.address,
      rewardOracle: ethers.constants.AddressZero,
    }
  ]
  console.log("setEmissionAdmin")

  await _emissionManager.setEmissionAdmin(addiTokenAddress, ownerAddress)
  console.log("configureAssets")

  await _emissionManager.connect(owner).configureAssets(usdcRewardsConfigInput)


  const aclManager = await ethers.getContractFactory("ACLManager");
  const _aclManager = await aclManager.attach(aclManagerAddress);

  const InterestRateOracle = await ethers.getContractFactory("InterestRateOracle");
  const interestRateOracleUnderlying = await InterestRateOracle.deploy(
    _poolAddressesProvider.address,
    _aclManager.address,
    underlyingAddress,
  );
  console.log("interestRateOracleUnderlying", interestRateOracleUnderlying.address)
  console.log("aaveRouterAddressesses", aaveRouterAddressesses)

  /// when using multiple platforms make sure the array has 2
  await _aggregatorConfigurator.initAggregator(
    _pool.address,
    interestRateOracleUnderlying.address,
    _aclManager.address, 
    _poolAddressesProvider.address,
    underlyingAddress,
    aTokenUnderlying,
    // [aaveRouterAddress, aaveRouterAddress_v2]
    aaveRouterAddressesses
  )

  console.log("DefaultReserveInterestRateStrategy6")

  const avasTokenAggregatorAddress = await _aaveProtocolDataProvider.getAggregatorAddress(underlyingAddress);
  console.log("avasTokenAggregatorAddress for", underlyingAddress, ": ", avasTokenAggregatorAddress)

  await interestRateOracleUnderlying.setAggregator(avasTokenAggregatorAddress)

  const StandardStrategy = await ethers.getContractFactory("StandardStrategy");
  const _usdcStandardStrategy = await StandardStrategy.deploy(
    avasTokenAggregatorAddress,
    ownerAddress,
    interestRateOracleUnderlying.address
  );

  
  const usdcAggregator = await ethers.getContractFactory("Aggregator")

  const _usdcAggregator = await usdcAggregator.attach(avasTokenAggregatorAddress);

  await _usdcAggregator.setAggregatorStrategy(_usdcStandardStrategy.address)


  const reserveParamsDai = [
    {
      aTokenImpl: ethers.constants.AddressZero,
      stableDebtTokenImpl: ethers.constants.AddressZero,
      variableDebtTokenImpl: ethers.constants.AddressZero,
      vaultTokenImpl: ethers.constants.AddressZero,
      underlyingAssetDecimals: 18,
      interestRateStrategyAddress: _stableReserveInterestRateStrategy.address,
      underlyingAsset: daiAddress,
      treasury: ownerAddress,
      incentivesController: _rewardsController.address,
      aTokenName: 'Interest Bearing WETH',
      aTokenSymbol: 'aWETH',
      variableDebtTokenName: 'Variable Debt Token WETH',
      variableDebtTokenSymbol: 'varWETH',
      stableDebtTokenName: 'Stable Debt Token WETH',
      stableDebtTokenSymbol: 'staWETH',
      vaultTokenName: 'Vault Token WETH',
      vaultTokenSymbol: 'vaultWETH',
      params: 0,
    }
  ]

  const initDaiReserveTx = await _poolConfigurator.initLiquidityReserves(reserveParamsDai);

  initDaiReserveTx.wait();

  const initDaiBorrowReserveTx = await _poolConfigurator.initVariableBorrowReserves(reserveParamsDai);

  initDaiBorrowReserveTx.wait();

  const initDaiStableReserveTx = await _poolConfigurator.initStableBorrowReserves(reserveParamsDai);

  initDaiStableReserveTx.wait();

  await _poolConfigurator.configureReserveAsCollateral(
    daiAddress,
    ethers.utils.parseUnits(".7", 4), // ltv,
    ethers.utils.parseUnits(".9", 4), // liquidationThreshold,
    ethers.utils.parseUnits("1.05", 4), // liquidationBonus
  );

  await _poolConfigurator.setReserveFactor(
    daiAddress, 
    '500' // 0.5%
  )
  await _poolConfigurator.setRewardFactor(
    daiAddress, 
    '5000' // 50% of reserveFactor
  )
  await _poolConfigurator.setDividendsVaultAddress(
    daiAddress, 
    dividendsVaultAddress // vault that holds aTokens --- testing ownerAddress as vault but use multi owner in prod
  )



  await _poolConfigurator.setReserveBorrowing(daiAddress, true)


  const avasCollateralUnderlyingAddress = await _aaveProtocolDataProvider.getReserveTokensAddresses(daiAddress);
  const aTokenCollateral = avasCollateralUnderlyingAddress[0]

  console.log("avasCollateralUnderlyingAddress", avasCollateralUnderlyingAddress)

  console.log("aTokenCollateral", aTokenCollateral)

  const interestRateOracleCollateral = await InterestRateOracle.deploy(
    _poolAddressesProvider.address,
    _aclManager.address,
    daiAddress,
  );

  await _aggregatorConfigurator.initAggregator(
    _pool.address,
    interestRateOracleCollateral.address,
    _aclManager.address, 
    _poolAddressesProvider.address,
    daiAddress,
    aTokenCollateral,
    // [aaveRouterAddress, aaveRouterAddress_v2]
    aaveRouterAddressesses
  )

  const colAvasTokenAggregatorAddress = await _aaveProtocolDataProvider.getAggregatorAddress(daiAddress);
  console.log("colAvasTokenAggregatorAddress", colAvasTokenAggregatorAddress)

  await interestRateOracleCollateral.setAggregator(colAvasTokenAggregatorAddress)

  const DaiStandardStrategy = await ethers.getContractFactory("StandardStrategy");
  const _daiStandardStrategy = await DaiStandardStrategy.deploy(
    colAvasTokenAggregatorAddress,
    ownerAddress,
    interestRateOracleCollateral.address
  );

  
  const daiAggregator = await ethers.getContractFactory("Aggregator")

  const _daiAggregator = await daiAggregator.attach(colAvasTokenAggregatorAddress);

  await _daiAggregator.setAggregatorStrategy(_daiStandardStrategy.address)





  // reapprove for aDai
  await _addi.connect(owner).approve(_pullRewardsTransferStrategy.address, tokenRewardsAmount);

  const daiRewardsConfigInput = [
    {
      emissionPerSecond: usdcEmissionsPerSecond.toString(),
      totalSupply: '0',
      distributionEnd: usdcDistributionEnd,
      asset: aTokenCollateral,
      reward: addiTokenAddress,
      transferStrategy: _pullRewardsTransferStrategy.address,
      rewardOracle: ethers.constants.AddressZero,
    }
  ]

  await _emissionManager.connect(owner).configureAssets(daiRewardsConfigInput)
 

  // dividends
  console.log("dividends")

  const DividendManager = await ethers.getContractFactory("DividendManager");
  const _dividendManager = await DividendManager.attach(dividendManagerAddress);

  console.log("dividends _dividendManager", _dividendManager.address)

  const usdcDividendsConfigInput = [
    {
      emissionPerSecond: '0',
      totalSupply: '0',
      reward: aTokenUnderlying,
      transferStrategy: ethers.constants.AddressZero
    }
  ]

  const daiDividendsConfigInput = [
    {
      emissionPerSecond: '0',
      totalSupply: '0',
      reward: aTokenCollateral,
      transferStrategy: ethers.constants.AddressZero
    }
  ]

  console.log("dividends 1")

  await _dividendManager.connect(owner).configureAssets(usdcDividendsConfigInput)

  console.log("dividends 2")

  await _dividendManager.connect(owner).configureAssets(daiDividendsConfigInput)

  console.log("dividends 3")
  console.log("avasTokenAggregatorAddress", avasTokenAggregatorAddress)

  return {
    "avasTokenAggregatorAddress": avasTokenAggregatorAddress
  }
}