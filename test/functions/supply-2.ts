const {ethers, getNamedAccounts} = require('hardhat');

const setupTest = deployments.createFixture(
  async ({deployments, getNamedAccounts, ethers}, options) => {
    await deployments.fixture(); // ensure you start from a fresh deployments
    const {deployer} = await getNamedAccounts();
    const Pool = await ethers.getContract('Pool', deployer);
    await Pool.supply(10).then((tx) => tx.wait()); //this mint is executed once and then `createFixture` will ensure it is snapshotted
    return {
      deployer: {
        address: deployer,
        TokenContract,
      },
    };
  }
);
describe('Token', () => {
  it('testing 1 2 3', async function () {
    const {deployer} = await setupTest();
    await deployer.TokenContract.mint(2);
  });
});
