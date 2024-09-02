import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types'

import { networkToEndpointId, MainnetV2EndpointId, EndpointVersion } from '@layerzerolabs/lz-definitions'

import { OmniXMultisender, OmniXMultisender__factory } from '../typechain-types'
import { OmniXDVNAddresses, LZDVNAddresses, omnixDVNeids, fullLZDeployments, MainnetV2NetworkToEndpointId } from '../constants/deploymentAddresses'

task(`setUlnConfigs`, 'call setUlnConfigs on a OmniXMultisender to explicitly set DVN settings')
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      const { ethers, network } = hre
      // Using ethers v5
      const [owner] = await ethers.getSigners()
      // fetch the smart contract address from the deployments, assume that it is the same across all the chains
      const omniXMultisenderAddress = '0x43a1421B40A6FEAb59850dDE01D5662A336D9304'
      console.log(`Multisender Address: ${omniXMultisenderAddress}`)
      // Find Omni X DVN address for this network in the list or assign an empty string if none
      const omniXDVNLocalAddress:string = OmniXDVNAddresses[network.name as keyof typeof OmniXDVNAddresses] || ''
      console.log(`Local Omni X DVN: ${omniXDVNLocalAddress}`)
      //check that the network that we are connected to is supported by LayerZero v2. if so assign a proper layerzero DVN address, otherwise throw
      const lzDVNLocalAddress = LZDVNAddresses[network.name as keyof typeof LZDVNAddresses]
      console.log(`Local LayerZero DVN: ${lzDVNLocalAddress}`)

      // using a list of full layerzero deployments to determine sendlib302 and receivelib302 addresses. throw if a network is not found
      if (!fullLZDeployments[network.name as keyof typeof fullLZDeployments]) {
        console.log('Could not find the network name in the full LZ deployment list')
        return
      }

      const sendLib302 = fullLZDeployments[network.name as keyof typeof fullLZDeployments].sendUln302
      console.log(`SL302 ${sendLib302}`)
      const receiveLib302 = fullLZDeployments[network.name as keyof typeof fullLZDeployments].receiveUln302
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
          const omniXDVNDestinationIds = omnixDVNeids //.filter(x => x !== networkToEndpointId(network.name,EndpointVersion.V2))
          console.log(omniXDVNDestinationIds)
          const tx1 = await omniXMultisender.setUlnConfigs(sendLib302,confirmations,omniXDVNDestinationIds,omniXDVNLocalAddress)
          console.log (`Successfully setUlnConfig Omni X DVN for sendLib302 for ${ await omniXMultisender.getAddress()} on ${network.name} ${tx1.hash}`)
          const tx2 = await omniXMultisender.setUlnConfigs(receiveLib302,confirmations,omniXDVNDestinationIds,omniXDVNLocalAddress)
          console.log (`Successfully setUlnConfig Omni X DVN for receiveLib302 for ${ await omniXMultisender.getAddress()} on ${network.name} ${tx2.hash}`)
          //Now we are done setting the config from source chain to other networks that support Omni X DVN. lets set up the rest of the pathways through layerzero DVN and filter out Omni X DVN chains
          const remainingDestinationIds = Object.values(MainnetV2NetworkToEndpointId).filter(x => typeof x === 'number').map(x => x as number).filter(x => omniXDVNDestinationIds.indexOf(x) === -1)
          console.log(remainingDestinationIds)
          const tx3 = await omniXMultisender.setUlnConfigs(sendLib302,confirmations,remainingDestinationIds,lzDVNLocalAddress)
          console.log (`Successfully setUlnConfig LayerZero DVN for sendLib302 for ${ await omniXMultisender.getAddress()} on ${network.name} ${tx3.hash}`)
          const tx4 = await omniXMultisender.setUlnConfigs(receiveLib302,confirmations,remainingDestinationIds,lzDVNLocalAddress)
          console.log (`Successfully setUlnConfig LayerZero DVN for receiveLib302 for ${ await omniXMultisender.getAddress()} on ${network.name} ${tx4.hash}`)
        } else {
          // If a chain does not support Omni X DVN, we will only need 2 transactions to set the DVN for all chains at once with LayerZero DVN!
          const destinationIds = Object.values(MainnetV2NetworkToEndpointId).filter(x => typeof x === 'number').map(x => x as number)
          console.log(destinationIds)
          const tx1 = await omniXMultisender.setUlnConfigs(sendLib302,confirmations,destinationIds,lzDVNLocalAddress, {gasLimit: 2000000})
          console.log (`Successfully setUlnConfig for sendLib302 for ${ await omniXMultisender.getAddress()} on ${network.name} ${tx1.hash}`)
          const tx2 = await omniXMultisender.setUlnConfigs(receiveLib302,confirmations,destinationIds,lzDVNLocalAddress,{gasLimit: 250000, gasPrice: 1000000000000})
          console.log (`Successfully setUlnConfig for receiveLib302 for ${await omniXMultisender.getAddress()} on ${network.name} ${tx2.hash}`)
        }
      } catch (error) {
        console.error(error)
      }
    })