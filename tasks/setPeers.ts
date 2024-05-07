import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types'

import { EndpointVersion, networkToEndpointId } from '@layerzerolabs/lz-definitions'

import { firstDeploymentAddressNetworks, secondDeploymentAddressNetworks, firstCloneDeploymentAddress, secondCloneDeploymentAddress, firstFactoryDeploymentAddress, secondFactoryDeploymentAddress, MainnetV2NetworkToEndpointId} from '../constants/deploymentAddresses'

import { OmniXMultisenderFactory, OmniXMultisenderFactory__factory } from '../typechain-types'
import { BigNumberish, BytesLike, zeroPadValue } from 'ethers'

task(`setPeers`, 'setPeers for a Multisender contract. used for connecting instances deployed on a different adress across the chains')
// .addParam('targetNetwork', 'name of the target network')    
.setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const { ethers, network } = hre
        // const { targetNetwork } = taskArguments
        const [owner] = await ethers.getSigners()

        // connect to an instance of OmniMultisenderFactory and set appropriate constants
        let omniXMultisenderFactoryAddress:string
        let omniXMultisenderCloneAddress:string
        const remoteEids:BigNumberish[] = []
        const remoteDeploymentAddresses: BytesLike[] = []

        if ( firstDeploymentAddressNetworks.includes(network.name) ) {
          omniXMultisenderFactoryAddress = firstFactoryDeploymentAddress
          omniXMultisenderCloneAddress = firstCloneDeploymentAddress
          secondDeploymentAddressNetworks.forEach((element, i) => {
            console.log('For each element')
            console.log(element)
            const destinationNetworkId = MainnetV2NetworkToEndpointId[element as keyof typeof MainnetV2NetworkToEndpointId]
            console.log(destinationNetworkId)
            remoteEids.push(destinationNetworkId)
            remoteDeploymentAddresses.push(zeroPadValue(secondCloneDeploymentAddress,32))
            console.log(remoteDeploymentAddresses[i].length)
          });
        } else {
          omniXMultisenderFactoryAddress = secondFactoryDeploymentAddress
          omniXMultisenderCloneAddress = secondCloneDeploymentAddress
          firstDeploymentAddressNetworks.forEach((element, i) => {
            console.log('For each element')
            console.log(element)
            const destinationNetworkId = MainnetV2NetworkToEndpointId[element as keyof typeof MainnetV2NetworkToEndpointId]
            console.log(destinationNetworkId)
            remoteEids.push(destinationNetworkId)
            remoteDeploymentAddresses.push(zeroPadValue(firstCloneDeploymentAddress,32))
            console.log(remoteDeploymentAddresses[i].length)
          });
        }

        const omniXMultisenderFactory: OmniXMultisenderFactory = OmniXMultisenderFactory__factory.connect(
            omniXMultisenderFactoryAddress,
            owner
        )

        // const input = generateOptions(owner.address, deis)
        //note that this code is meant for testing purposes only
        // in production you MUST implement a read call to estimateFees first so the users do not pass more value than needed
        // const tx = await omniMultisender[`sendDeposits(uint32[],uint128[])`].send(deis,[100000000,100000000])
        // console.log(`SetPeers to  on ${network.name} complete.`)
        // console.log(tx.hash)
        console.log(`About to set peers for ${omniXMultisenderCloneAddress} on ${network.name}`)
        console.log(remoteEids)
        console.log(remoteDeploymentAddresses)
        try {
          const tx = await omniXMultisenderFactory.setPeers(omniXMultisenderCloneAddress, remoteEids, remoteDeploymentAddresses, {gasLimit: 200000})
          console.log (`Successfully set peers for ${omniXMultisenderCloneAddress} on ${network.name} ${tx.hash}`)
        } catch (error) {
          console.error(error)
        }
        
    })