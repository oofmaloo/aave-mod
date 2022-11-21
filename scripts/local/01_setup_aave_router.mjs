import hre from "hardhat";
const { ethers } = hre;

// export async function setupAaveRouter(
//   [underlyingAddress, underlyingAddress_2],
//   poolAddressesProviderAddress,
//   aclManagerAddress,
//   aaveLendingPoolAddress,
//   aaveAddressesProviderAddress,
//   aaveRewardsControllerAddress,
//   aavePoolDataProviderAddress
//   ) {

//   // deploy routers

//   //!
//   //!    _____________________________________
//   //!    _____________________________________
//   // >>> make sure to update helpers contracts <<<
//   //!    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//   //!    ^^^^^^^^^^^^^
//   //!
//   //!

//   // Init AAVE Router
//   // aave router
//   let underlyings = [underlyingAddress, underlyingAddress_2];
//   console.log("AaveRouterV3")
//   let AaveRouter = await ethers.getContractFactory("AaveRouterV3");
//   let _aaveRouter = await AaveRouter.deploy(
//     poolAddressesProviderAddress, // addressesProvider_
//     aclManagerAddress, // _aclManager
//     underlyings, // underlyings
//     "10000" // borrowFactor_
//   );
//   await _aaveRouter.deployed();

//   let aaveRouterAddress = _aaveRouter.address;
//   console.log("const aaveRouterAddress = ", aaveRouterAddress)


//   // v2
//   console.log("AaveRouterV2")
//   let AaveRouterV2 = await ethers.getContractFactory("AaveRouterV2");
//   let _aaveRouterV2 = await AaveRouterV2.deploy(
//     poolAddressesProviderAddress, // addressesProvider_
//     aclManagerAddress, // _aclManager
//     underlyings, // underlyings
//     "10000" // borrowFactor_
//   );
//   await _aaveRouterV2.deployed();

//   let aaveRouterV2Address = _aaveRouterV2.address;
//   console.log("const aaveRouterV2Address = ", aaveRouterV2Address)

//   let AaveRouterTest = await ethers.getContractFactory("AaveRouterTest");
//   let _aaveRouterTest = await AaveRouterTest.deploy(
//     aaveLendingPoolAddress, //aavePoolAddress
//     aaveAddressesProviderAddress, //aaveAddressesProviderAddress
//     poolAddressesProviderAddress, // addressesProvider_
//     aclManagerAddress, // _aclManager
//     aaveRewardsControllerAddress, //aaveRewardsController
//     aavePoolDataProviderAddress, //aavePoolDataProvider_
//     underlyings, // underlyings
//     "10000" // borrowFactor_
//   );
//   await _aaveRouterTest.deployed();
//   let aaveRouterV3Address = _aaveRouterTest.address;
//   console.log("const aaveRouterV3Address = ", aaveRouterV3Address)

//   return {
//     "aaveRouterAddress": aaveRouterAddress,
//     "aaveRouterAddress_v2": aaveRouterV2Address,
//     "aaveRouterAddress_v3": aaveRouterV3Address
//   }
// }

// export async function setupAaveRouter(
//   [underlyingAddress, underlyingAddress_2],
//   poolAddressesProviderAddress,
//   aclManagerAddress,
//   [aaveLendingPoolAddress, aaveLendingPoolAddress_v2, aaveLendingPoolAddress_v3, aaveLendingPoolAddress_v4],
//   [aaveAddressesProviderAddress, aaveAddressesProviderAddress_v2, aaveAddressesProviderAddress_v3, aaveAddressesProviderAddress_v4],
//   [aaveRewardsControllerAddress, aaveRewardsControllerAddress_v2, aaveRewardsControllerAddress_v3, aaveRewardsControllerAddress_v4],
//   [aavePoolDataProviderAddress, aavePoolDataProviderAddress_v2, aavePoolDataProviderAddress_v3, aavePoolDataProviderAddress_v4]
//   ) {

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