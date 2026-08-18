# AI Continuation Guide

**Status:** draft Audit PR #157 `COMPLETE-ENDGAME-02`; implementation is not authorized  
**Updated:** 2026-08-18  
**Last merged PR:** #156 `ENDGAME-PARTICIPATION-GATE`  
**Verified main:** `c2fcaf39402392f0ebbad297d88f9689f4165e4c`  
**Active branch:** `agent/complete-endgame-02-audit`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main`.

Actual `main` and merged GitHub history override stale prose, abandoned branches and chat memory.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/complete-endgame-02-scaffold.md`
6. `docs/audits/completed/complete-endgame-01.md`
7. `docs/project-status.json`
8. `docs/roadmap-pr-index.json`
9. `docs/16-execution-roadmap.md`
10. `docs/27-playable-game-roadmap-v5.md`
11. PR #157 and actual `main`

## Closed stage 1

```text
#152 COMPLETE-ENDGAME-01 Audit d777a619109d4a9bfc8e5129bf4c525f3327b9b6
→ #153 c567675c506d55a14a73757afa80c704fb079fc7
→ #154 b62d8b739c27cf1616b33302886e565d88c04a42
→ #155 a5c72562200c2a6dfdc49f1e4f07e8a869a6558d
→ #156 c2fcaf39402392f0ebbad297d88f9689f4165e4c
```

`COMPLETE-ENDGAME-01` is completed with divergence none. Its exact closure evidence is archived in `docs/audits/completed/complete-endgame-01.md`.

## Current Audit #157

Audit, do not implement:

- inspect existing locked Obelisks/Gates, prerequisites, costs and assets;
- inspect current contribution/resource/build command boundaries;
- determine solo/alliance ownership and victory semantics;
- determine final-object attack/destruction reuse of ordinary combat;
- bind exact terminal timestamp and event ordering;
- bind post-terminal command behavior;
- prove what active/offline/save-load/autosave behavior must be tested at the terminal boundary;
- determine canonical terminal presentation without inventing an unnecessary route family;
- decide schema/save migration implications;
- identify three-faction asymmetries;
- produce a bounded implementation sequence and permanent acceptance gates.

`implementationAuthorized: false`

## Exact recovery action

1. verify `main` is still `c2fcaf39402392f0ebbad297d88f9689f4165e4c` or inspect anything added on top;
2. work only on `agent/complete-endgame-02-audit` while PR #157 is open;
3. read real final-object, persistence, campaign-time, combat and UI code before making product decisions;
4. record concrete evidence paths and unresolved unknowns;
5. do not create an implementation branch/PR while any critical unknown remains;
6. only an explicitly accepted/merged Audit #157 may set `implementationAuthorized: true` and define the next bounded PR sequence.

## Hard stops

- no Obelisk/Gate implementation in the Audit PR;
- no contribution or final-object combat commands;
- no persisted victory/defeat or terminal freeze;
- no bot final-object planning or allied-information exception (`COMPLETE-ENDGAME-03`);
- no new currency, catalogs/assets, multiplayer, seasons, global rebalance or M9 work;
- no weakening progression, determinism, performance, Browser or Graphify gates.
