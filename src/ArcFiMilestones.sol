// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Splits} from "./libraries/Splits.sol";

/// @title ArcFiMilestones
/// @notice Lump-sum USDC budget shared across the issues in a release. A
/// sponsor deposits a `totalBudget` once; ArcFi's oracle carves off
/// per-issue allocations as scope is agreed, and releases each allocation
/// as its PR merges — multi-step settlement against a single upfront
/// deposit instead of a fresh escrow per issue.
/// @dev Ported from MergeFi's Soroban `mergefi-milestones` contract onto Arc.
contract ArcFiMilestones is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum IssueStatus {
        None,
        Allocated,
        Released
    }

    struct Milestone {
        address sponsor;
        uint256 totalBudget;
        uint256 remainingBudget;
        uint64 createdAt;
        bool closed;
    }

    IERC20 public immutable usdc;
    address public immutable admin;
    address public immutable treasury;
    uint16 public immutable feeBps;

    mapping(uint256 milestoneId => Milestone) public milestones;
    mapping(uint256 milestoneId => mapping(uint256 issueId => uint256 amount)) public allocations;
    mapping(uint256 milestoneId => mapping(uint256 issueId => IssueStatus status)) public issueStatus;

    event MilestoneCreated(uint256 indexed milestoneId, address indexed sponsor, uint256 totalBudget);
    event Allocated(uint256 indexed milestoneId, uint256 indexed issueId, uint256 amount);
    event IssueReleased(
        uint256 indexed milestoneId, uint256 indexed issueId, uint256 feeAmount, address[] recipients, uint256[] amounts
    );
    event MilestoneCancelled(uint256 indexed milestoneId, uint256 refundedAmount);

    error NotAdmin();
    error AlreadyExists();
    error NotFound();
    error OverAllocation();
    error IssueAlreadyAllocated();
    error IssueNotAllocated();
    error IssueAlreadyReleased();
    error MilestoneClosed();
    error InvalidFeeBps();
    error ZeroAmount();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor(address _usdc, address _admin, address _treasury, uint16 _feeBps) {
        if (_feeBps > Splits.BPS_DENOMINATOR) revert InvalidFeeBps();
        usdc = IERC20(_usdc);
        admin = _admin;
        treasury = _treasury;
        feeBps = _feeBps;
    }

    /// @notice Sponsor deposits `totalBudget` once; the pool starts fully
    /// unallocated.
    function createMilestone(uint256 milestoneId, uint256 totalBudget) external nonReentrant {
        if (milestones[milestoneId].sponsor != address(0)) revert AlreadyExists();
        if (totalBudget == 0) revert ZeroAmount();

        milestones[milestoneId] = Milestone({
            sponsor: msg.sender,
            totalBudget: totalBudget,
            remainingBudget: totalBudget,
            createdAt: uint64(block.timestamp),
            closed: false
        });

        usdc.safeTransferFrom(msg.sender, address(this), totalBudget);
        emit MilestoneCreated(milestoneId, msg.sender, totalBudget);
    }

    /// @notice Admin reserves a slice of `remainingBudget` for `issueId`.
    /// Over-allocating past what's left, or allocating an issue twice,
    /// reverts.
    function allocate(uint256 milestoneId, uint256 issueId, uint256 amount) external onlyAdmin {
        Milestone storage m = milestones[milestoneId];
        if (m.sponsor == address(0)) revert NotFound();
        if (m.closed) revert MilestoneClosed();
        if (issueStatus[milestoneId][issueId] != IssueStatus.None) revert IssueAlreadyAllocated();
        if (amount > m.remainingBudget) revert OverAllocation();

        m.remainingBudget -= amount;
        allocations[milestoneId][issueId] = amount;
        issueStatus[milestoneId][issueId] = IssueStatus.Allocated;

        emit Allocated(milestoneId, issueId, amount);
    }

    /// @notice Same split/fee mechanics as `ArcFiEscrow.release`, but draws
    /// from the issue's pre-reserved allocation rather than a fresh deposit.
    function releaseIssue(uint256 milestoneId, uint256 issueId, Splits.Recipient[] calldata recipients)
        external
        nonReentrant
        onlyAdmin
    {
        Milestone storage m = milestones[milestoneId];
        if (m.sponsor == address(0)) revert NotFound();

        IssueStatus status = issueStatus[milestoneId][issueId];
        if (status == IssueStatus.Released) revert IssueAlreadyReleased();
        if (status != IssueStatus.Allocated) revert IssueNotAllocated();

        issueStatus[milestoneId][issueId] = IssueStatus.Released;
        uint256 amount = allocations[milestoneId][issueId];

        uint256 fee = (amount * feeBps) / Splits.BPS_DENOMINATOR;
        uint256[] memory shares = Splits.allocate(amount - fee, recipients);

        if (fee > 0) usdc.safeTransfer(treasury, fee);

        address[] memory accounts = new address[](recipients.length);
        for (uint256 i = 0; i < recipients.length; i++) {
            accounts[i] = recipients[i].account;
            if (shares[i] > 0) usdc.safeTransfer(recipients[i].account, shares[i]);
        }

        emit IssueReleased(milestoneId, issueId, fee, accounts, shares);
    }

    /// @notice Refunds whatever is left in `remainingBudget` (never
    /// allocated) back to the sponsor and closes the milestone.
    /// Already-released issues are unaffected — their funds already left.
    function cancelMilestone(uint256 milestoneId) external nonReentrant onlyAdmin {
        Milestone storage m = milestones[milestoneId];
        if (m.sponsor == address(0)) revert NotFound();
        if (m.closed) revert MilestoneClosed();

        m.closed = true;
        uint256 refundAmount = m.remainingBudget;
        m.remainingBudget = 0;

        if (refundAmount > 0) usdc.safeTransfer(m.sponsor, refundAmount);
        emit MilestoneCancelled(milestoneId, refundAmount);
    }

    function getMilestone(uint256 milestoneId) external view returns (Milestone memory) {
        return milestones[milestoneId];
    }

    function getIssueStatus(uint256 milestoneId, uint256 issueId) external view returns (IssueStatus) {
        return issueStatus[milestoneId][issueId];
    }
}
