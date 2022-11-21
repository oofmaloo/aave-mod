import hre from "hardhat";
const { ethers } = hre;

export async function deployProtocol(
  provider,
  ownerAddress,
  underlyingAddress,
  wethAddress,
  aaveLendingPoolAddress,
  aaveAddressesProviderAddress,
  aaveRewardsControllerAddress,
  aavePoolDataProviderAddress
  ) {

  console.log("deployProtocol - 001")
  console.log("deployProtocol - ownerAddress", ownerAddress)

  // Deploy Provider
  const PoolAddressesProvider = await ethers.getContractFactory("PoolAddressesProvider");
  const _poolAddressesProvider = await PoolAddressesProvider.deploy("1", ownerAddress);
  await _poolAddressesProvider.deployed();
  await _poolAddressesProvider.setACLAdmin(ownerAddress)
  // const getACLAdmin =  await _poolAddressesProvider.getACLAdmin()
  //
  console.log("deployProtocol - 002")
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const _priceOracle = await PriceOracle.deploy();
  await _priceOracle.deployed();
  await _poolAddressesProvider.setPriceOracle(_priceOracle.address)

  let tx = await _priceOracle.setAssetPrice(underlyingAddress, ethers.utils.parseUnits("1.0", 8));
  await tx.wait()
  tx = await _priceOracle.setAssetPrice(wethAddress, ethers.utils.parseUnits("1000", 8));
  await tx.wait()

  // await _priceOracle.setAssetPrice(underlyingAddress, ethers.utils.parseUnits("0.001", 18));
  // await _priceOracle.setAssetPrice(wethAddress, ethers.utils.parseUnits("1.0", 18));

  console.log("deployProtocol - 003")
  // Deploy Pool
  const ReserveLogic = await ethers.getContractFactory("ReserveLogic");
  const reserveLogic = await ReserveLogic.deploy();
  await reserveLogic.deployed();

  const ValidationLogic = await ethers.getContractFactory("ValidationLogic");
  const validationLogic = await ValidationLogic.deploy();
  await reserveLogic.deployed();

  const PoolLogic = await ethers.getContractFactory("PoolLogic");
  const poolLogic = await PoolLogic.deploy();
  await poolLogic.deployed();

  const SupplyLogic = await ethers.getContractFactory("SupplyLogic");
  const supplyLogic = await SupplyLogic.deploy();
  await supplyLogic.deployed();

  const BorrowLogic = await ethers.getContractFactory("BorrowLogic");
  const borrowLogic = await BorrowLogic.deploy();
  await borrowLogic.deployed();

  const LiquidationLogic = await ethers.getContractFactory("LiquidationLogic");
  const liquidationLogic = await LiquidationLogic.deploy();
  await liquidationLogic.deployed();

  const EModeLogic = await ethers.getContractFactory("EModeLogic");
  const eModeLogic = await EModeLogic.deploy();
  await eModeLogic.deployed();

  // const FlashLoanLogic = await ethers.getContractFactory("FlashLoanLogic")

  const FlashLoanLogic = await ethers.getContractFactory("FlashLoanLogic", {
    libraries: {
      BorrowLogic: borrowLogic.address,
    },
  });

  const flashLoanLogic = await FlashLoanLogic.deploy();
  console.log("deployProtocol - 004")
  await flashLoanLogic.deployed();

  // init
  const Pool = await ethers.getContractFactory("Pool", {
    libraries: {
      PoolLogic: poolLogic.address,
      SupplyLogic: supplyLogic.address,
      BorrowLogic: borrowLogic.address,
      FlashLoanLogic: flashLoanLogic.address,
      LiquidationLogic: liquidationLogic.address,
      EModeLogic: eModeLogic.address,
    }
  });
  const _pool = await Pool.deploy(_poolAddressesProvider.address);
  await _pool.deployed();
  await _poolAddressesProvider.setPool(_pool.address)
  //
  console.log("deployProtocol - 005")

  // const ATokenizationHelper = await ethers.getContractFactory("ATokenizationHelper");
  // const _aTokenizationHelper = await ATokenizationHelper.deploy();

  // const DebtTokenizationHelper = await ethers.getContractFactory("DebtTokenizationHelper");
  // const _debtTokenizationHelper = await DebtTokenizationHelper.deploy();

  // const TokenizationHelper = await ethers.getContractFactory("TokenizationHelper");
  // const _tokenizationHelper = await TokenizationHelper.deploy(
  //   _aTokenizationHelper.address,
  //   _debtTokenizationHelper.address
  // );
  // console.log("_tokenizationHelper:", _tokenizationHelper.address);

  // Deploy ACL Manager
  const ACLManager = await ethers.getContractFactory("ACLManager");
  const _aclManager = await ACLManager.deploy(_poolAddressesProvider.address);
  await _aclManager.deployed();
  tx = await _poolAddressesProvider.setACLManager(_aclManager.address);
  await tx.wait()

  tx = await _aclManager.addRiskAdmin(ownerAddress);
  await tx.wait()
  tx = await _aclManager.addAssetListingAdmin(ownerAddress);
  await tx.wait()
  //

  // Deploy Pool Configurator
  const ConfiguratorLogic = await ethers.getContractFactory("ConfiguratorLogic");
  const configuratorLogic = await ConfiguratorLogic.deploy();
  await configuratorLogic.deployed();

  const ATokenConfiguratorLogic = await ethers.getContractFactory("ATokenConfiguratorLogic");
  const aTokenConfiguratorLogic = await ATokenConfiguratorLogic.deploy();
  await aTokenConfiguratorLogic.deployed();

  const VariableDebtConfiguratorLogic = await ethers.getContractFactory("VariableDebtConfiguratorLogic");
  const variableDebtConfiguratorLogic = await VariableDebtConfiguratorLogic.deploy();
  await variableDebtConfiguratorLogic.deployed();

  const StableDebtConfiguratorLogic = await ethers.getContractFactory("StableDebtConfiguratorLogic");
  const stableDebtConfiguratorLogic = await StableDebtConfiguratorLogic.deploy();
  await stableDebtConfiguratorLogic.deployed();

  const VaultTokenConfiguratorLogic = await ethers.getContractFactory("VaultTokenConfiguratorLogic");
  const vaultTokenConfiguratorLogic = await VaultTokenConfiguratorLogic.deploy();
  await vaultTokenConfiguratorLogic.deployed();

  const PoolConfigurator = await ethers.getContractFactory("PoolConfigurator", {
    libraries: {
      ATokenConfiguratorLogic: aTokenConfiguratorLogic.address,
      VariableDebtConfiguratorLogic: variableDebtConfiguratorLogic.address,
      StableDebtConfiguratorLogic: stableDebtConfiguratorLogic.address,
      VaultTokenConfiguratorLogic: vaultTokenConfiguratorLogic.address
    },
  });
  const _poolConfigurator = await PoolConfigurator.deploy(_poolAddressesProvider.address);
  await _poolConfigurator.deployed();
  tx = await _poolAddressesProvider.setPoolConfigurator(_poolConfigurator.address);
  await tx.wait()
  console.log("_poolConfigurator:", _poolConfigurator.address);
  //

  // Deploy Aggregator Configurator
  const AggregatorLogic = await ethers.getContractFactory("AggregatorLogic");
  const aggregatorLogic = await AggregatorLogic.deploy();
  await aggregatorLogic.deployed();

  const AggregatorConfigurator = await ethers.getContractFactory("AggregatorConfigurator")


  const _aggregatorConfigurator = await AggregatorConfigurator.deploy(_poolAddressesProvider.address);
  await _aggregatorConfigurator.deployed();
  tx = await _poolAddressesProvider.setPoolAggregatorConfigurator(_aggregatorConfigurator.address);
  await tx.wait()
  console.log("_aggregatorConfigurator:", _aggregatorConfigurator.address);
  //


  const AaveProtocolDataProvider = await ethers.getContractFactory("AaveProtocolDataProvider");
  const _aaveProtocolDataProvider = await AaveProtocolDataProvider.deploy(_poolAddressesProvider.address);
  tx = await _poolAddressesProvider.setPoolDataProvider(_aaveProtocolDataProvider.address);
  await tx.wait()

  // 
  // prints
  console.log("Pool:", _pool.address);
  console.log("PoolAddressesProvider:", _poolAddressesProvider.address);
  console.log("AaveProtocolDataProvider:", _aaveProtocolDataProvider.address);
  console.log("EModeLogicAddress:", eModeLogic.address);
  console.log("aTokenConfiguratorLogic:", aTokenConfiguratorLogic.address);
  console.log("variableDebtConfiguratorLogic:", variableDebtConfiguratorLogic.address);
  console.log("stableDebtConfiguratorLogic:", stableDebtConfiguratorLogic.address);



  console.log("Libaries \n:");

  console.log("stableDebtConfiguratorLogic:", stableDebtConfiguratorLogic.address);


  return {
    "poolConfiguratorAddress": _poolConfigurator.address,
    "aggregatorConfiguratorAddress": _aggregatorConfigurator.address,
    "poolDataProviderAddress": _aaveProtocolDataProvider.address,
    "poolAddress": _pool.address,
    "poolAddressesProviderAddress": _poolAddressesProvider.address,
    "aclManagerAddress": _aclManager.address,
    "configuratorLogicAddress": configuratorLogic.address,
    "aggregatorLogicAddress": aggregatorLogic.address,
    "poolLogicAddress": poolLogic.address,
    "supplyLogicAddress": supplyLogic.address,
    "borrowLogicAddress": borrowLogic.address,
    "flashLoanLogicAddress": flashLoanLogic.address,
    "liquidationLogicAddress": liquidationLogic.address,
    "eModeLogicAddress": eModeLogic.address,
    "allocatorAddress": "_allocator.address",
    "aTokenConfiguratorLogicAddress": aTokenConfiguratorLogic.address,
    "variableDebtConfiguratorLogicAddress": variableDebtConfiguratorLogic.address,
    "stableDebtConfiguratorLogicAddress": stableDebtConfiguratorLogic.address,
    "vaultTokenConfiguratorLogicAddress": vaultTokenConfiguratorLogic.address
  }

}