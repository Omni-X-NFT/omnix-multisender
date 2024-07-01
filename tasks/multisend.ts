import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import { OmniXMultisender, OmniXMultisender__factory } from '../typechain-types'

task(`multisend`, 'multisend funds with fixed native on destination chains')
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const { ethers, network } = hre
        const [owner] = await ethers.getSigners()
        //list of destination ids, edit according to your needs
        const deis = [EndpointId.MERITCIRCLE_V2_MAINNET, EndpointId.BASE_V2_MAINNET]
        const omniXMultisenderAddress = (await hre.deployments.get('OmniXMultisender')).address
        console.log(`Multisender Address: ${omniXMultisenderAddress}`)
        
        // connect to an instance of OmniXMultisender
        const omniXMultisender: OmniXMultisender = OmniXMultisender__factory.connect(
            omniXMultisenderAddress,
            owner
        )

        // const input = generateOptions(owner.address, deis)
        // note that this code is meant for testing purposes only
        // in production you MUST implement a read call to estimateFees first so the users know exactly how much they should pass
        const tx = await omniXMultisender.sendDeposits_3FF34E(deis,[100000000,100000000],0)
        console.log(`Multisend on ${network.name} complete.`)
        console.log(tx.hash)
    })
