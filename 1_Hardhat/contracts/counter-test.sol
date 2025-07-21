// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "hardhat/console.sol";

contract CounterTest {
    uint256 count;

    constructor() public {
        count = 0;
    }

    function getCount() public view returns(uint256) {
        return count;
    }

    function incrementCount() public {
        count = count + 1;
    }
}