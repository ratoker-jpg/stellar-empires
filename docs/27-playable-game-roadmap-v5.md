# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-07-31  
**Last merged PR:** #139 `LOGISTICS-ROUTE-LIFECYCLE` · `dc8b42fc0e41b631a61dda524224145f2d8ba214`  
**Runtime baseline:** schema v16 / save format v3 / immutable dual progression profiles  
**Last completed batch:** `CAMPAIGN-PROGRESSION-BALANCE-01`  
**Current authorized work:** PR #140 `COLONY-OPERATIONS-UX`  
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
- hardened abstract route lifecycle, exact ephemeral catch-up receipts and deterministic legacy duplicate repair.

PR #139 merged as `dc8b42fc0e41b631a61dda524224145f2d8ba214` after CI `30661645271`, Browser `30661645781` and Graphify `30661645236`.

## 4. Accepted M5 contract

Audit #137 authorized exactly:

```text
#138 COLONY-PORTFOLIO-FOUNDATION — merged
→ #139 LOGISTICS-ROUTE-LIFECYCLE — merged
→ #140 COLONY-OPERATIONS-UX — active
→ #141 BOT-COLONY-LOGISTICS-GATE
```

No fifth M5 implementation PR is authorized.

## 5. Current implementation — colony Operations UX

PR #140 completes the player-facing product surface without changing simulation rules:

- canonical routed logistics and market modes;
- route create/edit/pause/resume/delete controls;
- priority, next departure, configured hourly flow, last result and miss diagnostics;
- origin/target pressure from the shared portfolio;
- endpoint links with browser-history return;
- explicit owned-colony market selection and stock/capacity context;
- selected colony passed to ordinary `MARKET_SWAP`;
- local accessible success/error feedback;
- unsaved form drafts remain presentation-only and disappear after reload;
- real Chromium workflow at both release viewports.

The former standalone panels are now render modules consumed by the routed Operations workspace and cannot mount independently.

## 6. Remaining M5 gap

After #140, only #141 remains. It must:

- converge bot colony roles deterministically;
- create/update ordinary logistics routes from the shared portfolio;
- use ordinary selected-colony market support when logistics cannot solve a critical deficit;
- prove direct/chunked/save-loaded equality in three-faction 24-hour fixtures;
- retain progression and seven-day performance gates;
- archive and close M5 with exact merge SHAs.

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
| M5 — Multi-colony economy/logistics coherence | implementation active | #137 merged; #138–#139 merged; #140 active; #141 ordered |
| M6 — Full PvE/meta systems | not audited | PvE depth, Arena, Admiral meta, services |
| M7 — Autonomous bot parity | not audited | honest full-domain bot loop beyond colony economy |
| M8 — Complete endgame | not audited | alliances, Solar War, Obelisks, Gates, victory/defeat |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 9. Key invariants

- current `main` is the only valid baseline;
- #141 must not start before #140 merges;
- campaign settings and progression profile remain immutable;
- active and offline paths use one orchestrator;
- player and bots use ordinary commands and visibility rules;
- schema v16/save v3 remain unless the audit is replaced;
- M5 does not alter progression constants or duration gates;
- no continuously running server is required.

## 10. Immediate action

Validate the latest PR #140 head through CI, Browser E2E and Graphify, resolve every blocking review thread, mark ready and squash merge. Then create only PR #141 `BOT-COLONY-LOGISTICS-GATE` from fresh `main` and close M5 there.
