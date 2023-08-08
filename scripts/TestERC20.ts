import { ethers } from "hardhat"

async function main() {
  const tokenContractFactory = await ethers.getContractFactory("MyERC20");
  const tokenContract = await tokenContractFactory.deploy();
  await tokenContract.waitForDeployment();
  const tokenContractAddress = await tokenContract.getAddress();
  console.log(`Contract deployed at ${tokenContractAddress}`);

  const accounts = await ethers.getSigners();
  const balance = await tokenContract.balanceOf(accounts[0].address);
  console.log(`My balance is ${balance} decimals units`);
  const otherBalance = await tokenContract.balanceOf(accounts[1].address);
  console.log(`Other balance is ${otherBalance} decimals units`);

  // Fetching the role code.
  const code = await tokenContract.MINTER_ROLE();
  console.log(code);

  // Giving role
  const roleTx = await tokenContract.grantRole(code, accounts[2].address);
  await roleTx.wait();

  // Minting tokens
  const mintTx = await tokenContract
    .connect(accounts[2])
    .mint(accounts[0].address, 2);
  await mintTx.wait();
  console.log(mintTx);
}

main().catch((err)=>{
  console.error(err)
  process.exitCode = 1
})