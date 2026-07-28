# Handoff — local campaign contract

## Baseline

- repository: `ratoker-jpg/stellar-empires`;
- branch base: exact `main` at `8b23ad357a94542ffd45a93d4d707f6b83171dd6`;
- runtime baseline: merged PR #123 at `aa1dc67ed874c75aa69af30ce9ced58169793c30`;
- active documentation PR: #124;
- next action after merge: Audit PR #125 only.

## Canonical product decision

Read `docs/25a-local-campaign-world-speed-and-offline-progression.md` before planning new gameplay work.

Stellar Empires is a local PvE browser campaign. The future new-game flow selects an immutable world-speed preset. The same speed governs open-session and offline deterministic simulation. Bots, attacks, diplomacy, alliances and endgame remain active through ordinary rules while the browser is closed. The full campaign should later be compressed toward a roughly one-day active-play target.

## Required next audit

Audit #125 must:

1. inspect the current live navigation and complete task flows;
2. rebaseline the roadmap against the canonical local-campaign contract;
3. authorize navigation/usability implementation first;
4. keep campaign time, persistence, offline catch-up and balance as a separate later audit.

No runtime implementation is authorized by PR #124.
