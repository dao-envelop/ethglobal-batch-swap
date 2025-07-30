// SPDX-License-Identifier: MIT
// ETHGlobal Hackathon.Factory

pragma solidity ^0.8.30;

import "@openzeppelin/contracts/proxy/Clones.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
//import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
//import "./interfaces/IEnvelopV2wNFT.sol";
/*
 * @dev https://eips.ethereum.org/EIPS/eip-1167[EIP 1167] is a standard for
 * deploying minimal proxy contracts, also known as "clones".
 */

contract WalletFactory {
    uint256 constant ORACLE_TYPE = 3000;

    event WalletDeployment(address indexed proxy, address indexed implementation, uint256 envelopOracleType);

    constructor() {}

    function createWallet(address _implementation, bytes memory _initCallData)
        public
        payable
        returns (address wallet)
    {
        wallet = _clone(_implementation, _initCallData);

        emit WalletDeployment(wallet, _implementation, ORACLE_TYPE);
    }

    function createWallet(address _implementation, bytes memory _initCallData, bytes32 _salt)
        public
        payable
        returns (address wallet)
    {
        wallet = _cloneDeterministic(_implementation, _initCallData, _salt);

        emit WalletDeployment(wallet, _implementation, ORACLE_TYPE);
    }

    function predictDeterministicAddress(address implementation, bytes32 salt) public view returns (address) {
        return Clones.predictDeterministicAddress(implementation, salt);
    }

    function _clone(address _implementation, bytes memory _initCallData) internal returns (address _contract) {
        _contract = Clones.clone(_implementation);

        // Initialize Wallet
        if (_initCallData.length > 0) {
            Address.functionCallWithValue(_contract, _initCallData, msg.value);
        }
    }

    function _cloneDeterministic(address _implementation, bytes memory _initCallData, bytes32 _salt)
        internal
        returns (address _contract)
    {
        _contract = Clones.cloneDeterministic(_implementation, _salt);

        // Initialize Wallet
        if (_initCallData.length > 0) {
            Address.functionCallWithValue(_contract, _initCallData, msg.value);
        }
    }

    function _cloneDeterministic(
        address _implementation,
        bytes memory _initCallData,
        bytes32 _salt,
        uint256 _valueDenominator
    ) internal returns (address _contract) {
        _contract = Clones.cloneDeterministic(_implementation, _salt);

        // Initialize wallet
        if (_initCallData.length > 0) {
            Address.functionCallWithValue(_contract, _initCallData, msg.value / _valueDenominator);
        }
    }
}
