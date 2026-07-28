# AI Continuation Guide

**Status:** Audit #130 accepted; implementation PR #131 is next  
**Updated:** 2026-07-28  
**Last merged PR:** #130 `LOCAL-CAMPAIGN-TIME-PACING-01` audit · `2379fa7a30974381349433e4f0e0ba43d15f1511`  
**Runtime baseline:** PR #129 `NAV-USABILITY-GATE` · `a586224aa85eb3bc4676c3f4cd98a0ff7625aafa`  
**Active batch:** `LOCAL-CAMPAIGN-TIME-PACING-01`  
**Next authorized implementation:** #131 `CAMPAIGN-SETTINGS-PERSISTENCE`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

Current GitHub history and `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/local-campaign-time-pacing-01-prs.md`
6. `docs/audits/contracts/local-campaign-time-pacing-01-clock-catchup.md`
7. `docs/audits/evidence/local-campaign-time-pacing-01-code-and-flow.md`
8. `docs/audits/evidence/local-campaign-time-pacing-01-graphify.md`
9. `docs/25a-local-campaign-world-speed-and-offline-progression.md`
10. `docs/23-bot-simulation-time-contract.md`
11. this document
12. `docs/project-status.json`
13. `docs/roadmap-pr-index.json`
14. `docs/27-playable-game-roadmap-v5.md`
15. latest merged PRs and actual `main`

## Delivered product state

- #101–#105: complete catalog runtime art;
- #106–#110: schema-v14 Universe navigation/action gate;
- #111–#115: routed application shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121–#123: demolition, whole-planet destruction and recovery;
- #124: canonical local-campaign world-speed/offline-progression product contract;
- #125–#129: completed navigation/usability repair;
- #130: accepted local campaign settings, persistence and chronological clock architecture.

## Audit #130 validation

Final audit head `d276a8db16af534ec915f877a76a8c419986f793` passed:

- CI `30389103445`;
- Browser E2E `30389103358`;
- Graphify `30389103322`.

Audit merge: `2379fa7a30974381349433e4f0e0ba43d15f1511`.

Four review findings were fixed:

- checkpoints store processed real-time cursor, not unprocessed target `now`;
- fresh Graphify evidence is recorded in-repository;
- legacy real creation time comes from validated envelope `savedAt`;
- completed return summary persists until explicit acknowledgement.

## Accepted implementation sequence

```text
#131 CAMPAIGN-SETTINGS-PERSISTENCE — next
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE — blocked until #131 merges
→ later CAMPAIGN-PROGRESSION-BALANCE-01 audit
```

## #131 exact scope

### Deterministic state

- schema v15;
- immutable `CampaignSettings`;
- `scenarioPreset: test | campaign | fidelity`;
- `worldSpeed: 1 | 2 | 5 | 10`;
- `offlineProgression: true`;
- validated `createdAtReal`;
- settings included in checksum and replay initial configuration.

### Persistence

- save format v3;
- integrity-protected runtime metadata outside `GameState`;
- processed `lastActiveAtReal` cursor;
- protected optional `pendingCatchUp` shape;
- protected optional `pendingReturnSummary` shape;
- autosave/manual/import/export/snapshot/recovery preserve runtime metadata semantics;
- v1/v2 envelopes and state v1–v14 migrate safely;
- legacy campaigns receive x1;
- legacy real creation/cursor time comes from validated envelope `savedAt`, not the fixed v14 simulation epoch.

### Player setup

- replace faction-only start with one accessible transaction selecting faction, scenario and fixed speed;
- show immutable campaign identity in System/Save presentation;
- no runtime mutation of settings.

### Explicit exclusions from #131

- no active real-time ticker;
- no offline elapsed-time processing;
- no chronological bot refactor;
- no removal of normal time controls yet;
- no progression cost/duration/level rebalance;
- no diplomacy, alliances or endgame.

## #132 reserved scope

After #131 merges, #132 may implement:

- one active/offline chronological orchestrator;
- event/logistics/world-event/bot decision boundaries;
- fixed-point speed mapping;
- active clock;
- bounded resumable catch-up;
- processed-cursor checkpoints;
- persisted pending summary until acknowledgement;
- removal of normal manual fast-forward controls;
- one-day/seven-day deterministic, Browser E2E and performance gates.

Do not begin #132 before #131 merges.

## Preserved invariants

- local browser campaign; no required server for Release 1.0;
- player and bots use ordinary commands and visibility rules;
- no elapsed time may be silently skipped;
- intelligence redaction remains authoritative;
- explicit fleet-send confirmation remains mandatory;
- IndexedDB slots, autosave, snapshot and recovery remain recoverable;
- completed navigation route/colony/return context remains stable;
- progression compression requires a separate later audit.

## Immediate route

```text
fresh current main
→ create branch for #131
→ implement only CAMPAIGN-SETTINGS-PERSISTENCE
→ run assets, lint, TypeScript, tests, build, Browser E2E and Graphify
→ resolve all P0/P1 review findings
→ merge #131
→ synchronize status
→ only then start #132
```
