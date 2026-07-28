# AI Continuation Guide

**Status:** PR #131 merged; PR #132 is the only next implementation  
**Updated:** 2026-07-29  
**Last merged PR:** #131 `CAMPAIGN-SETTINGS-PERSISTENCE` · `257e3effaab4e34285d00db64b6676fda364fcfd`  
**Runtime baseline:** schema v15 / save format v3  
**Active batch:** `LOCAL-CAMPAIGN-TIME-PACING-01`  
**Next work item:** #132 `CAMPAIGN-CLOCK-OFFLINE-GATE`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

Current GitHub history and actual `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/local-campaign-time-pacing-01-prs.md`
6. `docs/audits/contracts/local-campaign-time-pacing-01-clock-catchup.md`
7. `docs/changes/pr131-campaign-settings-persistence.md`
8. `docs/25a-local-campaign-world-speed-and-offline-progression.md`
9. `docs/23-bot-simulation-time-contract.md`
10. this document
11. `docs/project-status.json`
12. `docs/roadmap-pr-index.json`
13. `docs/27-playable-game-roadmap-v5.md`
14. latest merged PRs and actual `main`

## Delivered through merged `main`

- #101–#105: complete catalog runtime art;
- #106–#110: Universe navigation/action gate;
- #111–#115: routed application shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121–#123: demolition, whole-planet destruction and recovery;
- #124: local campaign product contract;
- #125–#129: navigation/usability repair;
- #130: accepted local campaign time/persistence architecture;
- #131: immutable campaign settings and cursor-safe persistence foundation.

## Current schema and persistence

### Deterministic state

- `GameState` schema v15;
- immutable checksummed `CampaignSettings`;
- scenario `test | campaign | fidelity`;
- world speed `1 | 2 | 5 | 10`;
- offline progression fixed true;
- canonical real creation timestamp;
- old state-creation and replay overloads remain deterministic x1.

### Save format v3

- runtime cursor/continuation/summary metadata remains outside `GameState`;
- checksum covers stable envelope fields, runtime metadata and state;
- v1/v2 envelopes and state v1–v14 migrate to x1;
- real creation/cursor time comes from validated envelope `savedAt`;
- current v15 loads execute reconciliation for aliases, schedules and bounded histories;
- autosave/manual/import/export/snapshot/recovery preserve cursor semantics;
- ordinary saves preserve `lastActiveAtReal` until time is actually processed;
- `pendingCatchUp` requires exact target/cursor/remainder consistency.

### Player setup

- one campaign-creation transaction selects faction, topology and immutable speed;
- x2 is the recommended UI preset;
- System / Saves exposes immutable campaign identity and processed cursor;
- settings cannot be changed after creation.

## PR #131 validation

- CI `30405640769`;
- Browser E2E `30405640704`;
- Graphify `30405640711`;
- Codex P1/P2 findings fixed and resolved;
- final re-review returned 👍;
- merge `257e3effaab4e34285d00db64b6676fda364fcfd`.

## #132 exact scope

Create only from fresh current `main`:

- one chronological active/offline orchestrator;
- event/logistics/world-event/bot boundaries;
- fixed-point speed mapping and fractional carry;
- active open-session clock;
- bounded resumable offline catch-up;
- processed-cursor checkpoints;
- pending target/remainder and accumulated summary persistence;
- pending return summary until acknowledgement;
- removal of player fast-forward controls;
- one-day/seven-day, Browser E2E and performance gates;
- audit archive and batch closure.

## Explicit exclusions from #132

- no numeric progression rebalance;
- no diplomacy, alliances or endgame implementation;
- no server-authoritative/online shared world;
- no broad mobile/framework redesign.

## Immediate route

```text
verify fresh current main
→ create PR #132 CAMPAIGN-CLOCK-OFFLINE-GATE
→ implement only the accepted clock/catch-up contract
→ pass CI, Browser E2E, Graphify and clean review
→ merge #132 and close/archive the batch
```
