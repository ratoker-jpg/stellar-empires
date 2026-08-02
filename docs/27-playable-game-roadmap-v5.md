# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** Audit #152 complete; M8 stage 1 ready for validation/merge  
**Updated:** 2026-08-02  
**Last merged PR:** #151 `BOT-PVE-META-GATE` · `73ed5536cb994a78fe7cdd45a41e0240901d7fe1`  
**Merged runtime baseline:** schema v17 / save format v4  
**Active work:** Audit #152 `COMPLETE-ENDGAME-01`  
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

The merged product includes deterministic schema-v17/save-v4 campaigns, immutable active/offline time, compressed finite progression, complete catalogs/runtime art, ordinary missions/intelligence/combat, demolition/destruction/recovery, coherent multi-colony economy/logistics, sustainable PvE, persistent reputation, local Arena mechanics, routed Operations UX and honest three-faction bot participation.

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

## 5. Exact M6b closure

```text
#147 Audit                         50835aeb2864b96e026a7202ad419368e934e47b
→ #148 PVE-REPUTATION-FOUNDATION  430265b061764145e4e3ea1470d545f2ef82d0fa
→ #149 ARENA-PVE-CHALLENGES       42c484426e850b84263d4eecab63ebbb3eaafb05
→ #150 PVE-META-OPERATIONS-UX     39b85fe057d2cbf1fcff6b949a14bc62c7dbde63
→ #151 BOT-PVE-META-GATE          73ed5536cb994a78fe7cdd45a41e0240901d7fe1
```

Delivered:

- PvE reputation and Recruit/Ranger/Vanguard/Warden tiers;
- three public deterministic Arena challenges per six-hour cycle;
- existing-resource entry, withdrawal, losses, survivors and rewards;
- Operations Arena UX;
- honest public-only bot entry through ordinary commands;
- planet-destruction capability and 40% gas reserve;
- exact 48-hour direct/chunk/save/offline equality.

## 6. Release 1.0 definition

A player can create and resume a deterministic campaign, build and understand a multi-colony economy, configure reliable logistics, unlock the catalog, execute sustainable missions, fight and recover colonies, use bounded PvE/meta systems, remain solo or participate in an alliance, participate in Solar War and reach a persisted victory or defeat.

Bots must use the same commands, resources, timing and information classes. Save/load/offline partitions must preserve deterministic outcomes.

## 7. M8 audit decision

M8 is split because three risk surfaces are not safely reviewable as one batch:

### Stage 1 — `COMPLETE-ENDGAME-01`

Audit #152 authorizes exactly four implementation PRs:

```text
#153 ALLIANCE-SOLO-FOUNDATION
→ #154 SOLAR-WAR-PARTICIPATION
→ #155 ENDGAME-OPERATIONS-UX
→ #156 ENDGAME-PARTICIPATION-GATE
```

Outcome:

- optional public/open local alliance membership;
- explicit valid solo path;
- one controlled schema v18/save v5 migration;
- deterministic 24-hour Solar War cycle using existing fleets, combat and catalogs;
- Operations/Reports/HUD presentation;
- exact migration/partition/Browser/performance closure.

### Stage 2 — `COMPLETE-ENDGAME-02`

Not yet audited. Must cover existing locked Obelisks/Gates, resource contributions, ownership, attacks, destruction, persisted victory/defeat, exact terminal boundary, autosave/offline/reload and terminal UI.

### Stage 3 — `COMPLETE-ENDGAME-03`

Not yet audited. Must cover bot public/allied/owned/hidden perception, ordinary-command alliance/Solar War/final-object behavior and final three-faction closure.

## 8. Milestone map

| Milestone | Status | Delivery |
|---|---|---|
| M1–M6b | completed | through PR #151 |
| M7 — Autonomous bot parity | substantially delivered | economy/logistics/PvE/meta delivered; endgame parity deferred to M8 stage 3 |
| M8.1 — Participation foundation | audited | Audit #152; #153–#156 after merge |
| M8.2 — Final objects and terminal result | not audited | `COMPLETE-ENDGAME-02` |
| M8.3 — Bot endgame closure | not audited | `COMPLETE-ENDGAME-03` |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 9. Key invariants

- current `main` is the only valid merged runtime baseline;
- alliance membership is optional and solo completion remains legal;
- exactly four implementation PRs are authorized by Audit #152;
- schema v18/save v5 may be introduced only by #153 in this batch;
- player and future bots use ordinary commands, owned resources and explicit visibility classes;
- no new endgame catalog/assets are assumed necessary because faction Obelisk/Gate entries already exist;
- no final-object or terminal mechanics enter stage 1;
- progression, determinism, Browser, Graphify and performance gates remain mandatory.

## 10. Immediate action

Validate the final Audit #152 documentation head, resolve review, squash merge and create only #153 from fresh `main`. Record exact Audit #152 squash SHA in #153.
