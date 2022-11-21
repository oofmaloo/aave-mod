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

    let _cToken = await ethers.getContractAt(cErc20Interface.abi, tokens[i], provider);

    //              //
    // deposit usdc //
    //              //
    let compMintAmount = ethers.utils.parseUnits("1000", underlyingDecimals);

    await _underlyingErc20.connect(aave_depositor)["mint(uint256)"](compMintAmount)

    let aave_depositorBalance = await _underlyingErc20.balanceOf(aave_depositorAddress)

    await _underlyingErc20.connect(aave_depositor).approve(_cToken.address, compMintAmount);
    let aave_depositorAllowance = await _underlyingErc20.connect(aave_depositor).allowance(aave_depositorAddress, _cToken.address);

    let compDepositTx = await _cToken.connect(aave_depositor).mint(compMintAmount);
    await compDepositTx.wait();
  }
}