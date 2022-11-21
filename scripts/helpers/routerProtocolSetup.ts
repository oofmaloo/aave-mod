import hre from "hardhat";
import { readJson } from '../../helpers/misc';
import { tokenAddressesArr, tokens } from '../../test/constants/tokens';
const { ethers } = hre;


// npx hardhat run scripts/helpers/routerProtocolSetup.ts --network buidlerevm_docker

async function main() {

  const poolLogicAddress = await readJson('PoolLogicAddress')

  const supplyLogicAddress = await readJson('SupplyLogic')
  const borrowLogicAddress = await readJson('BorrowLogic')
  const flashLoanLogicAddress = await readJson('FlashLoanLogic')
  const liquidationLogicAddress = await readJson('LiquidationLogic')
  const eModeLogicAddress = await readJson('EModeLogic')
  const poolAddress = await readJson('Pool')

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


  // deposit
  const aave_depositor = await provider.getSigner(3);
  const aave_depositorAddress = await aave_depositor.getAddress();
  const token = tokens.find(obj => obj.symbol == 'USDC')
  const tokenAddress = token.address
  const mintableERC20 = await ethers.getContractFactory("MintableERC20");
  const _underlyingErc20 = await mintableERC20.attach(tokenAddress);
  const underlyingDecimals = await _underlyingErc20.decimals();
  const aaveMintAmount = ethers.utils.parseUnits("10000000", underlyingDecimals);
  await _underlyingErc20.connect(aave_depositor)["mint(uint256)"](aaveMintAmount)
  await _underlyingErc20.connect(aave_depositor).approve(_aaveLendingPool.address, aaveMintAmount);
  const aave_depositorAllowance = await _underlyingErc20.connect(aave_depositor).allowance(aave_depositorAddress, _aaveLendingPool.address);
  const aaveUnderlyingDepositTx = await _aaveLendingPool.connect(aave_depositor).deposit(
    underlyingAddress,
    aaveMintAmount,
    aave_depositorAddress,
    "0"
  );
  await aaveUnderlyingDepositTx.wait();







  // const usdc = token.address
  // await _pool.mintToTreasury([underlyingAddress])
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
