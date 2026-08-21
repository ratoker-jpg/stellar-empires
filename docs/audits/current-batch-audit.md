# POST-1.0-NEMEXIA-PARITY-AUDIT

**State:** complete for controller review — docs only  
**Audit baseline:** `538a0f22ab77687b148916c9a50721fca32930b4`  
**Runtime baseline:** schema v19 / save format v6  
**Implementation authorized:** no  
**Audit branch:** `audit/post-1.0-nemexia-parity`

## Controller gate

This is an Audit artifact only. Keep the PR open for controller review. Do not merge this Audit and do not begin implementation until the controller explicitly approves the Audit, its classifications and its proposed batch.

Findings are separated into:

- **CONFIRMED** — supported by current executable source/test/runtime evidence;
- **DISPROVED** — a prior hypothesis contradicted by current executable evidence;
- **UNKNOWN** — evidence is insufficient; no implementation assumption may be made.

## Executive verdict

**Fresh Game → Terminal is not organically proven on the audited baseline.**

The strongest ordinary-command campaign proof is:

```text
Fresh Game
→ ordinary compressed-v1 economy/research/production/expedition/fleet commands
→ all empires classified as endgame-preparation
→ STOP
```

The proof does **not** continue through physical Planet Destroyer production, a measured successful Solar War qualification, organic Obelisk/Gate funding/building or terminal victory/defeat.

The exact executable break is important: `compressed-v1` can become capability-ready for the canonical Planet Destroyer and therefore advance its phase label, but its production-target path never requests the physical Planet Destroyer. `legacy-v1` does request it. No alternate compressed generic production path was found in the scheduler/research-production chain.

The existing terminal closure test is valuable, but it is a **prepared endgame fixture**, not Fresh Game → Terminal evidence: it injects late buildings, a Planet Destroyer, very large Solar War fleets and later final-project resources before proving Solar War/final-object/save/runtime closure.

## Studied surfaces

Authority / continuation:

- `AGENTS.md`
- `docs/28-audit-first-autonomous-delivery-protocol.md`
- `docs/audits/current-execution-state.md`
- `docs/audits/current-batch-audit.md`
- `docs/17-continuation-guide.md`
- `docs/project-status.json`
- `docs/16-execution-roadmap.md`
- `docs/roadmap-pr-index.json`
- `docs/29-post-1.0-nemexia-reference-roadmap.md`

Critical runtime/test surfaces:

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
- `src/simulation/endgame/solarWarView.ts`
- `src/simulation/combat/resolveAttackMission.ts`
- `src/simulation/combat/debris.ts`
- `src/simulation/market/market.ts`
- `src/simulation/planet/buildingOperations.ts`
- `src/simulation/planet/buildingQueue.ts`
- `src/simulation/planet/completeBuildingCatalog.ts`
- `src/simulation/research/progression.ts`
- `src/simulation/research/researchState.ts`
- `src/simulation/research/researchCommands.ts`
- `src/simulation/factions/factionResearchEffects.ts`
- `src/simulation/economy/planetEconomy.ts`
- `src/simulation/economy/empireEconomy.ts`
- `src/simulation/colonization/colonization.ts`
- `src/ui/planetViewModel.ts`
- `src/ui/researchScreen.ts`
- `tests/audit/progressionScenarioExperiment.test.ts`
- `tests/audit/campaignProgressionBaseline.test.ts`
- `tests/audit/compressedProgressionMilestones.test.ts`
- `tests/audit/botEndgameClosureGate.test.ts`
- `package.json`
- `.github/workflows/ci.yml`
- `.github/workflows/e2e.yml`

Graphify output was not present in the audited tree; this Audit therefore uses direct source/test evidence rather than treating missing generated graph output as a blocker.

## P0 — Fresh Game → Terminal proof chain

| Stage | Verdict | Evidence |
|---|---|---|
| Fresh Game | **CONFIRMED** | `runProgressionScenario()` starts with `createInitialGameState(...)` and `progressionProfile: 'compressed-v1'`. |
| Ordinary organic progression | **CONFIRMED** | Scenario applies real planner commands through `executeCommand()` and advances time through normal campaign runtime. |
| Formal `endgame-preparation` | **CONFIRMED** | Scenario completion predicate is exactly `allEmpiresReachedEndgamePreparation()`. The CI experiment gates this phase label, not terminal state. |
| Physical Planet Destroyer production | **CONFIRMED BLOCKER** | Compressed production targets omit the destroyer in all late phases; capability can still advance the phase. |
| Solar War entry eligibility | **PARTIALLY CONFIRMED** | Endgame planner can enter with any eligible stationed armed fleet; this is weaker than proven successful qualification. |
| Positive Solar War qualification | **UNKNOWN organically** | Prepared fixture proves positive scores only after injecting 24,000 heavy combat ships per bot. |
| Organic Obelisk / final project funding | **UNKNOWN** | Planner supports legal actions after positive qualification, but audited organic runner stops earlier and does not measure resource closure. |
| Gate build / stabilization | **UNKNOWN organically** | Prepared fixture proves the mechanics after direct preparation/resources. |
| Terminal victory/defeat | **UNKNOWN organically** | No Fresh Game runner reaches terminal without state preparation/injection. |

**Exact organic proof stop point:** all empires receiving the capability-based phase label `endgame-preparation`.

## Fixture / state-injection inventory

`tests/audit/botEndgameClosureGate.test.ts` must not be cited as organic campaign proof.

Its prepared endgame setup:

- starts from `createInitialGameState`, then directly modifies state;
- clears or suppresses pending/runtime systems for the fixture;
- directly sets bot building levels including government 10, research center 15, spaceport 12 and Galactic Obelisk 1;
- directly injects scout, fighter, colonizer, frigate and `roles.dreadnought`/Planet Destroyer inventory;
- injects one Solar War fleet per bot with 4,000 heavy-assault + 8,000 line-battleship + 12,000 interceptor ships;
- later directly replaces planet resources with exact final-project required resources for funding paths.

What that test legitimately proves: endgame participation policy, Solar War resolution, final-object commands, save round-trip, offline/campaign-time composition and terminal fixed-point behavior **from a prepared qualified state**.

What it does not prove: organic acquisition of those buildings, ships, fleet strength, qualification or resources.

## P1 — Organic late-game bots

### Canonical Planet Destroyer mapping

**DISPROVED old finding:** `roles.dreadnought` is not a wrong ship mapping.

`FactionMechanicalRoles.ships.dreadnought` maps directly to `complete.planetDestroyer`. All further findings use the canonical real Planet Destroyer identity rather than interpreting the role name literally.

### compressed-v1 production

**CONFIRMED blocker.**

`getBotPhaseProductionTargets()` for `compressed-v1` is driven by the compressed milestone list:

```text
scout
fighter
colonizer
frigate
```

The list is exhausted by colonization and stays unchanged through `heavy-fleet`, `planet-destruction` and `endgame-preparation`. Threat pressure may add ordinary combat units, but not the Planet Destroyer.

`planBotResearchAndProduction()` consumes those production targets. In compressed mode commander production and legacy fallback targets are empty, so there is no alternate generic unit-production fallback that adds the Planet Destroyer.

The compressed scheduler obtains production from that same planner. No second general ship-production planner was found in its candidate chain.

### capability versus ownership

`progressionPhase.ts` deliberately treats `hasShipOrCapability(...)` as sufficient for progression. The Planet Destroyer checkpoint therefore accepts either owned Planet Destroyer or production capability. Capability can move an empire past `heavy-fleet` without the physical ship.

This explains why a compressed scenario can report `endgame-preparation` while its production planner never requests the destroyer.

### legacy-v1 comparison

**CONFIRMED differentiation:** legacy production targets explicitly include `roles.dreadnought` in `heavy-fleet` and request higher totals in `planet-destruction` / `endgame-preparation`. Because that role maps to `complete.planetDestroyer`, legacy-v1 has a physical Planet Destroyer target that compressed-v1 lacks.

### Solar War / Gate readiness

- Solar War fleet eligibility only requires a stationed, non-mission own fleet containing at least one attacking ship. This means entry eligibility alone is not evidence of meaningful late-game strength.
- final-object start requires a **positive Solar War result** matching current solo/alliance participation.
- final-object planner can queue the Galactic Obelisk, start/contribute to the final project and attack an enemy vulnerable Gate when legal.
- enemy Gate attack explicitly requires the real canonical `complete.planetDestroyer` in the attacking fleet.
- organic resource sufficiency and positive Solar War strength are not measured by the current fresh scenario.

**Verdict:** endgame mechanics exist, but organic late-game readiness is not closed.

## P2 — advertised effect consumer matrix

| Advertised value | Producer / aggregation | Audited gameplay consumer | Verdict |
|---|---|---|---|
| `salvageEfficiencyPercent` | Scrapyard; accumulated by `buildingOperations.ts` | `collectDebris()` collects by cargo capacity/field amounts and does not consume the building summary | **CONFIRMED ghost gap** |
| `marketEfficiencyPercent` | Trade Center; accumulated by `buildingOperations.ts` | market quote/swap uses global market fee/reserves/price impact; no planet building efficiency input | **CONFIRMED ghost gap** |
| `bankCreditEfficiencyPercent` | Bank; accumulated by `buildingOperations.ts` | No consumer found in inspected market/planet/empire economy paths; repository-wide absence was not proven strongly enough to make a removal/formula claim | **UNKNOWN** |
| `ecologyCapacity` | research effect summary | Colony limit is `1 + colonization research level`; planet economy consumes energy output but not ecology capacity | **CONFIRMED ghost gap** |

Implementation must not invent formulas. For each confirmed ghost effect, the implementation choice must either connect an already intended semantic consumer with tests or remove/hide the misleading advertised effect. Bank stays evidence-gated.

## P3 — combat correctness

### Battle seed identity

**CONFIRMED blocker.** `resolveAttackMission()` derives battle seed as:

```text
state.seed ^ eventSequence ^ attackerFleet.id.length
```

Only fleet-ID length contributes, so different equal-length fleet IDs collide under the same state seed/event sequence. Replace this with stable full-identity entropy while preserving deterministic replay/save behavior.

### pooled multi-fleet defender doctrine

**CONFIRMED blocker.** All stationed defender fleets are pooled into `defenderUnits`, but formation, target priority, commander and defender command-combat effects are taken from `defenderFleets[0]` only. The battle therefore combines multiple fleets' units under the first fleet's doctrine/commander semantics.

The fix needs an explicit deterministic multi-fleet doctrine rule; do not silently depend on array order.

## P4 — UI/runtime truth

### Building queue slots

**DISPROVED old finding:** four functional building slots do not exist.

- runtime `queueBuildingConstruction()` writes `buildQueue: [queueItem]`;
- UI building cards block when `planet.buildQueue.length > 0` and report that the construction queue is occupied.

Current truth is one active building construction per planet. Do not create a queue-capacity implementation item from the old hypothesis.

### Research requirements

**DISPROVED old finding:** UI and command runtime do not use divergent requirement resolvers.

Both `researchScreen.ts` and `researchCommands.ts` call the same `findMissingResearchRequirements(definition, research, planet, profileId)`. That function resolves profile-adjusted requirements through `resolveResearchRequirement(...)` and caps the laboratory requirement against profile building limits.

No research-resolver parity PR is justified by this Audit.

## P5 — bot differentiation, difficulty, memory, offense

| Area | Current truth | Verdict |
|---|---|---|
| Aegis | `industrial`, normal profile, 600s cadence, 2 commands | **CONFIRMED differentiated profile** |
| Synod | `explorer`, hard profile, 300s cadence, 3 commands | **CONFIRMED differentiated profile** |
| Veyra | `aggressive`, normal profile, 450s cadence, 2 commands | **CONFIRMED differentiated profile** |
| Legacy personality strategy | industrial/explorer/aggressive use different planner priority orders | **CONFIRMED** |
| Compressed personality strategy | common priority pipeline; profile cadence/budget still differs | **CONFIRMED but narrower differentiation** |
| Endgame alliance policy | Aegis/Synod alliance path; Veyra solo path | **CONFIRMED** |
| Offensive planner | armed fleets attack current level-3 intel targets when power threshold and mission legality pass | **CONFIRMED** |
| `BotDifficulty` | difficulty-tagged default profiles carry materially different cadence/command budgets consumed by scheduler; the string itself is not a separate switch-based difficulty engine | **DISPROVES “difficulty has no runtime effect at all”; limitation retained** |
| Memory | `memory.ts` is a deterministic view over persisted intelligence observations/alerts, including stale/current state; not a separate hidden learning store | **CONFIRMED existing memory surface** |

Therefore do not schedule “make bots attack”, “add bot memory from scratch” or a new archetype expansion before organic endgame closure. If richer compressed personality behavior is desired later, it needs a separate post-closure product decision rather than being treated as missing baseline correctness.

## P6 — low-cost tooling

- `package-lock.json` exists, but CI and Browser E2E use `npm install --no-audit --no-fund`, not `npm ci` — **CONFIRMED low-cost gap**.
- `package.json` has Playwright but no axe dependency/script — **CONFIRMED absence of an axe gate**; existing accessibility runtime/tests should be preserved rather than replaced.
- no snapshot baseline was found in the audited test tree — **CONFIRMED no current visual snapshot baseline in inspected tests**.
- broad dead-code deletion is **UNKNOWN / not authorized** because this Audit did not prove a safe dead-code list. Only separately proven dead code may be removed.

Tooling is lower priority than organic campaign correctness.

## CONFIRMED

1. Current Fresh Game scenario uses ordinary commands but terminates at formal `endgame-preparation`, not terminal campaign result.
2. `compressed-v1` does not request a physical Planet Destroyer in its production-target path.
3. Capability alone can satisfy the Planet Destroyer phase checkpoint and advance progression.
4. `legacy-v1` does request the canonical Planet Destroyer.
5. Existing terminal closure acceptance relies on direct late-game buildings/ships/fleets/resources preparation.
6. Organic positive Solar War qualification, Gate funding/building and terminal closure are not proven.
7. `salvageEfficiencyPercent`, `marketEfficiencyPercent` and `ecologyCapacity` have advertised/aggregated values without matching consumers on the audited canonical paths.
8. Attack battle seed uses collision-prone fleet-ID length entropy.
9. Pooled multi-fleet defense takes doctrine/commander semantics from the first defender fleet only.
10. Bots already perform offensive attack planning.
11. Aegis/Synod/Veyra profiles, cadence/budgets, legacy priorities and endgame policies are differentiated.
12. CI/E2E use `npm install`; axe and visual snapshot gates are absent from the audited setup.

## DISPROVED

1. **Wrong:** `roles.dreadnought` maps to the wrong unit. **Truth:** it maps directly to real `complete.planetDestroyer`.
2. **Wrong:** four building queue slots are functionally implemented. **Truth:** runtime and UI enforce one active construction.
3. **Wrong:** research UI and runtime use mismatched authoritative requirement logic. **Truth:** both call the same profile-aware resolver path.
4. **Wrong:** bots do not attack. **Truth:** fleet planner selects legal attack missions after intelligence and power checks.
5. **Wrong as a blanket claim:** bot difficulty/profile data is unused. **Truth:** the default difficulty-tagged profiles have scheduler-consumed cadence and command-budget differences, although `difficulty` is not itself a standalone algorithmic switch.

## UNKNOWN

1. Whether `bankCreditEfficiencyPercent` has a non-obvious consumer outside the inspected economy/market paths; no implementation formula may be guessed.
2. Organic measured Solar War score/strength distribution across accepted seeds/factions after fixing physical late-game production.
3. Organic time/resource envelope for Obelisk/final-project/Gate completion after Solar War qualification.
4. Whether richer compressed personality differentiation is desirable; current behavior is functional but less personality-shaped than legacy.
5. A proven dead-code list.
6. Secondary Nemexia mechanics without strong supplied/live provenance; these remain research candidates, not parity requirements.

## Nemexia reference / provenance matrix

The Audit does not promote prior external notes to truth. Current Stellar product correctness has priority.

| Candidate stream | Stellar status | Reference provenance available to this Audit | Classification | Confidence / action |
|---|---|---|---|---|
| Physical planet-destruction ship in late progression | Stellar has canonical Planet Destroyer; compressed organic target missing | prior research / `HYPOTHESIS` unless backed by supplied snapshot | **KEEP_STELLAR** for canonical unit; fix Stellar closure first | High on Stellar, no external formula needed |
| Planet destruction / Gate attack | Existing Stellar mechanics explicitly require real Planet Destroyer for enemy Gate attack | prior research / `HYPOTHESIS` | **KEEP_STELLAR** | High; do not port formulas |
| Alliance vs solo Solar War participation | Existing Stellar has Aegis/Synod alliance and Veyra solo policy | prior research context / `HYPOTHESIS` | **KEEP_STELLAR** | High on current product truth |
| Final Gate / terminal flow | Existing prepared-fixture mechanics work; organic path missing | prior research / `HYPOTHESIS` | **KEEP_STELLAR** and close organic path | High |
| Salvage / Trade / Bank / ecology semantics | Current advertised effects partly ghost | prior Nemexia notes are not verified implementation contracts | **RESEARCH** before any Nemexia-derived formula | Mixed |
| Multi-fleet doctrine semantics | Current first-fleet reduction is a Stellar correctness issue | no authoritative Nemexia rule established here | **KEEP_STELLAR / RESEARCH rule** | Fix deterministic correctness without copying unknown rule |
| Bot archetype expansion | Existing three bots already differentiated | no reference need demonstrated | **REJECT for this batch** | Defer until closure |
| Broad market/logistics rewrite | Existing systems functional; no blocker evidence | no strong provenance need | **REJECT for this batch** | Avoid scope inflation |
| Framework migration / event sourcing / combat redesign | Not required by audited blockers | none relevant | **REJECT** | Old broad recommendations remain obsolete/unjustified |

Any later Nemexia-derived implementation claim must record one of the roadmap provenance tags (`LIVE_HTML`, `LIVE_BATTLE_REPORT`, `LIVE_DOM_GLOBAL`, `SUPPLIED_INFO_PAGE`, `AUTOMATION_OBSERVATION`, `USER_MEMORY`, `HEURISTIC`, `HYPOTHESIS`) and must not treat `USER_MEMORY`, `HEURISTIC` or `HYPOTHESIS` as verified mechanics.

## Ranked backlog

1. **P0 — organic late-game closure:** physical Planet Destroyer production plus Fresh Game → positive Solar War → final object → terminal proof.
2. **P1 — combat identity/doctrine correctness:** full stable fleet identity in battle seed and deterministic multi-defender doctrine handling.
3. **P1 — advertised-effect truth:** salvage / market / ecology consumer-or-remove decisions; Bank only after evidence closure.
4. **P2 — low-cost quality gates:** `npm ci`, axe, visual snapshots; dead code only if separately proven.
5. **P3 — optional product research:** richer compressed personality differentiation / additional Nemexia-reference candidates after campaign correctness.

## Proposed implementation batch — NOT AUTHORIZED YET

Default bounded batch: four PRs. Implementation starts only after controller approval and Audit merge. Every dependent successor must branch from the fresh merged `main` after predecessor review/merge.

### `POST-1.0-PR1-ORGANIC-LATE-GAME-CLOSURE` — blocking

**Scope**

- make compressed late-game production physically acquire the canonical Planet Destroyer rather than satisfying only capability;
- extend the ordinary-command progression proof beyond `endgame-preparation` through a positive Solar War result, legal Obelisk/final-project/Gate flow and terminal result;
- tune only the minimum existing production/economy/endgame planner targets required to close that executable path;
- preserve `legacy-v1` behavior and existing endgame policies.

**Acceptance**

- accepted fresh seeds/factions reach at least one real Planet Destroyer through commands/queues, not direct inventory mutation;
- the terminal runner contains no direct building/research/resource/fleet/endgame injection;
- runner reaches positive Solar War qualification and terminal campaign result through legal commands/runtime;
- save round-trip and partitioned time advancement remain deterministic;
- existing prepared-fixture endgame tests remain valid as focused mechanics tests.

**Tests**

- production-target/phase regression tests for compressed vs legacy;
- extended organic progression scenario / terminal gate;
- save/offline/partition determinism over the organic closure path.

**Schema/save impact:** none expected. If durable state is unexpectedly required, stop and rescope before migration.

### `POST-1.0-PR2-COMBAT-IDENTITY-DOCTRINE`

**Scope**

- derive battle entropy from stable full fleet identity rather than ID length;
- define and implement deterministic pooled multi-defender doctrine/commander semantics;
- do not redesign the combat engine or formulas beyond these correctness defects.

**Acceptance/tests**

- distinct equal-length fleet IDs do not collapse to the same identity contribution;
- same stable inputs replay identically across save/load;
- multi-fleet defense result no longer depends implicitly on first array element;
- explicit tests cover differing defender formations/target priorities/commanders and fleet order.

**Schema/save impact:** none expected.

### `POST-1.0-PR3-ADVERTISED-EFFECT-TRUTH`

**Scope**

- resolve salvage, market and ecology ghost effects by connecting an already intended consumer or removing/hiding the misleading advertised value;
- first close evidence for Bank; if still unknown, leave Bank unchanged and document it rather than guessing credit mechanics;
- no broad market/economy rewrite.

**Acceptance/tests**

- every touched advertised effect has a deterministic runtime consumer test or is no longer advertised as active;
- no Nemexia-derived formula enters without strong provenance;
- existing market/debris/colonization/economy behavior remains regression-covered.

**Schema/save impact:** none expected; avoid persisting derived summaries.

### `POST-1.0-PR4-LOW-COST-QUALITY-GATES`

**Scope**

- switch lockfile-backed CI/E2E installs to `npm ci` where compatible;
- add bounded axe accessibility coverage to representative production screens;
- add stable Playwright visual snapshots for a small deterministic screen set;
- remove code only when deadness is proven in that PR.

**Acceptance/tests**

- CI and browser workflows remain green from clean lockfile installs;
- axe gate has explicit allowed-zero/known-issue policy rather than silent exclusions;
- snapshots are deterministic and artifact/debug friendly;
- no speculative cleanup.

**Schema/save impact:** none.

## Dependency graph

```text
Audit #173 POST-1.0-NEMEXIA-PARITY-AUDIT
  └─ controller review + merge
      └─ PR1 ORGANIC-LATE-GAME-CLOSURE  [blocking product proof]
          └─ controller review + merge
              ├─ PR2 COMBAT-IDENTITY-DOCTRINE      [code-independent from PR3]
              ├─ PR3 ADVERTISED-EFFECT-TRUTH       [code-independent from PR2]
              └─ PR4 LOW-COST-QUALITY-GATES        [intentionally after gameplay truth]
```

PR2 and PR3 are logically independent of each other. PR4 is also technically independent but deliberately ordered after gameplay correctness. Do not stack dependent branches. Unless the controller explicitly authorizes independent parallel preparation after accepting this Audit, execute each checkpoint from fresh `main` after the prior reviewed merge.

## Risk / schema / save assessment

- **Schema/save:** no migration is justified by this batch; baseline remains schema v19 / save v6.
- **Determinism:** PR1 and PR2 are high-sensitivity; both require save/load and partition replay gates.
- **Performance:** PR1 extended organic scenario can increase CI runtime; keep seed matrix bounded and retain explicit operation budgets.
- **Browser:** PR1 is simulation-first but terminal UI smoke should remain green; PR4 intentionally adds browser quality coverage later.
- **Reference risk:** highest for effect formulas. Do not import Nemexia semantics from weak provenance.

## Audit acceptance recommendation

This Audit is complete enough for controller review. Core blockers and disproved hypotheses have executable evidence. Remaining secondary gaps are explicitly `UNKNOWN` and do not prevent choosing the first bounded implementation batch.

**STOP:** leave the Audit PR open; do not merge; do not create `POST-1.0-PR1-ORGANIC-LATE-GAME-CLOSURE` until controller approval and Audit merge.
