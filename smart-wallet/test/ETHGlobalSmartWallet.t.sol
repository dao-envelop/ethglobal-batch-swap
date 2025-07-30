// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {ETHGlobalSmartWallet} from "../src/ETHGlobalSmartWallet.sol";

contract ETHGlobalSmartWalletTest is Test {
    ETHGlobalSmartWallet public impl;

    function setUp() public {
        impl = new ETHGlobalSmartWallet();
        //impl.setNumber(0);
    }

    // function test_Increment() public {
    //     impl.increment();
    //     assertEq(impl.number(), 1);
    // }

    // function testFuzz_SetNumber(uint256 x) public {
    //     impl.setNumber(x);
    //     assertEq(impl.number(), x);
    // }
}
