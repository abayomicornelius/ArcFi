// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ArcFiEscrow} from "../src/ArcFiEscrow.sol";
import {Splits} from "../src/libraries/Splits.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";

contract ArcFiEscrowTest is Test {
    ArcFiEscrow escrow;
    MockUSDC usdc;

    address admin = makeAddr("admin");
    address treasury = makeAddr("treasury");
    address sponsor = makeAddr("sponsor");
    address contributor = makeAddr("contributor");
    address stranger = makeAddr("stranger");

    uint16 constant FEE_BPS = 250; // 2.5%
    uint256 constant AMOUNT = 1_000e6; // 1,000 USDC

    function setUp() public {
        usdc = new MockUSDC();
        escrow = new ArcFiEscrow(address(usdc), admin, treasury, FEE_BPS);

        usdc.mint(sponsor, 1_000_000e6);
        vm.prank(sponsor);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function _recipients(address account) internal pure returns (Splits.Recipient[] memory r) {
        r = new Splits.Recipient[](1);
        r[0] = Splits.Recipient({account: account, bps: 10_000});
    }

    function test_fund_transfersUSDCAndRecordsEscrow() public {
        vm.prank(sponsor);
        escrow.fund(1, AMOUNT, uint64(block.timestamp + 7 days));

        ArcFiEscrow.Escrow memory e = escrow.getEscrow(1);
        assertEq(e.sponsor, sponsor);
        assertEq(e.amount, AMOUNT);
        assertEq(uint8(e.status), uint8(ArcFiEscrow.Status.Funded));
        assertEq(usdc.balanceOf(address(escrow)), AMOUNT);
    }

    function test_fund_revertsOnDoubleFund() public {
        vm.startPrank(sponsor);
        escrow.fund(1, AMOUNT, uint64(block.timestamp + 7 days));
        vm.expectRevert(ArcFiEscrow.AlreadyFunded.selector);
        escrow.fund(1, AMOUNT, uint64(block.timestamp + 7 days));
        vm.stopPrank();
    }

    function test_release_paysContributorMinusFee() public {
        vm.prank(sponsor);
        escrow.fund(1, AMOUNT, uint64(block.timestamp + 7 days));

        vm.prank(admin);
        escrow.release(1, _recipients(contributor));

        uint256 expectedFee = (AMOUNT * FEE_BPS) / 10_000;
        assertEq(usdc.balanceOf(treasury), expectedFee);
        assertEq(usdc.balanceOf(contributor), AMOUNT - expectedFee);
        assertEq(uint8(escrow.getEscrow(1).status), uint8(ArcFiEscrow.Status.Paid));
    }

    function test_release_splitsTeamBountyWithoutStrandedDust() public {
        vm.prank(sponsor);
        escrow.fund(1, 100e6, uint64(block.timestamp + 7 days));

        address alice = makeAddr("alice");
        address bob = makeAddr("bob");
        address carol = makeAddr("carol");

        Splits.Recipient[] memory recipients = new Splits.Recipient[](3);
        recipients[0] = Splits.Recipient({account: alice, bps: 3334});
        recipients[1] = Splits.Recipient({account: bob, bps: 3333});
        recipients[2] = Splits.Recipient({account: carol, bps: 3333});

        vm.prank(admin);
        escrow.release(1, recipients);

        uint256 fee = (uint256(100e6) * FEE_BPS) / 10_000;
        uint256 distributable = 100e6 - fee;
        uint256 sum = usdc.balanceOf(alice) + usdc.balanceOf(bob) + usdc.balanceOf(carol);
        assertEq(sum, distributable, "no dust should be stranded");
    }

    function test_release_revertsIfSplitDoesNotSumTo10000() public {
        vm.prank(sponsor);
        escrow.fund(1, AMOUNT, uint64(block.timestamp + 7 days));

        Splits.Recipient[] memory recipients = new Splits.Recipient[](1);
        recipients[0] = Splits.Recipient({account: contributor, bps: 9_000});

        vm.prank(admin);
        vm.expectRevert(Splits.InvalidSplit.selector);
        escrow.release(1, recipients);
    }

    function test_release_revertsForNonAdmin() public {
        vm.prank(sponsor);
        escrow.fund(1, AMOUNT, uint64(block.timestamp + 7 days));

        vm.prank(stranger);
        vm.expectRevert(ArcFiEscrow.NotAdmin.selector);
        escrow.release(1, _recipients(contributor));
    }

    function test_release_revertsOnDoubleRelease() public {
        vm.prank(sponsor);
        escrow.fund(1, AMOUNT, uint64(block.timestamp + 7 days));

        vm.startPrank(admin);
        escrow.release(1, _recipients(contributor));
        vm.expectRevert(ArcFiEscrow.AlreadyPaid.selector);
        escrow.release(1, _recipients(contributor));
        vm.stopPrank();
    }

    function test_refund_adminCanForceBeforeDeadline() public {
        vm.prank(sponsor);
        escrow.fund(1, AMOUNT, uint64(block.timestamp + 7 days));

        vm.prank(admin);
        escrow.refund(1);

        assertEq(usdc.balanceOf(sponsor), 1_000_000e6);
        assertEq(uint8(escrow.getEscrow(1).status), uint8(ArcFiEscrow.Status.Refunded));
    }

    function test_refund_strangerCannotRefundBeforeDeadline() public {
        vm.prank(sponsor);
        escrow.fund(1, AMOUNT, uint64(block.timestamp + 7 days));

        vm.prank(stranger);
        vm.expectRevert(ArcFiEscrow.DeadlineNotPassed.selector);
        escrow.refund(1);
    }

    function test_refund_anyoneCanRefundAfterDeadline_paysOriginalSponsor() public {
        vm.prank(sponsor);
        escrow.fund(1, AMOUNT, uint64(block.timestamp + 1 days));

        vm.warp(block.timestamp + 2 days);

        vm.prank(stranger);
        escrow.refund(1);

        assertEq(usdc.balanceOf(sponsor), 1_000_000e6, "sponsor gets funds back, not the caller");
        assertEq(usdc.balanceOf(stranger), 0);
    }

    function test_extendDeadline_onlySponsorCanExtendForward() public {
        vm.prank(sponsor);
        escrow.fund(1, AMOUNT, uint64(block.timestamp + 1 days));

        vm.prank(stranger);
        vm.expectRevert(ArcFiEscrow.NotSponsor.selector);
        escrow.extendDeadline(1, uint64(block.timestamp + 2 days));

        vm.prank(sponsor);
        vm.expectRevert(ArcFiEscrow.DeadlineNotLater.selector);
        escrow.extendDeadline(1, uint64(block.timestamp));

        vm.prank(sponsor);
        escrow.extendDeadline(1, uint64(block.timestamp + 10 days));
        assertEq(escrow.getEscrow(1).deadline, uint64(block.timestamp + 10 days));
    }

    function testFuzz_release_neverStrandsDust(uint256 amount, uint16 bpsA) public {
        amount = bound(amount, 3, 1_000_000e6);
        bpsA = uint16(bound(bpsA, 1, 9_998));
        uint16 bpsB = 10_000 - bpsA;

        vm.prank(sponsor);
        usdc.mint(sponsor, amount);
        vm.prank(sponsor);
        escrow.fund(1, amount, uint64(block.timestamp + 7 days));

        address alice = makeAddr("fuzzAlice");
        address bob = makeAddr("fuzzBob");
        Splits.Recipient[] memory recipients = new Splits.Recipient[](2);
        recipients[0] = Splits.Recipient({account: alice, bps: bpsA});
        recipients[1] = Splits.Recipient({account: bob, bps: bpsB});

        vm.prank(admin);
        escrow.release(1, recipients);

        uint256 fee = (amount * FEE_BPS) / 10_000;
        assertEq(usdc.balanceOf(alice) + usdc.balanceOf(bob) + usdc.balanceOf(treasury), amount - fee + fee);
        assertEq(usdc.balanceOf(alice) + usdc.balanceOf(bob), amount - fee);
    }
}
