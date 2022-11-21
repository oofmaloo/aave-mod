export interface iRouterInputParams {
	name: string;
	routerType: string;
	poolAddress: string;
	addressesProviderAddress: string;
	dataProviderAddress: string;
}


export const pools = [
	{
		name: "Aave-V2-A",
		routerType: "aave",
		poolAddress: "0xca4211da53d1bbab819B03138302a21d6F6B7647",
		addressesProviderAddress: "0x4826533B4897376654Bb4d4AD88B7faFD0C98528",
		dataProviderAddress: "0x0ed64d01D0B4B655E410EF1441dD677B695639E7"
	},
	{
		name: "Aave-V2-B",
		routerType: "aave",
		poolAddress: "0x72A2e04a66336BC6A394a7808402968D65e9335A",
		addressesProviderAddress: "0x8bEe2037448F096900Fd9affc427d38aE6CC0350",
		dataProviderAddress: "0xc0Bb1650A8eA5dDF81998f17B5319afD656f4c11"
	},
	// {
	// 	name: "Aave-V2-C",
	// 	routerType: "aave",
	// 	poolAddress: "0x54aF7945f9CbAD79Cb8Afc02fC46080195139F22",
	// 	addressesProviderAddress: "0x06786bCbc114bbfa670E30A1AC35dFd1310Be82f",
	// 	dataProviderAddress: "0xD69BC314bdaa329EB18F36E4897D96A3A48C3eeF"
	// },
	// {
	// 	name: "Aave-V2-D",
	// 	routerType: "aave",
	// 	poolAddress: "0xA4d82217474460D3250F2Be0C8E58FDf60cd21De",
	// 	addressesProviderAddress: "0x840748F7Fd3EA956E5f4c88001da5CC1ABCBc038",
	// 	dataProviderAddress: "0x057cD3082EfED32d5C907801BF3628B27D88fD80"
	// },
	{
		name: "Comp-V2-A",
		routerType: "comp",
		poolAddress: "0",
		addressesProviderAddress: "0",
		dataProviderAddress: "0"
	},
]

export const compPools = [
	{
		name: "Comp-V2-A",
		routerType: "comp",
	},
	// {
	// 	name: "Aave-V2-B",
	// 	routerType: "aave",
	// 	poolAddress: "0x72A2e04a66336BC6A394a7808402968D65e9335A",
	// 	addressesProviderAddress: "0x8bEe2037448F096900Fd9affc427d38aE6CC0350",
	// 	dataProviderAddress: "0xc0Bb1650A8eA5dDF81998f17B5319afD656f4c11"
	// },
	// {
	// 	name: "Aave-V2-C",
	// 	routerType: "aave",
	// 	poolAddress: "0x54aF7945f9CbAD79Cb8Afc02fC46080195139F22",
	// 	addressesProviderAddress: "0x06786bCbc114bbfa670E30A1AC35dFd1310Be82f",
	// 	dataProviderAddress: "0xD69BC314bdaa329EB18F36E4897D96A3A48C3eeF"
	// },
	// {
	// 	name: "Aave-V2-D",
	// 	routerType: "aave",
	// 	poolAddress: "0xA4d82217474460D3250F2Be0C8E58FDf60cd21De",
	// 	addressesProviderAddress: "0x840748F7Fd3EA956E5f4c88001da5CC1ABCBc038",
	// 	dataProviderAddress: "0x057cD3082EfED32d5C907801BF3628B27D88fD80"
	// },
]