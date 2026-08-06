// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ArcFiEscrow} from "../src/ArcFiEscrow.sol";
import {ArcFiMilestones} from "../src/ArcFiMilestones.sol";
import {ArcFiMaintenancePool} from "../src/ArcFiMaintenancePool.sol";

/// @notice Deploys the ArcFi contract suite.
///
/// Required env vars:
///   PRIVATE_KEY   deployer key (becomes tx signer; pay gas in USDC on Arc)
///   USDC_ADDRESS  USDC token contract address on the target network
///   ADMIN_ADDRESS ArcFi backend oracle address (release/allocate/withdraw authority)
///   TREASURY_ADDRESS  protocol fee recipient
/// Optional:
///   FEE_BPS       protocol fee in basis points (default 250 = 2.5%)
///
/// Usage:
///   forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast --verify
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address usdc = vm.envAddress("USDC_ADDRESS");
        address admin = vm.envAddress("ADMIN_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        uint16 feeBps = uint16(vm.envOr("FEE_BPS", uint256(250)));

        vm.startBroadcast(deployerKey);

        ArcFiEscrow escrow = new ArcFiEscrow(usdc, admin, treasury, feeBps);
        ArcFiMilestones milestones = new ArcFiMilestones(usdc, admin, treasury, feeBps);
        ArcFiMaintenancePool maintenancePool = new ArcFiMaintenancePool(usdc, admin, treasury, feeBps);

        vm.stopBroadcast();

        console.log("ArcFiEscrow:          ", address(escrow));
        console.log("ArcFiMilestones:      ", address(milestones));
        console.log("ArcFiMaintenancePool: ", address(maintenancePool));
    }
}
