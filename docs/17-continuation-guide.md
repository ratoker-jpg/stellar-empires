# AI Continuation Guide

**Status:** PR #132 is active and in final validation  
**Updated:** 2026-07-29  
**Last merged PR:** #131 `CAMPAIGN-SETTINGS-PERSISTENCE` · `257e3effaab4e34285d00db64b6676fda364fcfd`  
**Runtime baseline:** schema v15 / save format v3  
**Active batch:** `LOCAL-CAMPAIGN-TIME-PACING-01`  
**Active work item:** #132 `CAMPAIGN-CLOCK-OFFLINE-GATE`

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
8. `docs/changes/pr132-campaign-clock-offline-gate.md`
9. `docs/audits/completed/local-campaign-time-pacing-01.md`
10. `docs/25a-local-campaign-world-speed-and-offline-progression.md`
11. `docs/23-bot-simulation-time-contract.md`
12. this document
13. `docs/project-status.json`
14. `docs/roadmap-pr-index.json`
15. `docs/27-playable-game-roadmap-v5.md`
16. latest merged PRs and actual `main`

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

## Active PR #132 implementation

The current branch implements:

- a shared DOM-independent chronological active/offline orchestrator;
- event, logistics, world-event and bot-decision boundaries;
- integer fixed-point x1/x2/x5/x10 speed mapping and fractional carry;
- an active browser campaign clock;
- bounded resumable offline catch-up;
- processed-cursor checkpoints and protected continuation;
- cooperative catch-up progress;
- durable pending return summary until explicit acknowledgement;
- removal of normal player fast-forward controls;
- one-day/seven-day deterministic and performance tests;
- Chromium Browser E2E for active and offline progression;
- batch change documentation and completion archive.

## Final #132 route

```text
verify final branch head
→ pass CI, Browser E2E and Graphify
→ request automated review
→ fix every actionable P0/P1/P2 finding
→ mark ready and squash merge #132
→ synchronize exact merge SHA on main
→ close LOCAL-CAMPAIGN-TIME-PACING-01
→ only then create CAMPAIGN-PROGRESSION-BALANCE-01 audit
```

## Explicit exclusions from #132

- no numeric progression rebalance;
- no diplomacy, alliances or endgame implementation;
- no server-authoritative/online shared world;
- no broad mobile/framework redesign.

## Next authorized work after merge

Only Audit `CAMPAIGN-PROGRESSION-BALANCE-01` may begin after #132 is merged and status is synchronized. That audit must measure campaign duration and decide exact progression compression before any balance values change.
