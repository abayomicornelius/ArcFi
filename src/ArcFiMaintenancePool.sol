// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ArcFiMaintenancePool
/// @notice Recurring, open-ended USDC funding tied to a repo/org rather than
/// one issue. Sponsors can deposit repeatedly; ArcFi's oracle authorizes
/// maintainer draw-downs against off-chain-adjudicated maintenance credit
/// (not tied to any single PR merge, unlike escrow/milestones).
/// @dev `poolId` is an off-chain-assigned identifier for a repo/org (e.g. a
/// hash of `owner/repo`), not tied to any single issue.
contract ArcFiMaintenancePool is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint16 internal constant BPS_DENOMINATOR = 10_000;

    struct Pool {
        uint256 balance;
        uint256 totalDeposited;
        uint256 totalWithdrawn;
        uint64 createdAt;
        uint32 depositCount;
    }

    struct Deposit {
        address sponsor;
        uint256 amount;
        uint64 timestamp;
    }

    IERC20 public immutable usdc;
    address public immutable admin;
    address public immutable treasury;
    uint16 public immutable feeBps;

    mapping(uint256 poolId => Pool) public pools;
    mapping(uint256 poolId => mapping(uint32 index => Deposit)) public deposits;

    event Deposited(uint256 indexed poolId, address indexed sponsor, uint256 amount, uint32 index);
    event Withdrawn(uint256 indexed poolId, address indexed recipient, uint256 amount, uint256 feeAmount);

    error NotAdmin();
    error ZeroAmount();
    error InsufficientBalance();
    error InvalidFeeBps();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor(address _usdc, address _admin, address _treasury, uint16 _feeBps) {
        if (_feeBps > BPS_DENOMINATOR) revert InvalidFeeBps();
        usdc = IERC20(_usdc);
        admin = _admin;
        treasury = _treasury;
        feeBps = _feeBps;
    }

    /// @notice Any sponsor can deposit repeatedly; the pool is created
    /// implicitly on first deposit. Every deposit is recorded so the full
    /// contribution history is queryable.
    function deposit(uint256 poolId, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        Pool storage p = pools[poolId];
        if (p.createdAt == 0) {
            p.createdAt = uint64(block.timestamp);
        }

        uint32 index = p.depositCount;
        deposits[poolId][index] = Deposit({sponsor: msg.sender, amount: amount, timestamp: uint64(block.timestamp)});
        p.depositCount = index + 1;
        p.balance += amount;
        p.totalDeposited += amount;

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(poolId, msg.sender, amount, index);
    }

    /// @notice Admin-authorized maintainer draw-down. Deducts the fee off
    /// the top, same as escrow/milestone payouts; reverts if `amount`
    /// exceeds the pool's current balance.
    function withdraw(uint256 poolId, address recipient, uint256 amount) external nonReentrant onlyAdmin {
        Pool storage p = pools[poolId];
        if (amount == 0) revert ZeroAmount();
        if (amount > p.balance) revert InsufficientBalance();

        uint256 fee = (amount * feeBps) / BPS_DENOMINATOR;
        uint256 payout = amount - fee;

        p.balance -= amount;
        p.totalWithdrawn += amount;

        if (fee > 0) usdc.safeTransfer(treasury, fee);
        usdc.safeTransfer(recipient, payout);

        emit Withdrawn(poolId, recipient, payout, fee);
    }

    function getPool(uint256 poolId) external view returns (Pool memory) {
        return pools[poolId];
    }

    function getDeposit(uint256 poolId, uint32 index) external view returns (Deposit memory) {
        return deposits[poolId][index];
    }
}
