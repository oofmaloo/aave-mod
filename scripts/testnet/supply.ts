// npx hardhat run scripts/testnet/supply.ts --network fuji
// npx hardhat run scripts/testnet/supply.ts --network localhost

import {deployments, ethers, getNamedAccounts} from 'hardhat';
import { assets, underlyings } from '../constants/addresses'
const {parseUnits} = ethers.utils;
const {deploy, get, getArtifact, save, run} = deployments;

async function main() {
  const {deploy, execute, read} = deployments;

  const {deployer} = await getNamedAccounts();
  console.log("deployer", deployer)

  let reserveData = await read('Pool', { from: deployer }, 'getReserveData', underlyings[0]);
  console.log("reserveData", reserveData)

	const amount = "200000000"

	const impersonatedSigner = await ethers.getImpersonatedSigner("0x52f428419bFf2668a1416f1aB0776163BC8F8731");

 //  console.log("impersonatedSigner", impersonatedSigner)

  const poolAddress = (await deployments.get('Pool')).address;

  const PoolContract = await ethers.getContractAt('Pool', poolAddress);

  const mintableERC20 = await ethers.getContractFactory("MintableERC20");
  const _underlyingErc20 = await mintableERC20.attach(underlyings[0]);
  await _underlyingErc20.connect(impersonatedSigner).approve(poolAddress, amount);

  let tx = await PoolContract.connect(impersonatedSigner).supply(
    underlyings[0],
    amount,
    impersonatedSigner.address,
    false,
    0
  );

 //  let tx = await execute('Pool', { from: impersonatedSigner, gasLimit: 4000000 }, 'supply', 
 //    underlyings[0],
 //    amount,
 //    impersonatedSigner.address,
 //    false,
 //    0
	// );
 //  let tx = await execute('Pool', { from: deployer, gasLimit: 8000000 }, 'supply', 
 //    underlyings[0],
 //    amount,
 //    deployer,
 //    false,
 //    0
	// );

 //  let tx = await execute('Pool', { from: deployer  }, 'supply', 
 //    underlyings[0],
 //    amount,
 //    deployer,
 //    false,
 //    0
	// );

	console.log("tx", tx)

  reserveData = await read('Pool', { from: deployer }, 'getReserveData', underlyings[0]);
  console.log("reserveData", reserveData)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
