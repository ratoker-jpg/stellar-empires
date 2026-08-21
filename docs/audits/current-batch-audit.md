# POST-1.0-NEMEXIA-PARITY-AUDIT

**State:** complete for controller re-review after FIX — docs only  
**Audit baseline:** `538a0f22ab77687b148916c9a50721fca32930b4`  
**Baseline source:** PR #172 `docs: define post-1.0 Nemexia reference roadmap`  
**Runtime baseline:** schema v19 / save format v6  
**Implementation authorized:** no  
**Audit PR:** #173  
**Audit branch:** `audit/post-1.0-nemexia-parity`

## Controller gate

This is an Audit artifact only. Keep PR #173 open for controller review. Do not merge this Audit and do not begin implementation until the controller explicitly approves the Audit, classifications and proposed batch.

Audit claims use both protocol evidence-state and parity classification:

- **CONFIRMED / VERIFIED** — supported by current executable source, tests, generated Graphify evidence or authoritative current documents;
- **DISPROVED** — a prior hypothesis contradicted by current executable evidence;
- **UNKNOWN** — evidence is insufficient; no implementation assumption may be made;
- **DECISION** — an explicit bounded Stellar project choice proposed by this Audit.

Nemexia-reference streams are classified exactly as required by `docs/29-post-1.0-nemexia-reference-roadmap.md`:

- `KEEP_STELLAR`
- `ADAPT_FROM_NEMEXIA`
- `RESEARCH`
- `REJECT`

A reference classification is not automatically an implementation work item.

## Executive verdict

**Fresh Game → Terminal is not organically proven on the audited baseline.**

The strongest ordinary-command campaign proof is:

```text
Fresh Game
→ ordinary compressed-v1 economy/research/production/expedition/fleet commands
→ all empires classified as endgame-preparation
→ STOP
```

The proof does **not** continue through physical Planet Destroyer production, a measured successful Solar War qualification, organic Obelisk/final-project/Gate funding/building or terminal victory/defeat.

The exact executable break is important: `compressed-v1` can become capability-ready for the canonical Planet Destroyer and therefore advance its phase label, but its production-target path never requests the physical Planet Destroyer. `legacy-v1` does request it. No alternate compressed generic production path was found in the scheduler/research-production chain.

The existing terminal closure test is valuable, but it is a **prepared endgame fixture**, not Fresh Game → Terminal evidence: it injects late buildings, a Planet Destroyer, very large Solar War fleets and later final-project resources before proving Solar War/final-object/save/runtime closure.

**Priority decision:** P0 organic closure outranks all optional Nemexia-reference parity additions. Required coverage 7–17 is audited below, but it does not expand the implementation batch merely because a Nemexia concept exists.

## Studied surfaces

### Authority / control plane

- `AGENTS.md`
- `docs/28-audit-first-autonomous-delivery-protocol.md`
- `docs/audits/current-execution-state.md`
- `docs/audits/current-batch-audit.md`
- `docs/17-continuation-guide.md`
- `docs/project-status.json`
- `docs/16-execution-roadmap.md`
- `docs/roadmap-pr-index.json`
- `docs/29-post-1.0-nemexia-reference-roadmap.md`
- `docs/audits/completed/m9-release-candidate.md`
- PR #172 exact baseline commit/title

### Graphify / repository analysis

- `.agents/skills/graphify/SKILL.md`
- `.graphify-version`
- `scripts/graphify-audit.sh`
- `.github/workflows/graphify-audit.yml`
- exact-head Graphify Actions run #1245 / run id `32466413596`
- Actions artifact `graphify-audit-output` / artifact id `9440848884`
- generated `graphify-out/graph.json`
- generated `graphify-out/GRAPH_REPORT.md`
- generated `graphify-ci.log`

### P0–P6 runtime/test surfaces

- `src/simulation/createInitialGameState.ts`
- `src/simulation/progression/scenarioRunner.ts`
- `src/simulation/bots/progressionPhase.ts`
- `src/simulation/bots/progressionPriorities.ts`
- `src/simulation/bots/researchProductionPlanner.ts`
- `src/simulation/bots/scheduler.ts`
- `src/simulation/bots/endgameParticipationPlanner.ts`
- `src/simulation/bots/endgameFinalObjectPlanner.ts`
- `src/simulation/bots/fleetMissionPlanner.ts`
- `src/simulation/bots/profiles.ts`
- `src/simulation/bots/memory.ts`
- `src/simulation/factions/factionMechanicalRoles.ts`
- `src/simulation/factions/factionMechanicalCatalogRegistry.ts`
- `src/simulation/factions/factionResearchEffects.ts`
- `src/simulation/endgame/participation.ts`
- `src/simulation/endgame/solarWar.ts`
- `src/simulation/endgame/solarWarView.ts`
- `src/simulation/endgame/finalObjects.ts`
- `src/simulation/endgame/campaignResult.ts`
- `src/simulation/combat/resolveAttackMission.ts`
- `src/simulation/combat/resolveBattle.ts`
- `src/simulation/combat/fleetDoctrine.ts`
- `src/simulation/combat/debris.ts`
- `src/simulation/market/market.ts`
- `src/simulation/planet/buildingOperations.ts`
- `src/simulation/planet/buildingQueue.ts`
- `src/simulation/planet/completeBuildingCatalog.ts`
- `src/simulation/research/progression.ts`
- `src/simulation/research/researchState.ts`
- `src/simulation/research/researchCommands.ts`
- `src/simulation/economy/planetEconomy.ts`
- `src/simulation/economy/empireEconomy.ts`
- `src/simulation/colonization/colonization.ts`
- `src/simulation/units/productionCommands.ts`
- `src/ui/planetViewModel.ts`
- `src/ui/researchScreen.ts`
- `tests/audit/progressionScenarioExperiment.test.ts`
- `tests/audit/campaignProgressionBaseline.test.ts`
- `tests/audit/compressedProgressionMilestones.test.ts`
- `tests/audit/compressedProgressionPartition.test.ts`
- `tests/audit/botEndgameClosureGate.test.ts`
- `tests/audit/endgameTerminalGate.test.ts`
- `tests/simulation/botResearchProductionPlanner.test.ts`
- `tests/simulation/combat.test.ts`
- `tests/simulation/combatV2.test.ts`
- `tests/simulation/fleetDoctrine.test.ts`
- `package.json`
- `package-lock.json`
- `.github/workflows/ci.yml`
- `.github/workflows/e2e.yml`
- `.github/workflows/pages.yml`

### Mandatory parity/reference coverage 7–17 surfaces

- `src/simulation/universe/model.ts`
- `src/simulation/space/coordinates.ts`
- `src/game/scenes/SpaceMapScene.ts`
- `src/ui/spaceMapViewModel.ts`
- `src/ui/spaceMapNavigation.ts`
- `src/simulation/colonization/colonization.ts`
- `src/simulation/factions/completeCatalogTargets.ts`
- `src/simulation/factions/factionMechanicalRoles.ts`
- `src/simulation/units/completeShipCatalog.ts`
- `src/simulation/units/completeDefenseCatalog.ts`
- `src/simulation/units/completeCommanderShipCatalog.ts`
- `src/simulation/units/inventory.ts`
- `src/simulation/units/productionCommands.ts`
- `src/simulation/defense/planetaryDefense.ts`
- `src/simulation/command/commandDoctrine.ts`
- `src/simulation/command/commanderShips.ts`
- `src/simulation/fleets/missionRules.ts`
- `src/simulation/fleets/flightCalculations.ts`
- `src/simulation/fleets/flightCommands.ts`
- `src/simulation/logistics/routes.ts`
- `src/simulation/bots/colonyLogisticsPlanner.ts`
- `src/simulation/economy/empireEconomy.ts`
- `src/ui/empireOverviewViewModel.ts`
- `src/ui/productionScreen.ts`
- `src/ui/logisticsRoutesPanel.ts`
- `src/simulation/intelligence/resolveScout.ts`
- `src/simulation/intelligence/intelligenceState.ts`
- `src/simulation/galaxy/intelligenceView.ts`
- `src/simulation/reports/missionReports.ts`
- `src/ui/galaxyIntelPanel.ts`
- `src/ui/reportsWorkspace.ts`
- `src/ui/missionReportsPanel.ts`
- `src/ui/commandRanking.ts`
- `src/ui/commandRankingScreen.ts`
- `src/simulation/endgame/participation.ts`
- `src/simulation/pve/spaceObjects.ts`
- `src/simulation/pve/worldEvents.ts`
- `src/simulation/pve/targetRecovery.ts`
- `src/ui/spaceObjectsPanel.ts`
- `tests/e2e/universeNavigation.spec.ts`
- `tests/e2e/ordinaryMissionIntelligence.spec.ts`
- `tests/e2e/intelligenceReportsPresentation.spec.ts`
- `tests/e2e/empireOverview.spec.ts`
- `tests/simulation/colonization.test.ts`
- `tests/simulation/unitProduction.test.ts`
- `tests/simulation/logisticsRoutes.test.ts`
- `tests/simulation/intelligence.test.ts`
- `tests/simulation/debris.test.ts`
- `tests/simulation/spaceObjects.test.ts`
- `src/ui/commandRanking.test.ts`

### Reference/provenance surfaces

- `docs/research/nemexia-mechanics-reference.md`
- `docs/research/nemexia-mechanics-reference-part-1.md`
- `docs/research/nemexia-mechanics-reference-part-2.md`
- `docs/research/nemexia-mechanics-reference-part-3.md`
- `docs/research/nemexia-mechanics-reference-part-4.md`
- `docs/research/nemexia-final-complete-game-concept-2026-07-26.md`
- `docs/research/nemexia-browser-audit/09-ships-and-defense.md`
- `docs/research/nemexia-browser-audit/10-fleets-and-missions.md`
- `docs/research/nemexia-browser-audit/11-galaxy.md`
- `docs/research/nemexia-browser-audit/12-combat.md`
- `docs/research/nemexia-browser-audit/13-social-and-meta.md`
- `docs/research/nemexia-browser-audit/19-complete-user-captured-catalog-2026-07-22.md`
- `docs/research/nemexia-browser-audit/20-universe-navigation-capture-2026-07-26.md`
- `docs/research/nemexia-browser-audit/catalog-2026-07-22/*`

## Mandatory Graphify Audit pass

### Pinned setup and build evidence

The required Graphify pass was executed through the repository-owned workflow on the exact PR head before this FIX:

- pinned version: `.graphify-version` = `0.8.38`;
- workflow environment: `graphifyy==0.8.38`, Python 3.12;
- repository runner: `bash scripts/graphify-audit.sh code`;
- scope: code-only directed graph of `src` + `tests` plus copied `package.json`/`tsconfig.json`;
- exact-head workflow: Graphify audit run #1245, run id `32466413596`, success;
- artifact: `graphify-audit-output`, id `9440848884`, digest `sha256:ce818bf8c97f11cd36d78aab546e29c231d831a1ad408ddd8ff90f5e2016216a`;
- build log: 445/445 code files AST-extracted, exit code 0;
- graph: 3,496 nodes, 12,184 edges, 144 communities, 100% extracted nodes and one inferred edge after clustering.

`GRAPH_REPORT.md` identifies high-coupling hubs including `GameState` (316 edges), `createInitialGameState()` (224), `executeCommand()` (162) and `getFactionMechanicalRoles()` (116). This supports treating P0 and faction mechanical registries as cross-domain surfaces rather than isolated planner files.

### Dependency/consumer queries made against generated Graphify graph

The generated `graph.json` was queried for incoming/outgoing relations and paths, then verified against source/tests. Material results:

| Graphify subject | Graph evidence | Source/test verification | Audit consequence |
|---|---|---|---|
| `createInitialGameState()` | central initializer with calls into bot automation, campaign settings, command state, endgame participation/final objects, intelligence, market, planets, PvE, research, universe and upgrades; incoming from runtime and scenario/tests | verified in `createInitialGameState.ts` and scenario tests | P0 organic proof must start here and cannot substitute a prepared late-game state |
| `planBotResearchAndProduction()` | consumed by scheduler compressed/legacy paths, recovery planner and scenario runner; calls progression phase/perception/research/production selection | verified in scheduler/planner source | no hidden second compressed production planner was found; PD omission is a real executable-path blocker |
| `resolveAttackMission()` | calls `resolveBattle`, debris/plunder, doctrine/commander/research effects, demolition/destruction and recovery; entered from flight event resolution | verified in combat source/tests | PR2 is cross-cutting combat correctness but still bounded to attack resolution/identity/doctrine |
| `collectDebris()` | incoming from `flightCommands.applyFlightEvent`; covered by debris tests | verified in `debris.ts` | salvage advertised effect has no graph edge to collection path |
| `executeMarketSwap()` | called by reducer command dispatch; no graph path from building operational summary | verified in `market.ts` | market efficiency is a confirmed ghost gap |
| `getFleetSlotCapacity()` | consumed by `missionRules.getFleetSlotSummary()` | verified in mission rules | flight-slot contract is real Stellar runtime, not missing parity |
| `resolveColonization()` | called by flight event resolution; calls colonizability, colony limit/count, colony creation, owner update and cargo unload | verified in colonization source/tests | colonization is KEEP_STELLAR; no Nemexia port needed |
| `createEmpireEconomyPortfolio()` | consumed by bot colony logistics, empire overview and logistics UI/tests | verified in economy/UI source | multi-planet economy/QoL already has a native operational model |
| `resolveScoutArrivalOutcome()` / scout graph | consumed from flight resolution and tests; connects faction research, intelligence state/history and snapshots | verified in scout/intelligence source | reconnaissance is KEEP_STELLAR |
| `createUnifiedMissionReports()` | consumed by ranking, UI and report tests; composes event/world-event/Solar-War/intelligence reports | verified in reports source | report surface is native and cross-domain |
| `createEmpireRanking()` / `createPlayerCommandProfile()` | consumed by command ranking screen/shell | verified in `commandRanking.ts` | ranking/profile exists, but it is one Stellar composite score rather than Nemexia score-layer parity |
| `createInitialSpaceObjects()` / `startSpaceObjectMission()` | persisted/migrated runtime state, UI and tests; kinds include asteroid/gas-cloud/anomaly | verified in `spaceObjects.ts` | world-object gameplay exists, but current objects are fixed-coordinate targets, not a proved moving-asteroid system |
| alliance/endgame participation nodes | command/reducer, endgame planners/UI/tests consume alliance participation state | verified in `participation.ts` | alliance functionality exists for local endgame participation; live social parity is not required |

### Graphify limitations

Graphify is evidence, not authority. This pass has these limits:

1. repository runner intentionally graphs `src` and `tests`; workflow YAML, docs/research provenance, saved-page/MHTML evidence and third-party captures are outside the code graph and were audited separately;
2. code-only clustering had no LLM backend, so communities retain generic `Community N` labels; relationships remain useful, labels do not encode product meaning;
3. import/call edges prove structural coupling, not semantic correctness, formula provenance or runtime frequency;
4. dynamic browser behavior, deployed Pages state and owner-supplied external captures are not established by graph edges;
5. the connected execution environment cannot invoke arbitrary commands inside a completed GitHub Actions job. The exact-head generated Graphify artifact was therefore downloaded and its `graph.json` queried directly for dependencies/consumers; source/tests were then used to verify those graph results. Direct source reading supplements this pass and does **not** replace Graphify.

A new exact-head Graphify workflow is required after the FIX commit and must be green before controller handoff.

## P0 — Fresh Game → Terminal proof chain

| Stage | Verdict | Evidence |
|---|---|---|
| Fresh Game | **CONFIRMED** | `runProgressionScenario()` starts with `createInitialGameState(...)` and `progressionProfile: 'compressed-v1'`. |
| Ordinary organic progression | **CONFIRMED** | Scenario applies real planner commands through `executeCommand()` and advances time through normal campaign runtime. |
| Formal `endgame-preparation` | **CONFIRMED** | Scenario completion predicate is `allEmpiresReachedEndgamePreparation()`. CI gates this phase label, not terminal state. |
| Physical Planet Destroyer production | **CONFIRMED BLOCKER** | Compressed production milestones are scout/fighter/colonizer/frigate; the same four remain through late phases. Legacy late phases target `roles.dreadnought` → real Planet Destroyer. |
| Solar War entry eligibility | **PARTIALLY CONFIRMED** | Endgame planner can enter with an eligible stationed armed fleet; eligibility is weaker than positive qualification. |
| Positive Solar War qualification | **UNKNOWN organically** | Prepared fixture proves positive scores only after injecting very large combat fleets. |
| Organic Obelisk / final project funding | **UNKNOWN** | Planner supports legal actions after positive qualification, but organic runner stops earlier and does not measure resource closure. |
| Gate build / stabilization | **UNKNOWN organically** | Prepared fixture proves mechanics after direct preparation/resources. |
| Terminal victory/defeat | **UNKNOWN organically** | No Fresh Game runner reaches terminal without state preparation/injection. |

**Exact organic proof stop point:** capability-based `endgame-preparation`, before the ordinary compressed production path has proven a physical Planet Destroyer and before positive Solar War qualification.

## Fixture / state-injection inventory

`tests/audit/botEndgameClosureGate.test.ts` must not be cited as organic campaign proof.

Its prepared endgame setup:

- starts from `createInitialGameState`, then directly modifies state;
- clears or suppresses pending/runtime systems for the fixture;
- directly sets bot building levels including government 10, research center 15, spaceport 12 and Galactic Obelisk 1;
- directly injects scout, fighter, colonizer, frigate and `roles.dreadnought`/Planet Destroyer inventory;
- injects one Solar War fleet per bot with thousands of heavy combat ships;
- later directly replaces planet resources with exact final-project required resources for funding paths.

What that test legitimately proves: endgame participation policy, Solar War resolution, final-object commands, save round-trip, offline/campaign-time composition and terminal fixed-point behavior **from a prepared qualified state**.

What it does not prove: organic acquisition of those buildings, ships, fleet strength, qualification or resources.

## P1 — Organic late-game bots

### Canonical Planet Destroyer mapping

**DISPROVED old finding:** `roles.dreadnought` is not a wrong ship mapping.

`FactionMechanicalRoles.ships.dreadnought` maps directly to `complete.planetDestroyer`. All further findings use the canonical real Planet Destroyer identity rather than interpreting the role name literally.

### compressed-v1 production

**CONFIRMED blocker.**

`getBotPhaseProductionTargets()` for `compressed-v1` uses four cumulative milestones only:

```text
scout
fighter
colonizer
frigate
```

The four-target set remains after colonization through `heavy-fleet`, `planet-destruction` and `endgame-preparation`. Threat pressure adds fighters/corvettes, not the Planet Destroyer.

`createPhasePrerequisiteTargets()` does include Planet Destroyer requirements in `heavy-fleet`, so compressed progression can prepare capability. `planBotResearchAndProduction()` consumes those production targets, and the compressed scheduler uses that same planner. Graphify did not expose a separate compressed general-production path that injects the missing hull.

### capability versus ownership

`progressionPhase.ts` treats ship capability as sufficient for the corresponding phase checkpoint. This explains why a compressed scenario can report `endgame-preparation` while its production planner has never requested the destroyer.

### legacy-v1 comparison

**CONFIRMED differentiation:** legacy production targets explicitly include `roles.dreadnought` in `heavy-fleet` and request higher totals in `planet-destruction` / `endgame-preparation`. Because that role maps to `complete.planetDestroyer`, legacy-v1 has a physical Planet Destroyer target that compressed-v1 lacks.

### Solar War / Gate readiness

- Solar War fleet eligibility only requires a stationed, non-mission own fleet containing attacking ships; this is not proof of meaningful strength.
- final-object start requires a **positive Solar War result** matching current solo/alliance participation.
- final-object planner can queue the Galactic Obelisk, start/contribute to the final project and attack a vulnerable enemy Gate when legal.
- enemy Gate attack explicitly requires the canonical Planet Destroyer in the attacking fleet.
- organic resource sufficiency and positive Solar War strength are not measured by the current fresh scenario.

**Verdict:** endgame mechanics exist, but organic late-game readiness is not closed.

## P2 — advertised effect consumer matrix

| Advertised value | Producer / aggregation | Audited gameplay consumer | Verdict |
|---|---|---|---|
| `salvageEfficiencyPercent` | Scrapyard; accumulated by `buildingOperations.ts` | `collectDebris()` collects by cargo capacity/field amounts and has no building-summary input; Graphify shows collection from flight event resolution | **CONFIRMED ghost gap** |
| `marketEfficiencyPercent` | Trade Center; accumulated by `buildingOperations.ts` | market quote/swap uses market fee/reserves/price impact; Graphify shows command/reducer consumer but no building-summary path | **CONFIRMED ghost gap** |
| `bankCreditEfficiencyPercent` | Bank; accumulated by `buildingOperations.ts` | no consumer found in inspected market/planet/empire economy paths; repository-wide absence is not proven strongly enough to invent/remove a credit mechanic | **UNKNOWN** |
| `ecologyCapacity` | research effect summary | colony limit is colonization research; planet economy consumes energy output, not ecology capacity | **CONFIRMED ghost gap** |

Implementation must not invent Nemexia formulas. For each confirmed ghost effect, PR3 may only connect a deliberately documented Stellar-native consumer or stop advertising the inactive effect. Bank stays evidence-gated and no credit subsystem is authorized by default.

## P3 — combat correctness

### Battle seed identity

**CONFIRMED blocker.** `resolveAttackMission()` derives battle seed as:

```text
state.seed ^ eventSequence ^ attackerFleet.id.length
```

Only fleet-ID length contributes, so different equal-length fleet IDs collide under the same state seed/event sequence. PR2 must use stable full-identity entropy while preserving deterministic replay/save behavior.

### pooled multi-fleet defender doctrine

**CONFIRMED blocker.** All stationed defender fleets are pooled into `defenderUnits`, but formation, target priority, commander and defender command-combat effects are taken from `defenderFleets[0]` only.

**DECISION for bounded PR2:** preserve the existing one-primary-doctrine pooled-side model, but make primary-defender selection an explicit stable rule: choose the stationed defender fleet by lexicographically smallest stable fleet ID after filtering. Formation, target priority and commander come from that same selected primary fleet. This removes dependence on state-array ordering without introducing a new multi-entry combat engine or inventing per-fleet simultaneous doctrine stacking.

Acceptance must prove that permuting identical defender fleets in `state.fleets` cannot change the selected primary doctrine or battle result.

## P4 — UI/runtime truth

### Building queue slots

**DISPROVED old finding:** four functional building slots do not exist.

- runtime `queueBuildingConstruction()` writes `buildQueue: [queueItem]`;
- UI building cards block when `planet.buildQueue.length > 0`.

Current truth is one active building construction per planet. Do not create a queue-capacity implementation item from the old hypothesis.

### Research requirements

**DISPROVED old finding:** UI and command runtime do not use divergent requirement resolvers.

Both `researchScreen.ts` and `researchCommands.ts` call the same `findMissingResearchRequirements(definition, research, planet, profileId)`. That function resolves profile-adjusted requirements through `resolveResearchRequirement(...)` and caps laboratory requirement against profile limits.

No research-resolver parity PR is justified.

## P5 — bot differentiation, difficulty, memory, offense

| Area | Current truth | Verdict |
|---|---|---|
| Aegis | `industrial`, normal profile, 600s cadence, 2 commands | **CONFIRMED differentiated profile** |
| Synod | `explorer`, hard profile, 300s cadence, 3 commands | **CONFIRMED differentiated profile** |
| Veyra | `aggressive`, normal profile, 450s cadence, 2 commands | **CONFIRMED differentiated profile** |
| Legacy personality strategy | industrial/explorer/aggressive use different planner priority orders | **CONFIRMED** |
| Compressed personality strategy | common priority pipeline; cadence/budget still differs | **CONFIRMED but narrower differentiation** |
| Endgame alliance policy | Aegis/Synod alliance path; Veyra solo path | **CONFIRMED** |
| Offensive planner | armed fleets attack current full-intel targets after power and mission checks | **CONFIRMED** |
| `BotDifficulty` | difficulty-tagged default profiles carry scheduler-consumed cadence/command-budget differences; string is not a standalone difficulty algorithm | **DISPROVES blanket “unused” claim; limitation retained** |
| Memory | deterministic view over persisted intelligence observations/alerts, including stale/current state | **CONFIRMED existing memory surface** |

Do not schedule “make bots attack”, “add bot memory from scratch” or archetype expansion before organic endgame closure.

## P6 — low-cost tooling

- `package-lock.json` exists, but CI, Browser E2E and Pages build use `npm install --no-audit --no-fund`, not `npm ci` — **CONFIRMED reproducibility improvement candidate**.
- `package.json` has Playwright but no axe dependency/script — **CONFIRMED absence of an axe gate**; preserve existing accessibility runtime/tests.
- no Playwright visual snapshot baseline appears in the generated code graph/test inventory — **CONFIRMED no current snapshot baseline in inspected scope**.
- broad dead-code deletion is **UNKNOWN / not authorized**; Graphify connectivity is evidence but not sufficient proof of dead runtime code.

Tooling remains lower priority than P0.

# Required parity/reference coverage 7–17

## Classification method

For each required coverage stream:

- **Stellar evidence** establishes current product truth;
- **Reference provenance** describes only what the external evidence can support;
- **Classification** decides whether the current Stellar design stays, a bounded adaptation is justified, more research is required, or the concept is rejected for this program;
- **Action** explicitly states whether this Audit adds implementation scope.

### 7 — galaxy topology / solar-system presentation / colonization

**Stellar truth**

- `UniverseModel` has deterministic topology presets: test `2×9`, campaign `6×27`, fidelity `15×81`, with 20 universe slots and 24 positions per solar system.
- `SpaceMapScene` renders Universe → Galaxy → Solar-system navigation, system paging, central sun and 24 position slots.
- `resolveColonization()` is reached from flight-event resolution; it validates a colonizable target, colony limits/research, consumes the colony ship, transfers cargo, creates the colony, updates ownership and reconciles debris/recycler targeting.
- Graphify confirms `flightCommands.applyFlightEvent → resolveColonization` and UI/view-model consumers around universe navigation.

**Reference provenance:** `SUPPLIED_INFO_PAGE` / user-supplied saved-page capture, plus official Help research. The 2026-07-26 capture supports 20 universe presentation slots, 81-system gallery behavior, 24 positions, breadcrumb/navigation and colonization-entry UX. It does not define Stellar world-generation formulas.

**Classification:** **KEEP_STELLAR** — high confidence.

**Gap / no-action:** no parity blocker found. Current campaign preset intentionally differs from historical topology scale while fidelity mode preserves the large reference-shaped surface. Do not alter topology or colonization in this batch.

### 8 — ships / defence / commander ships / population-capacity / faction asymmetry

**Stellar truth**

- complete catalog target manifest records 13 ships/faction, 9 defenses/faction and 13 shared commander ships, alongside 24 buildings/faction and 22 shared technologies;
- faction mechanical registries resolve original Aegis/Synod/Veyra catalogs/roles rather than runtime reference IDs;
- `queueUnitBatch()` enforces research/building requirements, one production queue per kind, population capacity, hangar capacity, defense-grid capacity, commander one-per-type constraints and Admiral/command level requirements;
- faction catalogs carry intentional stat/requirement asymmetry.

**Reference provenance:** `USER_CAPTURED_HTML` / normalized `SUPPLIED_INFO_PAGE` catalog evidence confirms the historical 13/9/13 shape and multiple faction stat/prerequisite differences. Values are capture-time reference, not balance authority.

**Classification:** **KEEP_STELLAR** — high confidence.

**Gap / no-action:** compressed bot failure to physically target Planet Destroyer is a P0 planner gap, not a missing catalog/asymmetry system. No catalog rebalance/port is added to this batch.

### 9 — fleet missions / slots / travel ETA / logistics

**Stellar truth**

- ordinary mission contract supports transport, deploy, scout, attack, recycle and colonize;
- `getFleetSlotSummary()` consumes research-derived fleet-slot capacity and counts active flights;
- `flightCalculations.ts` deterministically calculates coordinate distance, duration and fuel;
- mission availability exposes estimate, slot use/capacity, fuel requirement and target visibility;
- logistics routes provide owned-colony resource transfers with interval/reserve/priority controls; empire economy portfolio and bot colony logistics consume them.

**Reference provenance:** `CONFIRMED_UI` + `CONFIRMED_HELP` / `SUPPLIED_INFO_PAGE` lists a broader historical mission set, but live destination/fuel/timing/cancel outcomes were not exercised in the browser audit.

**Classification:** **KEEP_STELLAR** for current mission/slot/ETA/logistics contracts; historical extra mission types are **RESEARCH**, not parity requirements — high confidence on current Stellar, medium on external exact semantics.

**Gap / no-action:** no demonstrated need for pirate raid, fleet-save, Sun Support or every historical mission. Do not broaden this batch.

### 10 — economy / production overview / multi-planet QoL

**Stellar truth**

- `planetEconomy.ts` has resource production/storage, energy, population, stability and specialization effects;
- `createEmpireEconomyPortfolio()` aggregates colonies, resource stock/capacity/flow, queues, fleets, routes and health reasons;
- that portfolio is consumed by empire overview, logistics UI and bot colony logistics per Graphify;
- `productionScreen.ts` and unit production commands expose/execute current production truth.

**Reference provenance:** official Help / saved pages support multi-resource production, storage, population and multi-planet management patterns; exact historical formulas are not Stellar authority.

**Classification:** **KEEP_STELLAR** — high confidence.

**Gap / no-action:** P2 ghost effects remain separate. No broad economy, production dashboard or logistics rewrite is justified.

### 11 — spying / reconnaissance / reports

**Stellar truth**

- scout missions have explicit availability, cooldown and composition rules;
- `resolveScoutArrivalOutcome()` produces deterministic intelligence observations/counterintelligence consequences;
- intelligence state preserves current/stale observations and alerts;
- galaxy intelligence view redacts unknown data and is consumed by mission gating and UI;
- `createUnifiedMissionReports()` composes battle/event/world-event/Solar-War/intelligence reports and is consumed by reporting/ranking/UI paths.

**Reference provenance:** `CONFIRMED_UI`, `CONFIRMED_HELP` and normalized saved-page research confirm spying/report concepts but not every current server-side formula/report row.

**Classification:** **KEEP_STELLAR** — high confidence.

**Gap / no-action:** no parity blocker found. Historical probe persistence/report-detail rules remain **RESEARCH** if product value is later demonstrated.

### 12 — combat reports / debris / recycling / known-vs-unknown formulas

**Stellar truth**

- combat is a deterministic Stellar-native engine with explicit unit profiles, formations, targeting, research/upgrade/commander effects and battle reports;
- attack resolution creates casualties, debris, plunder, commander experience, demolition/destruction outcomes and mission reports;
- recycler missions consume debris through `collectDebris()` and cargo limits;
- P3 found two bounded correctness defects: fleet-ID-length seed entropy and implicit first-defender doctrine selection.

**Reference provenance:** `CONFIRMED_HELP` supports historical round caps, grouped targets, result classes and some high-level formulas. Browser capture confirms simulator/report UI. Some historical precise formulas, especially Battle Points, are image-only or unavailable and explicitly remain unknown.

**Classification:** **KEEP_STELLAR** for combat/report/debris architecture; **RESEARCH** for unknown Nemexia formulas. High confidence.

**Gap / action:** only PR2 bounded correctness and PR3 advertised salvage truth are in this batch. Historical combat formula replacement, 5/8/12 redesign or balance port is **REJECT for this batch**.

### 13 — Resource/Battle/Total/Achievement score layers + Admiral/commander progression

**Stellar truth**

- `createEmpireRanking()` computes a single derived Stellar score from colonies, current resource stock, production, building/research levels, units, fleets and victories;
- this score is UI-derived and not a persisted Nemexia-style Resource/Battle/Achievement ledger;
- command progression is real and persisted: `EmpireCommandState` tracks experience/level/doctrine/flagship; battle resolution awards command experience; levels run to 40; commander-ship production consumes command/Admiral level.

**Reference provenance:** official Help research describes separate Total/Resource/Battle rankings, Hardcore Achievement Points and Admiral progression via Battle Points. The two exact historical BP formulas are image-only and deliberately not reconstructed.

**Classification:** **RESEARCH** for separate score-layer parity; **KEEP_STELLAR** for existing command/commander progression — medium-high confidence.

**Gap / no-action:** first-class Resource/Battle/Achievement score ledgers are not present as equivalent persisted systems. No evidence shows they block Fresh Game → Terminal or current player feedback. They are not added to PR1–PR4. Any future score-layer work requires its own product/audit decision and an original formula.

### 14 — achievements / ranking / profile / alliances

**Stellar truth**

- command ranking/profile UI exists through `createEmpireRanking()`, `createPlayerCommandProfile()` and command ranking screen/shell consumers;
- local endgame alliances are persisted through `EndgameParticipationState`, creation/join/leave history, participant state and Solar War integration;
- no first-class achievement model was found in the Graphify source/test graph.

**Reference provenance:** `CONFIRMED_UI` exposes historical Ranking/Personal/Alliance/Achievement navigation; official Help describes alliance progression and achievement categories. Live social actions were intentionally not executed.

**Classification:** **RESEARCH** overall; sub-decisions: ranking/profile/alliance **KEEP_STELLAR**, achievements **RESEARCH**, live chat/auction/social-service parity **REJECT** for the offline single-player product — high confidence on current Stellar, medium on optional achievement value.

**Gap / no-action:** absence of a dedicated achievement layer is real but not a P0 correctness blocker. Do not append an achievement PR to this batch.

### 15 — moving asteroids / debris world mechanics

**Stellar truth**

- `SpaceObjectState` supports `asteroid`, `gas-cloud` and `anomaly` with deterministic system/position, yield, hazard, control/cooldown and persisted recovery;
- missions use normal flight distance/duration/fuel and deterministic reward/loss resolution;
- `SpaceMapScene` can display strategic object kinds in solar-system slots;
- debris fields are combat-generated and recyclable;
- current `SpaceObjectState` has no trajectory/velocity/next-position field, and Graphify exposes no moving-asteroid path.

**Reference provenance:** saved-page/Help synthesis records historical asteroid exploitation and a research recommendation for deterministic movement. Exact motion/server formula is not established as a current Stellar contract.

**Classification:** **RESEARCH** — medium-high confidence.

**Gap / no-action:** Stellar has asteroid gameplay but not proved moving-asteroid semantics. This is optional world-system design, not required for P0 and not part of PR1–PR4.

### 16 — saved-page / MHTML / catalog external evidence

**Stellar truth / boundary**

- normalized research documents preserve source hashes, observed UI geometry, catalog counts and provenance boundaries;
- Stellar runtime does not need Nemexia DOM selectors, browser globals, saved HTML, MHTML, source JS/CSS or third-party art as runtime dependencies;
- owner-supplied catalog/capture values remain research evidence unless independently adopted as an original Stellar decision.

**Reference provenance:** primarily `SUPPLIED_INFO_PAGE` / user-captured saved-page HTML and normalized research, with official Help/release-note cross-checks. Raw captured account/session material and original assets are explicitly excluded.

**Classification:** **RESEARCH** as evidence only; runtime coupling is **REJECT** — high confidence.

**Gap / no-action:** unknown server formulas remain unknown. No saved-page/MHTML/catalog file becomes production input in this batch.

### 17 — CI reproducibility + production/browser/Pages baseline

**Current baseline**

- Release 1.0 closure archive states #171 was required to pass exact-head asset audit, lint, typecheck, tests/build, compressed progression, performance, Browser E2E, production-base Browser smoke, Graphify, review/thread and mergeability gates;
- M9 production smoke starts a real fresh campaign from built `dist` under `/stellar-empires/`, proves assets ready/decodable, manual save/load, navigation and reload survival;
- current `ci.yml`, `e2e.yml` and `pages.yml` all use Node 24;
- PR Browser E2E contains both broad browser E2E and `e2e:production` production-base smoke;
- Pages workflow validates/builds static `dist` then deploys it from `main`;
- current workflows use `npm install --no-audit --no-fund`, not lockfile-strict `npm ci`;
- PR #172 and Audit #173 are docs/control-plane changes and do not modify production runtime.

**Evidence boundary:** the archived M9 audit explicitly does not invent a post-merge deployed Pages run. This Audit verifies the current workflow contract and exact-head PR production-browser gate; it does not claim an unobserved live deployment run as evidence.

**Reference provenance:** not Nemexia-derived; repository/runtime evidence only.

**Classification:** **KEEP_STELLAR** — high confidence, with bounded PR4 reproducibility/quality hardening.

**Gap / action:** move compatible CI/E2E/Pages installs to `npm ci` and add bounded quality gates in PR4. No release/package redesign.

## Mandatory parity matrix summary

| # | Surface | Classification | Provenance / confidence | Batch action |
|---:|---|---|---|---|
| 7 | topology / solar-system / colonization | **KEEP_STELLAR** | source/tests + `SUPPLIED_INFO_PAGE`; high | none |
| 8 | catalogs / capacity / asymmetry | **KEEP_STELLAR** | source/tests + `USER_CAPTURED_HTML`; high | PD planner gap stays PR1 |
| 9 | missions / slots / ETA / logistics | **KEEP_STELLAR**; extras **RESEARCH** | source/tests + Help/UI; high/medium | none |
| 10 | economy / production / multi-planet QoL | **KEEP_STELLAR** | source/tests + Help; high | none beyond existing ghost-effect scope |
| 11 | spying / recon / reports | **KEEP_STELLAR** | source/tests + Help/UI; high | none |
| 12 | combat / reports / debris | **KEEP_STELLAR**; unknown formulas **RESEARCH** | source/tests + Help/UI; high | PR2 + relevant PR3 truth only |
| 13 | score layers / Admiral | score layers **RESEARCH**; command progression **KEEP_STELLAR** | source + Help; medium-high | none |
| 14 | achievements / ranking / profile / alliances | mixed **RESEARCH / KEEP_STELLAR / REJECT** | source + Help/UI; medium-high | none |
| 15 | moving asteroid / debris world | **RESEARCH** | source + saved-page synthesis; medium-high | none |
| 16 | saved-page/MHTML/catalog evidence | evidence **RESEARCH**, runtime coupling **REJECT** | supplied captures; high | none |
| 17 | CI / browser / Pages | **KEEP_STELLAR** | repo workflows/release archive; high | PR4 bounded hardening |

## CONFIRMED

1. Current Fresh Game scenario uses ordinary commands but terminates at formal `endgame-preparation`, not terminal campaign result.
2. `compressed-v1` does not request a physical Planet Destroyer in its production-target path.
3. Capability alone can satisfy the Planet Destroyer phase checkpoint and advance progression.
4. `legacy-v1` does request the canonical Planet Destroyer.
5. Existing terminal closure acceptance relies on direct late-game buildings/ships/fleets/resources preparation.
6. Organic positive Solar War qualification, Gate funding/building and terminal closure are not proven.
7. `salvageEfficiencyPercent`, `marketEfficiencyPercent` and `ecologyCapacity` are produced/aggregated without matching consumers on canonical audited paths.
8. Attack battle seed uses collision-prone fleet-ID-length entropy.
9. Pooled multi-fleet defense currently takes doctrine/commander semantics from the first defender fleet only.
10. Bots already perform offensive attack planning.
11. Aegis/Synod/Veyra profiles, cadence/budgets, legacy priorities and endgame policies are differentiated.
12. Graphify exact-head build succeeded and confirms the critical P0/P1/P2/P3 consumer/call paths recorded above.
13. Stellar already has deterministic universe/solar navigation, colonization, complete catalog shapes, population/hangar/defense-grid capacity, fleet slots/ETA/fuel, logistics, multi-planet economy portfolio, reconnaissance/reports, combat/debris, ranking/profile, local alliances and persistent space objects.
14. Current Stellar has command/commander progression but no equivalent first-class Nemexia Resource/Battle/Achievement score ledgers in the audited graph.
15. Current Stellar asteroid objects are fixed-coordinate strategic targets; no moving-asteroid trajectory system is proved.
16. CI/E2E/Pages use `npm install`; axe and visual snapshot gates are absent from audited setup.

## DISPROVED

1. **Wrong:** `roles.dreadnought` maps to the wrong unit. **Truth:** it maps directly to real `complete.planetDestroyer`.
2. **Wrong:** four building queue slots are functionally implemented. **Truth:** runtime and UI enforce one active construction.
3. **Wrong:** research UI and runtime use mismatched authoritative requirement logic. **Truth:** both call the same profile-aware resolver path.
4. **Wrong:** bots do not attack. **Truth:** fleet planner selects legal attack missions after intelligence and power checks.
5. **Wrong as a blanket claim:** bot difficulty/profile data is unused. **Truth:** default difficulty-tagged profiles have scheduler-consumed cadence and command-budget differences, although `difficulty` is not a standalone algorithmic switch.

## UNKNOWN

1. Whether `bankCreditEfficiencyPercent` has a non-obvious consumer outside inspected economy/market paths; no formula may be guessed.
2. Organic measured Solar War score/strength distribution across accepted seeds/factions after physical Planet Destroyer production is fixed.
3. Organic time/resource envelope for Obelisk/final-project/Gate completion after Solar War qualification.
4. Whether richer compressed personality differentiation is desirable; current behavior is functional but narrower than legacy.
5. A proven dead-code list.
6. Product value and original formula for separate Resource/Battle/Achievement score layers.
7. Product value and original semantics for a dedicated achievement system.
8. Exact historical moving-asteroid server trajectory/formula; this is not needed for current batch.
9. Exact historical Battle Point formulas that are image-only in the reference; they remain unknown and are not needed by PR1–PR4.
10. A separately observed post-#172 live Pages deployment run; current workflow and production-browser contract are verified, but this Audit does not invent deployment evidence.

Non-critical UNKNOWN items 4–10 do not block PR1 because they are explicitly outside P0 closure. Bank evidence is allowed to remain unresolved because PR3 is contractually forbidden from inventing a credit subsystem and may leave Bank untouched.

## Rejected assumptions / non-port boundary

Do not create implementation work for:

- four functional building queues;
- research resolver mismatch;
- “bots do not attack”;
- “BotDifficulty is wholly unused”;
- eight new bot personalities;
- Svelte/Solid migration;
- event-sourcing/replay rewrite;
- binary-heap queue optimization while performance gates are healthy;
- wholesale market/logistics rewrite;
- broad combat redesign, initiative or active-ability engine;
- live Nemexia chat/auction/services/social parity;
- raw saved-page/MHTML/DOM/global/browser automation coupling;
- copied Nemexia formulas, balance, text, UI or assets;
- new credit subsystem solely to justify the Bank bonus;
- score/achievement/moving-asteroid PRs solely because reference evidence exists.

## Ranked backlog

1. **P0 — organic late-game closure:** physical Planet Destroyer production plus Fresh Game → positive Solar War → final object/Gate → terminal proof.
2. **P1 — combat identity/doctrine correctness:** full stable fleet identity in battle seed and deterministic primary defender doctrine selection.
3. **P1 — advertised-effect truth:** salvage / market / ecology consumer-or-remove decisions; Bank only after evidence closure.
4. **P2 — low-cost quality gates:** `npm ci`, bounded axe coverage, deterministic visual snapshots; dead code only if independently proven.
5. **P3 research only:** score/achievement layers, moving-asteroid semantics, richer compressed personality differentiation and other reference candidates require later product/audit decisions.

# Exact proposed implementation contracts — NOT AUTHORIZED YET

Default bounded batch: four implementation PRs. PR1 is blocking. PR2 and PR3 are logically independent **after PR1 is reviewed and merged**. PR4 is technically independent but intentionally scheduled after gameplay correctness. No implementation branch may be created from this Audit branch.

## `POST-1.0-PR1-ORGANIC-LATE-GAME-CLOSURE`

### Purpose / player-visible outcome

A real fresh compressed campaign must organically acquire the actual late-game hull and progress through the existing Solar War/final-object/Gate mechanics to a real terminal result without test-only state injection. The player-visible outcome is that the shipped campaign is demonstrably completable/losable through ordinary gameplay systems rather than only through prepared acceptance fixtures.

### Verified current state

- `createInitialGameState()` is the real clean initializer.
- `runProgressionScenario()` uses ordinary planners/commands/time but stops when all empires are labelled `endgame-preparation`.
- compressed production milestones top out at scout/fighter/colonizer/frigate; pressure adds fighter/corvette.
- Planet Destroyer prerequisites are prepared, and capability can satisfy phase progression before ownership.
- legacy late phases target `roles.dreadnought` → actual Planet Destroyer.
- endgame participation/final-object planners already support Solar War entry, positive-result qualification, Obelisk/final-project funding and Gate attack when legal.
- prepared terminal tests prove those isolated mechanics from injected late state, not organic acquisition.

### Exact expected repository paths

Primary expected modifications:

- `src/simulation/bots/progressionPriorities.ts`
- `src/simulation/bots/progressionPhase.ts` — only if phase completion must distinguish capability from physical late-game readiness
- `src/simulation/bots/researchProductionPlanner.ts`
- `src/simulation/progression/scenarioRunner.ts`
- `tests/simulation/botResearchProductionPlanner.test.ts`
- `tests/simulation/botProgressionPhase.test.ts`
- `tests/audit/progressionScenarioExperiment.test.ts`
- `tests/audit/compressedProgressionMilestones.test.ts`
- `tests/audit/compressedProgressionPartition.test.ts`
- `tests/audit/botEndgameClosureGate.test.ts` — preserve as prepared-mechanics proof; may add explicit fixture label/assertions
- new or extended audit/integration test under `tests/audit/` for organic terminal closure

Read/verify-only unless the organic runner exposes a real defect:

- `src/simulation/bots/scheduler.ts`
- `src/simulation/bots/endgameParticipationPlanner.ts`
- `src/simulation/bots/endgameFinalObjectPlanner.ts`
- `src/simulation/endgame/solarWar.ts`
- `src/simulation/endgame/solarWarView.ts`
- `src/simulation/endgame/finalObjects.ts`
- `src/simulation/endgame/campaignResult.ts`
- `src/simulation/units/productionCommands.ts`
- `src/simulation/campaign/time.ts`
- `src/storage/*` save/load paths used by determinism gates

Any required runtime change outside the primary set because the ordinary path reveals a new endgame defect must be recorded as material divergence before broadening PR1.

### Important functions / types / registries

- `getBotPhaseProductionTargets()`
- `phaseShipTargets()` / `createPhasePrerequisiteTargets()`
- `getBotProgressionPhase()` / ship capability checks
- `planBotResearchAndProduction()` / production selection
- `runProgressionScenario()`
- `createInitialGameState()`
- `executeCommand()`
- `runBotScheduler()` / compressed candidate path
- `planBotEndgameParticipation()`
- `planBotEndgameFinalObjects()`
- `getFactionMechanicalRoles()`
- `FactionMechanicalRoles.ships.dreadnought`
- `complete.planetDestroyer`
- `QUEUE_UNIT_BATCH`, production queue and inventory state
- Solar War participation/results/final-object/campaign-result types

### Dependency / data-flow map

```text
FactionMechanicalRoles.complete.planetDestroyer
→ progression prerequisite/capability targets
→ getBotPhaseProductionTargets(compressed-v1)
→ planBotResearchAndProduction
→ scheduler candidate
→ QUEUE_UNIT_BATCH
→ production completion / real inventory
→ fleet creation + ordinary SEND_FLEET
→ Solar War entry/resolution
→ positive participation result
→ Obelisk/final-project commands
→ Gate funding/construction/vulnerability
→ campaignResult terminal
```

Graphify confirms the scheduler/planner/scenario consumers and `createInitialGameState` centrality; source/tests verify command legality and prepared endgame mechanics.

### Player / bot / UI / reporting consumers

- bots: scheduler, research/production planner, endgame participation/final-object planner;
- player/runtime: same production, fleet, Solar War and final-object commands remain authoritative;
- UI: endgame operations panel/view model and terminal presentation must continue reflecting the same state;
- reporting: Solar War/event/terminal reporting remains existing behavior; no new reporting schema is required.

### Persistence / schema impact

**Expected:** none. Keep schema v19 / save format v6. This PR should alter planner targets/tests, not introduce a new persisted concept.

**Stop condition:** if organic closure requires new durable state or migration, stop and amend/re-audit before schema/save changes.

### Deterministic / performance constraints

- same seed/settings must produce repeatable closure metrics/results;
- save/load and partitioned time advancement must not alter the outcome;
- no `cloneState`, direct inventory/resource/building/research/Solar-War/Gate mutation in the main acceptance path;
- seed matrix must be bounded so CI stays inside campaign-performance budgets;
- planner changes must not create command loops or unbounded stockpiling.

### Required gates

**Unit**
- compressed late-phase production-target regression explicitly contains canonical Planet Destroyer;
- legacy behavior remains valid;
- phase readiness test distinguishes any intended physical-ownership condition.

**Integration/audit/headless**
- fresh `createInitialGameState` organic closure scenario;
- accepted bounded seeds/factions physically complete Planet Destroyer through production queue;
- positive Solar War qualification then legal final-object/Gate path then terminal result;
- save round-trip and partitioned time determinism;
- existing campaign performance gate remains green.

**Browser**
- existing Browser E2E and production smoke remain green;
- endgame operations/terminal presentation tests continue to pass; add a browser assertion only if PR1 changes a visible terminal transition.

### Risks

- a single added target may expose resource/population/hangar/timing insufficiency later in the organic path;
- over-tuning fleet quantities can mask rather than reveal closure blockers;
- extending the scenario can make CI slow if seed/time bounds are careless;
- changing phase semantics can affect scheduler cadence/PvE behavior.

### Explicit non-goals

- combat-engine redesign;
- new score/achievement system;
- moving asteroids;
- bot personality expansion;
- ghost-effect wiring;
- arbitrary fleet-size matching to prepared fixture numbers;
- schema/save migration.

### Ordered implementation steps

1. Add regression tests proving current compressed late phases omit physical Planet Destroyer while legacy includes it.
2. Change the minimum compressed production target/phase readiness needed to require and produce the canonical Planet Destroyer.
3. Extend scenario instrumentation to record real ownership, fleet strength, Solar War qualification and final-object progression without mutation helpers.
4. Run the organic scenario; if a later blocker appears, fix only an existing planner/runtime defect required for legal closure and record material divergence.
5. Reach terminal result through ordinary commands/time.
6. Add save/load and partition determinism assertions around the extended path.
7. Run unit/audit/performance/Browser/production gates.
8. Return PR1 to controller; do not start dependent work until review + merge.

### Exact acceptance gate

PR1 passes only when at least the accepted bounded fresh-seed/faction matrix reaches a terminal campaign result from `createInitialGameState()` through ordinary command/planner/queue/time paths, with an actually produced canonical Planet Destroyer, positive Solar War qualification and legal final-object/Gate progression, and with no direct state injection in the main acceptance path. Existing prepared endgame fixtures remain separately labelled focused mechanics tests.

### Unresolved questions + verification method

- **UNKNOWN:** minimum organic fleet/resource/time envelope after adding PD. **Verify:** instrument the fresh scenario and record actual produced inventory, resources, Solar War scores and elapsed time; do not copy fixture quantities.
- **UNKNOWN:** whether phase semantics must require physical PD ownership or production target alone closes the path. **Verify:** run scenario with target-only change first; modify `progressionPhase.ts` only if phase/cadence still advances ahead of real readiness.
- **UNKNOWN:** whether a later Gate/resource planner defect appears. **Verify:** ordinary scenario command/rejection audit after positive Solar War qualification; broaden only with concrete rejection evidence.

## `POST-1.0-PR2-COMBAT-IDENTITY-DOCTRINE`

### Purpose / player-visible outcome

Combat must remain deterministic while distinct fleets have distinct stable identity entropy, and pooled planetary defense must not change merely because equivalent defender fleets are stored in a different array order. Player/bot battle reports should be repeatable and order-independent under identical game state.

### Verified current state

- attack seed uses `state.seed ^ eventSequence ^ attackerFleet.id.length`;
- equal-length IDs collide in identity contribution;
- all defender fleets' ships are pooled;
- doctrine/formation/target priority/commander are taken from `defenderFleets[0]`;
- Graphify shows `resolveAttackMission()` as the combat integration hub called from flight resolution and connected to battle/debris/commander/demolition/destruction paths.

### Exact expected repository paths

Primary:

- `src/simulation/combat/resolveAttackMission.ts`
- `src/simulation/combat/fleetDoctrine.ts` — only if stable primary selection helper belongs here
- `tests/simulation/combat.test.ts`
- `tests/simulation/combatV2.test.ts`
- `tests/simulation/fleetDoctrine.test.ts`

Read/verify-only unless required by tests:

- `src/simulation/combat/resolveBattle.ts`
- `src/simulation/combat/types.ts`
- `src/simulation/command/commanderShips.ts`
- `src/simulation/command/commandDoctrine.ts`
- `src/simulation/fleets/flightCommands.ts`
- `src/simulation/fleets/types.ts`
- `src/simulation/combat/debris.ts`

### Important functions / types / registries

- `resolveAttackMission()`
- `resolveBattle()`
- `FleetState.id`
- `FleetFormation`, `FleetTargetPriority`, `FLEET_FORMATIONS`
- `getCommanderFleetEffects()`
- `getCommandCombatEffects()`
- battle seed/hash helper to be introduced or reused
- `BattleReport`

### Dependency / data-flow map

```text
SEND_FLEET attack
→ FLEET_ARRIVE
→ resolveAttackMission
   ├─ stable attacker identity → battle seed
   ├─ collect stationed defender fleets
   ├─ stable primary defender selection
   ├─ pooled defender units + primary doctrine/commander
   └─ resolveBattle
→ recovery / debris / plunder / demolition / destruction
→ BattleReport / mission reports
```

### Player / bot / UI / reporting consumers

- player and bot attacks both use the same resolver;
- commander/command doctrine effects feed combat;
- mission/battle reports consume the result;
- no separate bot-only combat formula is authorized.

### Persistence / schema impact

None expected. Fleet IDs and existing doctrine fields already persist. Do not add a stored random seed or new battle-state schema merely to fix entropy.

### Deterministic / performance constraints

- stable full-ID hash must be deterministic across platforms/save-load and must not use process-random hashing;
- stable primary defender is **DECISION:** lexicographically smallest eligible defender fleet ID;
- reordering `state.fleets` must not change battle result;
- complexity must stay linear/log-linear in defender fleet count; no new per-round architecture.

### Required gates

**Unit**
- stable identity hash gives different contributions for distinct equal-length IDs;
- same ID/input gives same value;
- stable primary defender selection is order-independent and ties are impossible for unique IDs.

**Integration/headless**
- equal gameplay state with defender fleet array permutations yields same report/result;
- same seed/save round-trip yields same result;
- commander/doctrine selection comes from the same stable primary fleet.

**Browser**
- existing combat/report/browser suites remain green; no new browser behavior required unless report presentation changes unexpectedly.

### Risks

- changing seed entropy intentionally changes deterministic outcomes for future battles on identical old save state; this is a correctness change, not save corruption;
- existing snapshot-like expectations may encode old outcomes;
- primary-doctrine rule must not accidentally select a non-eligible fleet.

### Explicit non-goals

- initiative system;
- active combat abilities redesign;
- new targeting/balance formulas;
- per-fleet simultaneous doctrine stacking;
- combat report schema expansion;
- Nemexia combat formula port.

### Ordered implementation steps

1. Add focused failing tests for equal-length attacker IDs and defender-array permutation.
2. Implement a small stable string hash/identity contribution in the combat boundary or reuse an existing deterministic repository hash only if semantics are suitable.
3. Sort/select eligible defender fleets by stable ID before primary doctrine/commander selection.
4. Preserve pooled units and current formation/priority semantics under the explicit primary rule.
5. Run combat/debris/demolition/commander regressions plus save/replay determinism checks.
6. Run full CI/Browser gates and return PR2 for controller review.

### Exact acceptance gate

Distinct equal-length fleet IDs no longer share the same identity contribution; identical stable inputs replay identically; any permutation of the same eligible defender fleets selects the same primary doctrine/commander and produces the same battle result/report; no broad combat redesign or schema migration is introduced.

### Unresolved questions + verification method

- **Non-blocking:** whether a later separate design should model per-fleet doctrines individually. **Verify later:** dedicated combat-design Audit with player-value evidence; explicitly outside PR2.
- **Verification:** run existing combat/commander/flight report tests before/after to identify expected outcome deltas caused solely by corrected seed identity.

## `POST-1.0-PR3-ADVERTISED-EFFECT-TRUTH`

### Purpose / player-visible outcome

A building/research effect shown as active must either change an existing coherent Stellar gameplay calculation or stop being advertised as active. Players must not invest in a stat that is silently ignored. No new subsystem is created solely to justify stale metadata.

### Verified current state

- `buildingOperations.ts` aggregates salvage, market and Bank efficiency;
- research progression aggregates `ecologyCapacity`;
- debris collection does not consume salvage efficiency;
- market swap/quote does not consume market efficiency;
- planet/colony economy paths inspected do not consume ecology capacity;
- Bank consumer remains UNKNOWN;
- Graphify confirms debris and market command consumers but no matching graph edge from these advertised summaries to those canonical operations.

### Exact expected repository paths

Evidence/producer paths:

- `src/simulation/planet/buildingOperations.ts`
- `src/simulation/planet/completeBuildingCatalog.ts`
- `src/simulation/research/progression.ts`
- `src/simulation/factions/factionResearchEffects.ts`

Potential existing consumer paths, depending on the explicit smallest truth decision:

- `src/simulation/combat/debris.ts`
- `src/simulation/fleets/flightCommands.ts`
- `src/simulation/market/market.ts`
- `src/simulation/economy/planetEconomy.ts`
- `src/simulation/economy/empireEconomy.ts`
- catalog/UI copy surfaces that render these effects

Tests:

- `tests/simulation/debris.test.ts`
- `tests/simulation/market.test.ts`
- relevant building/research catalog tests
- relevant economy/colonization tests if ecology text/consumer changes

No Bank credit-state/storage files are expected because a new credit subsystem is a non-goal.

### Important functions / types / registries

- `calculateBuildingOperationalSummary()` / `getPlanetBuildingOperationalSummary()`
- `BuildingOperationalEffects`
- `salvageEfficiencyPercent`
- `marketEfficiencyPercent`
- `bankCreditEfficiencyPercent`
- `ResearchEffectSummary.ecologyCapacity`
- `collectDebris()`
- `quoteMarketSwap()` / `executeMarketSwap()`
- `calculateResearchEffects()` / `getResearchEffectsForEmpire()`
- building/research catalog definitions and player-visible descriptions

### Dependency / data-flow map

```text
catalog advertised effect
→ operational/research summary
→ [currently missing consumer]
→ existing debris / market / economy action OR player-visible copy removal
→ UI/report/player expectation
```

Each effect is handled independently; no combined new economy subsystem is authorized.

### Player / bot / UI / reporting consumers

- player and bots share market/debris/economy commands;
- catalog cards/tooltips/descriptions are player-visible promises;
- mission reports may show collected/reward amounts but need no new schema;
- bot planner behavior must not gain hidden bonuses unavailable to player commands.

### Persistence / schema impact

None expected. Operational summaries are derived. Removing stale advertisement or applying a deterministic calculation to existing command output should not require persistence.

### Deterministic / performance constraints

- any adopted Stellar formula must be explicit in code/tests and integer/deterministic;
- no random yield solely from reference ±5% examples;
- no new iterative economy simulation;
- existing market/debris operations remain bounded.

### Required gates

**Unit/integration**
- for every touched effect, a test proves either a deterministic consumer changes the action result or the effect is no longer advertised/aggregated as active;
- no effect remains half-wired between catalog and runtime;
- regression tests cover unaffected market/debris/economy paths.

**Headless/browser**
- catalog/UI screens render truthful descriptions;
- existing browser smoke remains green; add focused browser assertion only when user-visible copy/number is materially changed.

### Risks

- inventing a formula with no Stellar design evidence;
- accidentally increasing resources from salvage in a way that duplicates debris value;
- market fee changes affecting economy balance;
- ecology name may imply ozone/population semantics that Stellar does not model directly;
- Bank can tempt scope expansion into credits.

### Explicit non-goals

- new credit system;
- Nemexia trade market clone;
- scrap-processing subsystem;
- ozone simulation solely to consume ecology;
- broad economy rebalance;
- score/achievement system.

### Ordered implementation steps

1. Re-run repository/Graphify consumer search per effect on fresh post-PR1 main.
2. For salvage/market/ecology, choose the smallest truth-preserving resolution: existing coherent consumer with an explicitly documented original Stellar formula, or remove/rename inactive advertised metadata/copy.
3. For Bank, if no existing consumer is proven, leave it unchanged or remove inactive advertisement; do **not** create credits. Record the evidence decision in PR3.
4. Add effect-by-effect tests before implementation changes.
5. Update only the catalog/consumer/UI paths required by those decisions.
6. Run market/debris/economy/catalog/full CI and Browser regressions.

### Exact acceptance gate

Every effect changed by PR3 has end-to-end evidence from catalog/summary to a deterministic existing gameplay consumer **or** is no longer presented as an active effect. No unknown Nemexia formula, new credit/scrap/ozone subsystem, schema migration or broad economy rewrite is introduced. Bank may remain explicitly untouched if consumer evidence stays UNKNOWN.

### Unresolved questions + verification method

- **Bank UNKNOWN:** search fresh graph/source for all `bankCreditEfficiencyPercent` references and any credit/loan state before PR3; if still producer-only, do not invent consumer.
- **Salvage semantic choice:** verify whether current UI describes collection speed/yield/processing; if no existing coherent mechanic exists, prefer truthful copy/metadata removal over resource creation.
- **Market semantic choice:** inspect current player-visible Trade Center copy and fee model; adopt an original documented fee effect only if controller-approved PR3 scope can express it without balance-system expansion.
- **Ecology semantic choice:** inspect current description and any capacity UI; if no coherent Stellar capacity exists, remove/reword inactive effect instead of porting ozone.

These are non-critical to PR1 and can be resolved at PR3 start from fresh main under the no-guessing rule.

## `POST-1.0-PR4-LOW-COST-QUALITY-GATES`

### Purpose / player-visible outcome

Make the repository build/install path more reproducible and add small browser regressions for accessibility/visual stability after gameplay correctness is closed. Player-visible outcome is lower risk of broken production UI/assets/navigation escaping CI, not new gameplay.

### Verified current state

- committed lockfile exists;
- `ci.yml`, `e2e.yml` and `pages.yml` use Node 24 and `npm install --no-audit --no-fund`;
- Browser E2E includes normal browser suite plus production-base smoke;
- release closure required production smoke and browser gates;
- no axe dependency/script or visual snapshot baseline is present in audited package/test graph;
- existing `accessibilityRuntime.ts` and tests provide internal accessibility behavior that must remain.

### Exact expected repository paths

Install reproducibility:

- `.github/workflows/ci.yml`
- `.github/workflows/e2e.yml`
- `.github/workflows/pages.yml`
- `package-lock.json` — validation authority; update only if dependency changes require it

Accessibility / visual gates if adopted:

- `package.json`
- `package-lock.json`
- a bounded Playwright spec under `tests/e2e/` or dedicated quality spec path consistent with current suite
- existing representative specs such as `tests/e2e/navigationUsability.spec.ts`, `tests/e2e/empireOverview.spec.ts`, `tests/e2e/universeNavigation.spec.ts`
- Playwright configuration files only if snapshot path/threshold configuration is required
- `src/ui/accessibilityRuntime.ts` / `.test.ts` are verify-only unless a real accessibility defect is discovered

Dead code: no expected deletion paths are authorized in advance.

### Important functions / types / registries

- npm scripts: `check`, `e2e`, `e2e:production`
- GitHub Actions Node/install/build steps
- Playwright browser fixtures/selectors
- existing accessibility runtime hooks/selectors
- production base-path/version assertions

### Dependency / data-flow map

```text
package-lock.json
→ npm ci
→ CI / Browser E2E / Pages build
→ vite dist
→ production-base Playwright smoke

representative deterministic UI state
→ Playwright render
→ axe assertions / visual snapshot
→ CI artifact/debug output
```

### Player / bot / UI / reporting consumers

No gameplay consumer changes. Browser gates cover player UI. Bot/simulation/reporting code is regression-only.

### Persistence / schema impact

None. No save/runtime state changes.

### Deterministic / performance constraints

- `npm ci` must succeed from committed lockfile without mutation;
- visual snapshots must use deterministic state/viewport/fonts/assets and a deliberately small set;
- no flaky animation/timing snapshots;
- accessibility scan scope must be bounded to representative stable screens;
- browser runtime increase must remain acceptable under existing workflow timeout.

### Required gates

**Workflow/headless**
- clean `npm ci` succeeds in CI, E2E and Pages jobs;
- assets/lint/typecheck/tests/build/performance remain green.

**Browser**
- normal Browser E2E green;
- production-base smoke green;
- focused accessibility scans have explicit zero-violation or documented targeted-exception policy;
- chosen snapshots pass reproducibly and upload useful diff artifacts on failure.

### Risks

- lockfile currently tolerated by `npm install` but incompatible with strict `npm ci`;
- adding an axe library updates dev dependency lockfile;
- visual snapshots may be flaky if scope includes animated/non-deterministic surfaces;
- broad dead-code cleanup can accidentally expand a low-risk PR.

### Explicit non-goals

- gameplay changes;
- framework migration;
- broad UI redesign;
- exhaustive screenshots of every route;
- blanket accessibility refactor unrelated to failing focused gates;
- speculative dead-code deletion.

### Ordered implementation steps

1. Change one clean install path to `npm ci` and prove lockfile compatibility; apply consistently to CI/E2E/Pages only after success.
2. Add the smallest focused accessibility dependency/spec if needed, preserving internal accessibility runtime.
3. Select 1–3 deterministic high-value screens and add stable snapshot assertions with fixed viewport/state.
4. Run full CI, Browser E2E and production smoke; verify Pages build contract.
5. Remove dead code only if independently proven and trivially isolated; otherwise leave it out.
6. Return PR4 for controller review.

### Exact acceptance gate

All lockfile-backed GitHub workflows use a clean reproducible install compatible with the committed lockfile; CI, Browser E2E and production smoke are green; bounded axe/snapshot gates are deterministic and useful; no gameplay/schema changes or speculative cleanup are included.

### Unresolved questions + verification method

- **`npm ci` compatibility:** verify in the PR's exact-head CI jobs; if lock metadata is inconsistent, repair lock metadata rather than falling back silently.
- **axe package choice:** check current dependency policy/latest compatible Playwright integration during PR4 and pin through lockfile; do not add a package in this Audit.
- **snapshot screen set:** choose screens with stable deterministic fixtures after inspecting current E2E state; exclude animated/time-varying views unless frozen.

# Dependency graph / controller sequencing

```text
Audit #173 POST-1.0-NEMEXIA-PARITY-AUDIT
→ controller review + merge
→ PR1 POST-1.0-PR1-ORGANIC-LATE-GAME-CLOSURE
→ controller review + merge
   ├─ PR2 POST-1.0-PR2-COMBAT-IDENTITY-DOCTRINE
   ├─ PR3 POST-1.0-PR3-ADVERTISED-EFFECT-TRUTH
   └─ PR4 POST-1.0-PR4-LOW-COST-QUALITY-GATES  [technically independent, intentionally later]
```

PR2 and PR3 have no mandatory code dependency on each other. PR4 is technically independent but intentionally deferred until gameplay correctness. Each dependent branch starts from the latest merged `main`; independent parallel preparation requires controller authorization under the repository delivery model.

# Risk / schema / save assessment

- **Schema/save:** no migration is justified by this batch; baseline remains schema v19 / save v6.
- **Determinism:** PR1 and PR2 are high-sensitivity; both require save/load/partition or replay gates.
- **Performance:** PR1 extended organic scenario can increase CI runtime; keep seed/time matrix bounded and retain operation budgets.
- **Browser:** PR1 is simulation-first but full Browser/production smoke remains required; PR4 adds quality coverage only after gameplay truth.
- **Reference risk:** highest for historical formulas/score layers/effects. Unknown external formulas remain unknown.
- **Batch boundary:** mandatory parity coverage 7–17 does not authorize score/achievement/moving-asteroid/social feature work.

# Controller review checklist

The controller should verify:

- P0 organic proof stop point and fixture inventory are accepted;
- compressed Planet Destroyer production gap is accepted as first blocker;
- DISPROVED hypotheses stay rejected;
- required coverage 7–17 has an explicit classification/provenance/no-action result;
- Graphify exact-head evidence and limitations are acceptable;
- PR1–PR4 contracts are sufficiently exact to prevent broad rediscovery;
- PR2 stable-primary doctrine DECISION is accepted;
- PR3 no-guessing/Bank boundary is accepted;
- dependency graph does not imply PR2 → PR3 code dependency;
- schema v19/save v6 remain unchanged;
- implementation remains unauthorized until Audit merge.

## Audit acceptance recommendation

After this FIX, the Audit has covered the mandatory 1–17 surface, performed and recorded the required pinned Graphify pass, preserved verified blocker/disproof evidence, and expanded the proposed four implementation contracts to protocol-level file/function/data-flow/consumer/gate detail.

Remaining UNKNOWN items are either evidence-gated inside a later PR contract (Bank) or explicitly outside the P0-focused batch (score layers, achievements, moving asteroids, optional personality expansion, external formulas). They must not be silently converted into implementation work.

**STOP:** leave PR #173 open for controller review; do not merge; do not create `POST-1.0-PR1-ORGANIC-LATE-GAME-CLOSURE` until controller approval and Audit merge.
