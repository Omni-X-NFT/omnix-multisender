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

import { LibZip } from "solady/src/utils/LibZip.sol";
import { Ownable } from "solady/src/auth/Ownable.sol";
import { Initializable } from "solady/src/utils/Initializable.sol";
import { SafeTransferLib } from "solady/src/utils/SafeTransferLib.sol";
import { FixedPointMathLib } from "solady/src/utils/FixedPointMathLib.sol";

/// @title OmniXMultisender
contract OmniXMultisender is Initializable, Ownable {

    // Events
    event PeerSet(uint32 indexed remoteEid, bytes32 indexed remoteAddress);
    event GasLimitSet(uint32 indexed remoteEid, uint128 indexed gasLimit);
    event Withdrawal(address token, address to);
    /// -----------------------------------------------------------------------
    /// Custom Errors
    /// -----------------------------------------------------------------------

    error InsufficientNativeValue(); // 0x35898e6e

    error ArrayLengthsMustMatch(); // 0x587543d1

    /// -----------------------------------------------------------------------
    /// Constants
    /// -----------------------------------------------------------------------
    
    address internal immutable endpointAddress;
    address internal immutable omniNftAddress;
    //@dev This gas limit value will be used unless a function specifies the value explicitly or it has been set in gasLimitLookeup by the owner
    uint24 internal immutable defaultGasLimit = 10000;
    uint256 internal constant BIPS_DIVISOR = 10_000;

    /// -----------------------------------------------------------------------
    /// Mutables
    /// -----------------------------------------------------------------------

    mapping(uint32 => bytes32) public peers;

    mapping(uint32 => uint128) public gasLimitLookup; 

    constructor (address _endpointAddress, address _omniNftAddress) payable {
        endpointAddress = _endpointAddress;
        omniNftAddress = _omniNftAddress;
    }

    function endpoint() public view virtual returns (ILayerZeroEndpointV2) {
        return ILayerZeroEndpointV2(endpointAddress);
    }

    /// -----------------------------------------------------------------------
    /// Actions
    /// -----------------------------------------------------------------------

    function sendDeposits(uint32[] calldata dstEids, uint128[] calldata amounts, uint24 customGasLimit)
        external
        payable
        virtual
    {
        _sendDeposits(dstEids, amounts, msg.sender, customGasLimit);
    }

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
 
    function estimateLZFees(uint32[] calldata _dstEids, uint128[] calldata _amounts, address _to)
        external
        view
        virtual
        returns (uint256)
    {
        return _estimateLZFees(_dstEids, _amounts, _to);
    }

    function estimateTotalFees(uint256 _fee)
        external
        view
        virtual
        returns (uint256)
    {
        return _estimateTotalFees(_fee);
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
        bytes32 convertedAddress = bytes32(uint256(uint160(address(this))));
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

    function _estimateTotalFees(uint256 _fee)
        internal
        view
        returns (uint256)
    {
        uint256 omniBalance =
            omniNftAddress == address(0) ? 0 : SafeTransferLib.balanceOf(omniNftAddress, msg.sender);
        uint256 discountBips =
            FixedPointMathLib.mulDiv(100, omniBalance > 5 ? 5 : omniBalance, 5);
        uint256 totalFee = FixedPointMathLib.mulDiv(
            _fee, BIPS_DIVISOR + 100 - discountBips, BIPS_DIVISOR // we could use either fee or realizedFee for this, realizedFee is more reliable if we decide for an optimistic route
        );
        return totalFee;
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

        uint256 totalFee = _estimateTotalFees(realizedFee);
        if (totalFee > msg.value) revert InsufficientNativeValue();

        uint256 refund = msg.value - totalFee;
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