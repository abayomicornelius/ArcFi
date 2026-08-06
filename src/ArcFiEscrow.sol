// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Splits} from "./libraries/Splits.sol";

/// @title ArcFiEscrow
/// @notice Single-issue USDC bounty escrow. A sponsor funds a GitHub issue;
/// ArcFi's off-chain oracle (watching GitHub webhooks for the linked PR
/// merging) releases the funds to the contributor(s), split by basis points
/// for team bounties, minus a protocol fee to the treasury.
/// @dev `admin`/`treasury`/`feeBps` are set once in the constructor rather
/// than via a separate `initialize` call, so there's no window between
/// deployment and configuration for an admin-front-running race.
contract ArcFiEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status {
        None,
        Funded,
        Paid,
        Refunded
    }

    struct Escrow {
        address sponsor;
        uint256 amount;
        Status status;
        uint64 createdAt;
        uint64 deadline;
    }

    IERC20 public immutable usdc;
    address public immutable admin;
    address public immutable treasury;
    uint16 public immutable feeBps;

    mapping(uint256 issueId => Escrow) public escrows;

    event Funded(uint256 indexed issueId, address indexed sponsor, uint256 amount, uint64 deadline);
    event Released(uint256 indexed issueId, uint256 feeAmount, address[] recipients, uint256[] amounts);
    event Refunded(uint256 indexed issueId, address indexed sponsor, uint256 amount);
    event DeadlineExtended(uint256 indexed issueId, uint64 newDeadline);

    error NotAdmin();
    error NotSponsor();
    error AlreadyFunded();
    error NotFunded();
    error AlreadyPaid();
    error AlreadyRefunded();
    error DeadlineNotPassed();
    error DeadlineNotLater();
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

    /// @notice Funds a bounty for `issueId`. One escrow per issue — a second
    /// `fund` call on an already-funded id reverts rather than topping it up,
    /// so an issue's terms can't change after the fact.
    function fund(uint256 issueId, uint256 amount, uint64 deadline) external nonReentrant {
        if (escrows[issueId].status != Status.None) revert AlreadyFunded();
        if (amount == 0) revert ZeroAmount();

        escrows[issueId] = Escrow({
            sponsor: msg.sender,
            amount: amount,
            status: Status.Funded,
            createdAt: uint64(block.timestamp),
            deadline: deadline
        });

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        emit Funded(issueId, msg.sender, amount, deadline);
    }

    /// @notice Admin-only payout once the linked PR is merged. `recipients`
    /// bps must sum to exactly 10_000 — a single recipient at 10_000 bps
    /// covers the solo-payee case; anything else reverts before funds move.
    function release(uint256 issueId, Splits.Recipient[] calldata recipients) external nonReentrant onlyAdmin {
        Escrow storage e = escrows[issueId];
        if (e.status == Status.None) revert NotFunded();
        if (e.status == Status.Paid) revert AlreadyPaid();
        if (e.status == Status.Refunded) revert AlreadyRefunded();

        uint256 amount = e.amount;
        e.status = Status.Paid;

        uint256 fee = (amount * feeBps) / Splits.BPS_DENOMINATOR;
        uint256[] memory shares = Splits.allocate(amount - fee, recipients);

        if (fee > 0) usdc.safeTransfer(treasury, fee);

        address[] memory accounts = new address[](recipients.length);
        for (uint256 i = 0; i < recipients.length; i++) {
            accounts[i] = recipients[i].account;
            if (shares[i] > 0) usdc.safeTransfer(recipients[i].account, shares[i]);
        }

        emit Released(issueId, fee, accounts, shares);
    }

    /// @notice Admin can force-refund at any time (e.g. issue cancelled).
    /// After `deadline`, anyone can trigger it — it always pays the original
    /// sponsor, never the caller, so the permissionless path removes the
    /// admin as a liveness dependency without creating a theft vector.
    function refund(uint256 issueId) external nonReentrant {
        Escrow storage e = escrows[issueId];
        if (e.status == Status.None) revert NotFunded();
        if (e.status == Status.Paid) revert AlreadyPaid();
        if (e.status == Status.Refunded) revert AlreadyRefunded();
        if (msg.sender != admin && block.timestamp < e.deadline) revert DeadlineNotPassed();

        uint256 amount = e.amount;
        address sponsor = e.sponsor;
        e.status = Status.Refunded;

        usdc.safeTransfer(sponsor, amount);
        emit Refunded(issueId, sponsor, amount);
    }

    /// @notice Sponsor pushes their own deadline later (never earlier) if
    /// they want more time before the permissionless refund path opens.
    function extendDeadline(uint256 issueId, uint64 newDeadline) external {
        Escrow storage e = escrows[issueId];
        if (e.status == Status.None) revert NotFunded();
        if (msg.sender != e.sponsor) revert NotSponsor();
        if (e.status == Status.Paid) revert AlreadyPaid();
        if (e.status == Status.Refunded) revert AlreadyRefunded();
        if (newDeadline <= e.deadline || newDeadline <= block.timestamp) revert DeadlineNotLater();

        e.deadline = newDeadline;
        emit DeadlineExtended(issueId, newDeadline);
    }

    function getEscrow(uint256 issueId) external view returns (Escrow memory) {
        return escrows[issueId];
    }
}
