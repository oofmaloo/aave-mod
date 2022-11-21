// import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { loadFixture } from 'ethereum-waffle';
import { deployProtocol } from '../deploy/protocol';
import { deployRouters } from '../deploy/routers';
// import { deployCompound } from '../deploy/deploy-comp';
import { deployTokenAndDividends } from '../deploy/dividends';
import { setupReserves } from '../deploy/reserves';
import { tokenAddressesArr, tokens } from '../constants/tokens';
import { pools } from '../constants/pools';
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { readJson } from '../../helpers/misc';

const provider = new ethers.providers.JsonRpcProvider();

describe.only("supply", function () {
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
    console.log("aggregatorBalance", aggregatorBalance)
    expect(aggregatorBalance).to.equal('0');

    let aggregatorStoredBalance = await _aggregator.balance();
    console.log("aggregatorStoredBalance", aggregatorStoredBalance)
    expect(aggregatorStoredBalance).to.equal(aggregatorBalance);

    let routerRates = await _aggregator.getRouterRates()
    console.log("routerRates", routerRates)

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

    let tx = await _pool.connect(depositor).supply(
      tokenAddress,
      mintAmount,
      depositorAddress,
      false,
      0
    )
    const gasUsed = tx.getTransactionReceipt().gasUsed;
    console.log("gasUsed", gasUsed);

    aTokenBalance = await _aToken.balanceOf(depositorAddress);
    console.log("aTokenBalance", aTokenBalance);
    expect(aTokenBalance).to.equal(mintAmount);

    aggregatorBalance = await _aggregator.getBalanceStored();
    console.log("aggregatorBalance", aggregatorBalance);
    expect(aggregatorBalance).to.be.at.least(mintAmount);

    aggregatorStoredBalance = await _aggregator.balance();
    console.log("aggregatorStoredBalance", aggregatorStoredBalance)
    expect(aggregatorStoredBalance).to.equal(aggregatorBalance);

    const reserveData = await _aaveProtocolDataProvider.getReserveData(tokenAddress)
    console.log("usdc reserveData", reserveData)

    routerRates = await _aggregator.getRouterRates()
    console.log("routerRates", routerRates)
  });

  // it("function: supply() 2", async function () {
  //   const {
  //     _poolAddressesProvider,
  //     _priceOracle,
  //     _pool,
  //     _aclManager,
  //     _poolConfigurator,
  //     _aaveProtocolDataProvider
  //   } = await loadFixture(deploy);
  //   await (ethers.provider as any).send("evm_increaseTime", [1000]);
  //   await (ethers.provider as any).send('evm_mine');

  //   const depositor = await provider.getSigner(3);
  //   const depositorAddress = await depositor.getAddress();

  //   const tokenAddress = tokenAddressesArr[0]

  //   const token = tokens.find(obj => obj.address == tokenAddress)

  //   const aggregatorTitle = "a" + token?.name + "-" + "Aggregator"
  //   const aggregatorData = await readJson(aggregatorTitle)


  //   const Aggregator = await ethers.getContractFactory("Aggregator");
  //   const _aggregator = await Aggregator.attach(aggregatorData.address);

  //   let aggregatorBalance = await _aggregator.getBalanceStored();

  //   let aggregatorStoredBalance = await _aggregator.balance();

  //   let routerRates = await _aggregator.getRouterRates()
  //   console.log("routerRates", routerRates)

  //   const aTokenReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(tokenAddress);
  //   const aTokenUnderlying = aTokenReserveData[0]

  //   const AToken = await ethers.getContractFactory("AToken");
  //   const _aToken = await AToken.attach(aTokenUnderlying);
  //   let aTokenBalance = await _aToken.balanceOf(depositorAddress);



  //   const MintableERC20 = await ethers.getContractFactory("MintableERC20");
  //   const _underlyingErc20 = await MintableERC20.attach(tokenAddress);
  //   const underlyingDecimals = await _underlyingErc20.decimals();

  //   const mintAmount = ethers.utils.parseUnits("10000", underlyingDecimals)
  //   await _underlyingErc20.connect(depositor)["mint(uint256)"](mintAmount);

  //   await _underlyingErc20.connect(depositor).approve(_pool.address, mintAmount);

  //   await _pool.connect(depositor).supply(
  //     tokenAddress,
  //     mintAmount,
  //     depositorAddress,
  //     false,
  //     0
  //   )
  //   aTokenBalance = await _aToken.balanceOf(depositorAddress);


  //   aggregatorBalance = await _aggregator.getBalanceStored();

  //   aggregatorStoredBalance = await _aggregator.balance();

  //   const reserveData = await _aaveProtocolDataProvider.getReserveData(tokenAddress)
  //   console.log("usdc reserveData", reserveData)

  //   routerRates = await _aggregator.getRouterRates()
  //   console.log("routerRates", routerRates)

  // });

  // it("function: supply() - tokenAddressesArr[1]", async function () {
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

  //   const tokenAddress = tokenAddressesArr[1]

  //   const token = tokens.find(obj => obj.address == tokenAddress)

  //   const aggregatorTitle = "a" + token?.name + "-" + "Aggregator"
  //   const aggregatorData = await readJson(aggregatorTitle)


  //   const Aggregator = await ethers.getContractFactory("Aggregator");
  //   const _aggregator = await Aggregator.attach(aggregatorData.address);

  //   let aggregatorBalance = await _aggregator.getBalanceStored();
  //   console.log("aggregatorBalance", aggregatorBalance)
  //   expect(aggregatorBalance).to.equal('0');

  //   let aggregatorStoredBalance = await _aggregator.balance();
  //   console.log("aggregatorStoredBalance", aggregatorStoredBalance)
  //   expect(aggregatorStoredBalance).to.equal(aggregatorBalance);


  //   let routerRates = await _aggregator.getRouterRates()
  //   console.log("routerRates", routerRates)



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
  //     false,
  //     0
  //   )
  //   aTokenBalance = await _aToken.balanceOf(depositorAddress);

  //   expect(aTokenBalance).to.equal(mintAmount);

  //   aggregatorBalance = await _aggregator.getBalanceStored();
  //   expect(aggregatorBalance).to.equal(mintAmount);

  //   aggregatorStoredBalance = await _aggregator.balance();
  //   expect(aggregatorStoredBalance).to.equal(aggregatorBalance);

  //   const reserveData = await _aaveProtocolDataProvider.getReserveData(tokenAddress)
  //   console.log("weth reserveData", reserveData)

  //   routerRates = await _aggregator.getRouterRates()
  //   console.log("routerRates", routerRates)
  // });

  // it("function: supply() - tokenAddressesArr[1] 2", async function () {
  //   const {
  //     _poolAddressesProvider,
  //     _priceOracle,
  //     _pool,
  //     _aclManager,
  //     _poolConfigurator,
  //     _aaveProtocolDataProvider
  //   } = await loadFixture(deploy);

  //   await (ethers.provider as any).send("evm_increaseTime", [1000]);
  //   await (ethers.provider as any).send('evm_mine');

  //   const depositor = await provider.getSigner(3);
  //   const depositorAddress = await depositor.getAddress();

  //   const tokenAddress = tokenAddressesArr[1]

  //   const token = tokens.find(obj => obj.address == tokenAddress)

  //   const aggregatorTitle = "a" + token?.name + "-" + "Aggregator"
  //   const aggregatorData = await readJson(aggregatorTitle)


  //   const Aggregator = await ethers.getContractFactory("Aggregator");
  //   const _aggregator = await Aggregator.attach(aggregatorData.address);

  //   let aggregatorBalance = await _aggregator.getBalanceStored();
  //   console.log("aggregatorBalance", aggregatorBalance)
  //   expect(aggregatorBalance).to.be.at.least('0'); // at least time may go by

  //   let aggregatorStoredBalance = await _aggregator.balance();
  //   console.log("aggregatorStoredBalance", aggregatorStoredBalance)
  //   expect(aggregatorBalance).to.be.at.least(aggregatorStoredBalance);

  //   let routerRates = await _aggregator.getRouterRates()
  //   console.log("routerRates", routerRates)


  //   const aTokenReserveData = await _aaveProtocolDataProvider.getReserveTokensAddresses(tokenAddress);
  //   const aTokenUnderlying = aTokenReserveData[0]

  //   const AToken = await ethers.getContractFactory("AToken");
  //   const _aToken = await AToken.attach(aTokenUnderlying);
  //   let aTokenBalance = await _aToken.balanceOf(depositorAddress);
  //   // expect(aTokenBalance).to.equal('0');

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
  //     false,
  //     0
  //   )
  //   aTokenBalance = await _aToken.balanceOf(depositorAddress);

  //   // expect(aTokenBalance).to.equal(mintAmount);

  //   aggregatorBalance = await _aggregator.getBalanceStored();
  //   // expect(aggregatorBalance).to.equal(mintAmount);

  //   aggregatorStoredBalance = await _aggregator.balance();
  //   // expect(aggregatorStoredBalance).to.equal(aggregatorBalance);

  //   const reserveData = await _aaveProtocolDataProvider.getReserveData(tokenAddress)
  //   console.log("weth reserveData", reserveData)

  //   routerRates = await _aggregator.getRouterRates()
  //   console.log("routerRates", routerRates)
  // });

  // it("function: supply() - approve failure", async function () {
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

  //   const MintableERC20 = await ethers.getContractFactory("MintableERC20");
  //   const _underlyingErc20 = await MintableERC20.attach(tokenAddress);
  //   const underlyingDecimals = await _underlyingErc20.decimals();

  //   const mintAmount = ethers.utils.parseUnits("10000", underlyingDecimals)
  //   await _underlyingErc20.connect(depositor)["mint(uint256)"](mintAmount)

  //   await expect(_pool.connect(depositor).supply(
  //     tokenAddress,
  //     mintAmount,
  //     depositorAddress,
  //     false,
  //     0
  //   )).to.be.revertedWith("ERC20: transfer amount exceeds allowance");

  // });

  // it("function: supply() - asset failure zero address", async function () {
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

  //   const MintableERC20 = await ethers.getContractFactory("MintableERC20");
  //   const _underlyingErc20 = await MintableERC20.attach(tokenAddress);
  //   const underlyingDecimals = await _underlyingErc20.decimals();

  //   const mintAmount = ethers.utils.parseUnits("10000", underlyingDecimals)
  //   await _underlyingErc20.connect(depositor)["mint(uint256)"](mintAmount)

  //   await expect(_pool.connect(depositor).supply(
  //     _aToken.address,
  //     mintAmount,
  //     depositorAddress,
  //     false,
  //     0
  //   )).to.be.reverted;
  // });

});
