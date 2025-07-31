// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Test, console} from "forge-std/Test.sol";
import "forge-std/console.sol";
import {ETHGlobalSmartWallet} from "../src/ETHGlobalSmartWallet.sol";
import {WalletFactory} from "../src/WalletFactory.sol";
import {Wallet} from "../src/Wallet.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockERC721} from "../src/mocks/MockERC721.sol";

contract ETHGlobalSmartWalletTest is Test {
    ETHGlobalSmartWallet public impl;
    WalletFactory public factory;
    ETHGlobalSmartWallet public wallet;
    MockERC20 erc20_1;
    MockERC20 erc20_2;
    MockERC721 public erc721;
    address payable walletAddress;
    uint256 sendERC20Amount = 2e18;

    function setUp() public {
        factory = new WalletFactory();
        impl = new ETHGlobalSmartWallet(address(factory));
        erc20_1 = new MockERC20("Mock ERC20", "ERC20");
        erc20_2 = new MockERC20("Mock ERC20", "ERC20");
        erc721 = new MockERC721("Mock ERC721", "ERC");
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
        assertEq(wallet.ownerOf(wallet.TOKEN_ID()), address(this));
        assertEq(wallet.TOKEN_ID(), 1);
        assertEq(wallet.name(), "ETHGlobal Smart Wallet");
        assertEq(wallet.symbol(), "ETHGLW");
        string memory url = string(
            abi.encodePacked(
                "https://apidev.envelop.is/meta/",
                vm.toString(block.chainid),
                "/",
                Strings.toHexString(uint256(uint160(address(walletAddress)))),
                //uint160(walletAddress).toHexString(),
                "/",
                vm.toString(wallet.TOKEN_ID())
            )
        );
        assertEq(wallet.tokenURI(wallet.TOKEN_ID()), url);
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
        // by non-owner and non-spender
        vm.prank(receiver);
        vm.expectRevert("Only owner or keeper");
        wallet.executeEncodedTxBatch(targets, values, dataArray);
        // by spender
        wallet.setApprovalForAll(receiver, true);
        vm.prank(receiver);
        wallet.executeEncodedTxBatch(targets, values, dataArray);
        assertEq(erc20_1.balanceOf(walletAddress), 0);
        assertEq(erc20_2.balanceOf(walletAddress), 0);
        assertEq(erc20_1.balanceOf(receiver), sendERC20Amount);
        assertEq(erc20_2.balanceOf(receiver), sendERC20Amount * 2);
    }

    function test_transferFrom() public {
        uint256 tokenId = impl.TOKEN_ID();
        wallet.approve(address(1), tokenId);
        vm.prank(address(1));
        wallet.transferFrom(address(this), address(2), tokenId);
        assertEq(wallet.getApproved(tokenId), address(0));
        vm.prank(address(1));
        vm.expectRevert();
        wallet.transferFrom(address(this), address(3), tokenId);
        assertEq(wallet.ownerOf(tokenId), address(2));
        assertEq(wallet.getApproved(tokenId), address(0));
    }

    function test_batch_several_different_assets() public {
        uint256 tokenId = 0;
        erc721.transferFrom(address(this), walletAddress, tokenId);
        erc20_1.transfer(walletAddress, sendERC20Amount);

        assertEq(erc721.ownerOf(tokenId), walletAddress);
        assertEq(erc20_1.balanceOf(walletAddress), sendERC20Amount);
        address[] memory targets = new address[](2);
        bytes[] memory dataArray = new bytes[](2);
        uint256[] memory values = new uint256[](2);
        address receiver = address(2);
        targets[0] = address(erc20_1);
        targets[1] = address(erc721);
        values[0] = 0;
        values[1] = 0;
        dataArray[0] = abi.encodeWithSignature("transfer(address,uint256)", receiver, sendERC20Amount);
        dataArray[1] = abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)", walletAddress, receiver, tokenId, bytes("")
        );
        wallet.executeEncodedTxBatch(targets, values, dataArray);
        assertEq(erc721.ownerOf(tokenId), receiver);
        assertEq(erc20_1.balanceOf(walletAddress), 0);
        assertEq(erc20_1.balanceOf(receiver), sendERC20Amount);
    }

    function test_initialize_again() public {
        ETHGlobalSmartWallet.InitParams memory initData = ETHGlobalSmartWallet.InitParams(
            address(this),
            "ETHGlobal Smart Wallet AGAIN",
            "ETHGLW",
            "https://apidev.envelop.is/meta/",
            new address[](0),
            new bytes32[](0),
            new uint256[](0),
            ""
        );
        vm.expectRevert();
        wallet.initialize(initData);
    }
}
