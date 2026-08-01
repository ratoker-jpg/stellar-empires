# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-08-01  
**Last merged PR:** #141 `BOT-COLONY-LOGISTICS-GATE` · `0167ad689e299438c9d0550ee20ba53452c93d39`  
**Runtime baseline:** schema v16 / save format v3 / immutable dual progression profiles  
**Last completed batch:** `MULTI-COLONY-ECONOMY-LOGISTICS-01`  
**Current authorized work:** Audit #142 `SUSTAINABLE-PVE-OPERATIONS-01`  
**Release target:** complete local PvE browser campaign with autonomous bot empires

## 1. Product target

```text
choose faction and immutable campaign settings
→ develop a coherent multi-colony economy
→ configure predictable logistics and market support
→ research and build fleets
→ explore, spy, transport, colonize, recycle, raid and fight
→ compete with autonomous bot empires
→ participate in alliances and Solar War
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
6. canonical product/endgame contracts;
7. completed audits and old handoffs as history.

## 3. Delivered baseline

The merged product includes:

- deterministic schema-v16 simulation and save-v3 persistence;
- immutable local campaign settings and shared active/offline time;
- compressed finite progression with permanent 15-case matrix;
- complete mechanical catalogs, runtime art and routed application;
- ordinary missions, intelligence, combat, destruction/recovery and PvE foundations;
- coherent multi-colony economy and stable planet roles;
- hardened deterministic abstract logistics;
- canonical player route and selected-colony market workflow;
- honest bot colony role/logistics planning through ordinary commands.

PR #141 completed M5 as `0167ad689e299438c9d0550ee20ba53452c93d39` after CI `30694661125`, Browser `30694661120` and Graphify `30694661124`.

## 4. Completed M5

```text
#137 Audit
→ #138 COLONY-PORTFOLIO-FOUNDATION
→ #139 LOGISTICS-ROUTE-LIFECYCLE
→ #140 COLONY-OPERATIONS-UX
→ #141 BOT-COLONY-LOGISTICS-GATE
```

Archive:

```text
docs/audits/completed/multi-colony-economy-logistics-01.md
```

## 5. Audit #142 — sustainable PvE before new meta

The existing PvE layer is broad but finite:

- depleted objects do not replenish;
- pirate bases have finite zero-production resources and no recovery/respawn;
- pirate-hunt lacks a targeted reward mechanic;
- bots do not perceive or run expeditions/object operations;
- Operations lacks one pure canonical PvE opportunity model.

Audit #142 selects M6a as a medium four-PR batch:

```text
#143 PVE-TARGET-RECOVERY
→ #144 PVE-OPERATIONS-INTELLIGENCE-UX
→ #145 BOT-PVE-OPERATIONS
→ #146 PVE-SUSTAINABILITY-GATE
```

This batch makes existing PvE repeatable, understandable and honestly contested. It does not add Arena, Admiral services, reputation or endgame.

## 6. Accepted M6a boundary

```text
PVE_TARGET_RECOVERY_SECONDS = 21_600
SPACE_OBJECT_ACTIVE_COOLDOWN_SECONDS = 300
PIRATE_HUNT_REWARD_PERMILLE = 1_500
DEFAULT_PIRATE_BASE_COUNT = 3
```

- final object depletion recovers after six campaign hours;
- pirate bases recover or safely respawn after six campaign hours;
- recovery is processed at deterministic 1,800-second world-event evaluations;
- pirate-hunt boosts only the targeted base reward;
- bots use public PvE data and ordinary commands;
- schema v16/save format v3 remain unchanged;
- no persisted PvE meta or continuously running service is introduced.

## 7. Release 1.0 definition

A player can create and resume a deterministic campaign, build and understand a multi-colony economy, configure reliable logistics, unlock the catalog, execute sustainable missions, fight and recover colonies, interact with complete PvE/meta systems, join or avoid alliances and reach victory or defeat.

Bots must use the same commands, resources, timing and intelligence limits. Save/load/offline partitions must preserve deterministic outcomes.

## 8. Milestone map

| Milestone | Status | Delivery |
|---|---|---|
| M1 — Production assets | completed | Audit #101; #102–#105 |
| M2 — Navigable Universe | completed | Audit #106; #107–#110 |
| M3 — Coherent UI shell | technically completed | Audit #111; #112–#115 |
| M3b — Navigation/usability repair | completed | Audit #125; #126–#129 |
| M4a — Ordinary missions/intelligence | completed | Audit #116; #117–#120 |
| M4b — Planet demolition/destruction/recovery | completed | Audit #121; #122–#123 |
| M4c — Local campaign time foundation | completed | Audit #130; #131–#132 |
| M4d — Campaign progression balance | completed | Audit #133; #134–#135 |
| M5 — Multi-colony economy/logistics coherence | completed | Audit #137; #138–#141 |
| M6a — Sustainable existing PvE operations | audit active | Audit #142; planned #143–#146 |
| M6b — PvE meta systems | not audited | Arena, Admiral meta, services or reputation if later justified |
| M7 — Autonomous bot parity | partial | colony logistics delivered; remaining domains require later audit |
| M8 — Complete endgame | not audited | alliances, Solar War, Obelisks, Gates, victory/defeat |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 9. Key invariants

- current `main` is the only valid baseline;
- Audit #142 is documentation-only;
- exactly four M6a implementation PRs are authorized after audit merge;
- campaign settings and progression profile remain immutable;
- active and offline paths use one orchestrator;
- player and bots use ordinary commands and visibility rules;
- schema v16/save v3 remain unless a replacement audit changes them;
- no continuously running server is required;
- permanent progression, determinism, Browser and performance gates remain mandatory.

## 10. Immediate action

Finish and validate Audit #142, resolve review and squash merge it. Then create only PR #143 `PVE-TARGET-RECOVERY` from fresh `main`; no gameplay implementation begins before the audit merges.
