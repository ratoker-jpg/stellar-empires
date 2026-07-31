# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-07-31  
**Last merged PR:** #138 `COLONY-PORTFOLIO-FOUNDATION` · `b6a598e1a2d9b4ec30cfaf82c2c21773ea0cea1f`  
**Runtime baseline:** schema v16 / save format v3 / immutable dual progression profiles  
**Last completed batch:** `CAMPAIGN-PROGRESSION-BALANCE-01`  
**Current authorized work:** PR #139 `LOGISTICS-ROUTE-LIFECYCLE`  
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
- immutable local campaign settings and x1/x2/x5/x10 time;
- shared active/offline chronological processing;
- compressed finite-campaign progression and permanent 15-case matrix;
- complete mechanical catalogs and runtime art;
- routed application, Universe hierarchy and release-viewport browser gate;
- ordinary missions, intelligence, combat, destruction/recovery and PvE foundations;
- multi-colony economy, specializations, development templates, abstract routes and market;
- a shared pure empire economy portfolio with stock pressure, configured flow, effective net flow and health diagnostics.

PR #138 merged the portfolio foundation as `b6a598e1a2d9b4ec30cfaf82c2c21773ea0cea1f` after CI `30659596856`, Browser `30659596868` and Graphify `30659596839`.

## 4. Accepted M5 contract

Audit #137 authorized exactly:

```text
#138 COLONY-PORTFOLIO-FOUNDATION — merged
→ #139 LOGISTICS-ROUTE-LIFECYCLE — active
→ #140 COLONY-OPERATIONS-UX
→ #141 BOT-COLONY-LOGISTICS-GATE
```

No fifth M5 implementation PR is authorized.

## 5. Current implementation — logistics route lifecycle

PR #139 closes runtime and compatibility gaps before UI and bot automation depend on routes:

- reject new duplicate `(empire, origin, target, resource)` keys;
- paused routes perform no departures;
- resume and active interval edits schedule from current game time;
- amount/reserve/priority-only edits retain the current departure;
- same-time routes resolve priority descending, then route ID ascending;
- every departure emits an ephemeral receipt;
- campaign summaries count every successful player receipt exactly;
- old duplicate save-v3 routes normalize deterministically after integrity validation;
- schema v16/save v3 remain unchanged.

Receipts are never persisted and do not affect checksums or replay identity.

## 6. Remaining M5 gap

After #139:

- #140 completes route create/edit/pause/resume/delete diagnostics, endpoint context and explicit selected-colony market workflow;
- #141 gives bots deterministic colony-role and ordinary logistics planning and closes the combined M5 gate.

Physical convoys, fuel, distance, interception and route combat remain outside M5.

## 7. Release 1.0 definition

A player can create and resume a deterministic campaign, build and understand a multi-colony economy, configure reliable logistics, unlock the catalog, navigate and execute supported missions, fight and recover colonies, interact with complete PvE/meta systems, join or avoid alliances and reach victory or defeat.

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
| M5 — Multi-colony economy/logistics coherence | implementation active | #137 merged; #138 merged; #139 active; #140–#141 ordered |
| M6 — Full PvE/meta systems | not audited | PvE depth, Arena, Admiral meta, services |
| M7 — Autonomous bot parity | not audited | honest full-domain bot loop beyond colony economy |
| M8 — Complete endgame | not audited | alliances, Solar War, Obelisks, Gates, victory/defeat |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 9. Key invariants

- current `main` is the only valid baseline;
- #140 must not start before #139 merges;
- campaign settings and progression profile remain immutable;
- no elapsed duration is skipped;
- active and offline paths use one orchestrator;
- player and bots use ordinary commands and visibility rules;
- schema v16/save v3 remain unless the audit is replaced;
- telemetry receipts remain outside deterministic state;
- M5 does not alter progression constants or duration gates;
- no continuously running server is required.

## 10. Immediate action

Validate the latest PR #139 head through CI, Browser E2E and Graphify, resolve every blocking review thread, mark ready and squash merge. Then create only PR #140 `COLONY-OPERATIONS-UX` from fresh `main`.
