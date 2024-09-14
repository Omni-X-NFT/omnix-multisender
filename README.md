<p align="center">
  <a href="https://send.omni-x.io/" style="color: #a77dff">Homepage</a> | <a href="https://cantina.xyz/portfolio/c44dcd35-a8c7-446d-9e99-95a57974a979" style="color: #a77dff">Cantina Audit</a>
</p>

<h1 align="center">Omni X Multisender</h1>

<p align="center">This documentation inherits from a template project for getting started with LayerZero's  <code>OApp</code> contract development.</p>

## 1) Developing Contracts

#### Installing dependencies

We recommend using `pnpm` as a package manager (but you can of course use a package manager of your choice):

```bash
pnpm install
```

#### Compiling your contracts

This project supports both `hardhat` and `forge` compilation. By default, the `compile` command will execute both:

```bash
pnpm compile
```

If you prefer one over the other, you can use the tooling-specific commands:

```bash
pnpm compile:forge
pnpm compile:hardhat
```

Or adjust the `package.json` to for example remove `forge` build:

```diff
- "compile": "$npm_execpath run compile:forge && $npm_execpath run compile:hardhat",
- "compile:forge": "forge build",
- "compile:hardhat": "hardhat compile",
+ "compile": "hardhat compile"
```

#### Running tests

Similarly to the contract compilation, we support both `hardhat` and `forge` tests. By default, the `test` command will execute both:

```bash
pnpm test
```

If you prefer one over the other, you can use the tooling-specific commands:

```bash
pnpm test:forge
pnpm test:hardhat
```

Or adjust the `package.json` to for example remove `hardhat` tests:

```diff
- "test": "$npm_execpath test:forge && $npm_execpath test:hardhat",
- "test:forge": "forge test",
- "test:hardhat": "$npm_execpath hardhat test"
+ "test": "forge test"
```

## 2) Deploying Contracts

Set up deployer wallet/account:

- Rename `.env.example` -> `.env`
- Create and fund a new wallet
- Choose your preferred means of setting up your deployer wallet/account:

```
MNEMONIC="test test test test test test test test test test test junk"
or...
PRIVATE_KEY="0xabc...def"
```

To deploy your contracts to your desired blockchains, run the following command in your project's folder:

```bash
npx hardhat lz:deploy
```

More information about available CLI arguments can be found using the `--help` flag:

```bash
npx hardhat lz:deploy --help
```

By following these steps, you can focus more on creating innovative omnichain solutions and less on the complexities of cross-chain communication.

## 3) Setting up contracts

There are 2 main set up steps for Omni X Multisender. Before executing the set up, set the deployment address and chain related constants to yours in the constants folder

First, run the following command to setPeers on every deployed chain:

```bash
npx hardhat setPeers --network ethereum  
```

This will be automated in the future however it is still beneficial to run chains one by one or in small groups as error handling in case of multiple failures in 30+ network environment could get cumbersome.

Next, run:

```bash
npx hardhat setUlnConfigs --network ethereum  
```

By default it will use a lean single DVN config with either Omni X DVN or LayerZero DVN depending on the chain availability. We reccomend using exactly the same config, but of course you are free to change number and types of DVNs that you want to use. Note that the number of confirmations, optional or required DVNs, and their types MUST MATCH EXACTLY between a source and a destination chain.

<p align="center">
  Join our community on <a href="https://discord-layerzero.netlify.app/discord" style="color: #a77dff">Discord</a> | Follow us on <a href="https://twitter.com/LayerZero_Labs" style="color: #a77dff">Twitter</a>
</p>
