import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import { OmniXMultisenderFactory, OmniXMultisenderFactory__factory } from '../typechain-types'

task(`setUlnConfigs`, 'call setUlnConfigs on a OmniXMultisenderFactory to set DVN to Omni X')
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      const { ethers, network } = hre
      // Using ethers v5
      const [owner] = await ethers.getSigners()
      // LayerZero DVN address on ethereum
      const dvnAddress = "0x589dEDbD617e0CBcB916A9223F4d1300c294236b"
 
      const sendLib302 = "0xbB2Ea70C9E858123480642Cf96acbcCE1372dCe1"
      
      const receiveLib302 = "0xc02Ab410f0734EFa3F14628780e6e695156024C2"
      
      const omniXMultisenderFactory: OmniXMultisenderFactory = OmniXMultisenderFactory__factory.connect(
        '0xd480364206b187c2a2b00b13bf3fd2bea6d52f65',
        owner
      )

      const confirmations = 6; // Arbitrary; Varies per remote chain
      //exclude the id of the source chain
      const destinationIds = [30115, 30116, 30118, 30125, 30125, 30126, 30138, 30145, 30149, 30150, 30151, 30153, 30155, 30159, 30167, 30173, 30175, 30176, 30177, 30181, 30182, 30183, 30195, 30196, 30197, 30198, 30199, 30202, 30210, 30211, 30212, 30213, 30214, 30215, 30216, 30217, 30230, 30235, 30236, 30237, 30238, 30243, 30255, 30257, 30260, 30263, 30265]

      console.log(`About to setUlnConfigs for ${await omniXMultisenderFactory.getAddress()} on ${network.name}`)
      // console.log(remoteDeploymentAddresses)
      try {
        const tx1 = await omniXMultisenderFactory.setUlnConfigs('0x559Ac215767928ca3c8A8a67a717bcC578CBAA01',sendLib302,confirmations,destinationIds,dvnAddress)
        console.log (`Successfully setUlnConfig for sendLib302 for ${ await omniXMultisenderFactory.getAddress()} on ${network.name} ${tx1.hash}`)
        const tx2 = await omniXMultisenderFactory.setUlnConfigs('0x559Ac215767928ca3c8A8a67a717bcC578CBAA01',receiveLib302,confirmations,destinationIds,dvnAddress)
        console.log (`Successfully setUlnConfig for receiveLib302 for ${await omniXMultisenderFactory.getAddress()} on ${network.name} ${tx2.hash}`)
      } catch (error) {
        console.error(error)
      }
    })