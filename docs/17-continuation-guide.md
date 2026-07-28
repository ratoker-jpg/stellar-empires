# AI Continuation Guide

**Status:** implementation PR #131 active; #132 remains blocked  
**Updated:** 2026-07-29  
**Last merged PR:** #130 audit · `2379fa7a30974381349433e4f0e0ba43d15f1511`  
**Active implementation baseline:** `1503c7d37fafc623bee4654ed460c92aa55a7b2f`  
**Active batch:** `LOCAL-CAMPAIGN-TIME-PACING-01`  
**Active work item:** #131 `CAMPAIGN-SETTINGS-PERSISTENCE`

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
- #106–#110: schema-v14 Universe navigation/action gate;
- #111–#115: routed application shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121–#123: demolition, whole-planet destruction and recovery;
- #124: local campaign product contract;
- #125–#129: navigation/usability repair;
- #130: accepted local campaign time/persistence architecture.

## Active #131 implementation

### Deterministic state

- `GameState` schema v15;
- immutable checksummed `CampaignSettings`;
- scenario `test | campaign | fidelity`;
- world speed `1 | 2 | 5 | 10`;
- offline progression fixed true;
- canonical real creation timestamp;
- old state-creation and replay overloads remain deterministic x1.

### Persistence

- save format v3;
- runtime cursor/continuation/summary metadata outside `GameState`;
- checksum covers stable envelope fields, runtime metadata and state;
- v1/v2 envelopes and state v1–v14 migrate to x1;
- real creation/cursor time comes from validated envelope `savedAt`;
- current v15 loads still execute reconciliation for aliases, schedules and bounded histories;
- autosave/manual/import/export/snapshot/recovery preserve cursor semantics.

### Player setup

- one campaign-creation transaction selects faction, topology and immutable speed;
- x2 is the recommended UI preset;
- System / Saves exposes immutable campaign identity and accepted cursor;
- no settings mutation after creation.

### Verification already established on code head

- assets, lint and strict TypeScript;
- complete Vitest suite;
- production build;
- Graphify;
- Browser E2E required again on final documentation head.

## Explicit exclusions from #131

- no active wall-clock ticker;
- no offline elapsed-time processing;
- no chronological bot integration;
- no removal of normal time controls;
- no progression balance changes;
- no diplomacy, alliances or endgame.

## #132 reserved scope

Only after #131 merges:

- one chronological active/offline orchestrator;
- event/logistics/world-event/bot boundaries;
- fixed-point speed mapping and fractional carry;
- active clock;
- bounded resumable offline catch-up;
- processed-cursor checkpoints;
- pending return summary until acknowledgement;
- removal of player fast-forward controls;
- one-day/seven-day, Browser E2E and performance gates;
- batch archive and closure.

## Immediate route

```text
finish #131 final documentation
→ pass CI, Browser E2E and Graphify on final head
→ resolve all P0/P1 review findings
→ mark ready and merge #131
→ synchronize exact merge SHA on main
→ only then create #132 from fresh main
```
