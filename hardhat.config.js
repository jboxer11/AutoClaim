require("@nomicfoundation/hardhat-toolbox");
require("hardhat-tracer");
require('hardhat-abi-exporter');
require('hardhat-dependency-compiler');


const networks = require("./hardhat.network.js");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.17",
    networks,
    external: {
        contracts: [
            {
                artifacts: 'node_modules/@pooltogether/v4-core/artifacts',
            },
        ],
    },
    tracer: {
        nameTags: {
            "0x62BB4fc73094c83B5e952C2180B23fA7054954c4": "OP:Mainnet:PoolTogether:Ticket"
        }
    },
    
};
