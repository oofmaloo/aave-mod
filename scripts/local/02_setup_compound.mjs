import hre from "hardhat";
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const cErc20Interface = require("../../artifacts/contracts/protocol/routers/compound/test/interfaces/CErc20Interface.sol/CErc20Interface.json");

const { ethers } = hre;

export async function setupCompound(
    provider,
    aave_depositor,
    aave_depositorAddress,
    [underlyingAddress, underlyingAddress_2],
    [tokenAddress, tokenAddress_2],
    compCount
  ) {

  const MintableERC20 = await ethers.getContractFactory("MintableERC20");

  const underlyingAddresses = [underlyingAddress, underlyingAddress_2]
  const tokens = [tokenAddress, tokenAddress_2]

  // deposit
  for (let i = 0; i < underlyingAddresses.length && i < compCount; i++) {

    let _underlyingErc20 = await MintableERC20.attach(underlyingAddress);
    let underlyingDecimals = await _underlyingErc20.decimals();

    console.log("setupCompound underlyingDecimals", underlyingDecimals)

    let _cToken = await ethers.getContractAt(cErc20Interface.abi, tokens[i], provider);
    console.log("setupCompound _cToken", _cToken.address)

    //              //
    // deposit usdc //
    //              //
    let compMintAmount = ethers.utils.parseUnits("10000000", underlyingDecimals);
    console.log("setupCompound compMintAmount")

    await _underlyingErc20.connect(aave_depositor)["mint(uint256)"](compMintAmount)
    console.log("setupCompound mint")

    let aave_depositorBalance = await _underlyingErc20.balanceOf(aave_depositorAddress)
    console.log("setupCompound aave_depositorBalance", aave_depositorBalance)

    await _underlyingErc20.connect(aave_depositor).approve(_cToken.address, compMintAmount);

    console.log("setupCompound approve")

    let aave_depositorAllowance = await _underlyingErc20.connect(aave_depositor).allowance(aave_depositorAddress, _cToken.address);

    console.log("setupCompound aave_depositorAllowance", aave_depositorAllowance)

    let underlyingCheck = await _cToken.connect(aave_depositor).underlying();
    console.log("setupCompound underlyingCheck", underlyingCheck)


    let compDepositTx = await _cToken.connect(aave_depositor).mint(compMintAmount);
    // await compDepositTx.wait();
    console.log("setupCompound compDepositTx", compDepositTx)

    await provider.send("evm_mine");
    await provider.send("evm_increaseTime", [100]);
    await provider.send("evm_mine");
  }
}