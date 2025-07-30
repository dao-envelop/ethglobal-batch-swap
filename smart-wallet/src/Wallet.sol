// SPDX-License-Identifier: MIT
// ETHGlobal Hackathon. Wallet
pragma solidity ^0.8.30;

import "@Uopenzeppelin/contracts/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@Uopenzeppelin/contracts/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

abstract contract Wallet is ERC721HolderUpgradeable, ERC1155HolderUpgradeable {
    error DifferentArraysLength(uint256 arr1, uint256 arr2);

    event EtherBalanceChanged(
        uint256 indexed balanceBefore, uint256 indexed balanceAfter, uint256 indexed txValue, address txSender
    );
    event EtherReceived(uint256 indexed balance, uint256 indexed txValue, address indexed txSender);

    modifier fixEtherBalance() {
        uint256 bb = address(this).balance;
        _;
        _fixEtherChanges(bb, address(this).balance);
    }

    /**
     * @dev The contract should be able to receive Eth.
     */
    receive() external payable virtual {
        emit EtherReceived(address(this).balance, msg.value, msg.sender);
    }

    /**
     * @dev Use this method for interact any dApps onchain
     * @param _target address of dApp smart contract
     * @param _value amount of native token in tx(msg.value)
     * @param _data ABI encoded transaction payload
     */
    function _executeEncodedTx(address _target, uint256 _value, bytes memory _data)
        internal
        fixEtherBalance
        returns (bytes memory r)
    {
        if (keccak256(_data) == keccak256(bytes(""))) {
            Address.sendValue(payable(_target), _value);
        } else {
            r = Address.functionCallWithValue(_target, _data, _value);
        }
    }

    /**
     * @dev Use this method for interact any dApps onchain, executing as one batch
     * @param _targetArray addressed of dApp smart contract
     * @param _valueArray amount of native token in every tx(msg.value)
     * @param _dataArray ABI encoded transaction payloads
     */
    function _executeEncodedTxBatch(
        address[] calldata _targetArray,
        uint256[] calldata _valueArray,
        bytes[] memory _dataArray
    ) internal fixEtherBalance returns (bytes[] memory r) {
        if (_targetArray.length != _valueArray.length) {
            revert DifferentArraysLength(_targetArray.length, _valueArray.length);
        }

        if (_targetArray.length != _dataArray.length) {
            revert DifferentArraysLength(_targetArray.length, _dataArray.length);
        }

        r = new bytes[](_dataArray.length);
        for (uint256 i = 0; i < _dataArray.length; ++i) {
            if (keccak256(_dataArray[i]) == keccak256(bytes(""))) {
                Address.sendValue(payable(_targetArray[i]), _valueArray[i]);
            } else {
                r[i] = Address.functionCallWithValue(_targetArray[i], _dataArray[i], _valueArray[i]);
            }
        }
    }

    function _fixEtherChanges(uint256 _balanceBefore, uint256 _balanceAfter) internal virtual {
        if (_balanceBefore != _balanceAfter) {
            _emitWrapper(_balanceBefore, _balanceAfter);
        }
    }

    /// To avoid use payable modifier
    function _emitWrapper(uint256 _balanceBefore, uint256 _balanceAfter) internal {
        emit EtherBalanceChanged(_balanceBefore, _balanceAfter, msg.value, msg.sender);
    }
}
