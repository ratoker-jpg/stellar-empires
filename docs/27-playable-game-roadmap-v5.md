# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** PR #155 `ENDGAME-OPERATIONS-UX` active; implementation complete, final validation pending  
**Updated:** 2026-08-04  
**Last merged PR:** #154 `SOLAR-WAR-PARTICIPATION` · `b62d8b739c27cf1616b33302886e565d88c04a42`  
**Runtime:** schema v18 / save format v5  
**Release target:** complete local PvE browser campaign with autonomous bot empires

## 1. Product target

```text
choose faction and immutable campaign settings
→ develop a coherent multi-colony economy
→ configure predictable logistics and market support
→ research and build fleets
→ explore, spy, transport, colonize, recycle, raid and fight
→ compete with autonomous bot empires
→ remain solo or participate in an alliance
→ participate in Solar War
→ build or destroy final Gates
→ reach deterministic victory or defeat
```

Nemexia references define systemic depth only. Stellar Empires keeps original terminology, assets, UI and implementation.

## 2. Source-of-truth hierarchy

1. current merged code/tests on `main`;
2. accepted current audit and contracts;
3. `docs/audits/current-execution-state.md`;
4. `docs/project-status.json` and `docs/roadmap-pr-index.json`;
5. this roadmap;
6. canonical product contracts;
7. completed audits and old handoffs as history.

## 3. Delivered merged baseline

Through PR #151 the product includes deterministic campaign time, compressed progression, complete catalogs/runtime art, ordinary missions/intelligence/combat, demolition/destruction/recovery, multi-colony economy/logistics, sustainable PvE, reputation, Arena and honest bot participation.

Audit #152 accepted M8 stage 1. PR #153 added optional public/open alliances, explicit solo participation and the controlled schema v18/save v5 migration. PR #154 added deterministic Solar War mechanics using existing fleets/combat and exact partition equality.

## 4. Completed batches

| Milestone | Delivery |
|---|---|
| M1 — Production assets | Audit #101; #102–#105 |
| M2 — Navigable Universe | Audit #106; #107–#110 |
| M3 — Coherent UI shell | Audit #111; #112–#115 |
| M3b — Navigation/usability repair | Audit #125; #126–#129 |
| M4a — Ordinary missions/intelligence | Audit #116; #117–#120 |
| M4b — Demolition/destruction/recovery | Audit #121; #122–#123 |
| M4c — Local campaign time | Audit #130; #131–#132 |
| M4d — Campaign progression balance | Audit #133; #134–#135 |
| M5 — Multi-colony economy/logistics | Audit #137; #138–#141 |
| M6a — Sustainable existing PvE | Audit #142; #143–#146 |
| M6b — PvE meta foundation | Audit #147; #148–#151 |

## 5. M8 staged delivery

M8 is split because persistence/participation, terminal closure and bot information parity are distinct high-risk surfaces.

### Stage 1 — `COMPLETE-ENDGAME-01`

```text
#152 Audit d777a619109d4a9bfc8e5129bf4c525f3327b9b6
→ #153 ALLIANCE-SOLO-FOUNDATION c567675c506d55a14a73757afa80c704fb079fc7
→ #154 SOLAR-WAR-PARTICIPATION b62d8b739c27cf1616b33302886e565d88c04a42
→ #155 ENDGAME-OPERATIONS-UX — active
→ #156 ENDGAME-PARTICIPATION-GATE
```

Exactly four implementation PRs are authorized.

Delivered through #154:

- one controlled schema v18/save v5 migration;
- explicit solo participation and optional public/open alliance membership;
- ordinary alliance create/join/leave commands and bounded membership history;
- deterministic 24-hour Solar War cycles using existing fleets, combat and catalogs;
- persisted losses, survivors, report and score with public/owner visibility split;
- 64-result retention and direct/chunk/save/load/resumable-offline equality.

PR #155 delivers:

- canonical Operations alliance and Solar War modes;
- solo eligibility, public roster and ordinary membership actions;
- cycle/opposing-force/legal-fleet/validation/active-entry presentation;
- redacted public results and owner-only detail;
- Reports `endgame` filter and compact HUD indicator;
- canonical reload/history, keyboard, responsive and reduced-motion behavior;
- no persistence, bot-planner or final-object change.

Stage-1 outcome after #156:

- optional alliance/solo participation;
- deterministic Solar War;
- Operations/Reports/HUD presentation;
- exact migration/partition/Browser/performance closure.

### Stage 2 — `COMPLETE-ENDGAME-02`

Not audited. Must cover existing locked Obelisks/Gates, resource contributions, ownership, attacks, destruction, persisted victory/defeat, exact terminal boundary, autosave/offline/reload and terminal UI.

### Stage 3 — `COMPLETE-ENDGAME-03`

Not audited. Must cover bot public/allied/owned/hidden perception, ordinary-command alliance/Solar War/final-object behavior and final three-faction closure.

## 6. Release 1.0 definition

A player can create and resume a deterministic campaign, build and understand a multi-colony economy, configure logistics, unlock the catalog, execute sustainable missions, fight and recover colonies, use bounded PvE/meta systems, remain solo or participate in an alliance, participate in Solar War and reach a persisted victory or defeat.

Bots must use the same commands, resources, timing and information classes. Save/load/offline partitions must preserve deterministic outcomes.

## 7. Milestone map

| Milestone | Status | Delivery |
|---|---|---|
| M1–M6b | completed | through PR #151 |
| M7 — Autonomous bot parity | substantially delivered | endgame parity deferred to M8 stage 3 |
| M8.1 — Participation foundation | implementation active | Audit #152; #153–#154 merged; #155 active; #156 authorized |
| M8.2 — Final objects and terminal result | not audited | `COMPLETE-ENDGAME-02` |
| M8.3 — Bot endgame closure | not audited | `COMPLETE-ENDGAME-03` |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance and release |

## 8. Key invariants

- current `main` is the only valid merged runtime baseline;
- alliance membership is optional and solo completion remains legal;
- exactly four implementation PRs are authorized by Audit #152;
- schema v18/save v5 was introduced only by #153 in this batch;
- Solar War uses ordinary commands, owned fleets, existing combat and explicit public/owner views;
- no new endgame catalog/assets are required for stage 1;
- no final-object or terminal mechanics enter stage 1;
- progression, determinism, Browser, Graphify and performance gates remain mandatory.

## 9. Immediate action

Validate the exact final PR #155 code+docs head, resolve review, squash merge, then create only draft PR #156 from fresh `main` and record the exact #155 squash SHA.
