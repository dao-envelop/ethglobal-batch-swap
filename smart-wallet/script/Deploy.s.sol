// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {ETHGlobalSmartWallet} from "../src/ETHGlobalSmartWallet.sol";

contract ETHGlobalSmartWalletScript is Script {
    ETHGlobalSmartWallet public impl;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        impl = new ETHGlobalSmartWallet();

        vm.stopBroadcast();
    }
}
