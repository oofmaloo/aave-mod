import { HardhatUserConfig } from "hardhat/config";
import "hardhat-abi-exporter";
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-waffle";
import 'hardhat-deploy';

const avaxFujiKey = process.env.AVAX_FUJI_KEY;

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000
          }
        }
      },
      {
        version: "0.8.10",
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000
          }
        }
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000
          }
        }
      },

    ]
  },
  namedAccounts: {
    deployer: 0,
    poster: '0x52f428419bFf2668a1416f1aB0776163BC8F8731',
    admin: {
      buidlerevm_docker: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      hardhat: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      fuji: '0x52f428419bFf2668a1416f1aB0776163BC8F8731'
    },
  },

  abiExporter: {
    path: './next-front/front/components/eth/abi',
    runOnCompile: true,
    clear: true,
    flat: false,
    pretty: false,
  },
  networks: {
    hardhat: {
      chainId: 31337,
      gasPrice: 225000000000,
      forking: {
        url: "https://api.avax-test.network/ext/C/rpc",
        enabled: true,
      },
    },
    // localhost: {
    //   chainId: 43113,
    //   gasPrice: 225000000000,
    //   forking: {
    //     url: "https://api.avax-test.network/ext/C/rpc",
    //     enabled: true,
    //   },
    // },
    buidlerevm_docker: {
      url: "http://localhost:8545",
      gasPrice: 8000000000,
      chainId: 31337,
      // allowUnlimitedContractSize: true,
      gasMultiplier: 2
    },
    fuji: {
      url: 'https://api.avax-test.network/ext/C/rpc',
      gasPrice: 225000000000,
      chainId: 43113,
      accounts: [`0x${avaxFujiKey}`]
    },
  },
}

export default config;

// npx hardhat node --fork https://api.avax-test.network/ext/bc/C/rpc

// npx hardhat node from anywhere
//
// cmd --- run aave
// cd aave-v2/protocol-v2
// npx hardhat aave:dev --network buidlerevm_docker
//
// cmd --- run aave for second router
// update helps/contract-getters.ts getAllMockedTokens() function
// update tasks/dev/initialize.ts allTokenAddresses['USDC'] && allTokenAddresses['WETH'] dictionary
// cd aave-v2/protocol-v2
// npx hardhat aave:dev --network buidlerevm_docker
//
// cmd --- start advias
// update scripts aave params
// cd advias
// update router helpers
// npx hardhat run scripts/local/00__deploy.mjs --network buidlerevm_docker
// npx hardhat run scripts/fuji/00__deploy.mjs --network fuji
// npx hardhat test --network buidlerevm_docker





// npx hardhat deploy --network buidlerevm_docker --reset
//
// --- prints routers to add to set_aggregators
// npx hardhat run scripts/set_aave_routers.ts --network buidlerevm_docker
//
// --- prints routers to add to set_aggregators
// npx hardhat run scripts/set_compound_routers.ts --network buidlerevm_docker
// npx hardhat run scripts/set_new_reserves.ts --network buidlerevm_docker
//
// --- add routers --- (set_aggregators)
//
// npx hardhat run scripts/set_aggregators.ts --network buidlerevm_docker
// npx hardhat run scripts/set_dividends.ts --network buidlerevm_docker



// fiji
// npx hardhat deploy --network fuji --reset
//
// --- prints routers to add to set_aggregators
// npx hardhat run scripts/set_aave_routers.ts --network fuji
//
// --- prints routers to add to set_aggregators
// npx hardhat run scripts/set_compound_routers.ts --network fuji
// npx hardhat run scripts/set_new_reserves.ts --network fuji
//
// --- add routers --- (set_aggregators)
//
// npx hardhat run scripts/set_aggregators.ts --network fuji
// npx hardhat run scripts/set_dividends.ts --network fuji



// forks
// npx hardhat deploy --network localhost --reset
//
// --- prints routers to add to set_aggregators
// npx hardhat run scripts/set_aave_routers.ts --network localhost
//
// --- prints routers to add to set_aggregators
// npx hardhat run scripts/set_compound_routers.ts --network localhost
//
// npx hardhat run scripts/set_new_reserves.ts --network localhost
//
// --- add routers before continuing--- (set_aggregators)
//
// npx hardhat run scripts/set_aggregators.ts --network localhost
// npx hardhat run scripts/set_dividends.ts --network localhost
