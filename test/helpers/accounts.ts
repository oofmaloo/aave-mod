import { ethers } from "hardhat";
const provider = new ethers.providers.JsonRpcProvider();

  // const accounts = await provider.listAccounts()

export const owner = async () => await provider.getSigner(0);
export const borrower_1 = async () =>  await provider.getSigner(1);
export const aave_depositor = async () =>  await provider.getSigner(2);
export const aave_borrower = async () =>  await provider.getSigner(3);
export const allocatorCaller = async () =>  await provider.getSigner(4);
export const validator = async () =>  await provider.getSigner(5);
export const liquidator = async () =>  await provider.getSigner(6);

  // export const owner = await provider.getSigner(0);
//   export const ownerAddress = await owner.getAddress();
//   export const borrower_1 = await provider.getSigner(2);
//   export const borrower_1Address = await borrower_1.getAddress();
//   export const aave_depositor = await provider.getSigner(3);
//   export const aave_depositorAddress = await aave_depositor.getAddress();
//   export const aave_borrower = await provider.getSigner(4);
//   export const aave_borrowerAddress = await aave_borrower.getAddress();
//   export const allocatorCaller = await provider.getSigner(5);
//   export const allocatorCallerAddress = await allocatorCaller.getAddress();
//   export const validator = await provider.getSigner(6);
//   export const validatorAddress = await validator.getAddress();
//   export const liquidator = await provider.getSigner(7);
//   export const liquidatorAddress = await liquidator.getAddress();

// import { ethers } from 'ethers';
// export async function accounts() {

//   const provider = new ethers.providers.JsonRpcProvider();

//   const accounts = await provider.listAccounts()

//   const owner = await provider.getSigner(0);
//   const ownerAddress = await owner.getAddress();
//   const borrower_1 = await provider.getSigner(2);
//   const borrower_1Address = await borrower_1.getAddress();
//   const aave_depositor = await provider.getSigner(3);
//   const aave_depositorAddress = await aave_depositor.getAddress();
//   const aave_borrower = await provider.getSigner(4);
//   const aave_borrowerAddress = await aave_borrower.getAddress();
//   const allocatorCaller = await provider.getSigner(5);
//   const allocatorCallerAddress = await allocatorCaller.getAddress();
//   const validator = await provider.getSigner(6);
//   const validatorAddress = await validator.getAddress();
//   const liquidator = await provider.getSigner(7);
//   const liquidatorAddress = await liquidator.getAddress();

//   return {
//     owner: owner,
//     ownerAddress: ownerAddress,
//     borrower_1: borrower_1,
//     borrower_1Address: borrower_1Address,
//     aave_depositor: aave_depositor,
//     aave_depositorAddress: aave_depositorAddress,
//     aave_borrower: aave_borrower,
//     aave_borrowerAddress: aave_borrowerAddress,
//     allocatorCaller: allocatorCaller,
//     allocatorCallerAddress: allocatorCallerAddress,
//     validator: validator,
//     validatorAddress: validatorAddress,
//     liquidator: liquidator,
//     liquidatorAddress: liquidatorAddress
//   }
// }
