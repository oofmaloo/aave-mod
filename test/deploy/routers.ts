import { Contract, utils } from "ethers";
import { iRouterInputParams } from '../constants/pools';
import { tokenAddressesArr, compAddressesArr } from '../constants/tokens';
import { ethers } from "hardhat";
import { saveToJson } from '../../helpers/misc';
import { expect } from "chai";

// import { 
//   owner,
//   ownerAddress,
//   borrower_1,
//   borrower_1Address,
//   aave_depositor,
//   aave_depositorAddress,
//   aave_borrower,
//   aave_borrowerAddress,
//   allocatorCaller,
//   allocatorCallerAddress,
//   validator,
//   validatorAddress,
//   liquidator,
//   liquidatorAddress
//  } from '../helpers/accounts';

// export async function deployRouters(
//   routers: RouterInputParams[],
//   providers: string[],
//   assets: string[],
//   poolAddressesProviderAddress: string,
//   aclManagerAddress: string,
//   aaveLendingPoolAddress: string,
//   aaveAddressesProviderAddress: string,
//   aaveRewardsControllerAddress: string,
//   aavePoolDataProviderAddress: string
//   ) {

//   const AaveRouter = await ethers.getContractFactory("AaveRouter");

//   for (let i = 0; protocols.length() < 1; i++) {
//     const _aaveRouter = await AaveRouter.deploy(
//       aaveLendingPoolAddress, // aaveLendingPoolAddress
//       aaveAddressesProviderAddress, // aaveAddressesProviderAddress
//       poolAddressesProviderAddress, // addressesProvider_
//       aclManagerAddress, // _aclManager
//       ethers.constants.AddressZero, // rewardsController_
//       aavePoolDataProviderAddress, // poolDataProvider_
//       assets, // underlyings
//       "10000" // borrowFactor_
//     );
//     await _aaveRouter.deployed();
//   }

  


//   return _aaveRouter.address;
// }

export async function deployRouters(
  assets: string[],
  routers: iRouterInputParams[],
  poolAddressesProviderAddress: string,
  aclManagerAddress: string,
  ) {

  console.log("deployRouters")

  const routersAddresses = [];
  const interestRateModelsAddresses = [];

  const AaveRouterTest = await ethers.getContractFactory("AaveRouterTest");
  // const Helper = await ethers.getContractFactory("Helper");
  const MockInterestRateModelStandard = await ethers.getContractFactory("MockInterestRateModelStandard");

  for (let i = 0; i < routers.length; i++) {
    if (routers[i].routerType == "aave") {

      const _aaveRouter = await AaveRouterTest.deploy(
        routers[i].poolAddress, // aaveLendingPoolAddress
        routers[i].addressesProviderAddress, // aaveAddressesProviderAddress
        poolAddressesProviderAddress, // addressesProvider_
        aclManagerAddress, // _aclManager
        ethers.constants.AddressZero, // rewardsController_
        routers[i].dataProviderAddress, // poolDataProvider_
        assets, // underlyings
        "10000" // borrowFactor_
      );
      routersAddresses.push(_aaveRouter.address)
      saveToJson({title: "AaveRouter", address: _aaveRouter.address, description: "router"})
      await _aaveRouter.deployed();

      for (let i = 0; i < tokenAddressesArr.length; i++) {
        let rate = await _aaveRouter.getPreviousInterestRate(tokenAddressesArr[i]) 
        expect(rate).to.be.at.least('0');
      }

      const _interestRateModelStandard = await MockInterestRateModelStandard.deploy(
        routers[i].dataProviderAddress, // aaveDataProvider
        ethers.utils.parseUnits(".6", 27), // optimalUsageRatio
        "0", // baseVariableBorrowRate
        ethers.utils.parseUnits(".04", 27), // variableRateSlope1
        ethers.utils.parseUnits(".6", 27), // variableRateSlope2
      );
      interestRateModelsAddresses.push(_interestRateModelStandard.address)
      saveToJson({title: "InterestRateModelStandard", address: _interestRateModelStandard.address, description: ""})
    }

    if (routers[i].routerType == "comp") {
      let CompoundRouterTest = await ethers.getContractFactory("CompoundRouterTest");
      let _compoundRouterTest = await CompoundRouterTest.deploy(
        poolAddressesProviderAddress, // addressesProvider_
        aclManagerAddress, // aclManager
        "0x0000000000000000000000000000000000000000", //rewardsController_
        assets, // underlyings
        compAddressesArr // tokens
      );
      await _compoundRouterTest.deployed();
      routersAddresses.push(_compoundRouterTest.address)

    }

  }

  


  return {routersAddresses, interestRateModelsAddresses};
}