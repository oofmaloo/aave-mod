export const tokens = [
	{
		name: "USDC",
		symbol: "USDC",
		address: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
		price: "1.0",
		ethPrice: ".001"
	},
	{
		name: "WETH",
		symbol: "WETH",
		address: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
		price: "1000.0",
		ethPrice: "1"
	},

]

export const tokenAddressesArr = ["0x5FC8d32690cc91D4c39d9d3abcBD16989F875707", "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"]

export const compTokens = [
	{
		name: "cUSDC",
		symbol: "cUSDC",
		underlying: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
		address: "0x0753ba18e716B0B4fA42aD0e66FdbBCcA0392A20",
		decimals: "8"
	},
	{
		name: "WETH",
		symbol: "WETH",
		underlying: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
		address: "0x2b761D3d44b48Be4Fec0C4aF895EB549f9e255A3",
		decimals: "8"
	},
]

// must be in same order as tokenAddressesArr
export const compAddressesArr = ["0x0753ba18e716B0B4fA42aD0e66FdbBCcA0392A20", "0x2b761D3d44b48Be4Fec0C4aF895EB549f9e255A3"]
