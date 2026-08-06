// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Splits} from "../src/libraries/Splits.sol";

contract SplitsHarness {
    function allocate(uint256 amount, Splits.Recipient[] calldata recipients) external pure returns (uint256[] memory) {
        return Splits.allocate(amount, recipients);
    }
}

contract SplitsTest is Test {
    SplitsHarness harness;

    function setUp() public {
        harness = new SplitsHarness();
    }

    function test_allocate_evenSplit() public view {
        Splits.Recipient[] memory r = new Splits.Recipient[](2);
        r[0] = Splits.Recipient({account: address(1), bps: 5_000});
        r[1] = Splits.Recipient({account: address(2), bps: 5_000});

        uint256[] memory shares = harness.allocate(100, r);
        assertEq(shares[0], 50);
        assertEq(shares[1], 50);
    }

    function test_allocate_threeWayDustGoesToLargestRemainder() public view {
        // 100 split 3334/3333/3333 bps -> 33.34/33.33/33.33, dust of 1 unit
        // goes to the recipient with the largest fractional remainder (index 0).
        Splits.Recipient[] memory r = new Splits.Recipient[](3);
        r[0] = Splits.Recipient({account: address(1), bps: 3_334});
        r[1] = Splits.Recipient({account: address(2), bps: 3_333});
        r[2] = Splits.Recipient({account: address(3), bps: 3_333});

        uint256[] memory shares = harness.allocate(100, r);
        assertEq(shares[0] + shares[1] + shares[2], 100);
        assertEq(shares[0], 34);
        assertEq(shares[1], 33);
        assertEq(shares[2], 33);
    }

    function test_allocate_revertsOnEmptyRecipients() public {
        Splits.Recipient[] memory r = new Splits.Recipient[](0);
        vm.expectRevert(Splits.EmptyRecipients.selector);
        harness.allocate(100, r);
    }

    function test_allocate_revertsWhenBpsDoNotSumTo10000() public {
        Splits.Recipient[] memory r = new Splits.Recipient[](2);
        r[0] = Splits.Recipient({account: address(1), bps: 4_000});
        r[1] = Splits.Recipient({account: address(2), bps: 4_000});

        vm.expectRevert(Splits.InvalidSplit.selector);
        harness.allocate(100, r);
    }

    function testFuzz_allocate_sharesAlwaysSumToAmount(uint256 amount, uint16 bpsA, uint8 recipientCount) public view {
        amount = bound(amount, 0, 1_000_000_000e6);
        recipientCount = uint8(bound(recipientCount, 2, 10));

        Splits.Recipient[] memory r = new Splits.Recipient[](recipientCount);
        uint16 remaining = 10_000;
        for (uint256 i = 0; i < recipientCount - 1; i++) {
            uint16 bps = uint16(bound(uint256(bpsA) + i, 1, remaining - (recipientCount - 1 - i)));
            r[i] = Splits.Recipient({account: address(uint160(i + 1)), bps: bps});
            remaining -= bps;
        }
        r[recipientCount - 1] = Splits.Recipient({account: address(uint160(recipientCount)), bps: remaining});

        uint256[] memory shares = harness.allocate(amount, r);
        uint256 sum;
        for (uint256 i = 0; i < shares.length; i++) {
            sum += shares[i];
        }
        assertEq(sum, amount);
    }
}
