import { expect } from "chai";
import { ethers } from "hardhat";
import {loadFixture} from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { MyERC20, TokenSale } from "../typechain-types";

const RATIO = 10;

describe("NFT Shop", async () => {
  let tokenSaleContract_: TokenSale;
  let paymentTokenContract_: MyERC20;
  let deployer: HardhatEthersSigner;
  let acc1: HardhatEthersSigner;
  let acc2: HardhatEthersSigner;

  async function deployContracts() {
    // Deploying Token contract
    const paymentTokenContractFactory = await ethers.getContractFactory(
      "MyERC20"
    );
    const paymentTokenContract = await paymentTokenContractFactory.deploy();
    await paymentTokenContract.waitForDeployment();
    const paymentTokenContractAddress = await paymentTokenContract.getAddress();
    
    // Deploying TokenSale contract
    const tokenSaleContractFactory = await ethers.getContractFactory(
      "TokenSale"
    );
    const tokenSaleContract = await tokenSaleContractFactory.deploy(
      RATIO,
      paymentTokenContractAddress
    );
    await tokenSaleContract.waitForDeployment();
    return {tokenSaleContract, paymentTokenContract};
  }

  beforeEach(async () => {
    [deployer, acc1, acc2] = await ethers.getSigners();
    const {tokenSaleContract, paymentTokenContract} = await loadFixture(deployContracts);
    tokenSaleContract_ = tokenSaleContract;
    paymentTokenContract_= paymentTokenContract;
  });

  describe("When the Shop contract is deployed", async () => {
    it("defines the ratio as provided in parameters", async () => {
      const ratio = await tokenSaleContract_.ratio();
      expect(ratio).to.eq(RATIO);
    });

    it("uses a valid ERC20 as payment token", async () => {
      const paymentTokenAddress = await tokenSaleContract_.paymentToken();
      const tokenContractFactory = await ethers.getContractFactory('ERC20');
      // const paymentTokenContract = tokenContractFactory.attach(paymentTokenAddress) as ERC20;
      await expect(paymentTokenContract_.balanceOf(ethers.ZeroAddress)).not.to
        .be.reverted;
      await expect(paymentTokenContract_.totalSupply()).not.to.be.reverted;
      // await expect(paymentTokenContract.name()).not.to.be.reverted;
      const tokenName = await paymentTokenContract_.name();
      expect(tokenName).to.not.be.empty;
      // await expect(paymentTokenContract.symbol()).not.to.be.reverted;
    });
  });

  describe("When a user buys an ERC20 from the Token contract", async () => {
    beforeEach(async () => {});

    it("charges the correct amount of ETH", async () => {
      throw new Error("Not implemented");
    });

    it("gives the correct amount of tokens", async () => {
      throw new Error("Not implemented");
    });
  });

  describe("When a user burns an ERC20 at the Shop contract", async () => {
    it("gives the correct amount of ETH", async () => {
      throw new Error("Not implemented");
    });

    it("burns the correct amount of tokens", async () => {
      throw new Error("Not implemented");
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
