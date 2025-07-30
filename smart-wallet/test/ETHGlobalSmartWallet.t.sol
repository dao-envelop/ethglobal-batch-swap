// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
//import "forge-std/console.sol";
import {ETHGlobalSmartWallet} from "../src/ETHGlobalSmartWallet.sol";
import {WalletFactory} from "../src/WalletFactory.sol";
import {Wallet} from "../src/Wallet.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";

contract ETHGlobalSmartWalletTest is Test {
    ETHGlobalSmartWallet public impl;
    WalletFactory public factory;
    ETHGlobalSmartWallet public wallet;
    MockERC20 erc20_1;
    MockERC20 erc20_2;
    address payable walletAddress;
    uint256 sendERC20Amount = 2e18;

    function setUp() public {
        factory = new WalletFactory();
        impl = new ETHGlobalSmartWallet(address(factory));
        erc20_1 = new MockERC20("Mock ERC20", "ERC20");
        erc20_2 = new MockERC20("Mock ERC20", "ERC20");
        ETHGlobalSmartWallet.InitParams memory initData = ETHGlobalSmartWallet.InitParams(
            address(this),
            "ETHGlobal Smart Wallet",
            "ETHGLW",
            "https://apidev.envelop.is/meta/",
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
        assertEq(impl.name(), "ETHGlobal Smart Wallet");
        assertEq(impl.symbol(), "ETHGLW");
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
        emit Wallet.EtherBalanceChanged(sendEtherAmount, sendEtherAmount / 2, 0, address(this));
        wallet.executeEncodedTx(ethReceiver, sendEtherAmount / 2, data);
        assertEq(ethReceiver.balance, sendEtherAmount / 2);
        assertEq(walletAddress.balance, sendEtherAmount / 2);
        vm.prank(address(2));
        vm.expectRevert("Only owner or keeper");
        wallet.executeEncodedTx(ethReceiver, sendEtherAmount / 2, data);
    }

    function test_approve() public {
        erc20_1.transfer(walletAddress, sendERC20Amount);
        erc20_2.transfer(walletAddress, sendERC20Amount * 2);
        assertEq(erc20_1.balanceOf(walletAddress), sendERC20Amount);
        assertEq(erc20_2.balanceOf(walletAddress), sendERC20Amount * 2);
        address receiver = address(2);
        address[] memory targets = new address[](2);
        bytes[] memory dataArray = new bytes[](2);
        uint256[] memory values = new uint256[](2);
        targets[0] = address(erc20_1);
        targets[1] = address(erc20_2);
        values[0] = 0;
        values[1] = 0;
        dataArray[0] = abi.encodeWithSignature("transfer(address,uint256)", receiver, sendERC20Amount);
        dataArray[1] = abi.encodeWithSignature("transfer(address,uint256)", receiver, sendERC20Amount * 2);
        vm.prank(receiver);
        vm.expectRevert("Only owner or keeper");
        wallet.executeEncodedTxBatch(targets, values, dataArray);
        wallet.setApprovalForAll(receiver, true);
        vm.prank(receiver);
        wallet.executeEncodedTxBatch(targets, values, dataArray);
        assertEq(erc20_1.balanceOf(walletAddress), 0);
        assertEq(erc20_2.balanceOf(walletAddress), 0);
        assertEq(erc20_1.balanceOf(receiver), sendERC20Amount);
        assertEq(erc20_2.balanceOf(receiver), sendERC20Amount * 2);
    }
}
