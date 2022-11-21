import { Contract, utils } from "ethers";
import { ethers } from "hardhat";
import { readJson } from '../../helpers/misc';
import { tokenAddressesArr, tokens } from '../constants/tokens';

export async function mockProtocols() {

  // const mockProtocolUser = await ethers.provider.getSigner(3);
  // const mockProtocolUserAddress = await mockProtocolUser.getAddress();

  // const poolLogicAddress = await readJson('PoolLogicAddress')
  // const supplyLogicAddress = await readJson('SupplyLogic')
  // const borrowLogicAddress = await readJson('BorrowLogic')
  // const flashLoanLogicAddress = await readJson('FlashLoanLogic')
  // const liquidationLogicAddress = await readJson('LiquidationLogic')
  // const eModeLogicAddress = await readJson('EModeLogic')
  // const poolAddress = await readJson('Pool')

  // const pool = await ethers.getContractFactory("Pool", {
  //   libraries: {
  //     PoolLogic: poolLogicAddress,
  //     SupplyLogic: supplyLogicAddress,
  //     BorrowLogic: borrowLogicAddress,
  //     FlashLoanLogic: flashLoanLogicAddress,
  //     LiquidationLogic: liquidationLogicAddress,
  //     EModeLogic: eModeLogicAddress,
  //   },
  // });
  // const _pool = await pool.attach(poolAddress);

  // const ILendingPool = await ethers.getContractFactory("ILendingPool");
  // const MintableERC20 = await ethers.getContractFactory("MintableERC20");

  // for (let i = 0; i < pools.length; i++) {
  //   let _aaveLendingPool = await ethers.getContractAt(ILendingPool.abi, pools[i].poolAddress, ethers.provider);
  //   // let _aaveLendingPool = await ILendingPool.attach(pools[i].poolAddress);

  //   for (let i = 0; i < tokenAddressesArr.length; i++) {
  //     let _underlyingErc20 = await MintableERC20.attach(tokenAddressesArr[i]);
  //     let underlyingDecimals = await _underlyingErc20.decimals();
  //     let aaveMintAmount = ethers.utils.parseUnits("10000000", underlyingDecimals);
  //     await _underlyingErc20.connect(mockProtocolUser)["mint(uint256)"](aaveMintAmount)
  //     await _underlyingErc20.connect(mockProtocolUser).approve(_aaveLendingPool.address, aaveMintAmount);
  //     const aaveUnderlyingDepositTx = await _aaveLendingPool.connect(mockProtocolUser).deposit(
  //       tokenAddressesArr[i],
  //       aaveMintAmount,
  //       mockProtocolUserAddress,
  //       "0"
  //     );
  //     await aaveUnderlyingDepositTx.wait();

  //   }
  // }

}
