// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {ETHGlobalSmartWallet} from "../src/ETHGlobalSmartWallet.sol";

contract ETHGlobalSmartWalletTest is Test {
    ETHGlobalSmartWallet public impl;

    function setUp() public {
        impl = new ETHGlobalSmartWallet();
    }

    function test_TOKEN_ID() public {
        assertEq(impl.TOKEN_ID(), 1);
    }

}
