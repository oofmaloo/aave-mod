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
  const poolLogicAddress = ""
  const supplyLogicAddress = ""
  const borrowLogicAddress = ""
  const flashLoanLogicAddress = ""
  const liquidationLogicAddress = ""
  const eModeLogicAddress = "0x75b0B516B47A27b1819D21B26203Abf314d42CCE"
  const poolAddress = poolAddress;
  const pool = await ethers.getContractFactory("Pool", {
    libraries: {
      PoolLogic: poolLogicAddress,
      SupplyLogic: supplyLogicAddress,
      BorrowLogic: borrowLogicAddress,
      FlashLoanLogic: flashLoanLogicAddress,
      LiquidationLogic: liquidationLogicAddress,
      EModeLogic: eModeLogicAddress,
    },
  });
  const _pool = await pool.attach(poolAddress);

  const underlyingAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"
  await _pool.mintToTreasury([underlyingAddress])
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
