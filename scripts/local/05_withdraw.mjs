import hre from "hardhat";

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const aaveAToken = require("../../artifacts/contracts/mocks/aave/IAToken.sol/IAToken.json");
const aaveProtocolDataProvider = require("../../artifacts/contracts/mocks/aave/IAaveProtocolDataProvider.sol/IAaveProtocolDataProvider.json");

const { ethers } = hre;

export async function withdraw(
    provider, 
    owner,
    ownerAddress,
    poolDataProviderAddress,
    poolAddress,
    poolLogicAddress,
    supplyLogicAddress,
    borrowLogicAddress,
    flashLoanLogicAddress,
    liquidationLogicAddress,
    eModeLogicAddress,
    underlyingAddress,
    aaveLendingPoolAddress,
    aavePoolDataProviderAddress,
    assetAggregatorAddress
  ) {

  const mintableERC20 = await ethers.getContractFactory("MintableERC20");
  const _underlyingErc20 = await mintableERC20.attach(underlyingAddress);
  const underlyingDecimals = await _underlyingErc20.decimals();
  // const poolDataProvider = await ethers.getContractFactory("PoolDataProvider");
  // const _poolDataProvider = await poolDataProvider.attach(poolDataProviderAddress);
  const AaveProtocolDataProvider = await ethers.getContractFactory("AaveProtocolDataProvider");
  const _aaveProtocolDataProvider = await AaveProtocolDataProvider.attach(poolDataProviderAddress);

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

  // Deposit Underlying
  const mintAmount = ethers.utils.parseUnits("1000", underlyingDecimals);

  await _underlyingErc20.connect(owner).approve(_pool.address, mintAmount);
  await _underlyingErc20.connect(owner)["mint(uint256)"](mintAmount)

  const tx = await _pool.connect(owner).withdraw(
    underlyingAddress,
    // 1,
    mintAmount,
    ownerAddress,
    false
  )

  const reserveTokensAddresses = await _aaveProtocolDataProvider.getReserveTokensAddresses(wethAddress)
  const avasUnderlyingTokenAddress = reserveTokensAddresses[0];

  // const avasUnderlyingAddress = await _poolDataProvider.getAvasTokenAddress(underlyingAddress);

  const avasToken = await ethers.getContractFactory("AToken");
  const _avasUnderlying = await avasToken.attach(avasUnderlyingTokenAddress);
  const balance = await _avasUnderlying.balanceOf(ownerAddress);
  console.log("owner _avasUnderlying balance", ethers.utils.formatUnits(balance, underlyingDecimals));




  const _aavePoolDataProvider = await ethers.getContractAt(aaveProtocolDataProvider.abi, aavePoolDataProviderAddress, provider);
  const aaveUnderlyingAddresses = await _aavePoolDataProvider.getReserveTokensAddresses(underlyingAddress)
  const aaveATokenUnderlyingAddress = aaveUnderlyingAddresses[0];
  const _aaveATokenUnderlyingAddress = await ethers.getContractAt(aaveAToken.abi, aaveATokenUnderlyingAddress, provider);

  const avasUnderlyingAggATokenBalance = await _aaveATokenUnderlyingAddress.balanceOf(assetAggregatorAddress)
  console.log("avasUnderlyingAggATokenBalance", ethers.utils.formatUnits(avasUnderlyingAggATokenBalance, underlyingDecimals));

  // increase block
  // const evMine = await network.provider.send("evm_mine");
  // await ethers.provider.send("evm_increaseTime", [2000]);
  // const evMine2 = await network.provider.send("evm_mine");

}