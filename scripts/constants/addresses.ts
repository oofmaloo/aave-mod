import hre from "hardhat";
const { ethers } = hre;

// local 
// export const underlyings = ["0x5FC8d32690cc91D4c39d9d3abcBD16989F875707", "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"]

// export const assets = [
//   {
//     symbol: 'USDC',
//     name: 'Circle USDC',
//     decimals: 6,
//     address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
//   },
//   {
//     symbol: 'WETH',
//     name: 'Wrapped ETH',
//     decimals: 18,
//     address: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
//   }
// ]

// export const routers = ["0xcBbA3386465456fe256B6d7695Cfd81A60b0a72A", "0x6d12F2D5f806912e1136ee7CeCd1D48C06A328BD"]

// export const cTokens = ["0x0753ba18e716B0B4fA42aD0e66FdbBCcA0392A20", "0x2b761D3d44b48Be4Fec0C4aF895EB549f9e255A3"]

// export const aaveRouters = [
//   {
//     aaveLendingPoolAddress: "0xca4211da53d1bbab819B03138302a21d6F6B7647",
//     aaveAddressesProviderAddress: "0x4826533B4897376654Bb4d4AD88B7faFD0C98528",
//     aaveRewardsControllerAddress: "0x0000000000000000000000000000000000000000",
//     aavePoolDataProviderAddress: "0x0ed64d01D0B4B655E410EF1441dD677B695639E7",
//   }
// ]


// fuji 
interface IAsset {
  symbol: string;
  name: string;
  decimals: string;
  address: string;
  oracleAddresses: string;
  price: string;
}
export const deploymentData: { [id: number]: IAsset[] } = {};

// fuji
deploymentData[43114] = [
  {
    symbol: 'USDC',
    name: 'Circle USDC',
    decimals:' 6',
    address: '0x3E937B4881CBd500d05EeDAB7BA203f2b7B3f74f',
    oracleAddresses: "0x7898AcCC83587C3C55116c5230C17a6Cd9C71bad",
    price: "0"
  },
  {
    symbol: 'DAI',
    name: 'Maker DAO DAI',
    decimals: '18',
    address: '0xFc7215C9498Fc12b22Bc0ed335871Db4315f03d3',
    oracleAddresses: "0x7898AcCC83587C3C55116c5230C17a6Cd9C71bad",
    price: "0"
  }
]

// local fork
deploymentData[31337] = [
  {
    symbol: 'USDC',
    name: 'Circle USDC',
    decimals: '6',
    address: '0x3E937B4881CBd500d05EeDAB7BA203f2b7B3f74f',
    oracleAddresses: "0x7898AcCC83587C3C55116c5230C17a6Cd9C71bad",
    price: ethers.utils.parseUnits("1.0", 8).toString()
  },
  {
    symbol: 'DAI',
    name: 'Maker DAO DAI',
    decimals: '18',
    address: '0xFc7215C9498Fc12b22Bc0ed335871Db4315f03d3',
    oracleAddresses: "0x7898AcCC83587C3C55116c5230C17a6Cd9C71bad",
    price: ethers.utils.parseUnits("1000", 8).toString()
  }
]

// const assets: [ IAsset[] ] = [];
// export const deploymentData: { [id: number] : [ [id: number] : assets ] } = {};

// deploymentData[43114] = { 
//   [
//     {
//       symbol: 'USDC',
//       name: 'Circle USDC',
//       decimals: 6,
//       address: '0x3E937B4881CBd500d05EeDAB7BA203f2b7B3f74f',
//       oracleAddresses: "0x7898AcCC83587C3C55116c5230C17a6Cd9C71bad"
//     },
//     {
//       symbol: 'DAI',
//       name: 'Maker DAO DAI',
//       decimals: 18,
//       address: '0xFc7215C9498Fc12b22Bc0ed335871Db4315f03d3',
//       oracleAddresses: "0x7898AcCC83587C3C55116c5230C17a6Cd9C71bad"
//     }
//   ]
// };

export const underlyings = ["0x3E937B4881CBd500d05EeDAB7BA203f2b7B3f74f", "0xFc7215C9498Fc12b22Bc0ed335871Db4315f03d3"]


export const deployData = {
  31337: {
    assets: [
      {
        symbol: 'USDC',
        name: 'Circle USDC',
        decimals: '6',
        address: '0x3E937B4881CBd500d05EeDAB7BA203f2b7B3f74f',
        oracleAddresses: "0x7898AcCC83587C3C55116c5230C17a6Cd9C71bad"
      },
      {
        symbol: 'DAI',
        name: 'Maker DAO DAI',
        decimals: '18',
        address: '0xFc7215C9498Fc12b22Bc0ed335871Db4315f03d3',
        oracleAddresses: "0x7898AcCC83587C3C55116c5230C17a6Cd9C71bad"
      }
    ]
  }
}

export const assets = [
  {
    symbol: 'USDC',
    name: 'Circle USDC',
    decimals: 6,
    address: '0x3E937B4881CBd500d05EeDAB7BA203f2b7B3f74f',
    oracleAddresses: "0x7898AcCC83587C3C55116c5230C17a6Cd9C71bad"
  },
  {
    symbol: 'DAI',
    name: 'Maker DAO DAI',
    decimals: 18,
    address: '0xFc7215C9498Fc12b22Bc0ed335871Db4315f03d3',
    oracleAddresses: "0x7898AcCC83587C3C55116c5230C17a6Cd9C71bad"
  }
]

// export const routers = ["0x2598896fcD18013d49059139529b2C417F633303", "0x3754BF1F1075157082dEeD49eD1023D484E76Ad1"]
export const routers = ["0x882AA2Cc4400A232e612B6204a84caa2591AB4B9", "0x4Eb3ED3eC8fdeBa3d8b4dFe16654A2b877836Ce2"]

export const cTokens = ["0xf971ecBb85c3e1d3Cb3eEeD68a67f1ee49Fa9244", "0xfa03939eE7354e633Fba8783E1305973C32FaE0D"]

export const aaveRouters = [
  {
    aaveLendingPoolAddress: "0xb47673b7a73D78743AFF1487AF69dBB5763F00cA",
    aaveAddressesProviderAddress: "0x1775ECC8362dB6CaB0c7A9C0957cF656A5276c29",
    aaveRewardsControllerAddress: "0x0000000000000000000000000000000000000000",
    aavePoolDataProviderAddress: "0x8e0988b28f9CdDe0134A206dfF94111578498C63",
  }
]
