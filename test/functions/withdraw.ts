import { loadFixture } from 'ethereum-waffle';
import { deployProtocol } from '../deploy/protocol';
import { deployRouters } from '../deploy/routers';
import { deployTokenAndDividends } from '../deploy/dividends';
import { setupReserves } from '../deploy/reserves';
import { tokenAddressesArr, tokens } from '../constants/tokens';
import { pools } from '../constants/pools';
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { readJson } from '../../helpers/misc';


const provider = new ethers.providers.JsonRpcProvider();


describe("withdraw", function () {
  async function deploy() {
    const owner = await provider.getSigner(0);
    const ownerAddress = await owner.getAddress();
    const treasury = await provider.getSigner(1);
    const treasuryAddress = await treasury.getAddress();
    const dividendsVault = await provider.getSigner(2);
    const dividendsVaultAddress = await dividendsVault.getAddress();

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

  it("function: supply() - usdc", async function () {
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

    const aTokenReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(tokenAddress);
    const aTokenUnderlying = aTokenReserveData[0]

    const AToken = await ethers.getContractFactory("AToken");
    const _aToken = await AToken.attach(aTokenUnderlying);
    let aTokenBalance = await _aToken.balanceOf(depositorAddress);
    expect(aTokenBalance).to.equal('0');

    const MintableERC20 = await ethers.getContractFactory("MintableERC20");
    const _underlyingErc20 = await MintableERC20.attach(tokenAddress);
    const underlyingDecimals = await _underlyingErc20.decimals();

    const depositAmount = ethers.utils.parseUnits("10000", underlyingDecimals)
    await _underlyingErc20.connect(depositor)["mint(uint256)"](depositAmount)

    await _underlyingErc20.connect(depositor).approve(_pool.address, depositAmount);

    await _pool.connect(depositor).supply(
      tokenAddress,
      depositAmount,
      depositorAddress,
      false,
      0
    )
    aTokenBalance = await _aToken.balanceOf(depositorAddress);

    expect(aTokenBalance).to.equal(depositAmount);
  });

  it("function: supply() - ontop check increase", async function () {
    const {
      _poolAddressesProvider,
      _priceOracle,
      _pool,
      _aclManager,
      _poolConfigurator,
      _aaveProtocolDataProvider
    } = await loadFixture(deploy);

    await (ethers.provider as any).send("evm_increaseTime", [15]);
    await (ethers.provider as any).send('evm_mine');

    const depositorTwo = await provider.getSigner(4);
    const depositorTwoAddress = await depositorTwo.getAddress();

    const tokenAddress = tokenAddressesArr[0]

    const token = tokens.find(obj => obj.address == tokenAddress)

    const aggregatorTitle = "a" + token?.name + "-" + "Aggregator"
    const aggregatorData = await readJson(aggregatorTitle)

    const Aggregator = await ethers.getContractFactory("Aggregator");
    const _aggregator = await Aggregator.attach(aggregatorData.address);

    const MintableERC20 = await ethers.getContractFactory("MintableERC20");
    const _underlyingErc20 = await MintableERC20.attach(tokenAddress);
    const underlyingDecimals = await _underlyingErc20.decimals();

    const depositAmount = ethers.utils.parseUnits("10000", underlyingDecimals)

    let aggregatorBalance = await _aggregator.getBalanceStored();
    expect(aggregatorBalance).to.be.at.least(depositAmount); // at least time may go by

    let aggregatorStoredBalance = await _aggregator.balance();
    expect(aggregatorBalance).to.be.at.least(aggregatorStoredBalance);

    const aTokenReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(tokenAddress);
    const aTokenUnderlying = aTokenReserveData[0]

    const AToken = await ethers.getContractFactory("AToken");
    const _aToken = await AToken.attach(aTokenUnderlying);
    let aTokenBalance = await _aToken.balanceOf(depositorTwoAddress);
    expect(aTokenBalance).to.equal('0');

    await _underlyingErc20.connect(depositorTwo)["mint(uint256)"](depositAmount)
    await _underlyingErc20.connect(depositorTwo).approve(_pool.address, depositAmount);

    await _pool.connect(depositorTwo).supply(
      tokenAddress,
      depositAmount,
      depositorTwoAddress,
      false,
      0
    )
    aTokenBalance = await _aToken.balanceOf(depositorTwoAddress);

    expect(aTokenBalance).to.equal(depositAmount);

    const expectedMinimumTotalSupply = ethers.utils.parseUnits("20000", underlyingDecimals)
    aTokenBalance = await _aToken.totalSupply();
    expect(aTokenBalance).to.be.at.least(expectedMinimumTotalSupply);
  });

  it("function: withdraw() - NOT_ENOUGH_AVAILABLE_USER_BALANCE", async function () {
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

    const MintableERC20 = await ethers.getContractFactory("MintableERC20");
    const _underlyingErc20 = await MintableERC20.attach(tokenAddress);
    const underlyingDecimals = await _underlyingErc20.decimals();

    const depositAmount = ethers.utils.parseUnits("20000", underlyingDecimals)

    const AToken = await ethers.getContractFactory("AToken");
    const _aToken = await AToken.attach(aTokenUnderlying);
    let aTokenBalance = await _aToken.balanceOf(depositorAddress);
    expect(aTokenBalance).to.be.at.least(ethers.utils.parseUnits("10000", underlyingDecimals));

    await _underlyingErc20.connect(depositor)["mint(uint256)"](depositAmount)
    await _underlyingErc20.connect(depositor).approve(_pool.address, depositAmount);

    await expect(_pool.connect(depositor).withdraw(
      tokenAddress,
      depositAmount,
      depositorAddress,
      false
    )).to.be.revertedWith('32') // NOT_ENOUGH_AVAILABLE_USER_BALANCE
  });

  it("function: withdraw() - success", async function () {
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

    const MintableERC20 = await ethers.getContractFactory("MintableERC20");
    const _underlyingErc20 = await MintableERC20.attach(tokenAddress);
    const underlyingDecimals = await _underlyingErc20.decimals();

    const depositAmount = ethers.utils.parseUnits("10000", underlyingDecimals)

    const token = tokens.find(obj => obj.address == tokenAddress)

    const aggregatorTitle = "a" + token?.name + "-" + "Aggregator"
    const aggregatorData = await readJson(aggregatorTitle)

    const Aggregator = await ethers.getContractFactory("Aggregator");
    const _aggregator = await Aggregator.attach(aggregatorData.address);

    const expectedMinimumTotalSupply = ethers.utils.parseUnits("20000", underlyingDecimals)
    let aggregatorBalance = await _aggregator.getBalanceStored();
    expect(aggregatorBalance).to.be.at.least(expectedMinimumTotalSupply);

    let aggregatorStoredBalance = await _aggregator.balance();
    expect(aggregatorBalance).to.be.at.least(aggregatorStoredBalance);

    const AToken = await ethers.getContractFactory("AToken");
    const _aToken = await AToken.attach(aTokenUnderlying);
    let aTokenBalance = await _aToken.balanceOf(depositorAddress);
    expect(aTokenBalance).to.be.at.least(depositAmount);

    await _underlyingErc20.connect(depositor)["mint(uint256)"](depositAmount)
    await _underlyingErc20.connect(depositor).approve(_pool.address, depositAmount);

    const expectedBalanceAfter = Number(aTokenBalance) - Number(depositAmount)
    await _pool.connect(depositor).withdraw(
      tokenAddress,
      depositAmount,
      depositorAddress,
      false
    )
    aTokenBalance = await _aToken.balanceOf(depositorAddress);

    expect(aTokenBalance).to.be.at.least(expectedBalanceAfter.toString());
  });

  // it("function: borrow()", async function () {
  //   const {
  //     _poolAddressesProvider,
  //     _priceOracle,
  //     _pool,
  //     _aclManager,
  //     _poolConfigurator,
  //     _aaveProtocolDataProvider
  //   } = await loadFixture(deploy);

  //   const MintableERC20 = await ethers.getContractFactory("MintableERC20");
  //   const _underlyingErc20_1 = await MintableERC20.attach(tokenAddressesArr[1]);
  //   const underlyingDecimals_1 = await _underlyingErc20_1.decimals();

  //   const depositor = await provider.getSigner(3);
  //   const depositorAddress = await depositor.getAddress();

  //   const tokenAddress = tokenAddressesArr[0]

  //   const aTokenReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(tokenAddress);
  //   const aTokenUnderlying = aTokenReserveData[0]

  //   const _underlyingErc20 = await MintableERC20.attach(tokenAddress);
  //   const underlyingDecimals = await _underlyingErc20.decimals();

  //   const mintAmount = ethers.utils.parseUnits("10000", underlyingDecimals)
  //   const borrowAmount = ethers.utils.parseUnits("5000", underlyingDecimals) // $500 worth of ETH

  //   const AToken = await ethers.getContractFactory("AToken");
  //   const _aToken = await AToken.attach(aTokenUnderlying);
  //   let aTokenBalance = await _aToken.balanceOf(depositorAddress);
  //   console.log("aTokenBalance", aTokenBalance)
  //   expect(aTokenBalance).to.equal(mintAmount);

  //   const variableDebtTokenUnderlying = aTokenReserveData[2]

  //   const VariableDebtToken = await ethers.getContractFactory("VariableDebtToken");
  //   const _variableDebtTokenUnderlying = await VariableDebtToken.attach(variableDebtTokenUnderlying);
  //   let variableDebtTokenUnderlyingBalance = await _variableDebtTokenUnderlying.balanceOf(depositorAddress);
  //   expect(variableDebtTokenUnderlyingBalance).to.equal('0');

  //   await _pool.connect(depositor).borrow(
  //     tokenAddress,
  //     borrowAmount,
  //     2,
  //     0,
  //     depositorAddress
  //   )
  // });

  // it("function: withdraw() - total fail", async function () {
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

  //   const tokenAddress = tokenAddressesArr[0]
  //   const aTokenReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(tokenAddress);
  //   const aTokenUnderlying = aTokenReserveData[0]

  //   const AToken = await ethers.getContractFactory("AToken");
  //   const _aToken = await AToken.attach(aTokenUnderlying);
  //   let aTokenBalance = await _aToken.balanceOf(depositorAddress);
  //   expect(aTokenBalance).to.equal('0');

  //   const MintableERC20 = await ethers.getContractFactory("MintableERC20");
  //   const _underlyingErc20 = await MintableERC20.attach(tokenAddress);
  //   const underlyingDecimals = await _underlyingErc20.decimals();

  //   const mintAmount = ethers.utils.parseUnits("10000", underlyingDecimals)
  //   await _underlyingErc20.connect(depositor)["mint(uint256)"](mintAmount)

  //   await _underlyingErc20.connect(depositor).approve(_pool.address, mintAmount);

  //   await _pool.connect(depositor).supply(
  //     tokenAddress,
  //     mintAmount,
  //     depositorAddress,
  // false,
  //     0
  //   )
  //   aTokenBalance = await _aToken.balanceOf(depositorAddress);

  //   expect(aTokenBalance).to.equal(mintAmount);
  // });

});