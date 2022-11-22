import { PrizePoolNetwork, PrizeDistributor, PrizeApi } from "@pooltogether/v4-client-js";
import { encodeWinningPicks } from '@pooltogether/v4-utils-js';
import { mainnet } from "@pooltogether/v4-pool-data";
import Chainlink from "./Chainlink.mjs";
import ethers from "ethers";

export default class DrawAutoClaim {

    providers;
    prizePoolNetwork; 

    constructor({
        providers,
        signer,
        poolDataNetwork = mainnet,
        defaultMaxPicksPerUser = 1, 
        defaultClaimExpiryDuration = 60 * 60 * 24 * 60
    }) {
        this.signer = signer;
        this.providers = providers;
        this.defaultMaxPicksPerUser = defaultMaxPicksPerUser;
        this.poolDataNetwork = poolDataNetwork;
        
        for (let key in this.providers) {
            this.providers[key].getChainId = function () {
                return this.network.chainId;
            }
        }   
        
        this.prizePoolNetwork = new PrizePoolNetwork(providers, poolDataNetwork);
    }

    //TODO: Move to utils
    static getContractByChainId(name, chainId, networkContracts = this.poolDataNetwork) {
        return networkContracts.contracts.find(c => c.type == name && c.chainId == chainId)
    }

    async getDrawResults(prizeDistributor, usersAddress, drawIds, maxPicksPerUserPerDraw, defaultMaxPicksPerUser = this.defaultMaxPicksPerUser) {

        if (!maxPicksPerUserPerDraw) {
            maxPicksPerUserPerDraw = [];
            drawIds.forEach(id => maxPicksPerUserPerDraw.push(defaultMaxPicksPerUser));
        }

        return await PrizeApi.getUsersDrawResultsByDraws(
            prizeDistributor.chainId,
            usersAddress,
            prizeDistributor.address,
            drawIds,
            maxPicksPerUserPerDraw
        )
    }

    async claimPrizesAcrossMultipleDrawsByDrawResultsForAddress(prizeDistributor, usersAddress, drawResults) {
        const prizeDistributorContract = prizeDistributor.prizeDistributorContract;
        const errorPrefix = 'PrizeDistributors [claimPrizes] | ';
        await prizeDistributor.validateSignerNetwork(errorPrefix);
        const drawResultsList = Object.values(drawResults);
        const totalValueToClaim = drawResultsList.reduce((total, drawResult) => {
            return total.add(drawResult.totalValue)
        }, ethers.BigNumber.from(0))

        if (totalValueToClaim.isZero()) {
            throw new Error(errorPrefix + 'No prizes to claim.')
        }

        const claim = encodeWinningPicks(usersAddress, drawResultsList);
        return {
            tx: prizeDistributorContract.populateTransaction.claim(
                claim.userAddress,
                claim.drawIds,
                claim.encodedWinningPickIndices
            ), 
            claim: claim
        }
    };

    async getAutoClaimUsers(){
        //TODO: Read OptIn/Out Events and store in db.
        return [process.env.TEST_USER_ADDRESS];
    }

    async getAllTransactions(additionalDrawIds = []) {
        let provider, transactions = [];

        for (let chainId in this.providers) {
            transactions = transactions.concat(await this.getTransactionsByChain(chainId, additionalDrawIds));
        }

        return transactions;
    }

    async getTransactionsByChain(chainId, additionalDrawIds = []) {
        const provider = this.providers[chainId], transactions = [];
        if(!provider) throw new Error(`No provider found for chainId: ${chainId}`);

        const lastestGasTokenPriceInUSD = await this.getUSDValueForNativeToken(chainId, provider);
        // console.log("lastestGasTokenPriceInUSD", lastestGasTokenPriceInUSD.price, lastestGasTokenPriceInUSD.pair)

        const prizeDistributorContractInfo = DrawAutoClaim.getContractByChainId("PrizeDistributor", provider.network.chainId, this.poolDataNetwork);
        const prizeDistributor = this.prizePoolNetwork.getPrizeDistributor(provider.network.chainId, prizeDistributorContractInfo.address);

        const users = await this.getAutoClaimUsers();
        const newestDraw = await prizeDistributor.getNewestDraw();

        let drawResults, claimTx;
        for(const usersAddress of users) {
            
            drawResults = await this.getDrawResults(prizeDistributor, usersAddress, [newestDraw.drawId].concat(additionalDrawIds));
            claimTx = await this.claimPrizesAcrossMultipleDrawsByDrawResultsForAddress(prizeDistributor, usersAddress, drawResults);

            transactions.push(claimTx);
        }

        return transactions;
    }

    static getNativeGasTokenForChainId(chainId) {
        return Chainlink.nativeGasTokenMap[chainId];
    }

    async getUSDValueForNativeToken(chainId, provider) {
        const 
            gasToken = Chainlink.nativeGasTokenMap[chainId],
            priceFeed = new ethers.Contract(gasToken.oracle, Chainlink.aggregatorV3InterfaceABI, provider), 
            decimals = await priceFeed.decimals(),
            feedResult = await priceFeed.latestRoundData()
        ;

        const price = ethers.utils.formatUnits(feedResult.answer, decimals);

        return {
            price: price,
            pair: gasToken.pair,
            answer: feedResult.answer,
            decimals: decimals
        };
    }
}