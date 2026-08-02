# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-08-02  
**Last merged PR:** #144 `PVE-OPERATIONS-INTELLIGENCE-UX` · `dbc5bdf0bce439efa5f0c61c8846bbd9960ba43a`  
**Runtime baseline:** schema v16 / save format v3 / immutable dual progression profiles  
**Last completed batch:** `MULTI-COLONY-ECONOMY-LOGISTICS-01`  
**Current authorized work:** #145 `BOT-PVE-OPERATIONS`  
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

The merged product includes deterministic schema-v16/save-v3 campaigns, immutable active/offline time, compressed finite progression, complete catalogs/runtime art, ordinary missions/intelligence/combat, destruction/recovery, coherent multi-colony economy, hardened logistics, player colony operations and honest bot colony logistics.

M5 completed through #141. Audit #142 authorized the current four-PR sustainable-PvE batch. #143 and #144 are merged.

## 4. Completed M5

```text
#137 Audit
→ #138 COLONY-PORTFOLIO-FOUNDATION
→ #139 LOGISTICS-ROUTE-LIFECYCLE
→ #140 COLONY-OPERATIONS-UX
→ #141 BOT-COLONY-LOGISTICS-GATE
```

Archive: `docs/audits/completed/multi-colony-economy-logistics-01.md`.

## 5. Active M6a — sustainable PvE before new meta

```text
#142 SUSTAINABLE-PVE-OPERATIONS-01 — Audit merged
→ #143 PVE-TARGET-RECOVERY — merged
→ #144 PVE-OPERATIONS-INTELLIGENCE-UX — merged
→ #145 BOT-PVE-OPERATIONS — active
→ #146 PVE-SUSTAINABILITY-GATE
```

This batch makes existing PvE repeatable, understandable and honestly contested. It does not add Arena, Admiral services, reputation or endgame.

## 6. Delivered #143–#144 foundation

#143 delivered deterministic object/pirate recovery, occupied-position protection, chronological offline recovery, targeted pirate-hunt rewards and 48-hour partition equality.

#144 delivered one pure opportunity model for expeditions, objects, pirate bases and active events, plus routed Operations/report presentation without new routes or command paths.

## 7. Active #145 bot PvE parity

#145 lets autonomous empires participate under the same information and command rules:

- public-only PvE perception;
- personality-aware canonical opportunity selection;
- ordinary fleet creation, expedition, object, legal pirate attack and recall commands;
- ready-owned-inventory-only fleet formation;
- 40% gas reserve for special operations;
- active-event/current-level-3-intelligence/120%-safety requirements for pirate-hunt;
- true recovery/high-threat actions before PvE;
- at most one `pve` command per decision;
- routine scheduler PvE unlock after heavy-fleet at `planet-destruction`;
- six-hour routine cadence and one-hour response to targeted events or active operations;
- hidden-player-state invariance;
- inherited logistics, determinism and performance gates.

Code head `db29dbe0a69ba38eea6a2f3ba838604305ec0505` passed CI `30746581384`, Browser `30746581373` and Graphify `30746581362`, including the permanent 15-case progression matrix. Performance: 1 day `6.06s`; 7 days `29.81s`.

## 8. Release 1.0 definition

A player can create and resume a deterministic campaign, build and understand a multi-colony economy, configure reliable logistics, unlock the catalog, execute sustainable missions, fight and recover colonies, interact with complete PvE/meta systems, join or avoid alliances and reach victory or defeat.

Bots must use the same commands, resources, timing and intelligence limits. Save/load/offline partitions must preserve deterministic outcomes.

## 9. Milestone map

| Milestone | Status | Delivery |
|---|---|---|
| M1 — Production assets | completed | Audit #101; #102–#105 |
| M2 — Navigable Universe | completed | Audit #106; #107–#110 |
| M3 — Coherent UI shell | technically completed | Audit #111; #112–#115 |
| M3b — Navigation/usability repair | completed | Audit #125; #126–#129 |
| M4a — Ordinary missions/intelligence | completed | Audit #116; #117–#120 |
| M4b — Demolition/destruction/recovery | completed | Audit #121; #122–#123 |
| M4c — Local campaign time | completed | Audit #130; #131–#132 |
| M4d — Campaign progression balance | completed | Audit #133; #134–#135 |
| M5 — Multi-colony economy/logistics | completed | Audit #137; #138–#141 |
| M6a — Sustainable existing PvE | implementation active | Audit #142; #143–#144 merged; #145 active; #146 ordered |
| M6b — PvE meta systems | not audited | Arena, Admiral meta/services/reputation only if later justified |
| M7 — Autonomous bot parity | partial | colony logistics merged; PvE parity active in #145 |
| M8 — Complete endgame | not audited | alliances, Solar War, Obelisks, Gates, victory/defeat |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 10. Key invariants

- current `main` is the only valid baseline;
- exactly four M6a implementation PRs are authorized;
- #143 owns lifecycle recovery;
- #144 owns player opportunity intelligence/UX;
- #145 owns honest bot PvE operations;
- #146 owns final sustainability evidence and closure;
- player and bots use ordinary commands and visibility rules;
- campaign identity, schema v16/save v3 and one active/offline orchestrator remain unchanged;
- progression, determinism, Browser and performance gates remain mandatory.

## 11. Immediate action

Validate final #145 documentation head, resolve review and squash merge. Then create only #146 `PVE-SUSTAINABILITY-GATE` from fresh `main`; do not begin a new batch early.
