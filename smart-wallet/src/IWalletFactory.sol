// SPDX-License-Identifier: MIT
// ETHGlobal Hackathon. Factory interface

pragma solidity ^0.8.20;

interface IWalletFactory {

    function createWallet(address _implementation, bytes memory _initCallData) 
        external 
        payable 
        returns(address wallet); 


    function createWallet(address _implementation, bytes memory _initCallData, bytes32 _salt) 
        external 
        payable 
        returns(address wallet); 
    
    function predictDeterministicAddress(
        address implementation,
        bytes32 salt
    ) external view returns (address);

}