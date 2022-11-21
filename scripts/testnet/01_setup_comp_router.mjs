import hre from "hardhat";
const { ethers } = hre;

export async function setupCompRouter(
  [underlyingAddress, underlyingAddress_2],
  [tokenAddress, tokenAddress_2],
  poolAddressesProviderAddress,
  aclManagerAddress,
  compCount
  ) {

  // deploy routers

  //!
  //!    _____________________________________
  //!    _____________________________________
  // >>> make sure to update helpers contracts <<<
  //!    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //!    ^^^^^^^^^^^^^
  //!
  //!
  let underlyings = [underlyingAddress, underlyingAddress_2];
  let tokens = [tokenAddress, tokenAddress_2];

  let compRouterAddresses = []
  console.log("compCount", compCount)

  for (let i = 0; i < compCount; i++) {
    let CompoundRouterTest = await ethers.getContractFactory("CompoundRouterTest");
    let _compoundRouterTest = await CompoundRouterTest.deploy(
      poolAddressesProviderAddress, // addressesProvider_
      aclManagerAddress, // aclManager
      "0x0000000000000000000000000000000000000000", //rewardsController_
      underlyings, // underlyings
      tokens // tokens
    );
    await _compoundRouterTest.deployed();
    compRouterAddresses.push(_compoundRouterTest.address)
  }

  console.log("compRouterAddresses", compRouterAddresses)

  return compRouterAddresses
}