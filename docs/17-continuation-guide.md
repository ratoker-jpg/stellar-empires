# AI Continuation Guide

**Status:** Audit PR #130 active; no runtime implementation before merge  
**Updated:** 2026-07-28  
**Runtime baseline:** PR #129 `NAV-USABILITY-GATE` · `a586224aa85eb3bc4676c3f4cd98a0ff7625aafa`  
**Audit baseline:** synchronized `main` · `45bd3297d402fd96691a26c60e47bd39a420f174`  
**Active batch:** `LOCAL-CAMPAIGN-TIME-PACING-01`  
**Next authorized implementation after audit acceptance:** #131 `CAMPAIGN-SETTINGS-PERSISTENCE`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

GitHub history and current `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/evidence/local-campaign-time-pacing-01-code-and-flow.md`
6. `docs/audits/contracts/local-campaign-time-pacing-01-clock-catchup.md`
7. `docs/audits/contracts/local-campaign-time-pacing-01-prs.md`
8. `docs/25a-local-campaign-world-speed-and-offline-progression.md`
9. `docs/23-bot-simulation-time-contract.md`
10. this document
11. `docs/project-status.json`
12. `docs/roadmap-pr-index.json`
13. `docs/27-playable-game-roadmap-v5.md`
14. latest merged pull requests and actual `main`

## Delivered product state

- #101–#105: complete catalog runtime art;
- #106–#110: schema-v14 Universe navigation/action gate;
- #111–#115: technically coherent routed shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121–#123: demolition, whole-planet destruction and recovery;
- #124: canonical local-campaign world-speed/offline-progression product contract;
- #125–#129: completed navigation/usability repair.

Navigation batch archive: `docs/audits/completed/navigation-usability-01.md`.

## Current verified time/persistence state

- `GameState` remains schema v14;
- save format remains v2;
- new game selects only faction;
- open-session world time advances only through manual Planet buttons;
- no real-time ticker or offline bootstrap exists;
- `ADVANCE_TIME` already processes ordinary events, economy, logistics and world events chronologically;
- bot decision cursors are persisted and bounded;
- overdue bots currently plan against the final post-jump state;
- `SaveEnvelope.savedAt` is not a protected catch-up cursor;
- report/history retention is insufficient as the sole long-catch-up summary source.

## Audit #130 decision

Complexity is **heavy**, with two sequential implementation PRs:

```text
#131 CAMPAIGN-SETTINGS-PERSISTENCE
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE
```

### #131

- schema v15 immutable `CampaignSettings`;
- scenario and world-speed selection before creation;
- save format v3 `CampaignRuntimeMetadata` outside GameState;
- envelope integrity and legacy x1 migration;
- replay initial settings;
- import/export/snapshot/recovery cursor correctness;
- no live ticker or catch-up yet.

### #132

- one chronological orchestrator for active and offline time;
- bot decision boundaries interleaved with existing event/logistics/world boundaries;
- bounded resumable catch-up and checkpoints;
- active real-time clock and fractional carry;
- structured redacted return summary;
- remove normal manual fast-forward controls;
- one-day/seven-day, fake-clock Browser E2E and release gates;
- archive and batch closure.

## Important architecture decisions

- old saves migrate to x1, not recommended x2;
- campaign settings are deterministic state and checksum input;
- wall-clock runtime cursor remains outside GameState;
- `savedAt` remains display/audit metadata;
- active and offline paths must use one orchestrator;
- no elapsed duration may be silently truncated;
- huge intervals yield through resumable operation chunks;
- final caught-up state saves before interactive mount/summary;
- summary is accumulated during processing and redacted by ordinary visibility rules;
- the old bot controller cannot remain a competing time owner.

## Explicit split from balance

Audit #130 does **not** authorize numeric progression compression. Exact level caps, costs, durations, unlock timing and a measured one-day campaign belong to a later `CAMPAIGN-PROGRESSION-BALANCE-01` audit after #132 delivers the clock/headless foundation.

## Immediate route

```text
complete Audit #130
→ pass CI, Graphify and review
→ merge audit
→ create #131 from fresh merged main
```

Do not edit runtime, schema, save format or UI time controls in Audit #130.

## Preserved invariants

- deterministic shared commands and validators;
- existing event ordering unless the accepted same-time clock contract explicitly defines integration;
- intelligence redaction;
- explicit fleet-send confirmation;
- IndexedDB autosave, snapshots, slots and recovery;
- completed route/colony/return navigation;
- local campaign, no required server for Release 1.0;
- no diplomacy/alliance/endgame implementation in #131–#132;
- no progression rebalance in #131–#132.
