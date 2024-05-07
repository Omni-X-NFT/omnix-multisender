import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import { OmniXMultisenderFactory, OmniXMultisenderFactory__factory } from '../typechain-types'

task(`setUlnConfigs`, 'call setUlnConfigs on a OmniXMultisenderFactory to set DVN to Omni X')
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      const { ethers, network } = hre
      // Using ethers v5
      const [owner] = await ethers.getSigners()
      // Omni X DVN address on fantom
      const dvnAddress = "0xE0F0FbBDBF9d398eCA0dd8c86d1F308D895b9Eb7"

      const sendLib302 = "0xC17BaBeF02a937093363220b0FB57De04A535D5E"
      
      const receiveLib302 = "0xe1Dd69A2D08dF4eA6a30a91cC061ac70F98aAbe3"
      
      const omniXMultisenderFactory: OmniXMultisenderFactory = OmniXMultisenderFactory__factory.connect(
        '0xd480364206b187c2a2b00b13bf3fd2bea6d52f65',
        owner
      )

      const confirmations = 6; // Arbitrary; Varies per remote chain
      //exclude the id of the source chain
      const destinationIds = [30101,30106,30109,30110,30111,30184]

      console.log(`About to setUlnConfigs for ${await omniXMultisenderFactory.getAddress()} on ${network.name}`)
      // console.log(remoteDeploymentAddresses)
      try {
        // const tx1 = await omniXMultisenderFactory.setUlnConfigs('0x559Ac215767928ca3c8A8a67a717bcC578CBAA01',sendLib302,confirmations,destinationIds,dvnAddress)
        // console.log (`Successfully setUlnConfig for sendLib302 for ${ await omniXMultisenderFactory.getAddress()} on ${network.name} ${tx1.hash}`)
        const tx2 = await omniXMultisenderFactory.setUlnConfigs('0x559Ac215767928ca3c8A8a67a717bcC578CBAA01',receiveLib302,confirmations,destinationIds,dvnAddress)
        console.log (`Successfully setUlnConfig for receiveLib302 for ${await omniXMultisenderFactory.getAddress()} on ${network.name} ${tx2.hash}`)
      } catch (error) {
        console.error(error)
      }
    })