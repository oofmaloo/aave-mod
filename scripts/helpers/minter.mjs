import hre from "hardhat";

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
// const IPool = require("../artifacts/contracts/interfaces/IPool.sol/IPool.json");
// const IPoolAddressesProvider = require("../artifacts/contracts/interfaces/IPoolAddressesProvider.sol/IPoolAddressesProvider.json");
// const IPoolDataProvider = require("../artifacts/contracts/interfaces/IPoolDataProvider.sol/IPoolDataProvider.json");
// const PoolDataProvider = require("../artifacts/contracts/protocol/pool/PoolDataProvider.sol/PoolDataProvider.json");
const { ethers } = hre;


// npx hardhat run scripts/helpers/minter.mjs --network buidlerevm_docker

async function main() {
  const underlyingAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"
  const mintableERC20 = await ethers.getContractFactory("MintableERC20");
  const _underlyingErc20 = await mintableERC20.attach(underlyingAddress);
  const mintAmount = ethers.utils.parseUnits("10000000", 6)
  await _underlyingErc20["mint(uint256)"](mintAmount)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
