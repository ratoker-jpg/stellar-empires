# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-08-01  
**Last merged PR:** #140 `COLONY-OPERATIONS-UX` · `01eab1366289526553cdffcb1042ee98a8a59040`  
**Runtime baseline:** schema v16 / save format v3 / immutable dual progression profiles  
**Last completed batch:** `CAMPAIGN-PROGRESSION-BALANCE-01`  
**Current authorized work:** PR #141 `BOT-COLONY-LOGISTICS-GATE` closure  
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
- multi-colony economy, specializations, development templates and market;
- a shared empire portfolio with stock pressure and configured route flow;
- hardened abstract route lifecycle, exact ephemeral player catch-up receipts and deterministic legacy duplicate repair;
- one canonical routed route-management and selected-colony market workflow.

PR #140 merged as `01eab1366289526553cdffcb1042ee98a8a59040` after CI `30663714857`, Browser `30663714825` and Graphify `30663714856`.

## 4. Final M5 contract

Audit #137 authorized exactly:

```text
#138 COLONY-PORTFOLIO-FOUNDATION — merged
→ #139 LOGISTICS-ROUTE-LIFECYCLE — merged
→ #140 COLONY-OPERATIONS-UX — merged
→ #141 BOT-COLONY-LOGISTICS-GATE — active closure PR
```

No fifth M5 implementation PR is authorized.

## 5. Current implementation — bot colony logistics closure

PR #141 completes honest autonomous colony economy behavior:

- canonical colony order by system ID, position and planet ID;
- deterministic industry/resource/military/balanced role allocation;
- specialization convergence before development template;
- queue-aware finite retry without stable-state churn;
- donor/receiver selection from the shared owned portfolio;
- ordinary `CREATE_LOGISTICS_ROUTE` and `UPDATE_LOGISTICS_ROUTE` commands;
- ordinary local `MARKET_SWAP` only when a critical receiver has no legal donor;
- auditable `logistics` scheduler source;
- at most one role/logistics command per bot decision;
- three-faction 24-hour direct/chunked/save-loaded closure gate.

No hidden bot economy, requirement bypass, privileged command or outcome-peeking path exists.

## 6. M5 closure gate

Aegis, Synod and Veyra two-colony fixtures prove:

- convergence from preexisting resource/balanced assignments;
- stable final canonical roles;
- successful positive route transfers;
- one bounded route and no duplicate key;
- bounded command history;
- deterministic state and summary equality across time partitions and save/load.

Code head `bd7c39e7a5de6641dc0f92d3be38d01e69c1a8cc` passed CI `30694352999` and Graphify `30694352977`. Browser `30694352963` and the final documentation-head rerun remain mandatory before merge.

Physical convoys, fuel, distance, interception and route combat remain outside M5.

## 7. Release 1.0 definition

A player can create and resume a deterministic campaign, build and understand a multi-colony economy, configure reliable logistics, unlock the catalog, execute supported missions, fight and recover colonies, interact with complete PvE/meta systems, join or avoid alliances and reach victory or defeat.

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
| M5 — Multi-colony economy/logistics coherence | closure active | #137 merged; #138–#140 merged; #141 active closure |
| M6 — Full PvE/meta systems | not audited | PvE depth, Arena, Admiral meta, services |
| M7 — Autonomous bot parity | not audited | honest full-domain bot loop beyond colony economy |
| M8 — Complete endgame | not audited | alliances, Solar War, Obelisks, Gates, victory/defeat |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 9. Key invariants

- current `main` is the only valid baseline;
- no fifth M5 implementation PR exists;
- campaign settings and progression profile remain immutable;
- active and offline paths use one orchestrator;
- player and bots use ordinary commands and visibility rules;
- schema v16/save v3 remain unless a new audit changes them;
- M5 does not alter progression constants or duration gates;
- no continuously running server is required.

## 10. Immediate action

Validate the latest PR #141 documentation head through CI, Browser E2E and Graphify, resolve every blocking review thread, mark ready and squash merge. Then create only Audit PR #142 from fresh `main`; no implementation begins before that audit.
