// import { CTokenDeployArg, deployCompoundV2, Comptroller,} from "@thenextblock/hardhat-compound";
import hardhatCompound from '@thenextblock/hardhat-compound';
import hardhatErc20 from "@thenextblock/hardhat-erc20";
import hre from "hardhat";
const { ethers } = hre;
const { CTokenDeployArg, deployCompoundV2, Comptroller,} = hardhatCompound;
const { deployErc20Token, Erc20Token } = hardhatErc20;

export async function deployCompound(
  owner,
  [underlyingAddress, underlyingAddress_2],
  [underlyingAddressPrice, underlyingAddress_2Price],
  [underlyingAddressCollateralFactor, underlyingAddress_2CollateralFactor]
  ) {

  // const underlyings = [underlyingAddress, underlyingAddress_2]
  // const prices = [underlyingAddressPrice, underlyingAddress_2Price]
  // const collateralFactors = [underlyingAddressCollateralFactor, underlyingAddress_2CollateralFactor]

  // const ctokenArgs = []

  // const mintableERC20 = await ethers.getContractFactory("MintableERC20");

  // for (let i = 0; i < underlyings.length; i++) {

  //   let _underlyingErc20 = await mintableERC20.attach(underlyings[i]);
  //   let underlyingDecimals = await _underlyingErc20.decimals();
  //   let underlyingName = await _underlyingErc20.name();
  //   let underlyingSymbol = await _underlyingErc20.symbol();

  //   ctokenArgs.push({
  //     cToken: "c" + underlyingSymbol,
  //     underlying: underlyings[i],
  //     underlyingPrice: prices[i],
  //     collateralFactor: collateralFactors[i], // 50%
  //   })

  // }

  // const [deployer] = await ethers.getSigners();
  const UNI_PRICE = "25022748000000000000";
  const USDC_PRICE = "1000000000000000000000000000000";

  // Deploy USDC ERC20
  const USDC: Erc20Token = await deployErc20Token(
    {
      name: "USDC",
      symbol: "USDC",
      decimals: 6,
    },
    owner
  );

  // Deploy UNI ERC20
  const UNI: Erc20Token = await deployErc20Token(
    {
      name: "UNI",
      symbol: "UNI",
      decimals: 18,
    },
    owner
  );

  const ctokenArgs: CTokenDeployArg[] = [
    {
      cToken: "cUNI",
      underlying: UNI.address,
      underlyingPrice: UNI_PRICE,
      collateralFactor: "500000000000000000", // 50%
    },
    {
      cToken: "cUSDC",
      underlying: USDC.address,
      underlyingPrice: USDC_PRICE,
      collateralFactor: "500000000000000000", // 50%
    },
  ];





  const { comptroller, cTokens, priceOracle, interestRateModels } =
    await deployCompoundV2(ctokenArgs, owner);

  await comptroller._setCloseFactor(ethers.parseUnits("0.5", 18).toString());
  await comptroller._setLiquidationIncentive(ethers.parseUnits("1.08", 18));

  const { cETH, cUSDC } = cTokens;

  console.log("Comptroller: ", comptroller.address);
  console.log("SimplePriceOralce: ", await comptroller.oracle());
  console.log("cETH: ", cETH.address);
  console.log("cUSDC: ", cUSDC.address);

  // Deploy Smartcontract
  const Compound = await ethers.getContractFactory("Compound");
  const compound = await Compound.deploy(comptroller.address);
  await compound.deployed();
  console.log("Compound deployed to:", compound.address);

  // Call public view function
  await compound.cTokens();



  // return {
  //   "comptroller": comptroller.address,
  //   "cTokens": cTokens.address,
  //   "priceOracle": priceOracle.address,
  //   "interestRateModels": interestRateModels.address,
  // }

}