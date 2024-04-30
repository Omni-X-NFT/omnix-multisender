// Get the environment configuration from .env file
//
// To make use of automatic environment setup:
// - Duplicate .env.example file and name it .env
// - Fill in the environment variables
import 'dotenv/config'

import 'hardhat-deploy'
import 'hardhat-contract-sizer'
import '@nomiclabs/hardhat-ethers'
import "@nomicfoundation/hardhat-verify";
import '@layerzerolabs/toolbox-hardhat'
import '@typechain/hardhat'
import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-chai-matchers'
import './tasks'
import { HardhatUserConfig, HttpNetworkAccountsUserConfig } from 'hardhat/types'

import { EndpointId } from '@layerzerolabs/lz-definitions'

// Set your preferred authentication method
//
// If you prefer using a mnemonic, set a MNEMONIC environment variable
// to a valid mnemonic
const MNEMONIC = process.env.MNEMONIC

// If you prefer to be authenticated using a private key, set a PRIVATE_KEY environment variable
const PRIVATE_KEY = process.env.PRIVATE_KEY

const accounts: HttpNetworkAccountsUserConfig | undefined = MNEMONIC
    ? { mnemonic: MNEMONIC }
    : PRIVATE_KEY
      ? [PRIVATE_KEY]
      : undefined

if (accounts == null) {
    console.warn(
        'Could not find MNEMONIC or PRIVATE_KEY environment variables. It will not be possible to execute transactions in your example.'
    )
}

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: '0.8.22',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    etherscan: {
        apiKey: {
            mainnet: process.env.ETHERSCAN_API_KEY || '',
            bnb: process.env.BSCSCAN_API_KEY || '',
            polygon: process.env.POLYGON_API_KEY || '',
            avalanche: process.env.AVALANCHE_API_KEY || '',
            optimisticEthereum: process.env.OPTIMISTIC_API_KEY || '',
            arbitrumOne: process.env.ARBITRUM_API_KEY || '',
            arbitrumNova: process.env.ARBITRUM_NOVA_API_KEY || '',
            metis: process.env.METIS_API_KEY || '',
            gnosis: process.env.GNOSIS_API_KEY || '',
            base: process.env.BASE_API_KEY || '',
            opera: process.env.FANTOM_API_KEY || '',
            moonbeam: process.env.MOONBEAM_API_KEY || '',
        } 
    },
    networks: {
        ethereum: {
            eid: EndpointId.ETHEREUM_V2_MAINNET,
            url: 'https://eth.llamarpc.com',
            accounts, 
        },
        base: {
            eid: EndpointId.BASE_V2_MAINNET,
            url: 'https://developer-access-mainnet.base.org',
            accounts,
        },
        optimism: {
            eid: EndpointId.OPTIMISM_V2_MAINNET,
            url: 'https://optimism.llamarpc.com',
            accounts,
        },
        arbitrum: {
            eid: EndpointId.ARBITRUM_V2_MAINNET,
            url: 'https://rpc.ankr.com/arbitrum',
            accounts,
        },
        bnb: {
            eid: EndpointId.BSC_V2_MAINNET,
            url: 'https://binance.llamarpc.com',
            accounts,
        },
        avalanche: {
            eid: EndpointId.AVALANCHE_V2_MAINNET,
            url: 'https://avalanche.public-rpc.com',
            accounts,
        },
        polygon: {
            eid: EndpointId.POLYGON_V2_MAINNET,
            url: 'https://polygon-pokt.nodies.app',
            accounts,
        },
        fantom: {
            eid: EndpointId.FANTOM_V2_MAINNET,
            url: 'https://rpc.ankr.com/fantom',
            accounts,
        },
        dfk: {
            eid: EndpointId.DFK_V2_MAINNET,
            url: 'https://subnets.avax.network/defi-kingdoms/dfk-chain/rpc',
            accounts,
        },
        harmony: {
            eid: EndpointId.HARMONY_V2_MAINNET,
            url: 'https://api.harmony.one',
            accounts,
        },
        dexalot: {
            eid: EndpointId.DEXALOT_V2_MAINNET,
            url: 'https://subnets.avax.network/dexalot/mainnet/rpc',
            accounts,
        },
        celo: {
            eid: EndpointId.CELO_V2_MAINNET,
            url: 'https://rpc.ankr.com/celo',
            accounts,
        },
        moonbeam: {
            eid: EndpointId.MOONBEAM_V2_MAINNET,
            url: 'https://rpc.ankr.com/moonbeam',
            accounts,
        },
        fuse: {
            eid: EndpointId.FUSE_V2_MAINNET,
            url: 'https://rpc.fuse.io',
            accounts,
        },
        gnosis: {
            eid: EndpointId.GNOSIS_V2_MAINNET,
            url: 'https://gnosis-pokt.nodies.app',
            accounts,
        },
        dos: {
            eid: EndpointId.DOS_MAINNET,
            url: 'https://main.doschain.com',
            accounts,
        },
        klaytn: {
            eid: EndpointId.KLAYTN_V2_MAINNET,
            url: 'https://1rpc.io/klay',
            accounts,
        },
        metis: {
            eid: EndpointId.METIS_V2_MAINNET,
            url: 'https://andromeda.metis.io/?owner=1088',
            accounts,
        },
        core: {
            eid: EndpointId.COREDAO_V2_MAINNET,
            url: 'https://rpc.coredao.org',
            accounts,
        },
        okx: {
            eid: EndpointId.OKX_V2_MAINNET,
            url: 'https://1rpc.io/oktc',
            accounts,
        },
        canto: {
            eid: EndpointId.CANTO_V2_MAINNET,
            url: 'https://canto-rpc.ansybl.io',
            accounts,
        },
        zksync: {
            eid: EndpointId.ZKSYNC_V2_MAINNET,
            url: 'https://mainnet.era.zksync.io',
            accounts,
        },
        moonriver: {
            eid: EndpointId.MOONRIVER_V2_MAINNET,
            url: 'https://moonriver-rpc.publicnode.com',
            accounts,
        },
        tenet: {
            eid: EndpointId.TENET_V2_MAINNET,
            url: 'https://tenet-evm.publicnode.com',
            accounts,
        },
        nova: {
            eid: EndpointId.NOVA_V2_MAINNET,
            url: 'https://arbitrum-nova.drpc.org',
            accounts,
        },
        kava: {
            eid: EndpointId.KAVA_V2_MAINNET,
            url: 'https://evm.kava.io',
            accounts,
        },
        meter: {
            eid: EndpointId.METER_V2_MAINNET,
            url: 'https://rpc.meter.io',
            accounts,
        },
        mantle: {
            eid: EndpointId.MANTLE_V2_MAINNET,
            url: 'https://mantle.drpc.org',
            accounts,
        },
        linea: {
            eid: 30183,
            url: 'https://rpc.linea.build',
            accounts,
        },
        zora: {
            eid: EndpointId.ZORA_V2_MAINNET,
            url: 'https://rpc.zora.energy',
            accounts,
        },
        loot: {
            eid: EndpointId.LOOT_V2_MAINNET,
            url: 'https://rpc.lootchain.com/http',
            accounts,
        },
        beam: {
            eid: EndpointId.MERITCIRCLE_V2_MAINNET,
            url: 'https://build.onbeam.com/rpc',
            accounts,
        },
        telos: {
            eid: EndpointId.TELOS_V2_MAINNET,
            url: 'https://mainnet-eu.telos.net/evm',
            accounts,
        },
        opBNB: {
            eid: EndpointId.OPBNB_V2_MAINNET,
            url: 'https://opbnb-rpc.publicnode.com',
            accounts,
        },
        astar: {
            eid: EndpointId.ASTAR_V2_MAINNET,
            url: 'https://1rpc.io/astr',
            accounts,
        },
        aurora: {
            eid: EndpointId.AURORA_MAINNET,
            url: 'https://arbitrum-nova.drpc.org',
            accounts,
        },
        conflux: {
            eid: EndpointId.CONFLUX_V2_MAINNET,
            url: 'https://evm.confluxrpc.com',
            accounts,
        },
        orderly: {
            eid: EndpointId.ORDERLY_V2_MAINNET,
            url: 'https://rpc.orderly.network',
            accounts,
        },
        scroll: {
            eid: EndpointId.SCROLL_V2_MAINNET,
            url: 'https://scroll-mainnet.chainstacklabs.com',
            accounts,
        },
        eon: {
            eid: EndpointId.EON_V2_MAINNET,
            url: 'https://rpc.ankr.com/horizen_eon',
            accounts,
        },
        xpla: {
            eid: EndpointId.XPLA_V2_MAINNET,
            url: 'https://dimension-evm-rpc.xpla.dev',
            accounts,
        },
        manta: {
            eid: EndpointId.MANTA_V2_MAINNET,
            url: 'https://1rpc.io/manta',
            accounts,
        },
        shimmer: {
            eid: EndpointId.SHIMMER_V2_MAINNET,
            url: 'https://json-rpc.evm.shimmer.network',
            accounts,
        },
        rarible: {
            eid: EndpointId.RARIBLE_V2_MAINNET,
            url: 'https://mainnet.rpc.rarichain.org/http',
            accounts,
        },
        xai: {
            eid: EndpointId.XAI_V2_MAINNET,
            url: 'https://xai-chain.net/rpc',
            accounts,
        },
        fraxtal: {
            eid: EndpointId.FRAXTAL_V2_MAINNET,
            url: 'https://rpc.frax.com',
            accounts,
        },
        blast: {
            eid: EndpointId.BLAST_V2_MAINNET,
            url: 'https://rpc.blast.io',
            accounts,
        },
        tiltyard: {
            eid: EndpointId.TILTYARD_V2_MAINNET,
            url: 'https://subnets.avax.network/tiltyard/mainnet/rpc',
            accounts,
        },
        mode: {
            eid: EndpointId.MODE_V2_MAINNET,
            url: 'https://mainnet.mode.network',
            accounts,
        },
        masa: {
            eid: EndpointId.MASA_V2_MAINNET,
            url: 'https://subnets.avax.network/masanetwork/mainnet/rpc',
            accounts,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0, // wallet address of index[0], of the mnemonic in .env
        },
    },
}

export default config
