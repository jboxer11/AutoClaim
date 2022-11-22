const Chainlink = {
    aggregatorV3InterfaceABI: [
        {
            inputs: [],
            name: "decimals",
            outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
            stateMutability: "view",
            type: "function",
        },
        {
            inputs: [],
            name: "description",
            outputs: [{ internalType: "string", name: "", type: "string" }],
            stateMutability: "view",
            type: "function",
        },
        {
            inputs: [{ internalType: "uint80", name: "_roundId", type: "uint80" }],
            name: "getRoundData",
            outputs: [
                { internalType: "uint80", name: "roundId", type: "uint80" },
                { internalType: "int256", name: "answer", type: "int256" },
                { internalType: "uint256", name: "startedAt", type: "uint256" },
                { internalType: "uint256", name: "updatedAt", type: "uint256" },
                { internalType: "uint80", name: "answeredInRound", type: "uint80" },
            ],
            stateMutability: "view",
            type: "function",
        },
        {
            inputs: [],
            name: "latestRoundData",
            outputs: [
                { internalType: "uint80", name: "roundId", type: "uint80" },
                { internalType: "int256", name: "answer", type: "int256" },
                { internalType: "uint256", name: "startedAt", type: "uint256" },
                { internalType: "uint256", name: "updatedAt", type: "uint256" },
                { internalType: "uint80", name: "answeredInRound", type: "uint80" },
            ],
            stateMutability: "view",
            type: "function",
        },
        {
            inputs: [],
            name: "version",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
        }
    ],
    nativeGasTokenMap: {
        1: {
            pair: "ETH/USD",
            oracle: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
        },
        10: {
            pair: "OP/USD",
            oracle: "0x0D276FC14719f9292D5C1eA2198673d1f4269246"
        },
        137: { // Polygon
            pair: "MATIC/USD",
            oracle: "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0"
        },
        43114: { // Avalanche
            pair: "AVAX/USD",
            oracle: "0x0A77230d17318075983913bC2145DB16C7366156"
        }
    }
};

export default Chainlink;