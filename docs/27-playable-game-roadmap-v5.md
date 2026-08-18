# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** M8.1 completed; `COMPLETE-ENDGAME-02` Audit #157 merged; PR #158 `FINAL-OBJECT-FOUNDATION` implementation complete and awaiting final gates  
**Updated:** 2026-08-18  
**Last merged PR:** #157 `COMPLETE-ENDGAME-02` Audit · `7750cdb83b58e95f790351b306e9cf5b344bd780`  
**Runtime on `main`:** schema v18 / save format v5  
**PR #158 target/delivered branch runtime:** schema v19 / save format v6  
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

## 3. Delivered baseline

Through PR #151 the product includes deterministic campaign time, compressed progression, complete catalogs/runtime art, ordinary missions/intelligence/combat, demolition/destruction/recovery, multi-colony economy/logistics, sustainable PvE, reputation, Arena and honest bot participation.

M8 stage 1 added optional alliance/solo participation, deterministic Solar War, canonical Operations/Reports/HUD presentation and exact three-faction 48-hour closure. It is fully merged through PR #156.

Audit #157 resolved the final-object, vulnerability, terminal persistence/runtime and closure contracts and authorized exactly four sequential Stage-2 implementation PRs.

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
- ordinary alliance create/join/leave commands and newest-64 membership history;
- deterministic 86,400-second Solar War cycles using existing fleets, combat and catalogs;
- one active entry per empire, persistent result and newest-64 history;
- public redacted result/scoreboard and owner-only fleet/battle detail;
- canonical Operations alliance/Solar War modes, Reports `endgame` filter and compact HUD indicator;
- Aegis, Synod and Veyra each proven for solo and alliance-member entry;
- exact whole-`GameState` equality after 48 campaign hours across direct, six-hour chunks, save/load and resumable offline runtime paths;
- strict malformed-current-state rejection and permanent progression/performance/Browser/Graphify gates;
- divergence none.

### Stage 2 — `COMPLETE-ENDGAME-02` — Audit #157 merged; implementation active

Audit #157 squash/new main:

`7750cdb83b58e95f790351b306e9cf5b344bd780`

Accepted implementation sequence:

```text
#158 FINAL-OBJECT-FOUNDATION
→ #159 FINAL-GATE-VULNERABILITY
→ #160 TERMINAL-RUNTIME-UX
→ #161 ENDGAME-TERMINAL-GATE
```

PR #158 has implemented its bounded foundation on `agent/final-object-foundation` and is awaiting exact final-head validation before squash merge. Its delivered scope is limited to:

- schema v19/save v6 final-project/result foundation and controlled v18/v5 migration;
- positive Solar War qualification snapshot;
- functional qualified Obelisk construction through the ordinary queue;
- immutable solo/alliance final-project cohort;
- existing-resource contributions and exact existing Gate funding target;
- pre-funded Gate transition into ordinary construction timing/`BUILDING_COMPLETE` machinery;
- bounded histories and strict current final-object/result validation;
- explicit Aegis/Synod/Veyra × solo/alliance funded-construction closure.

Still reserved for later Stage-2 PRs:

- #159: public 86,400-second Gate vulnerability plus ordinary-combat destruction/rebuild integration;
- #160: terminal runtime persistence, exact freeze/autosave/backlog behavior and terminal UX;
- #161: full three-faction terminal closure, partition equality and permanent acceptance gates.

No fifth Stage-2 implementation PR is authorized.

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
| M8.1 — Participation foundation | completed | Audit #152; #153–#156 |
| M8.2 — Final objects and terminal result | Audit #157 merged; #158 implementation complete/pending final gates | #158–#161 |
| M8.3 — Bot endgame closure | not audited | `COMPLETE-ENDGAME-03` |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance and release |

## 8. Key invariants

- current `main` is the only valid merged runtime baseline;
- alliance membership is optional and solo completion remains legal;
- schema v18/save v5 remains the merged runtime until #158 is squash-merged;
- schema v19/save v6 belongs to the accepted Stage-2 persistence foundation;
- Solar War uses ordinary commands, owned fleets, existing combat and explicit public/owner views;
- final objects reuse existing faction catalogs/assets, building timing and ordinary combat rather than parallel systems;
- Stage-2 implementation is strictly sequential: no #159 implementation before #158 merge;
- bot endgame planning/perception remains deferred to its own accepted audit;
- progression, determinism, Browser, Graphify and performance gates remain mandatory.

## 9. Immediate action

Validate the exact final head of PR #158 with CI, Browser E2E, Graphify, permanent progression/performance and review/mergeability gates. If green, squash-merge #158, fetch its generated fresh-main SHA and create only the #159 `FINAL-GATE-VULNERABILITY` draft scaffold. Do not implement #159 in the same closeout step.
