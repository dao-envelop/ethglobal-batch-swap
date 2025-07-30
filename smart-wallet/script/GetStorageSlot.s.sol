// SPDX-License-Identifier: UNLICENSED
// ETHGlobal Hackathon. Helpers

pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {Test, console2} from "forge-std/Test.sol";
import "../lib/forge-std/src/StdJson.sol";

// forge script script/GetStorageSlot.s.sol:GetStorageSlot
contract GetStorageSlot is Script {
    uint256 number;

    /**
     * @dev Store value in variable
     * @param num value to store
     */
    function store(uint256 num) public {
        number = num;
    }

    function run() public view {
        console2.log("Deployer address: %s, native balnce %s", msg.sender, msg.sender.balance);
        console2.log(
            "ETHglobal.storage.ETHGlobalSmartWallet \n %s \n",
            vm.toString(
                keccak256(abi.encode(uint256(keccak256("ETHglobal.storage.ETHGlobalSmartWallet")) - 1))
                    & ~bytes32(uint256(0xff))
            )
        );
    }
}
