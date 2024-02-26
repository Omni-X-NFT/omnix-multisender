import { EndpointId } from '@layerzerolabs/lz-definitions'

// const polygonOmniMultisender = {
//     eid: EndpointId.SEPOLIA_V2_TESTNET,
//     contractName: 'MyOApp',
// }

// const baseOmniMultisender = {
//     eid: EndpointId.AVALANCHE_V2_TESTNET,
//     contractName: 'MyOApp',
// }

// const arbitrumOmniMultisender = {
//     eid: EndpointId.POLYGON_V2_TESTNET,
//     contractName: 'MyOApp',
// }

const baseOmniMultisender = {
    eid: EndpointId.BASE_V2_MAINNET,
    contractName: 'OmniMultisender',
}

const optimismOmniMultisender = {
    eid: EndpointId.OPTIMISM_V2_MAINNET,
    contractName: 'OmniMultisender',
}

const arbitrumOmniMultisender = {
    eid: EndpointId.ARBITRUM_V2_MAINNET,
    contractName: 'OmniMultisender',
}

export default {
    contracts: [
        {
            contract: baseOmniMultisender,
        },
        {
            contract: optimismOmniMultisender,
        },
        {
            contract: arbitrumOmniMultisender,
        },
    ],
    connections: [
        {
            from: baseOmniMultisender,
            to: optimismOmniMultisender,
        },
        {
            from: baseOmniMultisender,
            to: arbitrumOmniMultisender,
        },
        {
            from: optimismOmniMultisender,
            to: baseOmniMultisender,
        },
        {
            from: optimismOmniMultisender,
            to: arbitrumOmniMultisender,
        },
        {
            from: arbitrumOmniMultisender,
            to: optimismOmniMultisender,
        },
        {
            from: arbitrumOmniMultisender,
            to: baseOmniMultisender,
        },
    ],
}
