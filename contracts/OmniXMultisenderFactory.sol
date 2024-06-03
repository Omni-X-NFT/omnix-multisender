// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibZip } from "solady/src/utils/LibZip.sol";
import { LibClone } from "solady/src/utils/LibClone.sol";
import { SafeTransferLib } from "solady/src/utils/SafeTransferLib.sol";

import { Ownable } from "solady/src/auth/Ownable.sol";

interface IOmniXMultisender {
    function initialize() external;
    function setPeers(uint32[] calldata remoteEids, bytes32[] calldata remoteAddresses)
        external;
    function setGasLimit(uint32[] calldata remoteEids, uint128[] calldata gasLimits)
        external;
    function setDelegate(address delegate) external;
    function setUlnConfigs(
        address lib,
        uint64 confirmations,
        uint32[] calldata eids,
        address dvn
    ) external;
}

contract OmniXMultisenderFactory is Ownable {
    /// -----------------------------------------------------------------------
    /// Immutables
    /// -----------------------------------------------------------------------

    address internal immutable implementation;

    /// -----------------------------------------------------------------------
    /// Constructor
    /// -----------------------------------------------------------------------

    constructor(address _owner, address _implementation) {
        _initializeOwner(_owner);
        implementation = _implementation;
    }

    /// -----------------------------------------------------------------------
    /// Owner Actions
    /// -----------------------------------------------------------------------

    function deploy(address endpoint, address omniNft, uint24 defaultGasLimit)
        external
        virtual
        onlyOwner
        returns (address instance)
    {
        instance = LibClone.clone(
            implementation,
            abi.encodePacked(endpoint, address(this), omniNft, defaultGasLimit)
        );

        IOmniXMultisender(instance).initialize();
    }

    function setPeers(
        address instance,
        uint32[] calldata remoteEids,
        bytes32[] calldata remoteAddresses
    ) external virtual onlyOwner {
        IOmniXMultisender(instance).setPeers(remoteEids, remoteAddresses);
    }

    function setGasLimit(
        address instance,
        uint32[] calldata remoteEids,
        uint128[] calldata gasLimits
    ) external virtual onlyOwner {
        IOmniXMultisender(instance).setGasLimit(remoteEids, gasLimits);
    }

    function setDelegate(address instance, address delegate) external virtual onlyOwner {
        IOmniXMultisender(instance).setDelegate(delegate);
    }

    function setUlnConfigs(
        address instance,
        address lib,
        uint64 confirmations,
        uint32[] calldata eids,
        address dvn
    ) external virtual onlyOwner {
        IOmniXMultisender(instance).setUlnConfigs(lib, confirmations, eids, dvn);
    }

    function withdraw(address token, address to) external virtual onlyOwner {
        if (token == address(0)) SafeTransferLib.safeTransferAllETH(to);
        else SafeTransferLib.safeTransferAll(token, to);
    }

    /// -----------------------------------------------------------------------
    /// Fallback
    /// -----------------------------------------------------------------------

    receive() external payable virtual { }

    fallback() external virtual {
        LibZip.cdFallback();
    }
}