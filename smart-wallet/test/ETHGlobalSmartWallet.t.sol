// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
//import "forge-std/console.sol";
import {ETHGlobalSmartWallet} from "../src/ETHGlobalSmartWallet.sol";
import {WalletFactory} from "../src/WalletFactory.sol";
import {Wallet} from "../src/Wallet.sol";

contract ETHGlobalSmartWalletTest is Test {
    ETHGlobalSmartWallet public impl;
    WalletFactory factory;
    address payable walletAddress;
    ETHGlobalSmartWallet wallet;

    function setUp() public {
        factory = new WalletFactory();
        impl = new ETHGlobalSmartWallet(address(factory));
        ETHGlobalSmartWallet.InitParams memory initData = ETHGlobalSmartWallet.InitParams(
            address(this),
            'ETHGlobal Smart Wallet',
            'ETHGLW',
            'https://apidev.envelop.is/meta/',
            new address[](0),
            new bytes32[](0),
            new uint256[](0),
            ""
        );

        walletAddress = payable(impl.createWalletOnFactory(initData));
        wallet = ETHGlobalSmartWallet(walletAddress);
    }

    function test_init() public {
        assertEq(wallet.ownerOf(impl.TOKEN_ID()), address(this));
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
        (bool sent, bytes memory data) = walletAddress.call{value: sendEtherAmount}("");
        // suppress solc warnings 
        sent;
        data;
        assertEq(walletAddress.balance, sendEtherAmount);
        //transfer eth from wallet
        data = "";
        address ethReceiver = address(2);
        vm.prank(address(this));
        vm.expectEmit();
        emit Wallet.EtherBalanceChanged(sendEtherAmount, sendEtherAmount / 2, 0 , address(this));
        wallet.executeEncodedTx(ethReceiver, sendEtherAmount / 2, data); 
        assertEq(ethReceiver.balance, sendEtherAmount / 2);
        assertEq(walletAddress.balance,sendEtherAmount / 2);

    }
}
