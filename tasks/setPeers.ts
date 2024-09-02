import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types'

import {  allNetworks, MainnetV2NetworkToEndpointId} from '../constants/deploymentAddresses'

import { OmniXMultisender, OmniXMultisender__factory } from '../typechain-types'
import { BigNumberish, BytesLike, zeroPadValue } from 'ethers'

task(`setPeers`, 'setPeers for a Multisender contract. used for connecting instances deployed on different chains')
.setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const { ethers, network } = hre
        // const { targetNetwork } = taskArguments
        const [owner] = await ethers.getSigners()

        // connect to an instance of OmniXMultisender and set appropriate constants
        // const omniXMultisenderAddress = (await hre.deployments.get('OmniXMultisender')).address
        const omniXMultisenderAddress = '0x43a1421B40A6FEAb59850dDE01D5662A336D9304'
        const remoteEids:BigNumberish[] = []
        const remoteDeploymentAddresses: BytesLike[] = []

        allNetworks.forEach((element, i) => {
            console.log(element)
            const destinationNetworkId = MainnetV2NetworkToEndpointId[element as keyof typeof MainnetV2NetworkToEndpointId]
            console.log(destinationNetworkId)
            remoteEids.push(destinationNetworkId)
            // we are assuming here that the multisender on all other networks has the same address as on the source one
            remoteDeploymentAddresses.push(zeroPadValue(omniXMultisenderAddress,32))
            console.log(remoteDeploymentAddresses.length)
        });

        const omniXMultisender: OmniXMultisender = OmniXMultisender__factory.connect(
            omniXMultisenderAddress,
            owner
        )

        // const input = generateOptions(owner.address, deis)
        // note that this code is meant for testing purposes only
        // in production you MUST implement a read call to estimateFees first so the users do not pass more value than needed
        // const tx = await omniMultisender[`sendDeposits(uint32[],uint128[])`].send(deis,[100000000,100000000])
        // console.log(`SetPeers to  on ${network.name} complete.`)
        // console.log(tx.hash)
        console.log(`About to set peers for ${omniXMultisenderAddress} on ${network.name}`)
        console.log(remoteEids)
        console.log(remoteDeploymentAddresses)
        try {
          const tx = await omniXMultisender.setPeers(remoteEids, remoteDeploymentAddresses, {gasLimit: 200000})
          console.log (`Successfully set peers for ${omniXMultisenderAddress} on ${network.name} ${tx.hash}`)
        } catch (error) {
          console.error(error)
        }
        
    })