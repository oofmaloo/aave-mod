import hre from "hardhat";
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const {readJson} = require("../../helpers/misc.ts");
const {tokenAddressesArr, tokens} = require("../../test/constants/tokens.ts");
const pools = require("../../test/constants/pools.ts");
const aaveLendingPool = require("../../artifacts/contracts/mocks/aave/ILendingPool.sol/ILendingPool.json");
const aaveProtocolDataProvider = require("../../artifacts/contracts/mocks/aave/IAaveProtocolDataProvider.sol/IAaveProtocolDataProvider.json");
const { ethers } = hre;

// npx hardhat run scripts/helpers/routerProtocolSetup.mjs --network buidlerevm_docker

async function main() {


  const aaveLendingPoolAddresses = pools.pools[2].poolAddress
  const aaveDataProviderAddress = pools.pools[2].dataProviderAddress

  const _aaveLendingPool = await ethers.getContractAt(aaveLendingPool.abi, aaveLendingPoolAddresses, ethers.provider);
  const _aavePoolDataProvider = await ethers.getContractAt(aaveProtocolDataProvider.abi, aaveDataProviderAddress, ethers.provider);

  // deposit
  const aave_depositor = await ethers.provider.getSigner(3);
  const aave_depositorAddress = await aave_depositor.getAddress();
  const aave_borrower = await ethers.provider.getSigner(4);
  const aave_borrowerAddress = await aave_borrower.getAddress();

  const token = tokens.find(obj => obj.symbol == 'USDC')
  const tokenAddress = token.address
  const mintableERC20 = await ethers.getContractFactory("MintableERC20");
  const _underlyingErc20 = await mintableERC20.attach(tokenAddress);
  const underlyingDecimals = await _underlyingErc20.decimals();
  const aaveMintAmount = ethers.utils.parseUnits("10000000", underlyingDecimals);
  await _underlyingErc20.connect(aave_depositor)["mint(uint256)"](aaveMintAmount)
  await _underlyingErc20.connect(aave_depositor).approve(_aaveLendingPool.address, aaveMintAmount);

  // decrease rate
  // const aave_depositorAllowance = await _underlyingErc20.connect(aave_depositor).allowance(aave_depositorAddress, _aaveLendingPool.address);
  // const aaveUnderlyingDepositTx = await _aaveLendingPool.connect(aave_depositor).deposit(
  //   tokenAddress,
  //   aaveMintAmount,
  //   aave_depositorAddress,
  //   "0"
  // );
  // await aaveUnderlyingDepositTx.wait();


  // increaserate
  await _aaveLendingPool.connect(aave_borrower).borrow(
    tokenAddress,
    aaveMintAmount,
    "2",
    "0",
    aave_borrowerAddress
  );

  console.log("after borrow")


  let aaveDepositReserveData_after = await _aavePoolDataProvider.getReserveData(tokenAddress)

  let aavaATokenDeposit_liquidityRate_after = aaveDepositReserveData_after[3];

  console.log("aavaATokenDeposit_liquidityRate_after", aavaATokenDeposit_liquidityRate_after/(10**27))

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
