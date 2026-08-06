// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ArcFiMaintenancePool} from "../src/ArcFiMaintenancePool.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";

contract ArcFiMaintenancePoolTest is Test {
    ArcFiMaintenancePool pool;
    MockUSDC usdc;

    address admin = makeAddr("admin");
    address treasury = makeAddr("treasury");
    address sponsorA = makeAddr("sponsorA");
    address sponsorB = makeAddr("sponsorB");
    address maintainer = makeAddr("maintainer");

    uint16 constant FEE_BPS = 500; // 5%

    function setUp() public {
        usdc = new MockUSDC();
        pool = new ArcFiMaintenancePool(address(usdc), admin, treasury, FEE_BPS);

        usdc.mint(sponsorA, 10_000e6);
        usdc.mint(sponsorB, 10_000e6);
        vm.prank(sponsorA);
        usdc.approve(address(pool), type(uint256).max);
        vm.prank(sponsorB);
        usdc.approve(address(pool), type(uint256).max);
    }

    function test_deposit_createsPoolImplicitlyAndAccumulates() public {
        vm.prank(sponsorA);
        pool.deposit(1, 1_000e6);
        vm.prank(sponsorB);
        pool.deposit(1, 2_000e6);

        ArcFiMaintenancePool.Pool memory p = pool.getPool(1);
        assertEq(p.balance, 3_000e6);
        assertEq(p.totalDeposited, 3_000e6);
        assertEq(p.depositCount, 2);

        ArcFiMaintenancePool.Deposit memory d0 = pool.getDeposit(1, 0);
        assertEq(d0.sponsor, sponsorA);
        assertEq(d0.amount, 1_000e6);
    }

    function test_withdraw_deductsFeeAndPaysRecipient() public {
        vm.prank(sponsorA);
        pool.deposit(1, 1_000e6);

        vm.prank(admin);
        pool.withdraw(1, maintainer, 400e6);

        uint256 fee = (uint256(400e6) * FEE_BPS) / 10_000;
        assertEq(usdc.balanceOf(maintainer), 400e6 - fee);
        assertEq(usdc.balanceOf(treasury), fee);
        assertEq(pool.getPool(1).balance, 600e6);
    }

    function test_withdraw_revertsIfExceedsBalance() public {
        vm.prank(sponsorA);
        pool.deposit(1, 100e6);

        vm.prank(admin);
        vm.expectRevert(ArcFiMaintenancePool.InsufficientBalance.selector);
        pool.withdraw(1, maintainer, 101e6);
    }

    function test_withdraw_revertsForNonAdmin() public {
        vm.prank(sponsorA);
        pool.deposit(1, 100e6);

        vm.prank(sponsorA);
        vm.expectRevert(ArcFiMaintenancePool.NotAdmin.selector);
        pool.withdraw(1, maintainer, 50e6);
    }

    function test_poolsAreIndependentByPoolId() public {
        vm.prank(sponsorA);
        pool.deposit(1, 500e6);
        vm.prank(sponsorB);
        pool.deposit(2, 700e6);

        assertEq(pool.getPool(1).balance, 500e6);
        assertEq(pool.getPool(2).balance, 700e6);
    }

    function test_constructor_revertsOnFeeBpsOver10000() public {
        vm.expectRevert(ArcFiMaintenancePool.InvalidFeeBps.selector);
        new ArcFiMaintenancePool(address(usdc), admin, treasury, 10_001);
    }
}
