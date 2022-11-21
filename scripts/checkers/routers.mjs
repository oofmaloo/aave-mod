import hre from "hardhat";
// import { readJson } from '../../helpers/misc.ts';
import { tokenAddressesArr, tokens } from '../../test/constants/tokens';
import { pools } from '../../test/constants/pools';

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const { ethers } = hre;
const aaveProtocolDataProvider = require("../../artifacts/contracts/mocks/aave/IAaveProtocolDataProvider.sol/IAaveProtocolDataProvider.json");


// npx hardhat run scripts/checkers/routers.mjs --network buidlerevm_docker

async function main() {

  for (let i = 0; i < pools.length; i++) {
    let _aavePoolDataProvider = await ethers.getContractAt(aaveProtocolDataProvider.abi, pools[i].dataProviderAddress, provider);

    for (let i = 0; i < tokenAddressesArr.length; i++) {
      let reserveData = await _aavePoolDataProvider.getReserveData(wethAddress)
      console.log("liquidityRate", ethers.utils.formatUnits(reserveData[3], "27"));
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
