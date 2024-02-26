import { NativeDrop, Options } from '@layerzerolabs/lz-v2-utilities'

type OptionsReturnType = {
    dstEids: number[]
    options: string[]
}

type EidGasAmount = {
    dstEid: number
    gasAmount: NativeDrop
}

const airdropValueMapping: EidGasAmount[] = [
    //BNB Chain
    {
        dstEid: 30102,
        gasAmount: '10000000000000000',
    },
    //Avalanche
    {
        dstEid: 30106,
        gasAmount: '10000000000000000',
    },
    //Polygon
    {
        dstEid: 30109,
        gasAmount: '10000000000000000',
    },
    //Arbitrum
    {
        dstEid: 30110,
        gasAmount: '15000000000000000',
    },
    //Optimism
    {
        dstEid: 30111,
        gasAmount: '15000000000000000',
    },
    //Fantom
    {
        dstEid: 30112,
        gasAmount: '10000000000000000',
    },
    //DFK
    {
        dstEid: 30115,
        gasAmount: '10000000000000000',
    },
    //Harmony
    {
        dstEid: 30116,
        gasAmount: '10000000000000000',
    },
    //Dexalot
    {
        dstEid: 30118,
        gasAmount: '10000000000000000',
    },
    //Celo
    {
        dstEid: 30125,
        gasAmount: '10000000000000000',
    },
    //Moonbeam
    {
        dstEid: 30126,
        gasAmount: '10000000000000000',
    },
    //Fuse
    {
        dstEid: 30138,
        gasAmount: '10000000000000000',
    },
    //Gnosis
    {
        dstEid: 30145,
        gasAmount: '10000000000000000',
    },
    //DOS
    {
        dstEid: 30149,
        gasAmount: '10000000000000000',
    },
    //Klaytn
    {
        dstEid: 30150,
        gasAmount: '10000000000000000',
    },
    //Metis
    {
        dstEid: 30151,
        gasAmount: '10000000000000000',
    },
    //CoreDAO
    {
        dstEid: 30153,
        gasAmount: '10000000000000000',
    },
    //OKX
    {
        dstEid: 30155,
        gasAmount: '10000000000000000',
    },
    //Polygon zkEVM
    {
        dstEid: 30158,
        gasAmount: '10000000000000000',
    },
    //Canto
    {
        dstEid: 30159,
        gasAmount: '10000000000000000',
    },
    //zkSync Era
    {
        dstEid: 30165,
        gasAmount: '10000000000000000',
    },
    //Moonriver
    {
        dstEid: 30167,
        gasAmount: '10000000000000000',
    },
    //Tenet
    {
        dstEid: 30173,
        gasAmount: '10000000000000000',
    },
    //Arbitrum Nova
    {
        dstEid: 30175,
        gasAmount: '15000000000000000',
    },
    //Meter.io
    {
        dstEid: 30176,
        gasAmount: '10000000000000000',
    },
    //Kava
    {
        dstEid: 30177,
        gasAmount: '10000000000000000',
    },
    //Mantle
    {
        dstEid: 30181,
        gasAmount: '10000000000000000',
    },
    //Hubble
    {
        dstEid: 30182,
        gasAmount: '10000000000000000',
    },

    //Linea
    {
        dstEid: 30183,
        gasAmount: '10000000000000000',
    },
    //Base
    {
        dstEid: 30184,
        gasAmount: '15000000000000000',
    },
    //Zora
    {
        dstEid: 30195,
        gasAmount: '10000000000000000',
    },
    //Viction
    {
        dstEid: 30196,
        gasAmount: '10000000000000000',
    },
    //Loot
    {
        dstEid: 30197,
        gasAmount: '10000000000000000',
    },
    //Merit Circle
    {
        dstEid: 30198,
        gasAmount: '10000000000000000',
    },
    //Telos
    {
        dstEid: 30199,
        gasAmount: '10000000000000000',
    },
    //opBNB
    {
        dstEid: 30202,
        gasAmount: '10000000000000000',
    },
    //Astar
    {
        dstEid: 30210,
        gasAmount: '10000000000000000',
    },
    //Aurora
    {
        dstEid: 30211,
        gasAmount: '10000000000000000',
    },
    //Conflux
    {
        dstEid: 30212,
        gasAmount: '10000000000000000',
    },
    //Orderly
    {
        dstEid: 30213,
        gasAmount: '10000000000000000',
    },
    //Scroll
    {
        dstEid: 30214,
        gasAmount: '10000000000000000',
    },
    //Horizen EON
    {
        dstEid: 30215,
        gasAmount: '10000000000000000',
    },
    //XPLA
    {
        dstEid: 30216,
        gasAmount: '10000000000000000',
    },
    //Manta
    {
        dstEid: 30217,
        gasAmount: '10000000000000000',
    },
    //ShimmerEVM
    {
        dstEid: 30230,
        gasAmount: '10000000000000000',
    },
    //Rarible
    {
        dstEid: 30235,
        gasAmount: '10000000000000000',
    },
    //Xai
    {
        dstEid: 30236,
        gasAmount: '10000000000000000',
    },
    //Injective
    {
        dstEid: 30234,
        gasAmount: '10000000000000000',
    },
    //Fraxtal
    {
        dstEid: 30255,
        gasAmount: '10000000000000000',
    },
]

export const generateOptions = (_receiverAddressInBytes32: string, chainlist: number[]): OptionsReturnType => {
    if (chainlist.length <= 0) throw 'Chainlist length must be positive'
    const returnObject: OptionsReturnType = { dstEids: [], options: [] }

    chainlist.forEach((x) => {
        console.log('generating options for chain with id ' + chainlist[x])
        returnObject.dstEids.push(chainlist[x])
        const hexedOptions = Options.newOptions()
            .addExecutorNativeDropOption(
                //@ts-ignore
                airdropValueMapping.find((ega) => ega.dstEid === chainlist[x]).gasAmount as NativeDrop,
                _receiverAddressInBytes32
            )
            .toHex()
        returnObject.options.push(hexedOptions)
    })

    return returnObject
}
