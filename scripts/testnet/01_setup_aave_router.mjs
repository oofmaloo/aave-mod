import hre from "hardhat";
const { ethers } = hre;

export async function setupAaveRouter(
  [underlyingAddress, underlyingAddress_2],
  poolAddressesProviderAddress,
  aclManagerAddress,
  aaveLendingPoolAddresses,
  aaveAddressesProviderAddresses,
  aaveRewardsControllerAddresses,
  aavePoolDataProviderAddresses,
  aaveCount
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
  let aaveRouterAddresses = []
  console.log("aaveLendingPoolAddresses.length", aaveLendingPoolAddresses.length)
    console.log("aaveCount", aaveCount)

  // for (let i = 0; i < aaveLendingPoolAddresses.length && aaveCount-1; i++) {
  for (let i = 0; i < aaveCount; i++) {
    console.log("aaveLendingPoolAddresses", aaveLendingPoolAddresses[i])
    let AaveRouterTest = await ethers.getContractFactory("AaveRouterTest");
    let _aaveRouterTest = await AaveRouterTest.deploy(
      aaveLendingPoolAddresses[i], //aavePoolAddress
      aaveAddressesProviderAddresses[i], //aaveAddressesProviderAddress
      poolAddressesProviderAddress, // addressesProvider_
      aclManagerAddress, // _aclManager
      aaveRewardsControllerAddresses[i], //aaveRewardsController
      aavePoolDataProviderAddresses[i], //aavePoolDataProvider_
      underlyings, // underlyings
      "10000" // borrowFactor_
    );
    await _aaveRouterTest.deployed();
    aaveRouterAddresses.push(_aaveRouterTest.address)
  }

  console.log("aaveRouterAddresses", aaveRouterAddresses)

  return aaveRouterAddresses
}