import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { MyERC20, TokenSale } from "../typechain-types";

const RATIO = 10n;
const PRICE = 1000;

describe("NFT Shop", async () => {
  let tokenSaleContract: TokenSale;
  let paymentTokenContract: MyERC20;
  let deployer: HardhatEthersSigner;
  let acc1: HardhatEthersSigner;
  let acc2: HardhatEthersSigner;

  async function deployContracts() {
    // Deploying Token contract
    const paymentTokenContractFactory = await ethers.getContractFactory(
      "MyERC20"
    );
    const paymentTokenContract_ = await paymentTokenContractFactory.deploy();
    await paymentTokenContract_.waitForDeployment();
    const paymentTokenContractAddress =
      await paymentTokenContract_.getAddress();

    // Deploying nft contract
    const nftContractFactory = await ethers.getContractFactory("MyERC721");
    const nftContract = await nftContractFactory.deploy();
    await nftContract.waitForDeployment();
    const nftContractAddress = await nftContract.getAddress();

    // Deploying TokenSale contract
    const tokenSaleContractFactory = await ethers.getContractFactory(
      "TokenSale"
    );
    const tokenSaleContract_ = await tokenSaleContractFactory.deploy(
      RATIO,
      PRICE,
      paymentTokenContractAddress,
      nftContractAddress
    );
    await tokenSaleContract_.waitForDeployment();

    // Giving Minter Role for Token Sale Contract in Payment Token Contract
    const tokenSaleContractAddress = await tokenSaleContract_.getAddress();
    const MINTER_ROLE = await paymentTokenContract_.MINTER_ROLE();
    const giveRoleTx = await paymentTokenContract_.grantRole(
      MINTER_ROLE,
      tokenSaleContractAddress
    );
    await giveRoleTx.wait();

    return { tokenSaleContract_, paymentTokenContract_ };
  }

  beforeEach(async () => {
    [deployer, acc1, acc2] = await ethers.getSigners();
    const { tokenSaleContract_, paymentTokenContract_ } = await loadFixture(
      deployContracts
    );
    tokenSaleContract = tokenSaleContract_;
    paymentTokenContract = paymentTokenContract_;
  });

  describe("When the Shop contract is deployed", async () => {
    it("defines the ratio as provided in parameters", async () => {
      const ratio = await tokenSaleContract.ratio();
      expect(ratio).to.eq(RATIO);
    });

    it("uses a valid ERC20 as payment token", async () => {
      // const paymentTokenAddress = await tokenSaleContract.paymentToken();
      // const tokenContractFactory = await ethers.getContractFactory('ERC20');
      // const paymentTokenContract = tokenContractFactory.attach(paymentTokenAddress) as ERC20;

      await expect(paymentTokenContract.balanceOf(ethers.ZeroAddress)).not.to.be
        .reverted;
      await expect(paymentTokenContract.totalSupply()).not.to.be.reverted;

      // await expect(paymentTokenContract_.name()).not.to.be.reverted;
      const tokenName = await paymentTokenContract.name();
      expect(tokenName).to.not.be.empty;

      // await expect(paymentTokenContract_.symbol()).not.to.be.reverted;
    });
  });

  describe("When a user buys an ERC20 from the Token contract", async () => {
    // const TEST_BUY_TOKENS_ETH_VALUE = ethers.formatUnits(1);
    const TEST_BUY_TOKENS_ETH_VALUE = ethers.parseUnits("1");
    const TEST_BUY_TOKENS_WEI_VALUE = 1;
    let ethBalanceBeforeTx: bigint;
    let ethBalanceAfterTx: bigint;
    let tokenBalanceBeforeTx: bigint;
    let tokenBalanceAfterTx: bigint;
    let gasFeesPaidInTx: bigint;

    beforeEach(async () => {
      tokenBalanceBeforeTx = await paymentTokenContract.balanceOf(acc1.address);
      ethBalanceBeforeTx = await ethers.provider.getBalance(acc1.address);
      const buyTokensTx = await tokenSaleContract
        .connect(acc1)
        .buyTokens({ value: TEST_BUY_TOKENS_ETH_VALUE });
      const receiptTx = await buyTokensTx.wait();
      gasFeesPaidInTx =
        (receiptTx?.gasUsed ?? 0n) * (receiptTx?.gasPrice ?? 0n);
      tokenBalanceAfterTx = await paymentTokenContract.balanceOf(acc1.address);
      ethBalanceAfterTx = await ethers.provider.getBalance(acc1.address);
    });

    it("charges the correct amount of ETH", async () => {
      const diff = ethBalanceBeforeTx - ethBalanceAfterTx;
      const expectedDiff = TEST_BUY_TOKENS_ETH_VALUE + gasFeesPaidInTx;
      expect(diff).to.eq(expectedDiff);
    });

    it("gives the correct amount of tokens", async () => {
      const diff = tokenBalanceAfterTx - tokenBalanceBeforeTx;
      const expectedDiff = TEST_BUY_TOKENS_ETH_VALUE * RATIO;
      expect(diff).to.eq(expectedDiff);
    });
  });

  describe("When a user burns an ERC20 at the Shop contract", async () => {
    const TEST_TOKEN_VALUE = ethers.parseUnits("1");

    let ethBalanceBeforeBurnTx: bigint;
    let ethBalanceAfterBurnTx: bigint;
    let tokenBalanceBeforeBurnTx: bigint;
    let tokenBalanceAfterBurnTx: bigint;
    let gasFeesPaidInTx: bigint;
    let burnGasFeesPaidInTx: bigint;

    beforeEach(async () => {
      // Fund account

      const buyTokensTx = await tokenSaleContract
        .connect(acc1)
        .buyTokens({ value: TEST_TOKEN_VALUE });
      const receiptTx = await buyTokensTx.wait();

      gasFeesPaidInTx =
        (receiptTx?.gasUsed ?? 0n) * (receiptTx?.gasPrice ?? 0n);

      // Approve tx,
      // because burnFrom will work only if there is an allowance set up first.
      // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/8643fd45fda2741b13145e60931383dfe5794a33/contracts/token/ERC20/extensions/ERC20Burnable.sol#L35
      const tokenSaleContractAddress = await tokenSaleContract.getAddress();
      const approveTx = await paymentTokenContract
        .connect(acc1)
        .approve(tokenSaleContractAddress, TEST_TOKEN_VALUE);
      const receiptApproveTx = await approveTx.wait();

      tokenBalanceBeforeBurnTx = await paymentTokenContract.balanceOf(
        acc1.address
      );
      ethBalanceBeforeBurnTx = await ethers.provider.getBalance(acc1.address);

      // Burn
      const burnTokensTx = await tokenSaleContract
        .connect(acc1)
        .returnTokens(TEST_TOKEN_VALUE);
      const receiptburnTokensTx = await burnTokensTx.wait();
      burnGasFeesPaidInTx =
        (receiptburnTokensTx?.gasUsed ?? 0n) *
        (receiptburnTokensTx?.gasPrice ?? 0n);
      tokenBalanceAfterBurnTx = await paymentTokenContract.balanceOf(
        acc1.address
      );
      ethBalanceAfterBurnTx = await ethers.provider.getBalance(acc1.address);
    });

    it("gives the correct amount of ETH", async () => {
      const diff = ethBalanceAfterBurnTx - ethBalanceBeforeBurnTx;
      const expectedDiff = TEST_TOKEN_VALUE / RATIO - burnGasFeesPaidInTx;
      expect(diff).to.eq(expectedDiff);
    });

    it("burns the correct amount of tokens", async () => {
      const diff = tokenBalanceBeforeBurnTx - tokenBalanceAfterBurnTx;
      const expectedDiff = TEST_TOKEN_VALUE;
      expect(diff).to.eq(expectedDiff);
    });
  });

  describe("When a user buys an NFT from the Shop contract", async () => {
    it("charges the correct amount of ERC20 tokens", async () => {
      throw new Error("Not implemented");
    });

    it("gives the correct NFT", async () => {
      throw new Error("Not implemented");
    });
  });

  describe("When a user burns their NFT at the Shop contract", async () => {
    it("gives the correct amount of ERC20 tokens", async () => {
      throw new Error("Not implemented");
    });
  });

  describe("When the owner withdraws from the Shop contract", async () => {
    it("recovers the right amount of ERC20 tokens", async () => {
      throw new Error("Not implemented");
    });

    it("updates the owner pool account correctly", async () => {
      throw new Error("Not implemented");
    });
  });
});
