
import { mainnet } from "@pooltogether/v4-pool-data";
import ethers from "ethers";

import DrawAutoClaim from "./DrawAutoClaim.mjs";

const DEFAULT_MAX_PICKS_PER_USER = Number(process.env.DEFAULT_MAX_PICKS_PER_USER || 1); // 1 win per wallet default
const DEFAULT_CLAIM_EXPIRY_DURATION = Number(process.env.DEFAULT_CLAIM_EXPIRY_DURATION || 60*60*24*60); //60 days default

const providers = {
    1: new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL, { name: 'ethereum', chainId: 1 }),
    10: new ethers.providers.JsonRpcProvider(process.env.OPTIMISIM_RPC_URL, { name: 'optimism', chainId: 10 }),
    137: new ethers.providers.JsonRpcProvider(process.env.POLYGON_RPC_URL, { name: 'polygon', chainId: 137 }),
    43114: new ethers.providers.JsonRpcProvider(process.env.AVALANCHE_RPC_URL, { name: 'avalanche', chainId: 43114 })
}

const autoClaimer = new DrawAutoClaim({
    providers: providers,
    poolDataNetwork: mainnet,
    defaultMaxPicksPerUser: DEFAULT_MAX_PICKS_PER_USER,
    defaultClaimExpiryDuration: DEFAULT_CLAIM_EXPIRY_DURATION
});

const txs = await autoClaimer.getAllTransactions([400]);

/* 
    TODO:
    * Check profitablity via oracle prices in USD
    * Sign and send profitable txs
*/
const prices =[];
for(let chainId in providers) {
    prices.push(await autoClaimer.getUSDValueForNativeToken(chainId, providers[chainId]));
}

console.log("prices", prices);
console.log(txs);