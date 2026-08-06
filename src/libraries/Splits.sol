// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Splits
/// @notice Basis-point payout splitting shared by ArcFi's escrow, milestone
/// and maintenance-pool contracts. Uses largest-remainder allocation for the
/// rounding dust so `sum(shares) == amount` holds exactly, without
/// systematically favoring whichever recipient happens to be listed last.
library Splits {
    uint16 internal constant BPS_DENOMINATOR = 10_000;

    struct Recipient {
        address account;
        uint16 bps;
    }

    error EmptyRecipients();
    error InvalidSplit();

    /// @notice Splits `amount` across `recipients` pro-rata by `bps`. Reverts
    /// unless `recipients` is non-empty and its `bps` values sum to exactly
    /// 10_000 — a single recipient at 10_000 bps is just the single-payee
    /// case, so escrow and team-bounty payouts share this one code path.
    /// @dev Dust distribution is O(dust * n), but dust is always strictly
    /// less than `recipients.length` (see proof in ArcFi's docs), so this
    /// stays cheap for the small team sizes bounty payouts actually have.
    function allocate(uint256 amount, Recipient[] calldata recipients) internal pure returns (uint256[] memory shares) {
        uint256 n = recipients.length;
        if (n == 0) revert EmptyRecipients();

        shares = new uint256[](n);
        uint256[] memory remainders = new uint256[](n);
        uint256 bpsSum;
        uint256 distributed;

        for (uint256 i = 0; i < n; i++) {
            uint16 bps = recipients[i].bps;
            bpsSum += bps;
            uint256 product = amount * bps;
            shares[i] = product / BPS_DENOMINATOR;
            remainders[i] = product % BPS_DENOMINATOR;
            distributed += shares[i];
        }

        if (bpsSum != BPS_DENOMINATOR) revert InvalidSplit();

        uint256 dust = amount - distributed;
        for (uint256 d = 0; d < dust; d++) {
            uint256 bestIdx = 0;
            uint256 bestRemainder = 0;
            for (uint256 i = 0; i < n; i++) {
                if (remainders[i] > bestRemainder) {
                    bestRemainder = remainders[i];
                    bestIdx = i;
                }
            }
            shares[bestIdx] += 1;
            remainders[bestIdx] = 0;
        }
    }
}
