import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types'

import { EndpointId } from '@layerzerolabs/lz-definitions'

// import { generateOptions } from '../options/'
import { OmniXMultisender, OmniXMultisender__factory } from '../typechain-types'

task(`multisend`, 'multisend funds with fixed native on destination chain')
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const { ethers, network } = hre
        // const { multisendAddress } = taskArguments
        const [owner] = await ethers.getSigners()
        //list of destination ids
        const deis = [EndpointId.MERITCIRCLE_V2_MAINNET, EndpointId.BASE_V2_MAINNET]

        // connect to an instance of OmniMultisender on Optimism
        const omniMultisender: OmniXMultisender = OmniXMultisender__factory.connect(
            '0x559Ac215767928ca3c8A8a67a717bcC578CBAA01',
            owner
        )

        // const input = generateOptions(owner.address, deis)
        //note that this code is meant for testing purposes only
        // in production you MUST implement a read call to estimateFees first so the users do not pass more value than needed
        const tx = await omniMultisender[`sendDeposits(uint32[],uint128[])`].send(deis,[100000000,100000000])
        console.log(`Multisend on ${network.name} complete.`)
        console.log(tx.hash)
    })
