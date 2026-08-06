// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ArcFiEscrow} from "../src/ArcFiEscrow.sol";
import {ArcFiMilestones} from "../src/ArcFiMilestones.sol";
import {ArcFiMaintenancePool} from "../src/ArcFiMaintenancePool.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";

/// @notice Local/Anvil-only convenience deploy: spins up a MockUSDC and mints
/// the deployer + admin a starting balance, then deploys the ArcFi suite
/// against it. Never use this against a real network — use Deploy.s.sol with
/// a real USDC address instead.
///
/// Usage: forge script script/DeployLocal.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
contract DeployLocal is Script {
    function run() external {
        uint256 deployerKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(deployerKey);
        address admin = vm.envOr("ADMIN_ADDRESS", deployer);
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);
        uint16 feeBps = uint16(vm.envOr("FEE_BPS", uint256(250)));

        vm.startBroadcast(deployerKey);

        MockUSDC usdc = new MockUSDC();
        usdc.mint(deployer, 1_000_000e6);

        ArcFiEscrow escrow = new ArcFiEscrow(address(usdc), admin, treasury, feeBps);
        ArcFiMilestones milestones = new ArcFiMilestones(address(usdc), admin, treasury, feeBps);
        ArcFiMaintenancePool maintenancePool = new ArcFiMaintenancePool(address(usdc), admin, treasury, feeBps);

        vm.stopBroadcast();

        console.log("MockUSDC:             ", address(usdc));
        console.log("ArcFiEscrow:          ", address(escrow));
        console.log("ArcFiMilestones:      ", address(milestones));
        console.log("ArcFiMaintenancePool: ", address(maintenancePool));
    }
}
