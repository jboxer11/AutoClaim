// const HardhatUserConfig = require("./hardhat.config.js");
const alchemyUrl = process.env.ALCHEMY_URL;
const infuraApiKey = process.env.INFURA_API_KEY;
const privateKey = process.env.BOT_PRIVATE_KEY;

const networks = {
    coverage: {
        url: 'http://127.0.0.1:8555',
        blockGasLimit: 200000000,
        allowUnlimitedContractSize: true,
    },
    localhost: {
        chainId: 1,
        url: 'http://127.0.0.1:8545',
        allowUnlimitedContractSize: true,
    }
}

if (alchemyUrl && process.env.FORK_ENABLED) {
    networks.hardhat = {
        chainId: Number(process.env.TEST_CHAIN_ID || 1),
        allowUnlimitedContractSize: true,
        gas: 12000000,
        blockGasLimit: 0x1fffffffffffff,
        forking: {
            url: alchemyUrl,
            blockNumber: Number(process.env.FORK_PINNED_BLOCK)
        }
    };

    if(privateKey) {
        networks.hardhat.accounts = [privateKey];
    }
} else {
    networks.hardhat = {
        allowUnlimitedContractSize: true,
        gas: 12000000,
        initialBaseFeePerGas: 0, // temporary fix, remove once we bump version: https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136
        blockGasLimit: 0x1fffffffffffff,
    };
}

if(privateKey) {
    networks.mainnet = {
        url: alchemyUrl,
        accounts: {
            mnemonic,
        },
    };
}

module.exports = networks;