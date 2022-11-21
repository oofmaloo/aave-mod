// npx hardhat run scripts/testnet/withdraw.ts --network fuji
// npx hardhat run scripts/testnet/withdraw.ts --network localhost

import {deployments, ethers, getNamedAccounts} from 'hardhat';
import { assets, underlyings } from '../constants/addresses'
const {parseUnits} = ethers.utils;
const {deploy, get, getArtifact, save, run} = deployments;

async function main() {
  const {deploy, execute, read} = deployments;

  const {deployer} = await getNamedAccounts();
  console.log("deployer", deployer)

  let reserveTokensAddresses = await read('AaveProtocolDataProvider', { from: deployer }, 'getReserveTokensAddresses', underlyings[0]);
  // console.log("reserveTokensAddresses", reserveTokensAddresses)getAggregatorAddress

	const amount = "100000000"
  const impersonatedSignerAddress = "0x52f428419bFf2668a1416f1aB0776163BC8F8731"
	const impersonatedSigner = await ethers.getImpersonatedSigner(impersonatedSignerAddress);

  const poolAddress = (await deployments.get('Pool')).address;

  const PoolContract = await ethers.getContractAt('Pool', poolAddress);

  const mintableERC20 = await ethers.getContractFactory("MintableERC20");
  const _aTokenErc20 = await mintableERC20.attach(reserveTokensAddresses[0]);
  let balanceOf = await _aTokenErc20.connect(impersonatedSigner).balanceOf(impersonatedSignerAddress);
  console.log("balanceOf", balanceOf)

  let tx = await PoolContract.connect(impersonatedSigner).withdraw(
    underlyings[0],
    amount,
    impersonatedSignerAddress,
    false
  );

	console.log("tx", tx)
  balanceOf = await _aTokenErc20.connect(impersonatedSigner).balanceOf(impersonatedSignerAddress);
  console.log("balanceOf", balanceOf)

 //  reserveData = await read('Pool', { from: deployer }, 'getReserveData', underlyings[0]);
 //  console.log("reserveData", reserveData)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
