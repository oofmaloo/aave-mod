import { loadFixture } from 'ethereum-waffle';
import { deployProtocol } from '../deploy/protocol';
import { deployRouters } from '../deploy/routers';
import { deployTokenAndDividends } from '../deploy/dividends';
import { setupReserves } from '../deploy/reserves';
import { deployAllocator } from '../deploy/allocator';
import { tokenAddressesArr } from '../constants/tokens';
import { pools } from '../constants/pools';
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { readJsonByDesc } from '../../helpers/misc';

const provider = new ethers.providers.JsonRpcProvider();


describe("staking", function () {
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

		return {
			_poolAddressesProvider,
			_priceOracle,
			_pool,
			_aclManager,
			_poolConfigurator,
			_aaveProtocolDataProvider,
			_stakedAddi,
			_addi,
			_dividendsController
		}
	}

	it("function: supply() - usdc", async function () {
		const {
			_poolAddressesProvider,
			_priceOracle,
			_pool,
			_aclManager,
			_poolConfigurator,
			_aaveProtocolDataProvider,
			_stakedAddi,
			_addi,
			_dividendsController
		} = await loadFixture(deploy);

		const depositor = await provider.getSigner(3);
		const depositorAddress = await depositor.getAddress();

		const tokenAddress = tokenAddressesArr[0]

		const aTokenReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(tokenAddress);
		const aTokenUnderlying = aTokenReserveData[0]

		const AToken = await ethers.getContractFactory("AToken");
		const _aToken = await AToken.attach(aTokenUnderlying);
		let aTokenBalance = await _aToken.balanceOf(depositorAddress);
		expect(aTokenBalance).to.equal('0');

		const MintableERC20 = await ethers.getContractFactory("MintableERC20");
		const _underlyingErc20 = await MintableERC20.attach(tokenAddress);
		const underlyingDecimals = await _underlyingErc20.decimals();

		const mintAmount = ethers.utils.parseUnits("1000000", underlyingDecimals)
		await _underlyingErc20.connect(depositor)["mint(uint256)"](mintAmount)

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
	});

	it("function: supply() - weth", async function () {
		const {
			_poolAddressesProvider,
			_priceOracle,
			_pool,
			_aclManager,
			_poolConfigurator,
			_aaveProtocolDataProvider,
			_stakedAddi,
			_addi,
			_dividendsController
		} = await loadFixture(deploy);

		const depositor = await provider.getSigner(3);
		const depositorAddress = await depositor.getAddress();

		const tokenAddress = tokenAddressesArr[1]

		const aTokenReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(tokenAddress);
		const aTokenUnderlying = aTokenReserveData[0]

		const AToken = await ethers.getContractFactory("AToken");
		const _aToken = await AToken.attach(aTokenUnderlying);
		let aTokenBalance = await _aToken.balanceOf(depositorAddress);
		expect(aTokenBalance).to.equal('0');

		const MintableERC20 = await ethers.getContractFactory("MintableERC20");
		const _underlyingErc20 = await MintableERC20.attach(tokenAddress);
		const underlyingDecimals = await _underlyingErc20.decimals();

		const mintAmount = ethers.utils.parseUnits("1000000", underlyingDecimals)
		await _underlyingErc20.connect(depositor)["mint(uint256)"](mintAmount)

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
	});

	it("function: begin stake", async function () {
		const {
			_poolAddressesProvider,
			_priceOracle,
			_pool,
			_aclManager,
			_poolConfigurator,
			_aaveProtocolDataProvider,
			_stakedAddi,
			_addi,
			_dividendsController
		} = await loadFixture(deploy);

		const owner = await provider.getSigner(0);
		const ownerAddress = await owner.getAddress();

		const balance = await _addi.balanceOf(ownerAddress)
		console.log("balance", balance)

		const balanceFormatted = ethers.utils.formatUnits(balance.toString(), 18)

		const stakeAmount = Number(balanceFormatted)*.9

		const parsedStakeAmount = ethers.utils.parseUnits(stakeAmount.toString(), 18)

		await _addi.approve(_stakedAddi.address, parsedStakeAmount)

		await _stakedAddi.stake(ownerAddress, parsedStakeAmount);

		await (ethers.provider as any).send("evm_increaseTime", [31556926]);
		await (ethers.provider as any).send('evm_mine');

		// await _dividendsController.handleMintToTreasury()

		const userDividends = await _dividendsController.getAllUserRewards(ownerAddress)
		console.log("userDividends", userDividends)

	});

	it("function: supply() - re-supply to initiate reserve factor", async function () {
		const {
			_poolAddressesProvider,
			_priceOracle,
			_pool,
			_aclManager,
			_poolConfigurator,
			_aaveProtocolDataProvider,
			_stakedAddi,
			_addi,
			_dividendsController
		} = await loadFixture(deploy);

		const depositor = await provider.getSigner(3);
		const depositorAddress = await depositor.getAddress();

		const tokenAddress = tokenAddressesArr[0]

		const MintableERC20 = await ethers.getContractFactory("MintableERC20");
		const _underlyingErc20 = await MintableERC20.attach(tokenAddress);
		const underlyingDecimals = await _underlyingErc20.decimals();

		const mintAmount = ethers.utils.parseUnits("1000000", underlyingDecimals)
		await _underlyingErc20.connect(depositor)["mint(uint256)"](mintAmount)

		await _underlyingErc20.connect(depositor).approve(_pool.address, mintAmount);

		await _pool.connect(depositor).supply(
			tokenAddress,
			mintAmount,
			depositorAddress,
			false,
			0
		)
	});

	it("function: supply() - re-supply to initiate reserve factor", async function () {
		const {
			_poolAddressesProvider,
			_priceOracle,
			_pool,
			_aclManager,
			_poolConfigurator,
			_aaveProtocolDataProvider,
			_stakedAddi,
			_addi,
			_dividendsController
		} = await loadFixture(deploy);

		const depositor = await provider.getSigner(3);
		const depositorAddress = await depositor.getAddress();

		const tokenAddress = tokenAddressesArr[1]

		const MintableERC20 = await ethers.getContractFactory("MintableERC20");
		const _underlyingErc20 = await MintableERC20.attach(tokenAddress);
		const underlyingDecimals = await _underlyingErc20.decimals();

		const mintAmount = ethers.utils.parseUnits("1000000", underlyingDecimals)
		await _underlyingErc20.connect(depositor)["mint(uint256)"](mintAmount)

		await _underlyingErc20.connect(depositor).approve(_pool.address, mintAmount);

		await _pool.connect(depositor).supply(
			tokenAddress,
			mintAmount,
			depositorAddress,
			false,
			0
		)
	});

	it("function: check stake", async function () {
		const {
			_poolAddressesProvider,
			_priceOracle,
			_pool,
			_aclManager,
			_poolConfigurator,
			_aaveProtocolDataProvider,
			_stakedAddi,
			_addi,
			_dividendsController
		} = await loadFixture(deploy);

		const owner = await provider.getSigner(0);
		const ownerAddress = await owner.getAddress();

		// const balance = await _addi.balanceOf(ownerAddress)
		// console.log("balance", balance)

		// const balanceFormatted = ethers.utils.formatUnits(balance.toString(), 18)

		// const stakeAmount = Number(balanceFormatted)*.9

		// const parsedStakeAmount = ethers.utils.parseUnits(stakeAmount.toString(), 18)

		// await _addi.approve(_stakedAddi.address, parsedStakeAmount)

		// await _stakedAddi.stake(ownerAddress, parsedStakeAmount);

		await (ethers.provider as any).send("evm_increaseTime", [31556926]);
		await (ethers.provider as any).send('evm_mine');

		await _dividendsController.handleMintToTreasury()

		const userDividends = await _dividendsController.getAllUserRewards(ownerAddress)
		console.log("userDividends", userDividends)

	});

});
