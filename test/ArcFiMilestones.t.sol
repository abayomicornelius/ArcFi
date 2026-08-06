// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ArcFiMilestones} from "../src/ArcFiMilestones.sol";
import {Splits} from "../src/libraries/Splits.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";

contract ArcFiMilestonesTest is Test {
    ArcFiMilestones milestones;
    MockUSDC usdc;

    address admin = makeAddr("admin");
    address treasury = makeAddr("treasury");
    address sponsor = makeAddr("sponsor");
    address contributor = makeAddr("contributor");

    uint16 constant FEE_BPS = 250;
    uint256 constant BUDGET = 10_000e6;

    function setUp() public {
        usdc = new MockUSDC();
        milestones = new ArcFiMilestones(address(usdc), admin, treasury, FEE_BPS);

        usdc.mint(sponsor, BUDGET);
        vm.prank(sponsor);
        usdc.approve(address(milestones), type(uint256).max);

        vm.prank(sponsor);
        milestones.createMilestone(1, BUDGET);
    }

    function _soleRecipient(address account) internal pure returns (Splits.Recipient[] memory r) {
        r = new Splits.Recipient[](1);
        r[0] = Splits.Recipient({account: account, bps: 10_000});
    }

    function test_createMilestone_pullsFullBudgetUpfront() public view {
        assertEq(usdc.balanceOf(address(milestones)), BUDGET);
        ArcFiMilestones.Milestone memory m = milestones.getMilestone(1);
        assertEq(m.totalBudget, BUDGET);
        assertEq(m.remainingBudget, BUDGET);
    }

    function test_allocate_reservesFromRemainingBudget() public {
        vm.prank(admin);
        milestones.allocate(1, 100, 2_000e6);

        assertEq(milestones.getMilestone(1).remainingBudget, BUDGET - 2_000e6);
        assertEq(uint8(milestones.getIssueStatus(1, 100)), uint8(ArcFiMilestones.IssueStatus.Allocated));
    }

    function test_allocate_revertsOnOverAllocation() public {
        vm.prank(admin);
        vm.expectRevert(ArcFiMilestones.OverAllocation.selector);
        milestones.allocate(1, 100, BUDGET + 1);
    }

    function test_allocate_revertsOnDoubleAllocate() public {
        vm.startPrank(admin);
        milestones.allocate(1, 100, 1_000e6);
        vm.expectRevert(ArcFiMilestones.IssueAlreadyAllocated.selector);
        milestones.allocate(1, 100, 1_000e6);
        vm.stopPrank();
    }

    function test_releaseIssue_paysFromAllocationMinusFee() public {
        vm.startPrank(admin);
        milestones.allocate(1, 100, 2_000e6);
        milestones.releaseIssue(1, 100, _soleRecipient(contributor));
        vm.stopPrank();

        uint256 fee = (uint256(2_000e6) * FEE_BPS) / 10_000;
        assertEq(usdc.balanceOf(contributor), 2_000e6 - fee);
        assertEq(usdc.balanceOf(treasury), fee);
        assertEq(uint8(milestones.getIssueStatus(1, 100)), uint8(ArcFiMilestones.IssueStatus.Released));
    }

    function test_releaseIssue_revertsIfNotAllocated() public {
        vm.prank(admin);
        vm.expectRevert(ArcFiMilestones.IssueNotAllocated.selector);
        milestones.releaseIssue(1, 999, _soleRecipient(contributor));
    }

    function test_releaseIssue_revertsOnDoubleRelease() public {
        vm.startPrank(admin);
        milestones.allocate(1, 100, 1_000e6);
        milestones.releaseIssue(1, 100, _soleRecipient(contributor));
        vm.expectRevert(ArcFiMilestones.IssueAlreadyReleased.selector);
        milestones.releaseIssue(1, 100, _soleRecipient(contributor));
        vm.stopPrank();
    }

    function test_cancelMilestone_refundsOnlyUnallocatedRemainder() public {
        vm.startPrank(admin);
        milestones.allocate(1, 100, 3_000e6);
        milestones.releaseIssue(1, 100, _soleRecipient(contributor));
        milestones.cancelMilestone(1);
        vm.stopPrank();

        assertEq(usdc.balanceOf(sponsor), BUDGET - 3_000e6, "only the unallocated remainder returns to sponsor");
        assertTrue(milestones.getMilestone(1).closed);
    }

    function test_cancelMilestone_doesNotClawBackReleasedFunds() public {
        vm.startPrank(admin);
        milestones.allocate(1, 100, 1_000e6);
        milestones.releaseIssue(1, 100, _soleRecipient(contributor));
        vm.stopPrank();

        uint256 contributorBalanceBefore = usdc.balanceOf(contributor);

        vm.prank(admin);
        milestones.cancelMilestone(1);

        assertEq(usdc.balanceOf(contributor), contributorBalanceBefore, "released funds are untouched by cancel");
    }

    function test_constructor_revertsOnFeeBpsOver10000() public {
        vm.expectRevert(ArcFiMilestones.InvalidFeeBps.selector);
        new ArcFiMilestones(address(usdc), admin, treasury, 10_001);
    }
}
