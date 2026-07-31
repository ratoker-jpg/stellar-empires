# MULTI-COLONY-ECONOMY-LOGISTICS-01 — implementation contract

**Audit PR:** #137  
**Baseline:** `3bcd5c0ae67d17f8e6159a19091fe1b6b4e62992`  
**Roadmap milestone:** M5  
**Complexity:** medium  
**Authorized implementation count:** exactly 4 PRs  
**Implementation PRs:** #138–#141  
**State schema:** v16 retained  
**Save format:** v3 retained

## Product outcome

A player with multiple colonies can understand which colony produces, consumes and receives resources; configure predictable routes; use the market on an explicitly selected colony; and recover from route problems without hidden or retroactive transfers.

Bot empires with multiple colonies allocate stable colony roles and use the same specialization, logistics and market commands as the player. The resulting behavior remains deterministic under active time, offline catch-up, save/load and world-speed scaling.

## Shared invariants

- Existing `GameState`, `GameCommand`, `executeCommand()` and campaign-time boundaries remain authoritative.
- No bot-only resources, commands, route exemptions or hidden state.
- No change to `legacy-v1 | compressed-v1`, starting bank, reward multipliers, progression requirements or accepted runtime envelope.
- No server requirement and no wall-clock work outside the shared campaign-time orchestrator.
- Logistics remains an abstract scheduled resource transfer. No transport ships, fuel, distance, interception or route combat.
- One active or paused route maximum per `(empireId, originPlanetId, targetPlanetId, resourceId)` key.
- All ordering is deterministic with explicit stable tie-breakers.
- Existing saves remain valid without schema migration.

# #138 — `COLONY-PORTFOLIO-FOUNDATION`

## Purpose

Create one deterministic empire-level economy model that every player view and later bot planner can consume instead of independently scanning colonies.

## Player-visible outcome

Empire Overview shows colony roles, economy health, stock pressure and scheduled route flow rather than only raw totals.

## Expected paths

```text
src/simulation/economy/empireEconomy.ts                 new
src/simulation/economy/types.ts
src/simulation/logistics/routes.ts                      pure selectors only if needed
src/ui/empireOverviewViewModel.ts
src/ui/empireOverview.ts
src/styles/empireOverview.css                           or existing overview stylesheet
tests/simulation/empireEconomy.test.ts                  new
tests/ui/empireOverviewViewModel.test.ts
tests/e2e/empireOverview.spec.ts                        or existing shell E2E
```

## Required model

For every owned colony derive:

- stock, capacity, production per hour and fill ratio for metal/crystal/gas;
- energy, population and stability efficiency;
- specialization and development template;
- active queue counts and stationed/active fleets;
- scheduled inbound and outbound amount per hour per resource from active routes;
- effective net flow = local production + inbound - outbound;
- health reasons with stable codes: `energy-deficit`, `population-deficit`, `stability-deficit`, `storage-pressure`, `resource-deficit`, `route-stalled`;
- empire aggregate totals and the same flow dimensions.

Calculations are pure selectors. They do not mutate `GameState`, issue commands or reveal foreign information.

## Acceptance

- deterministic ordering by system, position and planet ID;
- no checksum/state mutation;
- route-flow calculations cover multiple routes and priorities;
- Empire Overview displays all required dimensions and remains usable at 1366×768 and 1920×1080;
- focused unit/view-model tests and Browser E2E pass.

# #139 — `LOGISTICS-ROUTE-LIFECYCLE`

## Purpose

Close deterministic route lifecycle gaps before richer UI or bot automation depends on them.

## Expected paths

```text
src/simulation/logistics/routes.ts
src/simulation/logistics/types.ts                       only if a compatible derived type is required
src/simulation/reducer.ts
src/simulation/planet/reconcileDestroyedPlanet.ts
src/simulation/campaign/catchUpSummary.ts
src/storage/saveFormat.ts                               validation only; schema unchanged
src/storage/migrateGameState.ts                         compatibility only
tests/simulation/logisticsRoutes.test.ts
tests/simulation/planetDestructionRecoveryLoop.test.ts
tests/audit/compressedProgressionPartition.test.ts
```

## Exact runtime rules

1. Creating a duplicate route key is rejected with stable code `LOGISTICS_ROUTE_DUPLICATE`.
2. Pausing a route preserves its configuration but performs no departures.
3. Resuming a paused route sets `nextDepartureAt = current elapsed time + intervalSeconds`; paused time is never replayed as retroactive shipments.
4. Changing an active route interval also rebases its next departure from current elapsed time.
5. Changing amount, reserve or priority without changing interval preserves the current active departure time.
6. Same-time routes continue to execute by priority descending, then route ID ascending.
7. A route transfers at most configured amount, stock above reserve and target free capacity.
8. Destruction of either endpoint removes the route atomically with the colony, as current recovery already does; no stale route survives save/load.
9. Updating or deleting another empire's route remains rejected.
10. Route commands remain ordinary deterministic commands and continue to be logged.

## Acceptance

- focused duplicate, pause/resume, interval-edit, same-time-priority and destruction tests;
- direct/chunked/save-loaded time produces identical state;
- old save-v3 routes parse unchanged;
- one-day and seven-day catch-up budgets remain green;
- no new schema or save-format version.

# #140 — `COLONY-OPERATIONS-UX`

## Purpose

Turn the existing Operations routes into a complete player workflow built on #138 and #139.

## Expected paths

```text
src/ui/operationsWorkspace.ts
src/ui/empireOverview.ts
src/ui/empireOverviewViewModel.ts
src/ui/logisticsRoutesPanel.ts                         remove or reduce to shared pure helpers
src/ui/marketPanel.ts                                  remove or reduce to shared pure helpers
src/styles/operationsWorkspace.css
src/styles/empireOverview.css                          or existing stylesheet
tests/ui/operationsWorkspace.test.ts
tests/ui/empireOverviewViewModel.test.ts
tests/e2e/appShellOperations.spec.ts
```

## UI contract

Logistics mode must provide:

- explicit origin, target and resource selectors;
- amount, reserve, interval and priority controls;
- create and edit flows using the same validated commands;
- pause/resume/delete actions;
- next departure, hourly configured flow, last result and consecutive misses;
- origin/target stock and capacity pressure from the portfolio selector;
- stable visible error/success messages;
- links to both endpoint colonies while preserving route context.

Market mode must provide:

- explicit owned-colony selector instead of silently using only the current colony;
- selected colony stock/capacity beside the quote;
- unchanged deterministic quote and `MARKET_SWAP` command path.

Duplicate legacy top-level panels must not remain independently mountable. The canonical routed Operations workspace is the single product surface.

## Acceptance

- create → edit → pause → resume → delete works in real Chromium;
- selected market colony is the planet used by the command;
- Back/Forward/reload preserve canonical route, not unsaved form drafts;
- keyboard labels and error presentation are accessible;
- no horizontal overflow at both release viewports;
- no simulation change outside ordinary commands.

# #141 — `BOT-COLONY-LOGISTICS-GATE`

## Purpose

Give autonomous empires honest empire-level colony planning and close the combined M5 batch.

## Expected paths

```text
src/simulation/bots/perception.ts
src/simulation/bots/economyPlanner.ts
src/simulation/bots/colonyLogisticsPlanner.ts           new
src/simulation/bots/scheduler.ts
src/simulation/bots/threatRecoveryPlanner.ts            only dependency wiring if required
src/simulation/progression/scenarioRunner.ts
tests/simulation/botEconomyPlanner.test.ts
tests/simulation/botColonyLogisticsPlanner.test.ts      new
tests/simulation/botScheduler.test.ts
tests/audit/multiColonyEconomyLogistics.test.ts         new
tests/audit/progressionScenarioExperiment.test.ts
```

## Bot role allocation

Canonical owned-colony order is system ID, position, then planet ID.

For bots only, when at least two colonies exist:

- first colony: `industry` + `industrial-hub`;
- second colony: `resource` + `resource-hub`;
- third colony: `military` + `fortress`;
- further colonies: `balanced` + `balanced`.

Existing non-balanced roles are not churned unless the assigned role is invalid for current state. Changes use ordinary `SET_PLANET_SPECIALIZATION` and `SET_PLANET_DEVELOPMENT_TEMPLATE` commands and respect queue blockers.

## Bot logistics policy

- Evaluate the shared #138 portfolio only from owned visible state.
- A donor is eligible when its resource fill ratio is at least 55%.
- A receiver is eligible when its ratio is at most 35%.
- Prefer the lowest receiver ratio; tie-break resource ID, receiver colony order, donor colony order.
- Maintain at most one route for the selected donor/receiver/resource key.
- Default route: 1-hour interval, reserve 40% of donor capacity, amount `clamp(floor(donor productionPerHour), 100, 1,000)`, priority 3/2/1 for receiver ratio below 15%/25%/35%.
- Update an existing route through the ordinary update command when the deterministic target parameters differ.
- If no legal logistics action can address a receiver below 15%, existing ordinary market support may act on that receiver.
- Scheduler exposes `logistics` as an auditable planner source.

## Combined gate

A deterministic two-colony fixture for each faction must demonstrate over 24 campaign hours:

- stable bot role assignment;
- at least one accepted logistics transfer when donor/receiver thresholds are present;
- no duplicate route keys;
- no retroactive departures after pause/resume;
- deterministic direct/chunked/save-loaded equality;
- bounded route count and command history;
- no hidden resources or privileged commands.

The last PR must additionally:

- keep the permanent 15-case progression matrix green;
- keep seven-day catch-up below 30 seconds in isolated CI;
- pass full CI, Browser E2E and Graphify;
- archive this audit, append batch history and synchronize project status with exact merge SHAs.

## Explicit non-goals for all four PRs

- physical cargo fleets, route distance, fuel or interception;
- trade diplomacy, player-to-player market or auction house;
- new resources or strategic-resource logistics;
- progression/economy multiplier rebalance;
- new colony limit or colonization rules;
- PvE/meta expansion, Admiral services or Arena;
- alliances, Solar War, Obelisks, Gates or victory/defeat;
- server authority or multiplayer;
- mobile redesign beyond release-viewport regression protection.

## Divergence rule

If implementation requires a state-schema/save-format change, physical convoy model, new resource, or material change to progression timing, stop the batch and amend or replace Audit #137 before expanding the implementation.