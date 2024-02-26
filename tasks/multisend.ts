import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import { generateOptions } from '../options/'
import { OmniMultisender, OmniMultisender__factory } from '../typechain-types'

task(`multisend`, 'multisend funds with fixed native on destination chain')
    // .addParam(`multisendAddress`, `The address of the OmniMultisend contract `)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const { ethers } = hre
        // const { multisendAddress } = taskArguments
        const [owner] = await ethers.getSigners()
        //list of destination ids
        const deis = [EndpointId.ARBITRUM_V2_MAINNET, EndpointId.BASE_V2_MAINNET]

        // connect to an instance of OmniMultisender on Optimism
        const omniMultisender: OmniMultisender = OmniMultisender__factory.connect(
            '0x6071064D100fF1540Ea4D8FA665510ee982238F9',
            owner
        )

        const input = generateOptions(owner.address, deis)
        const tx = await omniMultisender.multiSend(input.dstEids, input.options)
        console.log(`Multisend complete.`)
        console.log(tx)
    })
