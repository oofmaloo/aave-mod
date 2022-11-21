// import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { loadFixture } from 'ethereum-waffle';
import { deployProtocol } from '../deploy/protocol';
import { deployRouters } from '../deploy/routers';
import { deployTokenAndDividends } from '../deploy/dividends';
import { setupReserves } from '../deploy/reserves';
import { pools } from '../constants/pools';
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { tokenAddressesArr, tokens } from '../constants/tokens';

import { readJson } from '../../helpers/misc';

const provider = new ethers.providers.JsonRpcProvider();


describe("stake", function () {
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
      _aaveProtocolDataProvider,
      _stakedAddi,
      _addi
    }
  }

  it("function: stake() - amount 0", async function () {
    const {
      _poolAddressesProvider,
      _priceOracle,
      _pool,
      _aclManager,
      _poolConfigurator,
      _aaveProtocolDataProvider,
      _stakedAddi,
      _addi
    } = await loadFixture(deploy);

    const staker = await provider.getSigner(1);
    const stakerAddress = await staker.getAddress();

    await expect(_stakedAddi.stake(stakerAddress, '0')).to.be.revertedWith("INVALID_ZERO_AMOUNT");

  });

  it("function: stake() - no addi balance", async function () {
    const {
      _poolAddressesProvider,
      _priceOracle,
      _pool,
      _aclManager,
      _poolConfigurator,
      _aaveProtocolDataProvider,
      _stakedAddi,
      _addi
    } = await loadFixture(deploy);

    const staker = await provider.getSigner(1);
    const stakerAddress = await staker.getAddress();

    let tokenBalance = await _addi.balanceOf(stakerAddress)
    expect(tokenBalance).to.equal('0');
    let stakedBalance = await _stakedAddi.balanceOf(stakerAddress)
    expect(stakedBalance).to.equal('0');

    let stakedContractAddiBalance = await _addi.balanceOf(_stakedAddi.address)
    expect(stakedContractAddiBalance).to.equal('0');

    const underlyingDecimals = await _addi.decimals()

    const stakeAmount = ethers.utils.parseUnits("10000", underlyingDecimals)

    await _addi.connect(staker).approve(_stakedAddi.address, stakeAmount);

    await expect(_stakedAddi.connect(staker).stake(stakerAddress, stakeAmount)).to.be.revertedWith("ERC20: transfer amount exceeds balance");

    tokenBalance = await _addi.balanceOf(stakerAddress)
    expect(tokenBalance).to.equal('0');

    stakedBalance = await _stakedAddi.balanceOf(stakerAddress)
    expect(stakedBalance).to.equal('0');
  });

  it("function: stake()", async function () {
    const {
      _poolAddressesProvider,
      _priceOracle,
      _pool,
      _aclManager,
      _poolConfigurator,
      _aaveProtocolDataProvider,
      _stakedAddi,
      _addi
    } = await loadFixture(deploy);

    const owner = await provider.getSigner(0);
    const ownerAddress = await owner.getAddress();

    let tokenBalance = await _addi.balanceOf(ownerAddress)
    console.log("tokenBalance1", tokenBalance)

    let stakedBalance = await _stakedAddi.balanceOf(ownerAddress)
    expect(stakedBalance).to.equal('0');

    let stakedContractAddiBalance = await _addi.balanceOf(_stakedAddi.address)
    expect(stakedContractAddiBalance).to.equal('0');


    const stakeAmount = tokenBalance

    await _addi.approve(_stakedAddi.address, stakeAmount)

    await _stakedAddi.stake(ownerAddress, stakeAmount);



    tokenBalance = await _addi.balanceOf(ownerAddress)
    expect(tokenBalance).to.equal('0');

    stakedBalance = await _stakedAddi.balanceOf(ownerAddress)
    expect(stakeAmount).to.equal(stakedBalance);

    stakedContractAddiBalance = await _addi.balanceOf(_stakedAddi.address)
    expect(stakedContractAddiBalance).to.equal(stakeAmount);
  });

  it("function: redeem() - amount 0", async function () {
    const {
      _poolAddressesProvider,
      _priceOracle,
      _pool,
      _aclManager,
      _poolConfigurator,
      _aaveProtocolDataProvider,
      _stakedAddi,
      _addi
    } = await loadFixture(deploy);

    const staker = await provider.getSigner(1);
    const stakerAddress = await staker.getAddress();

    await expect(_stakedAddi.redeem(stakerAddress, '0')).to.be.revertedWith("INVALID_ZERO_AMOUNT");

  });

  it("function: redeem() - UNSTAKE_WINDOW_FINISHED", async function () {
    const {
      _poolAddressesProvider,
      _priceOracle,
      _pool,
      _aclManager,
      _poolConfigurator,
      _aaveProtocolDataProvider,
      _stakedAddi,
      _addi
    } = await loadFixture(deploy);

    const owner = await provider.getSigner(0);
    const ownerAddress = await owner.getAddress();

    const stakeAmount = '1'

    await expect(_stakedAddi.redeem(ownerAddress, stakeAmount)).to.be.revertedWith("UNSTAKE_WINDOW_FINISHED");
  });

  it("function: cooldown() - no balance fail", async function () {
    const {
      _poolAddressesProvider,
      _priceOracle,
      _pool,
      _aclManager,
      _poolConfigurator,
      _aaveProtocolDataProvider,
      _stakedAddi,
      _addi
    } = await loadFixture(deploy);

    const staker = await provider.getSigner(1);
    const stakerAddress = await staker.getAddress();

    await expect(_stakedAddi.connect(staker).cooldown()).to.be.revertedWith("INVALID_BALANCE_ON_COOLDOWN");
  });


  it("function: cooldown() redeem() - INSUFFICIENT_COOLDOWN", async function () {
    const {
      _poolAddressesProvider,
      _priceOracle,
      _pool,
      _aclManager,
      _poolConfigurator,
      _aaveProtocolDataProvider,
      _stakedAddi,
      _addi
    } = await loadFixture(deploy);

    const owner = await provider.getSigner(0);
    const ownerAddress = await owner.getAddress();

    const stakeAmount = '1'
    await _stakedAddi.cooldown()

    await expect(_stakedAddi.redeem(ownerAddress, stakeAmount)).to.be.revertedWith("INSUFFICIENT_COOLDOWN");
  });

  it("function: cooldown() redeem()", async function () {
    const {
      _poolAddressesProvider,
      _priceOracle,
      _pool,
      _aclManager,
      _poolConfigurator,
      _aaveProtocolDataProvider,
      _stakedAddi,
      _addi
    } = await loadFixture(deploy);

    const owner = await provider.getSigner(0);
    const ownerAddress = await owner.getAddress();

    const stakeAmount = '1'

    await (ethers.provider as any).send("evm_increaseTime", [2629743]);
    await (ethers.provider as any).send('evm_mine');

    await _stakedAddi.redeem(ownerAddress, stakeAmount)
  });

});
