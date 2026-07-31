# MULTI-COLONY-ECONOMY-LOGISTICS-01 — verified baseline and source map

**Audit PR:** #137  
**Baseline:** merged `main` `3bcd5c0ae67d17f8e6159a19091fe1b6b4e62992`  
**Graphify source:** final PR #135 head `cca00be156c36e0ae80f963a81b0fa6242284702`, workflow `30640954312`, artifact `graphify-audit-output`  
**Graphify corpus:** 371 code files · 2,712 nodes · 9,177 edges · 118 communities

## Evidence labels

- **VERIFIED** — confirmed from current source, tests, workflow output or merged GitHub history.
- **INFERRED** — supported by current behavior but not encoded as an explicit contract.
- **DECISION** — scope choice made by Audit #137.
- **UNKNOWN** — not established and not permitted to drive implementation silently.

## Current runtime

### Colony portfolio

**VERIFIED**

- `PlanetState` already stores per-colony economy, specialization, development template, queues and inventory.
- `createEmpireOverviewViewModel()` aggregates resource stock, capacity and production and lists queue/fleet counts per colony.
- The overview does not expose route inflow/outflow, storage pressure, deficits, specialization/template identity or sustainability diagnostics.
- `PLANET_SPECIALIZATIONS` already defines balanced/resource/industry/military effects.
- `PLANET_DEVELOPMENT_TEMPLATES` already defines balanced/resource-hub/industrial-hub/fortress recommendations.
- Changing specialization is blocked while local queues are active; template changes are deterministic commands.

Primary paths:

```text
src/simulation/economy/planetEconomy.ts
src/simulation/economy/types.ts
src/simulation/planet/specialization.ts
src/simulation/planet/specializationCommands.ts
src/simulation/planet/types.ts
src/ui/empireOverviewViewModel.ts
src/ui/empireOverview.ts
src/ui/planetDevelopmentControls.ts
```

### Logistics runtime

**VERIFIED**

- `GameState.logisticsRoutes` is deterministic state and is validated by save format v3 and read by existing migrations.
- Player and bots share `CREATE_LOGISTICS_ROUTE`, `UPDATE_LOGISTICS_ROUTE` and `DELETE_LOGISTICS_ROUTE` command validation.
- A route transfers exactly one resource between two owned colonies on a fixed interval.
- Transfer amount is bounded by configured amount, stock above the origin reserve and target free capacity.
- Same-time departures resolve by priority descending and route ID ascending.
- Current bounds are 300–86,400 seconds per interval and at most 100,000 units per trip.
- Duplicate routes for the same empire/origin/target/resource are currently allowed, so legitimate baseline save-v3 files may already contain duplicate keys.
- `readLogisticsRoutes()` currently preserves every valid route and supplies defaults only for `consecutiveMisses` and `lastResult`; it does not normalize duplicate keys.
- Pausing does not rebase `nextDepartureAt`; resuming after elapsed time can therefore execute retroactive departures.
- Destroying either endpoint currently removes the route atomically through `reconcileDestroyedPlanet()`.
- Route transport is intentionally abstract: no cargo ship, fuel, distance, travel time or interception is consumed.
- `countPlayerLogisticsTransfers()` compares only before/after `lastResult`; a single large transition containing several departures can report at most one success per surviving route and can report zero when a final miss follows earlier successes.
- `advanceCampaignTime()` usually summarizes one chronological boundary at a time, but the summary helper and shared ADVANCE_TIME reducer do not provide an exact per-departure accounting contract.

Primary paths:

```text
src/simulation/logistics/routes.ts
src/simulation/logistics/types.ts
src/simulation/reducer.ts
src/simulation/planet/reconcileDestroyedPlanet.ts
src/simulation/campaign/time.ts
src/simulation/campaign/catchUpSummary.ts
src/storage/saveFormat.ts
src/storage/migrateGameState.ts
```

### Market

**VERIFIED**

- The market is global deterministic state with reserves, fee, price impact and bounded trade history.
- A trade spends and receives resources on one owned planet through `MARKET_SWAP`.
- Bot economy planning already uses the market as local emergency support.
- The canonical Operations UI always trades on the active colony and does not show that colony's stock beside the quote.

Primary paths:

```text
src/simulation/market/market.ts
src/simulation/market/types.ts
src/simulation/bots/economyPlanner.ts
src/ui/operationsWorkspace.ts
```

### Bot behavior

**VERIFIED**

- `planBotEconomy()` sorts owned colonies and chooses the first colony with an empty build queue.
- It evaluates stock ratios and phase prerequisites only for that selected colony.
- A balanced selected colony becomes resource-specialized in compressed campaigns; therefore the original colony is normally already `resource` before a second colony exists.
- A fixed two-colony mapping of first=`industry`, second=`resource` conflicts with a blanket rule that existing non-balanced roles never change; the implementation contract must define finite deterministic reconciliation.
- No bot planner creates, updates, pauses or deletes logistics routes.
- No bot planner measures aggregate route flow or donor/receiver pressure.
- The scheduler supports economy/research/production/fleet/threat sources but no logistics source.

Primary paths:

```text
src/simulation/bots/perception.ts
src/simulation/bots/economyPlanner.ts
src/simulation/bots/researchProductionPlanner.ts
src/simulation/bots/threatRecoveryPlanner.ts
src/simulation/bots/fleetMissionPlanner.ts
src/simulation/bots/scheduler.ts
src/simulation/progression/scenarioRunner.ts
```

### UI and test surface

**VERIFIED**

- `#/operations/logistics` and `#/operations/market` are canonical routed modes in `operationsWorkspace.ts`.
- `src/ui/logisticsRoutesPanel.ts` and `src/ui/marketPanel.ts` duplicate older panel implementations and have no inbound Graphify caller.
- Current logistics UI creates fixed-priority routes and can only pause/resume/delete them; it cannot edit amount, reserve, interval or priority.
- Current route cards omit next departure, consecutive misses, transfer rate and source/target storage pressure.
- Browser E2E verifies routing and viewport overflow but not route creation/editing, colony-specific market behavior or persistence.
- Existing focused coverage consists of three logistics runtime tests, market tests, specialization tests, one Operations summary test and route-only Browser navigation.

Primary paths:

```text
src/ui/operationsWorkspace.ts
src/styles/operationsWorkspace.css
src/ui/empireOverviewViewModel.ts
src/ui/empireOverview.ts
src/ui/logisticsRoutesPanel.ts
src/ui/marketPanel.ts
tests/simulation/logisticsRoutes.test.ts
tests/simulation/market.test.ts
tests/simulation/planetSpecialization.test.ts
tests/ui/empireOverviewViewModel.test.ts
tests/ui/operationsWorkspace.test.ts
tests/e2e/appShellOperations.spec.ts
```

## Graphify findings

**VERIFIED**

- Logistics is a small isolated community around `routes.ts`, `types.ts` and the legacy panel.
- Market is similarly isolated around `market.ts`, `types.ts` and the legacy panel.
- Colony specialization is connected to production durations and planet-development controls.
- Bot economy/progression is a high-coupling community connected to scheduler, threat recovery and the progression scenario.
- `GameState`, `createInitialGameState()` and `executeCommand()` remain project god nodes; M5 must not introduce a second state or command path.
- The previous graph contains code only; documentation and CSS must be inspected directly and Graphify cannot validate browser semantics.

## Audit conclusions

**DECISION**

1. M5 is a **medium** batch with exactly four implementation PRs.
2. State schema v16 and save format v3 are retained.
3. The existing abstract logistics model is retained; physical convoys, fuel, distance, interception and route combat are deferred.
4. Market remains emergency local balancing, not a replacement for inter-colony logistics.
5. Player actions and bot actions continue through the same ordinary commands and validators.
6. No progression constants, starting resources, world speed or profile identity change in this batch.
7. The two dead standalone panel modules are removed or reduced to shared pure helpers; duplicate independently mounted UI is forbidden.
8. Existing duplicate save-v3 routes are repaired after integrity validation by retaining the earliest creation-sequence route for each key; later duplicates never execute after load.
9. Exact catch-up accounting uses ephemeral per-departure receipts from the shared advance-time path, not persisted counters or inferred final `lastResult` deltas.
10. Bot roles converge to the canonical current colony ordering whenever the empire has at least two colonies; previous single-colony specialization is not grandfathered against that mapping.

## Non-critical unknowns

- **UNKNOWN:** whether a later PvE batch will replace abstract routes with physical convoys. This does not block M5 because the current product already exposes abstract persistent routes and save-v3 identity must remain stable.
- **UNKNOWN:** final release colony-count distribution. M5 planners must be deterministic for any positive colony count and must not assume exactly two colonies.

There are no critical unresolved unknowns blocking Audit #137.