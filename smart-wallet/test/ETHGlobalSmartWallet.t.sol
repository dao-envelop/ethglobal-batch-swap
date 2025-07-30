// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
//import "forge-std/console.sol";
import {ETHGlobalSmartWallet} from "../src/ETHGlobalSmartWallet.sol";
import {Wallet} from "../src/Wallet.sol";

contract ETHGlobalSmartWalletTest is Test {
    ETHGlobalSmartWallet public impl;
    address FACTORY;  //dummy

    function setUp() public {
        impl = new ETHGlobalSmartWallet(FACTORY);
    }

    function test_init() public {
        assertEq(impl.TOKEN_ID(), 1);
        assertEq(impl.name(), 'ETHGlobal Smart Wallet');
        assertEq(impl.symbol(), 'ETHGLW');
    }

    function test_send_eth() public {
        uint256 sendEtherAmount = 1e18;
        //get eth to wallet
        vm.prank(address(this));
        vm.expectEmit();
        emit Wallet.EtherReceived(sendEtherAmount, sendEtherAmount, address(this));
        (bool sent, bytes memory data) = address(impl).call{value: sendEtherAmount}("");
        // suppress solc warnings 
        sent;
        data;
        assertEq(address(impl).balance, sendEtherAmount);
        //transfer eth from wallet
        data = "";
        address ethReceiver = address(2);
        vm.prank(address(this));
        //vm.expectEmit();
        //emit Wallet.EtherBalanceChanged(sendEtherAmount, sendEtherAmount / 2, sendEtherAmount / 2 , ethReceiver);
        impl.executeEncodedTx(ethReceiver, sendEtherAmount / 2, data); 
        assertEq(ethReceiver.balance, sendEtherAmount / 2);
        assertEq(address(impl).balance,sendEtherAmount / 2);

    }
}
