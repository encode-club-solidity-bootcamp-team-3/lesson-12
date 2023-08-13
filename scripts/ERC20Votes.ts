import { ethers } from "hardhat";
import { MyToken__factory } from "../typechain-types";

// const MINT_VALUE = 1n; // = 1 bigint = 1 decimal unit = 1 wei
const MINT_VALUE = ethers.parseUnits("1"); // = 1 token for EVM (18 decimals)

async function main() {
  // import { ethers } from "hardhat";
  const [deployer, acc1, acc2] = await ethers.getSigners();
  const contractFactory = new MyToken__factory(deployer);

  // import { ethers } from "ethers";
  // const provider = ...;
  // const wallet = new ethers.Wallet('pk', provider);
  // const contractFactory = new MyToken__factory(wallet);

  const contract = await contractFactory.deploy(); // unlike deploy with hardhat getContractFactory that uses account 0 by default, here we use typechain-types and this does not use default, it uses the account passed in args of MyToken__factory(), so here it's deployer
  await contract.waitForDeployment();

  // Check address of contract deployed
  const contractAddress = await contract.getAddress();
  console.log(`Token contract deployed at ${contractAddress}`);

  // Mint some tokens
  // by default connected with account that deploys the contract.
  // deployer has minter_role (done in ERC20Votes.sol constructor).
  const mintTx = await contract.mint(acc1.address, MINT_VALUE);
  await mintTx.wait();
  console.log(
    `Minted ${MINT_VALUE.toString()} decimal units to accounts ${acc1.address}`
  );

  // Check balance
  const balanceBN = await contract.balanceOf(acc1.address);
  console.log(
    `Account ${
      acc1.address
    } has ${balanceBN.toString()} decimals units of MyToken`
  );

  // How contract.connect() works:
  // const contractSignedByDeployer = contract.connect(deployer)
  // const contractSignedByAcc1 = contractSignedByDeployer.connect(acc1);
  // const contractSignedByAcc2 = contractSignedByAcc1.connect(acc2);
  // const contractSignedByAcc3 = contractSignedByAcc2.connect(deployer);
  // const contractNotSigned? = contract.connect(ethers.provider);

  // Check the voting power
  const votes = await contract.getVotes(acc1.address);
  console.log(
    `Account ${
      acc1.address
    } has ${votes.toString()} units of voting power before self delegating`
  );

  // Self delegate
  const delegateTx = await contract.connect(acc1).delegate(acc1.address);
  await delegateTx.wait();

  // Check the voting power after delegating
  const votesAfter = await contract.getVotes(acc1.address);
  console.log(
    `Account ${
      acc1.address
    } has ${votesAfter.toString()} units of voting power after self delegating`
  );

  // Transfer tokens from acc1 to acc2
  const transferTx = await contract
    .connect(acc1)
    .transfer(acc2.address, MINT_VALUE / 2n);
  await transferTx.wait();

  // Check the voting power after transfering
  const votes1AfterTransfer = await contract.getVotes(acc1.address);
  console.log(
    `Account ${
      acc1.address
    } has ${votes1AfterTransfer.toString()} units of voting power after transfering`
  );
  const votes2AfterTransfer = await contract.getVotes(acc2.address);
  console.log(
    `Account ${
      acc2.address
    } has ${votes2AfterTransfer.toString()} units of voting power after receiving a transfer`
  );

  // Check past voting power
  const lastBlock = await ethers.provider.getBlock("latest");
  const blockNumber = lastBlock?.number ?? 0;
  for (let i = blockNumber; i > 0; i--) {
    console.log(`Current block number is ${i}`);
    const pastVotes = await contract.getPastVotes(acc1.address, i - 1);
    console.log(
      `Account ${
        acc1.address
      } had ${pastVotes.toString()} units of voting power at previous block`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
})