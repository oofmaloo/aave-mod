// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

abstract contract Helper {
	address internal immutable aaveAddressesProvider;
	address internal immutable aavePool;
	address internal immutable aaveDataProvider;

	constructor(
		address aaveAddressesProvider_,
		address aavePool_,
		address aaveDataProvider_
	) {
		aaveAddressesProvider = aaveAddressesProvider_;
		aavePool = aavePool_;
		aaveDataProvider = aaveDataProvider_;
	}
}