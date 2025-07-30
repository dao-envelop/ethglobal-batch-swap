// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {ETHGlobalSmartWallet} from "../src/ETHGlobalSmartWallet.sol";
import {WalletFactory} from "../src/WalletFactory.sol";

contract ETHGlobalSmartWalletScript is Script {
    ETHGlobalSmartWallet public impl;
    WalletFactory public factory;
     address FACTORY;  //dummy

    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        factory = new WalletFactory();
        impl = new ETHGlobalSmartWallet(address(factory));

        vm.stopBroadcast();
    }
}
