import assert from 'assert'

import { omniElementsAddresses } from '../constants/omniElementsAddresses'
import { type DeployFunction } from 'hardhat-deploy/types'

type IndexedAddresses = { [key: string]: string };

// TODO declare your contract name here
const contractName = 'OmniXMultisender'

const deployOmniXMultisender: DeployFunction = async (hre) => {
    const { getNamedAccounts, deployments } = hre

    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    assert(deployer, 'Missing named deployer account')

    const networkName = hre.network.name

    console.log(`Network: ${networkName}`)
    console.log(`Deployer: ${deployer}`)
    const localOmniElementAddress = (omniElementsAddresses as IndexedAddresses)[networkName] || "0x0000000000000000000000000000000000000000";
    console.log(`Omni Elements Address: ${localOmniElementAddress}`)

    // This is an external deployment pulled in from @layerzerolabs/lz-evm-sdk-v2
    //
    // @layerzerolabs/toolbox-hardhat takes care of plugging in the external deployments
    // from @layerzerolabs packages based on the configuration in your hardhat config
    //
    // For this to work correctly, your network config must define an eid property
    // set to `EndpointId` as defined in @layerzerolabs/lz-definitions
    //
    // For example:
    //
    // networks: {
    //   fuji: {
    //     ...
    //     eid: EndpointId.AVALANCHE_V2_TESTNET
    //   }
    // }
    const endpointV2Deployment = await hre.deployments.get('EndpointV2')

    const { address } = await deploy(contractName, {
        from: deployer,
        contract: 'contracts/OmniXMultisender.sol:OmniXMultisender',
        args: [
            endpointV2Deployment.address, // LayerZero's EndpointV2 address
            localOmniElementAddress // address of Omni Elements (discount ERC-721), empty if a collection is not deployed on a chain
        ],
        log: true,
        skipIfAlreadyDeployed: false,
    })

    console.log(`Deployed contract: ${contractName}, network: ${hre.network.name}, address: ${address}`)
}

deployOmniXMultisender.tags = [contractName]

export default deployOmniXMultisender
