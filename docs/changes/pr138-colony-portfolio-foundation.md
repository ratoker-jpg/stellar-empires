# PR #138 — COLONY-PORTFOLIO-FOUNDATION

**Batch:** `MULTI-COLONY-ECONOMY-LOGISTICS-01`  
**Audit:** #137 · `4e7fd20fdc415f30bf8a1476b67c79b0b8e79166`  
**Baseline:** merged `main` `4e7fd20fdc415f30bf8a1476b67c79b0b8e79166`  
**State schema:** v16 retained  
**Save format:** v3 retained

## Delivered

### Shared empire economy portfolio

`createEmpireEconomyPortfolio()` is the single pure selector for player views and later bot planning. It derives only from owned state and does not mutate `GameState`, issue commands or expose foreign data.

For every owned colony it returns:

- deterministic system/position/planet ordering;
- stock, capacity, fill permille and local production for metal, crystal and gas;
- scheduled inbound and outbound route flow per hour from active routes;
- effective net flow = local production + inbound − outbound;
- energy, population and stability balances;
- specialization and development template identity;
- building/ship/defence queue load;
- stationed fleet and active mission counts;
- stable health reason codes.

Empire aggregates expose the same resource and flow dimensions plus fleet and health summaries.

### Stable health rules

```text
energy-deficit      produced < consumed or efficiency < 100%
population-deficit  used > capacity
stability-deficit   capacity < demand or efficiency < 100%
storage-pressure    any resource fill >= 90%
resource-deficit    any resource fill <= 15% and effective net flow <= 0
route-stalled       active related route has a non-transfer result and misses > 0
```

The reason order is stable and deterministic.

### Empire Overview

The canonical Command → Overview workspace now shows:

- empire stock, fill pressure, local production, route flow and effective net flow;
- colony specialization and development role;
- per-resource stock/capacity/fill and local/inbound/outbound/net flow;
- energy, population, stability, queue and fleet load;
- localized health badges;
- existing active-colony navigation.

The layout remains responsive at 1366×768 and 1920×1080.

## Tests

- pure selector ordering, flow aggregation, health and checksum-neutral state coverage;
- foreign-colony/route/fleet isolation;
- view-model aggregation and route-flow coverage;
- real Chromium role/health/flow presentation at both release viewports;
- permanent progression matrix and catch-up performance remain unchanged.

## Code validation before status synchronization

Code head `bfeac936232bbe16a25aac26d22e3819c7cc8d60` passed:

- CI `30659066384` — asset audit, lint, typecheck, unit/integration suite, build, progression scenario and catch-up performance;
- Graphify `30659066387` — passed;
- Browser E2E `30659066404` — final result recorded in the PR after completion.

The final documentation head is rerun through all required workflows before merge.

## Explicit exclusions

- duplicate-route rejection or save repair;
- pause/resume or interval lifecycle changes;
- catch-up departure receipts;
- market workflow changes;
- bot colony-role or logistics planning;
- progression constants or campaign envelope changes;
- schema/save-format changes;
- physical cargo fleets, route distance, fuel, interception or combat.

## Ordered next work

After #138 merges, the only authorized next implementation is #139 `LOGISTICS-ROUTE-LIFECYCLE` from fresh `main`.
