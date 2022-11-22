const {expect} = require("chai");
const { ethers, artifacts, network } = require('hardhat');
const { utils, constants, Contract, ContractFactory, BigNumber } = ethers;
const { getSigners } = ethers;

const {
    time, loadFixture, impersonateAccount, setBalance, mine, mineUpTo
} = require("@nomicfoundation/hardhat-network-helpers");

const { mainnet, testnet } = require("@pooltogether/v4-pool-data")
const TEST_CHAIN_ID = Number(process.env.TEST_CHAIN_ID || 1);

let DrawAutoClaim;


describe("AutoClaim.sol", function() {

    this.beforeAll(async () => {
        DrawAutoClaim = (await import("../src/DrawAutoClaim.mjs")).default;
    })
    
    async function deployAutoClaimFixture() {

        await network.provider.request({
            method: "hardhat_reset",
            params: [{

                forking: {
                    jsonRpcUrl: process.env.ALCHEMY_URL,
                    blockNumber: Number(process.env.FORK_PINNED_BLOCK)
                }

            }]
        });

        const poolData = mainnet;

        const [wallet] = await getSigners();
        const testUserAddress = process.env.TEST_USER_ADDRESS;

        const autoClaimFactory = await ethers.getContractFactory('AutoClaim');
        const chainId = await wallet.getChainId();

        const networkPoolData = structuredClone(poolData);
        networkPoolData.contracts = networkPoolData.contracts.filter(c => c.chainId == chainId);

        const ticketInfo = networkPoolData.contracts.find(x => x.type == "Ticket");
        const prizeDistributorInfo = networkPoolData.contracts.find(x => x.type == "PrizeDistributor");
        const minPercentage = 500; //x/10000 = 0.05

        const ticket = new ethers.Contract(ticketInfo.address, new ethers.utils.Interface(ticketInfo.abi), wallet.provider);
        const prizeDistributor = new ethers.Contract(prizeDistributorInfo.address, new ethers.utils.Interface(prizeDistributorInfo.abi), wallet.provider);

        autoClaim = await autoClaimFactory.deploy(
            wallet.address,  // address _owner,
            ticketInfo.address, // IERC20 _token,
            prizeDistributorInfo.address, // IPrizeDistributor _prizeDistributor,
            minPercentage // uint16 _minimumPercentage

        );

        return {
            wallet,
            autoClaim,
            chainId,
            networkPoolData,
            ticket,
            ticketInfo,
            prizeDistributor,
            minPercentage,
            testUserAddress
        }
    }

    /* ====================================== */
    /* ======== Core External Tests ========= */
    /* ====================================== */
    describe('claimFor()', () => {
        it('should claim for another user', async () => {
            const {
                wallet, autoClaim, chainId,
                networkPoolData, ticket, ticketInfo, prizeDistributor,
                minPercentage, testUserAddress
            } = await loadFixture(deployAutoClaimFixture);

            await setBalance(wallet.address, ethers.utils.parseEther("10000000000000000000000"));
            await setBalance(testUserAddress, ethers.utils.parseEther("10000000000000000000000"));

            const testUser = await ethers.getImpersonatedSigner(testUserAddress);
            await autoClaim.connect(testUser).optIn(500); // User opts-in via UI (500 = 5%)
            
            /* 
                This is what I wanted to avoid, of course the number approved could be set much lower by default. 
                It does give the contract control to move tickets, but it will never take custody. Just passes % to the claimer. 
            */
            // User approves AutoClaim contract to move tickets on their behalf (via UI again)
            await ticket.connect(testUser).approve(autoClaim.address, "115792089237316195423570985008687907853269984665640564039457584007913129639935");

            const 
                pre = await ticket.balanceOf(wallet.address),
                preUser = await ticket.balanceOf(testUserAddress);

            let providers = {};

            providers[chainId] = wallet.provider;

            const autoClaimer = new DrawAutoClaim({
                providers: providers,
                poolDataNetwork: mainnet,
                defaultMaxPicksPerUser: 1,
                defaultClaimExpiryDuration: 60*60*24*60
            });

            const 
                results = await autoClaimer.getAllTransactions([400] /* additionalDrawIds */),
                result = results[0]
            ;

            // Claimer wallet claims for testUserAddress with valid params
            await autoClaim.connect(wallet).claimFor(
                        testUserAddress, 
                        result.claim.drawIds, 
                        result.claim.encodedWinningPickIndices, 
                        500, //5%
                        0
                    );

            const 
                post = await ticket.balanceOf(wallet.address),
                postUser = await ticket.balanceOf(testUserAddress);

            const 
                profit = post.sub(pre),
                userProfit = postUser.sub(preUser);

            expect(profit).to.equal(ethers.BigNumber.from("249999")); //Claimer earns 5%
            expect(userProfit).to.equal(ethers.BigNumber.from("4750000")); //User gets 95%
        });
    });

    describe('optIn()', () => {
        it("should allow a user to optin", async () => {
            const {
                wallet, autoClaim,
                networkPoolData, ticket, prizeDistributor,
                minPercentage, testUserAddress
            } = await loadFixture(deployAutoClaimFixture);

            const testUserBalance = await ticket.balanceOf(testUserAddress);
            const testUser = await ethers.getImpersonatedSigner(testUserAddress);

            await setBalance(testUserAddress, ethers.utils.parseEther("100"))

            const optInResult = await autoClaim.connect(testUser).optIn(500);
            await ticket.connect(testUser).approve(autoClaim.address, "115792089237316195423570985008687907853269984665640564039457584007913129639935");

            expect(await ticket.allowance(testUserAddress, autoClaim.address)).to.equal("115792089237316195423570985008687907853269984665640564039457584007913129639935");

        });
    });

    describe('optOut()', () => {
        it("should allow a user to optout");
    });

    
    /* =============================== */
    /* ======== Setter Tests ========= */
    /* =============================== */
    describe('Setter Functions', () => {
        describe('setMinimumPercentage()', () => {
            xit('should set the min percentage', async () => {
               
            });

            it("should only allow the owner to set minPercentage");

            it("should handle owner transfers");
        });
    });

    /* =============================== */
    /* ======== Getter Tests ========= */
    /* =============================== */

    
})