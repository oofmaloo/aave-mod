import { Contract, utils } from "ethers";
import { ethers } from "hardhat";
import { tokens } from '../constants/tokens';
import { insertProtocolContractInJsonDb } from '../helpers/contract-helpers';
import { resetJsonFile, saveToJson } from '../../helpers/misc';

export async function deployProtocol(account: string) {
    await resetJsonFile()
	// const db = await getDb();
	// const provider = new ethers.providers.JsonRpcProvider();
	// const accounts = await provider.listAccounts()

	// const owner = await provider.getSigner(0);
    // const ownerAddress = await owner.getAddress()
    // console.log('ownerAddress', ownerAddress)
    // const acc = await accounts
    //   console.log('acc', acc['ownerAddress'])

    // Deploy Provider
    const PoolAddressesProvider = await ethers.getContractFactory("PoolAddressesProvider");
    const _poolAddressesProvider = await PoolAddressesProvider.deploy("1", account);

    saveToJson({title: "PoolAddressesProvider", address: _poolAddressesProvider.address, description: ""})
    // await insertProtocolContractInJsonDb("PoolAddressesProvider", _poolAddressesProvider)
    // db.data.tokens
    // 	.push({
    // 		name: "PoolAddressesProvider",
    // 		address: _poolAddressesProvider.address
    // 	})
    // 	.write();

    await _poolAddressesProvider.deployed();
    await _poolAddressesProvider.setACLAdmin(account)
    const getACLAdmin =  await _poolAddressesProvider.getACLAdmin()
    //

    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    const _priceOracle = await PriceOracle.deploy();
    saveToJson({title: "PriceOracle", address: _priceOracle.address, description: ""})
    await _poolAddressesProvider.setPriceOracle(_priceOracle.address)


    for (let i = 0; i < tokens.length; i++) {
        await _priceOracle.setAssetPrice(tokens[i].address, ethers.utils.parseUnits(tokens[i].price, 8));
        await _priceOracle.setAssetEthPrice(tokens[i].address, ethers.utils.parseUnits(tokens[i].ethPrice, 18));
    }

    // Deploy Pool
    const ReserveLogic = await ethers.getContractFactory("ReserveLogic");
    const reserveLogic = await ReserveLogic.deploy();
    saveToJson({title: "ReserveLogic", address: reserveLogic.address, description: ""})

    const ValidationLogic = await ethers.getContractFactory("ValidationLogic");
    const validationLogic = await ValidationLogic.deploy();
    saveToJson({title: "ValidationLogic", address: validationLogic.address, description: ""})
    const PoolLogic = await ethers.getContractFactory("PoolLogic");
    const poolLogic = await PoolLogic.deploy();
    saveToJson({title: "PoolLogic", address: poolLogic.address, description: ""})

    const SupplyLogic = await ethers.getContractFactory("SupplyLogic");
    const supplyLogic = await SupplyLogic.deploy();
    saveToJson({title: "SupplyLogic", address: supplyLogic.address, description: ""})

    const BorrowLogic = await ethers.getContractFactory("BorrowLogic");
    const borrowLogic = await BorrowLogic.deploy();
    saveToJson({title: "BorrowLogic", address: borrowLogic.address, description: ""})

    const LiquidationLogic = await ethers.getContractFactory("LiquidationLogic");
    const liquidationLogic = await LiquidationLogic.deploy();
    saveToJson({title: "LiquidationLogic", address: liquidationLogic.address, description: ""})

    const EModeLogic = await ethers.getContractFactory("EModeLogic");
    const eModeLogic = await EModeLogic.deploy();
    saveToJson({title: "EModeLogic", address: eModeLogic.address, description: ""})

    const FlashLoanLogic = await ethers.getContractFactory("FlashLoanLogic", {
        libraries: {
            BorrowLogic: borrowLogic.address,
        },
    });

    const flashLoanLogic = await FlashLoanLogic.deploy();
    saveToJson({title: "FlashLoanLogic", address: flashLoanLogic.address, description: ""})

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
    saveToJson({title: "Pool", address: _pool.address, description: ""})
    await _poolAddressesProvider.setPool(_pool.address)


    // Deploy ACL Manager
    const ACLManager = await ethers.getContractFactory("ACLManager");
    const _aclManager = await ACLManager.deploy(_poolAddressesProvider.address);
    await _aclManager.deployed();
    saveToJson({title: "ACLManager", address: _aclManager.address, description: ""})
    await _poolAddressesProvider.setACLManager(_aclManager.address);

    await _aclManager.addRiskAdmin(account);
    await _aclManager.addAssetListingAdmin(account);
    //

    // Deploy Pool Configurator
    const ConfiguratorLogic = await ethers.getContractFactory("ConfiguratorLogic");
    const configuratorLogic = await ConfiguratorLogic.deploy();
    saveToJson({title: "ConfiguratorLogic", address: configuratorLogic.address, description: ""})

    const ATokenConfiguratorLogic = await ethers.getContractFactory("ATokenConfiguratorLogic");
    const aTokenConfiguratorLogic = await ATokenConfiguratorLogic.deploy();
    saveToJson({title: "ATokenConfiguratorLogic", address: aTokenConfiguratorLogic.address, description: ""})

    const VariableDebtConfiguratorLogic = await ethers.getContractFactory("VariableDebtConfiguratorLogic");
    const variableDebtConfiguratorLogic = await VariableDebtConfiguratorLogic.deploy();
    saveToJson({title: "VariableDebtConfiguratorLogic", address: variableDebtConfiguratorLogic.address, description: ""})

    const StableDebtConfiguratorLogic = await ethers.getContractFactory("StableDebtConfiguratorLogic");
    const stableDebtConfiguratorLogic = await StableDebtConfiguratorLogic.deploy();
    saveToJson({title: "StableDebtConfiguratorLogic", address: stableDebtConfiguratorLogic.address, description: ""})

    const VaultTokenConfiguratorLogic = await ethers.getContractFactory("VaultTokenConfiguratorLogic");
    const vaultTokenConfiguratorLogic = await VaultTokenConfiguratorLogic.deploy();
    saveToJson({title: "VaultTokenConfiguratorLogic", address: vaultTokenConfiguratorLogic.address, description: ""})

    const PoolConfigurator = await ethers.getContractFactory("PoolConfigurator", {
        libraries: {
            ATokenConfiguratorLogic: aTokenConfiguratorLogic.address,
            VariableDebtConfiguratorLogic: variableDebtConfiguratorLogic.address,
            StableDebtConfiguratorLogic: stableDebtConfiguratorLogic.address,
            VaultTokenConfiguratorLogic: vaultTokenConfiguratorLogic.address,
        },
    });
    const _poolConfigurator = await PoolConfigurator.deploy(_poolAddressesProvider.address);
    await _poolConfigurator.deployed();
    saveToJson({title: "PoolConfigurator", address: _poolConfigurator.address, description: ""})    
    await _poolAddressesProvider.setPoolConfigurator(_poolConfigurator.address);
    //

    // Deploy Aggregator Configurator
    const AggregatorLogic = await ethers.getContractFactory("AggregatorLogic");
    const aggregatorLogic = await AggregatorLogic.deploy();
    saveToJson({title: "AggregatorLogic", address: aggregatorLogic.address, description: ""})    

    const AggregatorConfigurator = await ethers.getContractFactory("AggregatorConfigurator")

    const _aggregatorConfigurator = await AggregatorConfigurator.deploy(_poolAddressesProvider.address);
    await _aggregatorConfigurator.deployed();
    saveToJson({title: "AggregatorConfigurator", address: _aggregatorConfigurator.address, description: ""})    

    await _poolAddressesProvider.setPoolAggregatorConfigurator(_aggregatorConfigurator.address);

    const AaveProtocolDataProvider = await ethers.getContractFactory("AaveProtocolDataProvider");
    const _aaveProtocolDataProvider = await AaveProtocolDataProvider.deploy(_poolAddressesProvider.address);
    saveToJson({title: "AaveProtocolDataProvider", address: _aaveProtocolDataProvider.address, description: ""})    
    await _poolAddressesProvider.setPoolDataProvider(_aaveProtocolDataProvider.address);

    const poolLogicAddress = poolLogic.address;
    const supplyLogicAddress = supplyLogic.address;
    const borrowLogicAddress = borrowLogic.address;
    const flashLoanLogicAddress = flashLoanLogic.address;
    const liquidationLogicAddress = liquidationLogic.address;
    const eModeLogicAddress = eModeLogic.address;
    const configuratorLogicAddress = configuratorLogic.address;
    const aTokenConfiguratorLogicAddress = aTokenConfiguratorLogic.address;
    const variableDebtConfiguratorLogicAddress = variableDebtConfiguratorLogic.address;
    const stableDebtConfiguratorLogicAddress = stableDebtConfiguratorLogic.address;

    return { 
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
    };
}
