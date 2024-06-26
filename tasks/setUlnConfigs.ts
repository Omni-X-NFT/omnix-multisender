import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types'

import { networkToEndpointId, MainnetV2EndpointId, EndpointVersion } from '@layerzerolabs/lz-definitions'

import { OmniXMultisender, OmniXMultisender__factory } from '../typechain-types'
import { OmniXDVNAddresses, LZDVNAddresses, omnixDVNeids } from '../constants/deploymentAddresses'

task(`setUlnConfigs`, 'call setUlnConfigs on a OmniXMultisender to explicitly set DVN settings')
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      const { ethers, network } = hre
      // Using ethers v5
      const [owner] = await ethers.getSigners()
      // fetch the smart contract address from the deployments, assume that it is the same across all the chains
      const omniXMultisenderAddress = (await hre.deployments.get('OmniXMultisender')).address
      console.log(`Multisender Address: ${omniXMultisenderAddress}`)
      // Find Omni X DVN address for this network in the list or assign an empty string if none
      const omniXDVNLocalAddress:string = OmniXDVNAddresses[network.name as keyof typeof OmniXDVNAddresses] || ''
      console.log(`Local Omni X DVN: ${omniXDVNLocalAddress}`)
      //check that the network that we are connected to is supported by LayerZero v2. if so assign a proper layerzero DVN address, otherwise throw
      let lzDVNLocalAddress: string
      if (networkToEndpointId(network.name, EndpointVersion.V2) in Object.values(MainnetV2EndpointId)) {
        lzDVNLocalAddress = LZDVNAddresses[network.name as keyof typeof LZDVNAddresses]
      } else return;
      console.log(`Local LayerZero DVN: ${lzDVNLocalAddress}`)

      const sendLib302 = (await hre.deployments.get('SendLib302')).address
      console.log(`SL302 ${sendLib302}`)
      const receiveLib302 = (await hre.deployments.get('ReceiveLib302')).address
      console.log(`RL302 ${receiveLib302}`)

      const omniXMultisender: OmniXMultisender = OmniXMultisender__factory.connect(
        omniXMultisenderAddress,
        owner
      )

      const confirmations = 6; // Arbitrary; Varies per remote chain

      console.log(`About to setUlnConfigs for ${await omniXMultisender.getAddress()} on ${network.name}`)
      try {
        //First lets check if Omni X DVN is supported on this network. If so we will first run set up for Omni X DVN enabled networks. If not run the whole set up for all networks on LayerZero DVN
        if (omniXDVNLocalAddress !== '') {
          const omniXDVNDestinationIds = omnixDVNeids.filter(x => x !== networkToEndpointId(hre.network.name,EndpointVersion.V2))
          const tx1 = await omniXMultisender.setUlnConfigs(sendLib302,confirmations,omniXDVNDestinationIds,omniXDVNLocalAddress)
          console.log (`Successfully setUlnConfig Omni X DVN for sendLib302 for ${ await omniXMultisender.getAddress()} on ${network.name} ${tx1.hash}`)
          const tx2 = await omniXMultisender.setUlnConfigs(receiveLib302,confirmations,omniXDVNDestinationIds,omniXDVNLocalAddress)
          console.log (`Successfully setUlnConfig Omni X DVN for receiveLib302 for ${ await omniXMultisender.getAddress()} on ${network.name} ${tx2.hash}`)
          //Now we are done setting the config from source chain to other networks that support Omni X DVN. lets set up the rest of the pathways through layerzero DVN
          const remainingDestinationIds = Object.values(MainnetV2EndpointId).filter(x => x !in omniXDVNDestinationIds)
          const tx3 = await omniXMultisender.setUlnConfigs(sendLib302,confirmations,remainingDestinationIds,lzDVNLocalAddress)
          console.log (`Successfully setUlnConfig LayerZero DVN for sendLib302 for ${ await omniXMultisender.getAddress()} on ${network.name} ${tx3.hash}`)
          const tx4 = await omniXMultisender.setUlnConfigs(receiveLib302,confirmations,remainingDestinationIds,lzDVNLocalAddress)
          console.log (`Successfully setUlnConfig LayerZero DVN for receiveLib302 for ${ await omniXMultisender.getAddress()} on ${network.name} ${tx4.hash}`)
        } else {
          // If a chain does not support Omni X DVN, we will only need 2 transactions to set the DVN for all chains
          const destinationIds = Object.values(MainnetV2EndpointId).filter(x => x !== networkToEndpointId(hre.network.name,EndpointVersion.V2))
          const tx1 = await omniXMultisender.setUlnConfigs(sendLib302,confirmations,destinationIds,lzDVNLocalAddress)
          console.log (`Successfully setUlnConfig for sendLib302 for ${ await omniXMultisender.getAddress()} on ${network.name} ${tx1.hash}`)
          const tx2 = await omniXMultisender.setUlnConfigs(receiveLib302,confirmations,destinationIds,lzDVNLocalAddress)
          console.log (`Successfully setUlnConfig for receiveLib302 for ${await omniXMultisender.getAddress()} on ${network.name} ${tx2.hash}`)
        }
      } catch (error) {
        console.error(error)
      }
    })