# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-08-02  
**Last merged PR:** #142 `SUSTAINABLE-PVE-OPERATIONS-01` audit · `81f1959b0bdbdd72d05dc21a2dce0a9e1470f010`  
**Runtime baseline:** schema v16 / save format v3 / immutable dual progression profiles  
**Last completed batch:** `MULTI-COLONY-ECONOMY-LOGISTICS-01`  
**Current authorized work:** #143 `PVE-TARGET-RECOVERY`  
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

M5 completed through PR #141. Audit #142 selected sustainable existing-PvE operations as the next medium four-PR batch.

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

## 5. Active M6a — sustainable PvE before new meta

```text
#142 SUSTAINABLE-PVE-OPERATIONS-01 — Audit merged
→ #143 PVE-TARGET-RECOVERY — active
→ #144 PVE-OPERATIONS-INTELLIGENCE-UX
→ #145 BOT-PVE-OPERATIONS
→ #146 PVE-SUSTAINABILITY-GATE
```

This batch makes existing PvE repeatable, understandable and honestly contested. It does not add Arena, Admiral services, reputation or endgame.

## 6. PR #143 target lifecycle foundation

Accepted constants:

```text
PVE_TARGET_RECOVERY_SECONDS = 21_600
SPACE_OBJECT_ACTIVE_COOLDOWN_SECONDS = 300
PIRATE_HUNT_REWARD_PERMILLE = 1_500
DEFAULT_PIRATE_BASE_COUNT = 3
```

Delivered on the active branch:

- final object depletion becomes eligible after six campaign hours;
- non-final extraction retains the existing five-minute cooldown;
- recovery is processed at deterministic 1,800-second world-event evaluations;
- eligible objects restore initial yield and clear temporary control;
- pirate bases restore deterministic resources/defenses after six hours;
- destroyed bases respawn only at their original unoccupied position;
- at most one pirate target recovers per evaluation;
- long offline advances preserve chronological battle/recovery visibility;
- pirate-hunt boosts only the targeted base reward;
- direct, chunked and save-loaded 48-hour states are equal;
- schema v16/save format v3 remain unchanged.

The verified ordinary space-object mission, reward, fleet return and rehome resolver remains intact.

Code head `ad23459708d6b7dab57c29c898e5772ba96e8917` passed CI `30741354763` and Graphify `30741354825`; Browser `30741354743` is required before merge. Final documentation-head workflows remain mandatory.

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
| M6a — Sustainable existing PvE operations | implementation active | Audit #142; #143 active; #144–#146 ordered |
| M6b — PvE meta systems | not audited | Arena, Admiral meta, services or reputation if later justified |
| M7 — Autonomous bot parity | partial | colony logistics delivered; remaining domains require later audit |
| M8 — Complete endgame | not audited | alliances, Solar War, Obelisks, Gates, victory/defeat |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 9. Key invariants

- current `main` is the only valid baseline;
- exactly four M6a implementation PRs are authorized;
- #143 contains lifecycle recovery only;
- #144 owns player opportunity intelligence/UX;
- #145 owns honest bot PvE operations;
- #146 owns final three-faction sustainability gate and closure;
- campaign settings and progression profile remain immutable;
- active and offline paths use one orchestrator;
- player and bots use ordinary commands and visibility rules;
- schema v16/save v3 remain unless a replacement audit changes them;
- no continuously running server is required;
- permanent progression, determinism, Browser and performance gates remain mandatory.

## 10. Immediate action

Validate the final #143 documentation head, resolve review and squash merge it. Then create only #144 `PVE-OPERATIONS-INTELLIGENCE-UX` from fresh `main`; do not start #145 or #146 early.
