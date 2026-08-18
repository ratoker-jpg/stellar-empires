# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** M8 stage 1 closure in PR #156; final documentation-head validation pending  
**Updated:** 2026-08-18  
**Last merged PR:** #155 `ENDGAME-OPERATIONS-UX` · `a5c72562200c2a6dfdc49f1e4f07e8a869a6558d`  
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

## 3. Delivered baseline

Through PR #151 the product includes deterministic campaign time, compressed progression, complete catalogs/runtime art, ordinary missions/intelligence/combat, demolition/destruction/recovery, multi-colony economy/logistics, sustainable PvE, reputation, Arena and honest bot participation.

M8 stage 1 then delivered optional alliance/solo participation, deterministic Solar War and its canonical Operations/Reports/HUD presentation. PR #156 closes this stage with three-faction migration, exact 48-hour partition, bounded-history and Browser evidence.

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

M8 is split because participation/persistence, terminal closure and bot information parity are distinct high-risk surfaces.

### Stage 1 — `COMPLETE-ENDGAME-01`

```text
#152 Audit d777a619109d4a9bfc8e5129bf4c525f3327b9b6
→ #153 ALLIANCE-SOLO-FOUNDATION c567675c506d55a14a73757afa80c704fb079fc7
→ #154 SOLAR-WAR-PARTICIPATION b62d8b739c27cf1616b33302886e565d88c04a42
→ #155 ENDGAME-OPERATIONS-UX a5c72562200c2a6dfdc49f1e4f07e8a869a6558d
→ #156 ENDGAME-PARTICIPATION-GATE — closure pending squash merge
```

Exactly four implementation PRs were authorized. No fifth implementation PR belongs to stage 1.

Stage-1 delivered outcome:

- one controlled schema v17/save v4 → schema v18/save v5 migration;
- explicit solo eligibility and optional public/open alliance membership;
- ordinary alliance create/join/leave commands and newest-64 membership history;
- deterministic 86,400-second Solar War cycles using existing fleets, combat and catalogs;
- one active entry per empire, persistent result and newest-64 history;
- public redacted result/scoreboard and owner-only fleet/battle detail;
- canonical Operations alliance/Solar War modes, Reports `endgame` filter and compact HUD indicator;
- Aegis, Synod and Veyra each proven for solo and alliance-member entry;
- exact whole-`GameState` equality after 48 campaign hours across direct, six-hour chunks, save/load and resumable offline runtime paths;
- strict malformed-current-state rejection and permanent progression/performance/Browser/Graphify gates;
- no runtime production defect exposed by the final closure matrix.

### Stage 2 — `COMPLETE-ENDGAME-02`

**Not audited and not authorized for implementation.** A new Audit must investigate and bind:

- existing locked Obelisks and Supreme Galactic Gates;
- resource contributions and ownership;
- final-object attack/destruction rules;
- exact terminal timestamp and deterministic victory/defeat state;
- autosave, reload and offline catch-up at the terminal boundary;
- terminal UI and post-terminal command behavior;
- schema/save implications and migration risk.

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
| M8.1 — Participation foundation | closure pending #156 squash | Audit #152; #153–#155 merged; #156 final gate |
| M8.2 — Final objects and terminal result | not audited | `COMPLETE-ENDGAME-02` |
| M8.3 — Bot endgame closure | not audited | `COMPLETE-ENDGAME-03` |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance and release |

## 8. Key invariants

- current `main` is the only valid merged runtime baseline;
- alliance membership is optional and solo completion remains legal;
- schema v18/save v5 was introduced only by #153 in stage 1;
- Solar War uses ordinary commands, owned fleets, existing combat and explicit public/owner views;
- no final-object or terminal mechanics entered stage 1;
- no implementation from stage 2 or 3 begins without its own accepted Audit PR;
- progression, determinism, Browser, Graphify and performance gates remain mandatory.

## 9. Immediate action

Validate the exact final PR #156 code+docs head, resolve review, squash merge, record the generated #156 squash SHA, then create only a `COMPLETE-ENDGAME-02` Audit scaffold from fresh `main`. Do not implement final objects or terminal state until that audit is accepted.
