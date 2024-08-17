// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { UlnConfig } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/UlnBase.sol";

import {
    ILayerZeroEndpointV2,
    MessagingParams,
    MessagingReceipt,
    Origin
} from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";

import {
    IMessageLibManager,
    SetConfigParam
} from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/IMessageLibManager.sol";

import { Ownable } from "solady/src/auth/Ownable.sol";
import { SafeTransferLib } from "solady/src/utils/SafeTransferLib.sol";

/// @title Omni X Multisender
/// @author Omni X
/// @notice Omni X Mutlsender allows you to send gas aka refuel your account on a number of EVM chains at once with no fees and close to perfect gas optimizations
/// @dev This multisender implementation is close to perfect for plain solidity, but can be even further improved upon with inline assembly, yul, etc.
/// @custom:donation This contract is completely free to use and fork, we do not take any extra fees. If you would like to donate you can send ETH or ERC-20s directly here, thank you🥰 
contract OmniXMultisender is Ownable {

    /// -----------------------------------------------------------------------
    /// Events
    /// -----------------------------------------------------------------------
    event PeerSet(uint32 indexed remoteEid, bytes32 indexed remoteAddress);
    event GasLimitSet(uint32 indexed remoteEid, uint128 indexed gasLimit);
    event Withdrawal(address token, address to);
    event UlnConfigSet(address lib, uint64 confirmations, uint32[] eids, address dvn);

    /// -----------------------------------------------------------------------
    /// Custom Errors
    /// -----------------------------------------------------------------------
    error InsufficientNativeValue(); // 0x35898e6e

    error ArrayLengthsMustMatch(); // 0x587543d1

    /// -----------------------------------------------------------------------
    /// Constants
    /// -----------------------------------------------------------------------
    bytes32 public immutable convertedAddress;
    address internal immutable endpointAddress;
    /// @dev This gas limit value will be used unless a function specifies the value explicitly or it has been set in gasLimitLookup by the owner
    uint24 internal immutable defaultGasLimit = 10000;
    uint256 internal constant BIPS_DIVISOR = 10_000;
    bool internal PATH_INITIALIZED_ON_DEPLOYMENT = true;

    /// -----------------------------------------------------------------------
    /// Mutables
    /// -----------------------------------------------------------------------

    mapping(uint32 => bytes32) public peers;

    mapping(uint32 => uint128) public gasLimitLookup; 

    constructor (address _endpointAddress) payable {
        Ownable._initializeOwner(msg.sender);
        endpointAddress = _endpointAddress;
        convertedAddress = bytes32(uint256(uint160(address(this))));
    }

    function endpoint() public view virtual returns (ILayerZeroEndpointV2) {
        return ILayerZeroEndpointV2(endpointAddress);
    }

    /// -----------------------------------------------------------------------
    /// Actions
    /// -----------------------------------------------------------------------

    /// @notice Use this function to send funds to any number of supported chains. Use 0 for customGasLimit if you do not want to override the default one. Override might be necessary when selecting 20+ destination chains at once.
    /// @dev The name of the function has been selected to optimize for its place at the top of the dispatch order, as well as using calldata instead of memory for further performance.
    function sendDeposits_3FF34E(uint32[] calldata dstEids, uint128[] calldata amounts, uint24 customGasLimit)
        external
        payable
        virtual
    {
        _sendDeposits(dstEids, amounts, msg.sender, customGasLimit);
    }

    /// @notice Same sendDeposits function as above just to a different address than your own.
    /// @dev This function's name and place in the call stack has not been optimized as most of the time users will send the gas to themselves
    function sendDeposits(
        uint32[] calldata dstEids,
        uint128[] calldata amounts,
        address to,
        uint24 customGasLimit
    ) external payable virtual {
        _sendDeposits(dstEids, amounts, to, customGasLimit);
    }

    /// -----------------------------------------------------------------------
    /// Only-Owner Logic
    /// -----------------------------------------------------------------------

    function withdraw(address token, address to) external virtual onlyOwner {
        if (token == address(0)) SafeTransferLib.safeTransferAllETH(to);
        else SafeTransferLib.safeTransferAll(token, to);
        emit Withdrawal(token, to); // Emit event
    }

    /// @dev Set peers for your contract. Deploy at once on all chains from a clean wallet to have the same address on every chain, alternatively you can try various CREATE2 and CREATE3 tools.
    function setPeers(uint32[] calldata remoteEids, bytes32[] calldata remoteAddresses)
        external
        virtual
        onlyOwner
    {
        if (remoteEids.length != remoteAddresses.length) {
            revert ArrayLengthsMustMatch();
        }
        for (uint256 i; i < remoteEids.length; ++i) {
            peers[remoteEids[i]] = remoteAddresses[i];
            emit PeerSet(remoteEids[i], remoteAddresses[i]); // Emit event
        }
    }

    /// @notice Set a custom gas limit for a number of paths.
    function setGasLimit(uint32[] calldata remoteEids, uint128[] calldata gasLimits)
        external
        virtual
        onlyOwner
    {
        if (remoteEids.length != gasLimits.length) revert ArrayLengthsMustMatch();
        for (uint256 i; i < remoteEids.length; ++i) {
            gasLimitLookup[remoteEids[i]] = gasLimits[i];
            emit GasLimitSet(remoteEids[i], gasLimits[i]); // Emit event
        }
    }

    function setDelegate(address delegate) external virtual onlyOwner {
        endpoint().setDelegate(delegate);
    }

    /// @dev lib version, number of confirmations and DVN MUST match EXACTLY between two chains for the contract to work.
    function setUlnConfigs(
        address lib,
        uint64 confirmations,
        uint32[] calldata eids,
        address dvn
    ) external virtual onlyOwner {
        if (lib == address(0) || dvn == address(0))
            revert("OmniXMultisender.setUlnConfigs: Either lib or dvn passed address is 0.");

        SetConfigParam[] memory configs = new SetConfigParam[](eids.length);

        for (uint256 i; i < eids.length;) {
            address[] memory opt = new address[](0);
            address[] memory req = new address[](1);
            req[0] = dvn;

            configs[i] = SetConfigParam({
                eid: eids[i],
                configType: 2,
                config: abi.encode(UlnConfig(confirmations, uint8(1), 0, 0, req, opt))
            });

            unchecked {
                ++i;
            }
        }

        IMessageLibManager(address(endpoint())).setConfig(address(this), lib, configs);
        emit UlnConfigSet(lib, confirmations, eids, dvn); // Emit event
    }

    /// -----------------------------------------------------------------------
    /// Read-Only Helpers
    /// -----------------------------------------------------------------------

    function createSendDepositOption(uint32 dstEid, uint128 amount, address to, uint24 customGasLimit)
        external
        view
        virtual
        returns (bytes memory)
    {
        return _createSendDepositOption(dstEid, amount, to, customGasLimit);
    }
 
    /// @notice Use this function to estimate fees for your cross-chain sendDeposits. It is reccomended to pass a slightly higher value than returned from here for better UX, any excess will be refunded back to the user.
    function estimateLZFees(uint32[] calldata _dstEids, uint128[] calldata _amounts, address _to)
        external
        view
        virtual
        returns (uint256)
    {
        return _estimateLZFees(_dstEids, _amounts, _to);
    }

    
    /// -----------------------------------------------------------------------
    /// Internal Helpers
    /// -----------------------------------------------------------------------

    function _estimateLZFees(uint32[] calldata _dstEids, uint128[] calldata _amounts, address to)
        internal
        view
        returns (uint256)
    {
        uint256 lzFee;
        for (uint256 i; i < _dstEids.length; ++i) {
            lzFee += endpoint().quote(
                MessagingParams(
                    _dstEids[i],
                    convertedAddress,
                    "",
                    _createSendDepositOption(_dstEids[i], _amounts[i], to, 0),
                    false),
                address(this)
            ).nativeFee;
        }
        return lzFee;
    }

    function _createSendDepositOption(uint32 dstEid, uint128 amount, address to, uint24 customGasLimit)
        internal
        view
        virtual
        returns (bytes memory)
    {
        return abi.encodePacked(
            uint16(3), // unrolled _createReceiveOption(dstEid) start
            uint8(1),
            uint16(16 + 1),
            uint8(1),
            _getGasLimit(dstEid, customGasLimit), // unrolled _createReceiveOption end
            uint8(1),
            uint16(32 + 16 + 1),
            uint8(2),
            amount, 
            bytes32(uint256(uint160(to)))
        );
    }

    function _sendDeposits(
        uint32[] calldata dstEids,
        uint128[] calldata amounts,
        address to,
        uint24 customGasLimit
    ) internal virtual {
        uint256 fee;
        uint256 initialBal = address(this).balance;
        uint256 origContractBal = address(this).balance - msg.value; // selfbalance() is cheaper (5 gas) than cached value which may have to depend on push + swap
         
        for (uint256 i; i < dstEids.length;++i) {
            fee += _lzSend(
                dstEids[i],
                "",
                _createSendDepositOption(dstEids[i], amounts[i], to, customGasLimit),
                address(this).balance,
                address(this)
            ).fee.nativeFee;
        }

        uint256 realizedFee = initialBal - address(this).balance;
        assert(realizedFee == fee); // invariant ensuring what lz is reporting, matches the realized fee we computed based on our balance

        if (realizedFee > msg.value) revert InsufficientNativeValue();

        uint256 refund = msg.value - realizedFee;
        if (refund > 0) SafeTransferLib.safeTransferETH(msg.sender, refund); // refund excess if necessary
        assert(address(this).balance >= origContractBal); // ensure the original contract balance is at least still intact, ensuring no balance dipping
    }

    function _lzSend(
        uint32 _dstEid,
        bytes memory _message,
        bytes memory _options,
        uint256 _nativeFee,
        address _refundAddress
    ) internal virtual returns (MessagingReceipt memory) {
        return endpoint().send{ value: _nativeFee }(
            MessagingParams(_dstEid, _getPeer(_dstEid), _message, _options, false),
            _refundAddress
        );
    }

    function _getPeer(uint32 _dstEid) internal view returns (bytes32) {
        bytes32 trustedRemote = peers[_dstEid];
        if (trustedRemote == 0) revert();
        else return trustedRemote;
    }

    function _getGasLimit(uint32 _dstEid, uint24 _customGasLimit) internal view returns (uint128) {
        if (_customGasLimit != 0) return _customGasLimit;
        uint128 gasLimit = gasLimitLookup[_dstEid];
        if (gasLimit == 0) return defaultGasLimit;
        else return gasLimit;
    }

    /// -----------------------------------------------------------------------
    /// Layer Zero Callbacks
    /// -----------------------------------------------------------------------

    function nextNonce(uint32, bytes32) external pure virtual returns (uint64 nonce) {
        return 0;
    }

    function allowInitializePath(Origin calldata origin)
        external
        view
        virtual
        returns (bool)
    {
        return PATH_INITIALIZED_ON_DEPLOYMENT;
    }

    function lzReceive(Origin calldata, bytes32, bytes calldata, address, bytes calldata)
        external
        pure
        virtual
    {
        return;
    }

    /// -----------------------------------------------------------------------
    /// Fallback
    /// -----------------------------------------------------------------------

    receive() external payable virtual {}

    fallback() external payable virtual {}
}