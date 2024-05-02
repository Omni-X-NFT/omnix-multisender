import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types'
import { OmniXMultisenderFactory, OmniXMultisenderFactory__factory } from '../typechain-types'
import { omniElementsAddresses } from '../constants/omniElementsAddresses'

task(`deployOmniXMultisenderClone`, 'Call a deploy function on a OmniXMultisenderFactory')
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      const { ethers, network, deployments } = hre
      const { name:networkName } = network

      const [owner] = await ethers.getSigners()

      //hardcoded omnixMultisenderFactory address
      const omniXMultisenderFactoryAddress = '0xd480364206B187c2A2B00b13Bf3fD2bea6D52f65';

      //determine if we pass an empty address or an actual address of Omni Elements to the deploy function
      let omniElementsAddress = "0x0000000000000000000000000000000000000000"
      if (omniElementsAddresses.hasOwnProperty(networkName)) {
        omniElementsAddress = omniElementsAddresses[networkName as keyof typeof omniElementsAddresses]
        console.log('Omni Elements Address '+ omniElementsAddress)
      } 

      const omniXMultisenderFactory: OmniXMultisenderFactory = OmniXMultisenderFactory__factory.connect(omniXMultisenderFactoryAddress,owner)
      //deploy a clone. first parameter is a hardcoded LayeZero v2 endpoint address
      const tx = await omniXMultisenderFactory.deploy('0x1a44076050125825900e736c501f859c50fe728c',omniElementsAddress, 200000, { gasLimit: "0x100000", })

      console.log(`${tx.hash} on ${networkName} succeeded!`)
    })