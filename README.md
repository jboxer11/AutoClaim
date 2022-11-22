# PoolTogether Prize Savings Protocol - AutoClaim Contract and Bot

<!-- ![Tests](https://github.com/pooltogether/pooltogether-rng-contracts/actions/workflows/main.yml/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/pooltogether/pooltogether-rng-contracts/badge.svg?branch=master)](https://coveralls.io/github/pooltogether/pooltogether-rng-contracts?branch=master)
[![built-with openzeppelin](https://img.shields.io/badge/built%20with-OpenZeppelin-3677FF)](https://docs.openzeppelin.com/)
[![GPLv3 license](https://img.shields.io/badge/License-GPLv3-blue.svg)](http://perso.crans.org/besson/LICENSE.html) -->
<!-- 
The [PoolTogether](https://www.pooltogether.com/) Prize Savings Protocol Ethereum smart contracts. -->

TODO: See the [documentation](https://v4.docs.pooltogether.com)

# Setup

Install Dependencies

```sh
$ yarn
```

Copy over .envrc.example to .envrc

```sh
$ cp .envrc.example .envrc
```

Make sure to update the enviroment variables with suitable values.

Now enable the env vars using [direnv](https://direnv.net/docs/installation.html)

```sh
$ direnv allow
```

# Interacting using Hardhat Console

You can interact with the contract using the buidler console:

```sh
$ npx hardhat console --network [network]
```


# TODO: Deploying 

You can deploy using the deploy script:

```sh
$ yarn deploy [network]
```

Where [network] can be `mainnet`, `rinkeby`, `ropsten`, or `kovan`.

Now you should verify the contracts on Etherscan:

```sh
$ yarn etherscan-verify [network]
```

The network option is the same as above.

# Development

Run Tests

```sh
$ yarn test
```

TODO: Run Coverage

```sh
$ yarn coverage
```

TODO: Run Gas Report

```sh
$ yarn gas
```

Start Local TestRPC 

```sh
$ yarn start
```