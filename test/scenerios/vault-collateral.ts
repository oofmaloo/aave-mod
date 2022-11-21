import { loadFixture } from 'ethereum-waffle';
import { deployProtocol } from '../deploy/protocol';
import { deployRouters } from '../deploy/routers';
import { deployTokenAndDividends } from '../deploy/dividends';
import { setupReserves } from '../deploy/reserves';
import { tokenAddressesArr } from '../constants/tokens';
import { pools } from '../constants/pools';
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";


const provider = new ethers.providers.JsonRpcProvider();


describe("vault-collateral", function () {
  async function deploy() {
    const owner = await provider.getSigner(0);
    const ownerAddress = await owner.getAddress();
    const treasury = await provider.getSigner(1);
    const treasuryAddress = await treasury.getAddress();
    const dividendsVault = await provider.getSigner(2);
    const dividendsVaultAddress = await dividendsVault.getAddress();
    const mockProtocolUser = await provider.getSigner(3);
    const mockProtocolUserAddress = await dividendsVault.getAddress();

    let {
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

    // await mockProtocols();

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
      _aaveProtocolDataProvider
    }
  }

  it("function: supply() - add liquidity tokenAddressesArr[0]", async function () {
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
    await _underlyingErc20.connect(depositor)["mint(uint256)"](mintAmount)

    await _underlyingErc20.connect(depositor).approve(_pool.address, mintAmount);

    // supply usdc
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

  it("function: supply() - to vault", async function () {
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

    const tokenAddress = tokenAddressesArr[1]

    const reserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(tokenAddress);
    const vaultTokenAddress = reserveData[3]

    const VaultToken = await ethers.getContractFactory("VaultToken");
    const _vaultToken = await VaultToken.attach(vaultTokenAddress);
    let vaultTokenBalance = await _vaultToken.balanceOf(depositorAddress);
    expect(vaultTokenBalance).to.equal('0');

    const MintableERC20 = await ethers.getContractFactory("MintableERC20");
    const _underlyingErc20 = await MintableERC20.attach(tokenAddress);
    const underlyingDecimals = await _underlyingErc20.decimals();

    const mintAmount = ethers.utils.parseUnits("10000", underlyingDecimals)
    await _underlyingErc20.connect(depositor)["mint(uint256)"](mintAmount)

    await _underlyingErc20.connect(depositor).approve(_pool.address, mintAmount);

    // supply usdc
    await _pool.connect(depositor).supply(
      tokenAddress,
      mintAmount,
      depositorAddress,
      true,
      0
    )
    vaultTokenBalance = await _vaultToken.balanceOf(depositorAddress);

    expect(vaultTokenBalance).to.equal(mintAmount);
  });

  // it("function: borrow() - borrow usdc", async function () {
  //   const {
  //     _poolAddressesProvider,
  //     _priceOracle,
  //     _pool,
  //     _aclManager,
  //     _poolConfigurator,
  //     _aaveProtocolDataProvider
  //   } = await loadFixture(deploy);

  //   const depositor = await provider.getSigner(3);
  //   const depositorAddress = await depositor.getAddress();

  //   const supplyTokenAddress = tokenAddressesArr[1]
  //   const borrowTokenAddress = tokenAddressesArr[0]

  //   const MintableERC20 = await ethers.getContractFactory("MintableERC20");

  //   // weth
  //   const _underlyingErc20_1 = await MintableERC20.attach(supplyTokenAddress);
  //   const underlyingDecimals_1 = await _underlyingErc20_1.decimals();
  //   const aTokenReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(borrowTokenAddress);
  //   const aTokenUnderlying = aTokenReserveData[0]

  //   // usdc
  //   const _underlyingErc20 = await MintableERC20.attach(borrowTokenAddress);
  //   const underlyingDecimals = await _underlyingErc20.decimals();

  //   const borrowAmount = ethers.utils.parseUnits("10000", underlyingDecimals)

  //   const variableDebtTokenUnderlying = aTokenReserveData[2]

  //   const VariableDebtToken = await ethers.getContractFactory("VariableDebtToken");
  //   const _variableDebtTokenUnderlying = await VariableDebtToken.attach(variableDebtTokenUnderlying);
  //   let variableDebtTokenUnderlyingBalance = await _variableDebtTokenUnderlying.balanceOf(depositorAddress);
  //   expect(variableDebtTokenUnderlyingBalance).to.equal('0');

  //   await _pool.connect(depositor).borrow(
  //     borrowTokenAddress,
  //     borrowAmount,
  //     2,
  //     0,
  //     depositorAddress
  //   )

  //   variableDebtTokenUnderlyingBalance = await _variableDebtTokenUnderlying.balanceOf(depositorAddress);
  //   expect(variableDebtTokenUnderlyingBalance).to.equal(borrowAmount);

  // });

});