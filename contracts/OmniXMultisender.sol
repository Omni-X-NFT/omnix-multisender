// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//   ／l
// （ﾟ､ ｡ ７   *
//   l  ~ヽ   \
//   じしf_,)ノ
import { UlnConfig } from
    "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/UlnBase.sol";

import {
    ILayerZeroEndpointV2,
    MessagingParams,
    MessagingReceipt,
    Origin
} from
    "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";

import {
    IMessageLibManager,
    SetConfigParam
} from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/IMessageLibManager.sol";

import { Clone } from "solady/src/utils/Clone.sol";
import { LibZip } from "solady/src/utils/LibZip.sol";
import { Initializable } from "solady/src/utils/Initializable.sol";
import { SafeTransferLib } from "solady/src/utils/SafeTransferLib.sol";
import { FixedPointMathLib } from "solady/src/utils/FixedPointMathLib.sol";

interface IERC721 {
    function balanceOf(address owner) external view returns (uint256 result);
}

/// @title OmniXMultisender
contract OmniXMultisender is Initializable, Clone {
    /// -----------------------------------------------------------------------
    /// Custom Errors
    /// -----------------------------------------------------------------------

    error InsufficientNativeValue(); // 0x35898e6e

    error Unauthorized(); // 0x82b42900

    error ArrayLengthsMustMatch(); // 0x587543d1

    /// -----------------------------------------------------------------------
    /// Constants
    /// -----------------------------------------------------------------------

    uint256 internal constant BIPS_DIVISOR = 10_000;

    /// -----------------------------------------------------------------------
    /// Mutables
    /// -----------------------------------------------------------------------

    mapping(uint32 => bytes32) public peers;

    mapping(uint32 => uint128) public gasLimitLookup;

    /// -----------------------------------------------------------------------
    /// Constants
    /// -----------------------------------------------------------------------

    function endpoint() public pure virtual returns (ILayerZeroEndpointV2) {
        return ILayerZeroEndpointV2(_getArgAddress(0x00));
    }

    function factory() public pure virtual returns (address) {
        return _getArgAddress(0x14);
    }

    function omniNft() public pure virtual returns (address) {
        return _getArgAddress(0x28);
    }

    function defaultGasLimit() public pure virtual returns (uint128) {
        return _getArgUint24(0x3c);
    }

    /// -----------------------------------------------------------------------
    /// Initialization
    /// -----------------------------------------------------------------------

    function initialize() external virtual initializer {
        endpoint().setDelegate(factory());
    }

    /// -----------------------------------------------------------------------
    /// Actions
    /// -----------------------------------------------------------------------

    function sendDeposits(uint32[] calldata dstEids, uint128[] calldata amounts)
        external
        payable
        virtual
    {
        _sendDeposits(dstEids, amounts, msg.sender);
    }

    function sendDeposits(
        uint32[] calldata dstEids,
        uint128[] calldata amounts,
        address to
    ) external payable virtual {
        _sendDeposits(dstEids, amounts, to);
    }

    function withdraw(address token) external virtual {
        if (token == address(0)) SafeTransferLib.safeTransferAllETH(factory());
        else SafeTransferLib.safeTransferAll(token, factory());
    }

    /// -----------------------------------------------------------------------
    /// Only-Factory Logic
    /// -----------------------------------------------------------------------

    modifier onlyFactory() virtual {
        if (msg.sender != factory()) revert Unauthorized();
        _;
    }

    function setPeers(uint32[] calldata remoteEids, bytes32[] calldata remoteAddresses)
        external
        virtual
        onlyFactory
    {
        unchecked {
            if (remoteEids.length != remoteAddresses.length) {
                revert ArrayLengthsMustMatch();
            }
            for (uint256 i; i < remoteEids.length; ++i) {
                peers[remoteEids[i]] = remoteAddresses[i];
            }
        }
    }

    function setGasLimit(uint32[] calldata remoteEids, uint128[] calldata gasLimits)
        external
        virtual
        onlyFactory
    {
        unchecked {
            if (remoteEids.length != gasLimits.length) revert ArrayLengthsMustMatch();
            for (uint256 i; i < remoteEids.length; ++i) {
                gasLimitLookup[remoteEids[i]] = gasLimits[i];
            }
        }
    }

    function setDelegate(address delegate) external virtual onlyFactory {
        endpoint().setDelegate(delegate);
    }

    function setUlnConfigs(
        address lib,
        uint64 confirmations,
        uint32[] calldata eids,
        address dvn
    ) external virtual onlyFactory {
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
    }

    /// -----------------------------------------------------------------------
    /// Read-Only Helpers
    /// -----------------------------------------------------------------------

    function createReceiveOption(uint32 dstEid)
        external
        view
        virtual
        returns (bytes memory)
    {
        return _createReceiveOption(dstEid);
    }

    function createNativeDropOption(uint32 dstEid, uint128 amount, address to)
        external
        view
        virtual
        returns (bytes memory)
    {
        return _createNativeDropOption(dstEid, amount, to);
    }

    function estimateFees(
        uint32[] calldata dstEids,
        bytes[] calldata messages,
        bytes[] calldata options
    ) external view virtual returns (uint256[] memory nativeFees) {
        unchecked {
            nativeFees = new uint256[](dstEids.length);
            for (uint256 i; i < dstEids.length; ++i) {
                nativeFees[i] = endpoint().quote(
                    MessagingParams(
                        dstEids[i], _getPeer(dstEids[i]), messages[i], options[i], false
                    ),
                    address(this)
                ).nativeFee;
            }
        }
    }

    /// -----------------------------------------------------------------------
    /// Internal Helpers
    /// -----------------------------------------------------------------------

    function _createReceiveOption(uint32 dstEid)
        internal
        view
        virtual
        returns (bytes memory)
    {
        return abi.encodePacked(
            abi.encodePacked(uint16(3)),
            uint8(1),
            uint16(16 + 1),
            uint8(1),
            abi.encodePacked(_getGasLimit(dstEid))
        );
    }

    function _createNativeDropOption(uint32 dstEid, uint128 amount, address to)
        internal
        view
        virtual
        returns (bytes memory)
    {
        return abi.encodePacked(
            _createReceiveOption(dstEid),
            uint8(1),
            uint16(32 + 16 + 1),
            uint8(2),
            abi.encodePacked(amount, bytes32(uint256(uint160(to))))
        );
    }

    function _sendDeposits(
        uint32[] calldata dstEids,
        uint128[] calldata amounts,
        address to
    ) internal virtual {
        uint256 fee;
        uint256 omniBalance =
            omniNft() == address(0) ? 0 : SafeTransferLib.balanceOf(omniNft(), msg.sender);
        uint256 discountBips =
            FixedPointMathLib.mulDiv(100, omniBalance > 5 ? 5 : omniBalance, 5);

        uint256 nativeAmount = FixedPointMathLib.mulDiv(
            msg.value, BIPS_DIVISOR - 100 + discountBips + 1, BIPS_DIVISOR
        );

        for (uint256 i; i < dstEids.length;) {
            fee += _lzSend(
                dstEids[i],
                "",
                _createNativeDropOption(dstEids[i], amounts[i], to),
                address(this).balance,
                address(this)
            ).fee.nativeFee;
            unchecked {
                ++i;
            }
        }
        
        if (fee > nativeAmount) revert InsufficientNativeValue();
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
        if (trustedRemote == 0) return bytes32(uint256(uint160(address(this))));
        else return trustedRemote;
    }

    function _getGasLimit(uint32 _dstEid) internal view returns (uint128) {
        uint128 gasLimit = gasLimitLookup[_dstEid];
        if (gasLimit == 0) return defaultGasLimit();
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
        return _getPeer(origin.srcEid) == origin.sender;
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

    receive() external payable virtual { }

    fallback() external payable virtual {
        LibZip.cdFallback();
    }
}