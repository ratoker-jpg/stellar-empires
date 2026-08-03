# AI Continuation Guide

**Status:** PR #154 `SOLAR-WAR-PARTICIPATION` active; runtime complete, final validation pending  
**Updated:** 2026-08-03  
**Last merged PR:** #153 `ALLIANCE-SOLO-FOUNDATION`  
**Verified main:** `c567675c506d55a14a73757afa80c704fb079fc7`  
**Active branch:** `agent/solar-war-participation`  
**Next implementation:** #155 only after #154 merges

## Repository

`ratoker-jpg/stellar-empires` · default branch `main`.

Actual `main` and merged GitHub history override stale prose, abandoned branches and chat memory.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/complete-endgame-01.md`
6. `docs/audits/evidence/complete-endgame-01.md`
7. `docs/changes/pr154-solar-war-participation.md`
8. `docs/project-status.json`
9. `docs/roadmap-pr-index.json`
10. `docs/16-execution-roadmap.md`
11. `docs/27-playable-game-roadmap-v5.md`
12. PR #154 and actual `main`

## Accepted sequence

```text
#152 COMPLETE-ENDGAME-01 Audit d777a619109d4a9bfc8e5129bf4c525f3327b9b6
→ #153 ALLIANCE-SOLO-FOUNDATION c567675c506d55a14a73757afa80c704fb079fc7
→ #154 SOLAR-WAR-PARTICIPATION — active
→ #155 ENDGAME-OPERATIONS-UX
→ #156 ENDGAME-PARTICIPATION-GATE
```

Exactly four implementation PRs are authorized. Alliance membership is optional and solo participation remains valid.

## Current PR #154 result

- schema v18/save v5 remains unchanged;
- deterministic 86,400-second Solar War cycles use existing faction ships;
- `ENTER_SOLAR_WAR` is ordinary and empire-generic;
- one active entry per empire and one shared resolution event per cycle;
- selected owned combat fleet is held until the exact cycle boundary;
- solo/alliance participation is snapshotted at entry;
- existing combat, research, upgrades, doctrines and commander effects are reused;
- battle seed ignores unrelated event-queue sequence;
- losses, survivors, battle report and result persist;
- public result is redacted; owner detail and aggregate scoreboard are pure selectors;
- old v18/v5 saves without Solar War state migrate to an empty state;
- result history is bounded to 64;
- direct, chunked, save/load and resumable offline partitions match.

## Exact recovery action

While #154 is open:

1. work only on `agent/solar-war-participation`;
2. keep Operations/HUD UI, bots and final objects out of scope;
3. run CI, Browser E2E and Graphify on the exact final code+docs head;
4. rerun only the isolated performance job if the unchanged threshold is hit by runner noise;
5. resolve every real failure and review finding;
6. squash merge only when mergeable and green.

After #154 merges:

1. fetch exact #154 squash SHA and fresh `main`;
2. create branch `agent/endgame-operations-ux`;
3. create only draft PR #155 `ENDGAME-OPERATIONS-UX`;
4. record exact #154 squash SHA in #155;
5. follow the accepted UI file map without adding bots, Gates or terminal state.

## Deferred audits

- `COMPLETE-ENDGAME-02`: Obelisks, Gates, contributions, attacks, destruction and terminal victory/defeat;
- `COMPLETE-ENDGAME-03`: public/allied/owned/hidden bot perception and final endgame closure.

## Hard stops

- no fifth PR in `COMPLETE-ENDGAME-01`;
- no Operations/HUD implementation inside #154;
- no Obelisk/Gate mechanics, victory/defeat or terminal state in #153–#156;
- no bot Solar War planning or allied-information exception;
- no hidden resources, privileged commands, new currency or multiplayer;
- no weakening progression, determinism, performance, Browser or Graphify gates.
