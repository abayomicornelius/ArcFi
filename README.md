# ArcFi

**Programmable USDC payouts for open-source funding — sponsor a GitHub issue, pay out automatically the moment the fix ships, on [Arc](https://www.circle.com/arc).**

Built for the **Arc DeFi Track** — [Programmable Money Accelerator](https://www.circle.com/arc) hackathon (Aug 2026 cohort).

## Live on Arc testnet

| Contract | Address |
|---|---|
| `ArcFiEscrow` | [`0x635c307d470cB02716a64e343C3472B32d80fdd8`](https://testnet.arcscan.app/address/0x635c307d470cB02716a64e343C3472B32d80fdd8) |
| `ArcFiMilestones` | [`0x426e15F73c43641bA3D19B6bF0fAb6C118294533`](https://testnet.arcscan.app/address/0x426e15F73c43641bA3D19B6bF0fAb6C118294533) |
| `ArcFiMaintenancePool` | [`0x052A8D142Ea4BfDbcC0Cc91488e00300df646b9c`](https://testnet.arcscan.app/address/0x052A8D142Ea4BfDbcC0Cc91488e00300df646b9c) |

USDC on Arc: `0x3600000000000000000000000000000000000000` (unified native gas + ERC-20 interface). Verified end-to-end with a real fund → release cycle on testnet.

## The idea

Open-source maintenance is chronically underfunded, and the funding that does exist is slow: a sponsor wires money to a foundation, a maintainer files paperwork, a contributor waits weeks to get paid for a merged PR.

**ArcFi fixes this natively on Arc**, Circle's stablecoin-native L1 — sponsor funds sit in escrow denominated directly in USDC, and release automatically the moment a linked GitHub PR merges, split by basis points across a team, with an always-open maintenance pool for ongoing repo upkeep. Arc's sub-second settlement means a payout is final by the time a contributor refreshes their wallet. It's a concrete example of "programmable money": funds move only when a specific, verifiable condition (a PR merge, attested to by an oracle) is met, not on a human's schedule.

### Why this fits the DeFi track

| Arc DeFi track ask | What ArcFi does |
|---|---|
| Meaningful use of Arc & USDC | Every contract is denominated in USDC; Arc's USDC-as-gas model means the whole flow — deposit, gas, payout — never leaves the stablecoin |
| Conditional payments | `release` / `releaseIssue` only pay out once the admin/oracle attests a PR merged; refunds are conditional on an explicit deadline |
| Onchain automation | The oracle (ArcFi's backend, watching GitHub webhooks) is the only address authorized to trigger payouts — no manual multisig approval per bounty |
| Multi-step settlement | Milestones reserve a budget once, then release it across many issues over time; maintenance pools accept indefinite recurring deposits and draw-downs |
| Treasury / fintech infrastructure | A protocol fee (basis points) is swept to a treasury address on every payout, in the same transaction as the recipient payout — no separate sweep step to forget |

## Architecture

Three independent contracts, one per funding lifecycle, rather than one bloated contract: an escrow is single-issue/single-payout/deadline-bound, a milestone is a lump sum sliced across a release, and a maintenance pool is open-ended and never "finishes."

```
src/
├── ArcFiEscrow.sol           single-issue bounty escrow
├── ArcFiMilestones.sol       lump-sum budget allocated across many issues
├── ArcFiMaintenancePool.sol  recurring, open-ended repo/org funding
├── libraries/
│   └── Splits.sol            shared basis-point payout splitting (largest-remainder, no stranded dust)
└── mocks/
    └── MockUSDC.sol          6-decimal ERC20 stand-in for local tests
```

### `ArcFiEscrow` — single-issue bounty

1. `fund(issueId, amount, deadline)` — sponsor deposits USDC for a specific issue. One escrow per issue; a second `fund` call reverts rather than silently topping it up, so terms can't change after the fact.
2. `release(issueId, recipients)` — oracle-only, called once the linked PR merges. `recipients` is a list of `(address, bps)` pairs that must sum to exactly 10,000 bps (a single recipient at 10,000 bps covers the solo-payee case). The protocol fee is deducted first, then the remainder is split pro-rata with no rounding dust left behind.
3. `refund(issueId)` — the oracle can force a refund any time (issue cancelled); **anyone** can trigger it once `deadline` passes. It always pays the original sponsor, never the caller, so this permissionless path removes the backend as a liveness dependency without opening a theft vector.
4. `extendDeadline(issueId, newDeadline)` — only the sponsor, and only forward in time.

### `ArcFiMilestones` — release-scoped budget

1. `createMilestone(milestoneId, totalBudget)` — sponsor deposits once.
2. `allocate(milestoneId, issueId, amount)` — oracle reserves a slice of the remaining budget for a specific issue as scope is agreed.
3. `releaseIssue(milestoneId, issueId, recipients)` — same split/fee mechanics as escrow, drawing from the issue's pre-reserved allocation.
4. `cancelMilestone(milestoneId)` — refunds whatever was never allocated back to the sponsor; already-released issues are untouched.

### `ArcFiMaintenancePool` — ongoing repo funding

1. `deposit(poolId, amount)` — any sponsor, any time, repeatedly. The pool is created implicitly on first deposit; every deposit is recorded so the full contribution history is queryable on-chain.
2. `withdraw(poolId, recipient, amount)` — oracle-authorized maintainer draw-down for completed maintenance work. Not tied to a specific PR the way escrow/milestones are — this is "maintenance credit" adjudicated off-chain by the backend.

### Security model

- **Oracle authorization is immutable at deploy time.** `admin`, `treasury`, and `feeBps` are constructor arguments, not set via a separate `initialize()` call. This closes the admin-front-running race that the original Soroban design had to document a mitigation for — on Arc, deployment and configuration happen atomically.
- **Sponsor funds can only be moved out by the sponsor's own action or the oracle's payout/refund logic** — never moved *in* without the sponsor's transaction.
- **Every payout path is idempotent.** Escrows and milestone-issues carry an explicit status (`Funded → Paid | Refunded`, `Allocated → Released`); double-release and double-refund both revert, so a backend retry after a dropped transaction is always safe to resend.
- **No stranded dust.** `Splits.allocate` uses largest-remainder rounding so `sum(shares) == amount` exactly, regardless of how many recipients split a bounty.
- **Reentrancy-guarded, checks-effects-interactions throughout**, using OpenZeppelin's `SafeERC20` and `ReentrancyGuard`.

## Arc network

| | |
|---|---|
| Chain ID | `5042002` (testnet) |
| RPC | `https://rpc.testnet.arc.io` |
| Explorer | `https://testnet.arcscan.app` |
| Gas / native currency | USDC |

## Getting started

```shell
forge install               # pull forge-std + OpenZeppelin
forge build
forge test -vv
```

### Deploy to Arc testnet

```shell
export PRIVATE_KEY=0x...
export USDC_ADDRESS=0x3600000000000000000000000000000000000000  # unified native/ERC-20 USDC on Arc
export ADMIN_ADDRESS=0x...      # ArcFi backend oracle address
export TREASURY_ADDRESS=0x...
export FEE_BPS=250              # optional, defaults to 250 (2.5%)

forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast
```

Get testnet USDC (used for both gas and deposits) from the [Circle faucet](https://faucet.circle.com/). `--verify` needs an `ARCSCAN_API_KEY`; omit it if you don't have one — deployment works either way.

## Frontend

`frontend/` is a full Next.js site, not just a contract dashboard:

- **Marketing home** (`/`) — the pitch, live protocol stats, and how-it-works.
- **App** (`/app`) — connect a wallet, fund an escrow, allocate/release milestones, deposit into or draw down a maintenance pool. A live activity feed watches all three contracts' events in real time. No WalletConnect account needed; it connects directly to an injected wallet (MetaMask etc.).
- **Profiles** — sign in with GitHub (`/onboarding`) to register as a **sponsor**, **maintainer**, and/or **contributor**, write a bio, and link a wallet. Profiles are backed by a real database (Prisma + SQLite locally), not mocked.
- **Directories** (`/sponsors`, `/maintainers`, `/contributors`) — public listings that merge registered profiles with on-chain USDC funded/received totals computed by scanning contract events. `/profile/[address]` is the per-wallet detail page.

### Local setup

The app ships pointed at a **local Anvil chain with a mock USDC** by default, so the contract flow — including a one-click "mint test USDC" faucet — is demoable with zero external dependencies:

```shell
# 1. In one terminal: start a local chain
anvil

# 2. In another: deploy the contract suite + a MockUSDC against it
forge script script/DeployLocal.s.sol --rpc-url http://127.0.0.1:8545 --broadcast

# 3. Set up the frontend
cd frontend
cp .env.example .env.local   # fill in the logged addresses from step 2
npm install                  # also runs `prisma generate`
npm run db:migrate           # creates the local SQLite profiles database
npm run dev
```

To point it at Arc testnet instead, deploy with `script/Deploy.s.sol` (see above), set `NEXT_PUBLIC_CHAIN=arc` plus the resulting addresses in `frontend/.env.local`, and connect a wallet funded with real Arc-testnet USDC — the faucet button only appears on the local chain, since it depends on MockUSDC's open `mint`.

### GitHub sign-in

Profiles require a GitHub OAuth App (this one manual step can't be scripted — GitHub requires it be created through their UI):

1. [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**.
2. Homepage URL: `http://localhost:3000`. Callback URL: `http://localhost:3000/api/auth/callback/github`.
3. Copy the Client ID, generate a Client Secret, and set `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` in `frontend/.env.local`.
4. Set `AUTH_SECRET` to a random value (`openssl rand -base64 32`) and `AUTH_URL` to your app's URL.

Everything else — the app, directories, and profile pages — works without this; only "Connect GitHub" requires it. Until it's configured, the button shows a clear toast explaining why instead of failing silently.

## Backend / Oracle (`backend/`)

A standalone service that closes the loop: it watches GitHub for merged PRs
and releases the linked bounty on-chain automatically, with no human in the
middle. `withdraw` (maintenance pool) stays a manual, oracle-signed action —
by contract design that's an off-chain-adjudicated maintainer draw-down, not
tied to a single PR the way escrow/milestone payouts are.

1. On the frontend, funding an escrow (`EscrowPanel`) or allocating a
   milestone issue (`MilestonesPanel`) now has optional GitHub
   owner/repo/issue# fields. Filling them in (requires GitHub sign-in)
   registers the on-chain issue against a real GitHub issue via
   `POST /api/bounties/register`.
2. `backend/` receives GitHub's `pull_request` webhook, verifies its HMAC
   signature, and — once a PR is merged and its body closes a registered
   issue (`closes #12`, `fixes #7`, ...) — resolves the PR author's linked
   wallet and calls `release`/`releaseIssue` with the oracle's key. It talks
   to the frontend's `/api/internal/*` routes (shared-secret auth) rather
   than touching the database directly, so Prisma access stays in one place.
3. Idempotent by design: a redelivered or duplicate webhook finds the
   bounty already marked `released` and skips it; even if it didn't, the
   contracts themselves revert cleanly on double-release.

Setup:

```shell
cd backend
cp .env.example .env   # fill in ADMIN_PRIVATE_KEY, contract addresses, a
                        # generated GITHUB_WEBHOOK_SECRET, and
                        # INTERNAL_API_SECRET (must match frontend/.env.local)
npm install
npm test                # unit tests for signature verification + PR parsing
npm run dev
```

Then add a webhook at `github.com/<owner>/<repo>/settings/hooks` — Payload
URL: this server's publicly reachable `/webhooks/github` (use `ngrok` or
similar for local testing), content type `application/json`, secret matching
`GITHUB_WEBHOOK_SECRET`, events: **Pull requests**.

Verified end-to-end against a local Anvil deployment: funded an escrow,
POSTed a synthetic (correctly-signed) merged-PR payload straight at the
backend, and confirmed the release transaction executed on-chain, USDC
landed in the contributor's wallet net of the protocol fee, and the bounty
record flipped to `released` — with a redelivered copy of the same webhook
correctly treated as a no-op afterward.

## Known limitations

- **Single EOA for deployer/admin/treasury.** The address that deployed the
  contracts is also the oracle authority and the fee recipient. Fine for a
  hackathon demo; before any real funds depend on this, split these roles
  (ideally the oracle key lives only in `backend/`'s environment, not a
  personal wallet) and consider a multisig for `admin`/`treasury`.
- **Single-recipient auto-resolution.** The oracle pays the merged PR's
  author 100% of a bounty. Team splits are still possible, just not
  auto-detected — use the manual release path in `/app` for those.

## Roadmap

- [x] Checkpoint 1 — project + idea (this repo)
- [x] Checkpoint 2 — contracts + a full sponsor/maintainer/contributor site (`frontend/`) with GitHub-backed profiles, demoable end-to-end against a local chain
- [x] Deployed live on Arc testnet — see [Live on Arc testnet](#live-on-arc-testnet) above; verified with a real fund → release cycle
- [x] Checkpoint 3 — GitHub-webhook oracle backend (`backend/`) wired to `release`/`releaseIssue`, verified end-to-end against a local deployment. Remaining: App Kit **Send** for sponsor deposits, demo video + deck
- [ ] Post-hackathon — CCTP-based cross-chain funding (sponsor on Ethereum/Base, payout settles on Arc), Circle Wallets for contributor onboarding without a prior wallet

---

<details>
<summary>Foundry tooling reference</summary>

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

- **Forge**: testing framework
- **Cast**: CLI for interacting with EVM chains
- **Anvil**: local Ethereum node
- **Chisel**: Solidity REPL

Docs: https://book.getfoundry.sh/

</details>
