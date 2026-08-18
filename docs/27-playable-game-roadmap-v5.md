# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** M8.1 completed; M8.2 `COMPLETE-ENDGAME-02` is in final closure PR #161  
**Updated:** 2026-08-19  
**Last merged PR:** #160 `TERMINAL-RUNTIME-UX` · `8ad44509426e4bb9555a8a6133e1dbdb899dccae`  
**Runtime:** schema v19 / save format v6  
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
→ reach deterministic persisted victory or defeat
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

## 3. Delivered baseline

Through PR #151 the product includes deterministic campaign time, compressed progression, complete catalogs/runtime art, ordinary missions/intelligence/combat, demolition/destruction/recovery, multi-colony economy/logistics, sustainable PvE, reputation, Arena and honest bot participation.

M8.1 added optional alliance/solo participation, deterministic Solar War, canonical Operations/Reports/HUD presentation and exact three-faction 48-hour closure. It is fully merged through PR #156.

Audit #157 resolved final-object, vulnerability, terminal persistence/runtime and closure contracts. PRs #158–#160 are merged and #161 is the closure-only acceptance gate.

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
| M8.1 — Endgame participation foundation | Audit #152; #153–#156 |

## 5. M8 staged delivery

M8 is split because participation/persistence, terminal closure and bot information parity are distinct high-risk surfaces.

### Stage 1 — `COMPLETE-ENDGAME-01` — completed

```text
#152 Audit d777a619109d4a9bfc8e5129bf4c525f3327b9b6
→ #153 c567675c506d55a14a73757afa80c704fb079fc7
→ #154 b62d8b739c27cf1616b33302886e565d88c04a42
→ #155 a5c72562200c2a6dfdc49f1e4f07e8a869a6558d
→ #156 c2fcaf39402392f0ebbad297d88f9689f4165e4c
```

Stage-1 outcome:

- controlled schema v17/save v4 → schema v18/save v5 migration;
- explicit solo eligibility and optional public/open alliance membership;
- ordinary alliance create/join/leave commands and bounded membership history;
- deterministic Solar War using existing fleets/combat/catalogs;
- public/owner result views, Operations, Reports and HUD integration;
- Aegis/Synod/Veyra solo/alliance participation and exact whole-state partition closure.

### Stage 2 — `COMPLETE-ENDGAME-02` — final closure active

Accepted sequence:

```text
#157 Audit 7750cdb83b58e95f790351b306e9cf5b344bd780
→ #158 FINAL-OBJECT-FOUNDATION       a66a05fd433893f4a6f15cd8d9fd53ea31d793f9
→ #159 FINAL-GATE-VULNERABILITY     466e5ea161a005eeb792d5440dc27d960b37b2f2
→ #160 TERMINAL-RUNTIME-UX          8ad44509426e4bb9555a8a6133e1dbdb899dccae
→ #161 ENDGAME-TERMINAL-GATE        active closure-only PR
```

Delivered Stage-2 behavior:

- schema v19/save v6 final-project/result foundation and controlled v18/v5 migration;
- positive Solar War qualification snapshot;
- functional existing faction Obelisks;
- immutable solo/alliance final-project participation/cohort;
- existing-resource contributions and exact existing Gate funding target;
- ordinary Gate construction timing and completion path;
- public exact 86,400-second Gate vulnerability;
- ordinary ATTACK + surviving existing Planet Destroyer Gate destruction and no-refund reset/rebuild;
- host-loss cancellation and fresh-project recovery;
- final-building isolation from ordinary random demolition;
- canonical same-second event ordering;
- persisted immutable terminal campaign result and exact frozen game second;
- inert future state and global `CAMPAIGN_TERMINAL` mutation rejection;
- active/offline real-backlog consumption after terminal without GameState progression;
- immediate durable terminal autosave/checkpoint and exact reload;
- persisted-cohort victory/defeat;
- final-project/terminal UX on existing Operations, Reports, HUD and catch-up/return summary surfaces.

#161 adds no new mechanics. It closes full-system acceptance evidence and the Stage-2 archive. No fifth Stage-2 implementation PR is authorized.

### Stage 3 — `COMPLETE-ENDGAME-03`

**Not audited and not implementation-authorized.**

Must investigate bot public/allied/owned/hidden perception, ordinary-command alliance/Solar-War/final-object behavior and final three-faction bot closure. It may begin only as an Audit from fresh post-#161 main.

## 6. Release 1.0 definition

A player can create and resume a deterministic campaign, build and understand a multi-colony economy, configure logistics, unlock the catalog, execute sustainable missions, fight and recover colonies, use bounded PvE/meta systems, remain solo or participate in an alliance, participate in Solar War and reach a persisted victory or defeat.

Bots must use the same commands, resources, timing and allowed information classes. Save/load/offline partitions must preserve deterministic outcomes.

## 7. Milestone map

| Milestone | Status | Delivery |
|---|---|---|
| M1–M6b | completed | through PR #151 |
| M7 — Autonomous bot parity | substantially delivered | endgame parity deferred to M8.3 |
| M8.1 — Participation foundation | completed | Audit #152; #153–#156 |
| M8.2 — Final objects and terminal result | closure PR active | Audit #157; #158–#161 |
| M8.3 — Bot endgame closure | not audited | `COMPLETE-ENDGAME-03` |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance and release |

## 8. Key invariants

- current `main` is the only valid merged runtime baseline;
- alliance membership is optional and solo completion remains legal;
- schema v19/save v6 is the Stage-2 runtime baseline;
- Solar War uses ordinary commands, owned fleets, existing combat and explicit public/owner views;
- final objects reuse existing faction catalogs/assets, building timing and ordinary combat rather than parallel systems;
- terminal result is persisted, immutable and freezes simulation at the exact terminal second;
- no post-victory continue sandbox exists;
- bot endgame planning/perception remains deferred to its own accepted Audit;
- progression, determinism, Browser, Graphify and performance gates remain mandatory.

## 9. Immediate action

Finish #161 closure-only evidence/docs, freeze one exact final head and require Main CI, Browser E2E with retained success artifact, Graphify, permanent compressed progression/performance and review/mergeability gates green on that same SHA. If green, squash-merge #161 with expected-head protection and verify fresh main. Do not begin bot endgame implementation until a separate `COMPLETE-ENDGAME-03` Audit is accepted.
