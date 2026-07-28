# Current implementation batch audit — PLANET-DEMOLITION-DESTRUCTION-01

**Audit PR:** #121  
**Status:** accepted when Audit PR #121 merges  
**Baseline:** exact post-PR #120 `main`, SHA `818aba011199dd5a96518f859ed35de671be892f`  
**Protocol:** `docs/28-audit-first-autonomous-delivery-protocol.md`  
**Roadmap milestone:** M4 — Ordinary mechanics complete  
**Complexity:** heavy  
**Authorized implementation count:** two sequential PRs, planned #122–#123

## 1. Executive decision

The next coherent batch completes the destructive branch of the existing ordinary attack mission:

```text
ordinary attack
→ deterministic battle
→ surviving planet-destroyer capability
→ building detonation
→ whole-planet destruction roll
→ atomic state/reference reconciliation
→ reports, UI, bots, save/load and Browser E2E
```

The batch is `PLANET-DEMOLITION-DESTRUCTION-01`.

| Planned PR | Work item | Player-visible result |
|---:|---|---|
| #122 | `PLANET-DEMOLITION-CONTRACT` | ordinary attacks with surviving planet-destroyers can deterministically remove eligible building levels and report every roll |
| #123 | `PLANET-DESTRUCTION-RECOVERY-GATE` | eligible planets can be destroyed without dangling state; the released coordinate can be colonized again and the full player/bot/save/browser gate closes the batch |

This is a heavy two-PR batch because removal of a live colony crosses combat, planets, fleets, queues, events, logistics, intelligence, reports, UI, bots, persistence and navigation. Splitting further would leave unsafe transitional states; combining both parts would make one unreviewable destructive PR.

## 2. Why this batch is next

### VERIFIED

- PR #120 closed the ordinary mission/intelligence batch and left planet destruction/recovery as an explicit M4 limitation.
- Audit #116 explicitly deferred planet demolition/destruction into a separate heavy audit because it affects buildings, colony survival, fleets, reports, bots and persistence.
- `docs/25-solar-war-obelisks-gates-and-progression.md` is the canonical gameplay contract for demolition points, building-detonation thresholds, whole-planet destruction chances, defence reductions, Polias reduction and last-colony protection.
- All three factions already have a `planet-destroyer` ship class and `planet-breaker` ability.
- Commander effects already expose `demolitionBasisPoints` and `planetDestructionReductionBasisPoints`, but demolition is currently misapplied only as a small combat weapon bonus.
- `resolveAttackMission()` currently resolves combat, defence recovery, plunder, debris and a `BattleReport`; it never damages buildings or removes a planet.
- `PlanetState` is an active-colony record. A destroyed coordinate can be represented by removing the colony, clearing the galaxy owner and retaining the underlying Universe position.
- Existing schema v14 already supports a variable active-planet array, optional report fields and recolonization of an unowned position. No tombstone collection is required.
- Colony removal must reconcile fleet origins/targets, queues, pending events, logistics routes, active world events, commander flagship references and UI active-colony context.
- Bounded intelligence observations and historical event logs may safely retain snapshots and exact coordinates after the active colony disappears.

### DECISION

Implement ordinary planet destruction without introducing a new mission kind. `SEND_FLEET` with mission `attack` remains the only entry point. Battle resolution remains authoritative and produces a single extended battle report containing combat, demolition and destruction outcomes.

### Why not economy/logistics redesign now

Multi-colony economy and logistics coherence are a separate M4 family. This batch only deletes routes invalidated by a destroyed endpoint; it does not redesign routing, transport balance, market behavior or colony specialization.

### Why not solar war/endgame now

Sun Attack, Sun Support, system collapse/regeneration, alliances, Solar Crystals, Obelisks, Gates and victory require their own later audits and explicit persisted endgame state. This batch handles ordinary colony attacks only.

## 3. Scope boundary

### Included

- configurable faction-specific planet-destroyer demolition/destruction profiles;
- weapon-upgrade scaling from level 0 through level 10;
- deterministic demolition points, target selection and per-building rolls;
- Annihilator demolition bonus applied to building rolls rather than generic weapon damage;
- deterministic whole-planet destruction chance with cap, defence, defending planet-destroyer and Polias reductions;
- last-colony protection for every non-neutral empire;
- extended battle reports and routed presentation;
- atomic removal/release of a destroyed colony;
- fleet, queue, event, route, world-event, flagship and navigation reconciliation;
- recyclable debris at the released coordinate;
- player and bot behavior through shared attack/report state;
- save/load, checksum, replay, headless and Browser E2E gates.

### Excluded

- new mission kinds or commands;
- Sun Attack, Sun Support or destruction/regeneration of a star system;
- alliances, diplomacy, Solar Crystals, Obelisks, Gates or victory;
- destruction of the final colony or complete empire elimination;
- rebuilding the same destroyed colony automatically;
- refunding destroyed construction, research, production, repair or upgrade queues;
- new art, copied Nemexia assets/text/formulas, monetization or premium mechanics;
- combat-v3 replacement, broad unit rebalance or economy/logistics redesign.

## 4. Verified current architecture

### 4.1 Attack resolution

`src/simulation/fleets/flightCommands.ts::applyFlightEvent()` resolves an `attack` arrival through `src/simulation/combat/resolveAttackMission.ts`, enqueues the returned `BattleReport` and schedules the surviving attacker fleet home.

`resolveAttackMission()` currently:

- gathers planetary defence and stationed defender fleets;
- applies research, ship upgrades, formation, target priority and one active Commander Ship;
- resolves deterministic combat;
- applies ship/defence recovery;
- plunders resources after attacker victory;
- creates debris;
- writes one battle report.

There is no post-combat siege phase.

### 4.2 Existing destructive capability

- `CompleteShipClass` includes `planet-destroyer`;
- faction catalogs map Aegis, Synod and Veyra planet-killer hulls;
- `planet-breaker` exists but its current generic ability fields do not encode the canonical faction-specific level-10 tables;
- Annihilator exposes demolition basis points;
- Polias exposes planet-destruction reduction basis points.

### 4.3 Cross-reference surface

A live `PlanetState.id` may be referenced by:

- fleet `originPlanetId`, stationary location, transit endpoints and mission target;
- building, unit, defence-repair, research and ship-upgrade completion events/queues;
- logistics route endpoints;
- intelligence observations and alerts;
- debris fields;
- active world events;
- commander flagship fleet references indirectly through removed fleets;
- application active-planet and canonical Planet routes.

Historical command/event/report entries are immutable evidence and must not be rewritten.

### 4.4 Persistence

Schema v14 validates active planets, fleets, intelligence, debris, routes, events and bot timing. It does not require a fixed planet count. The accepted design removes the active colony, clears ownership in the materialized galaxy and records destruction inside the battle report. Existing schema-v14 saves remain valid and require no migration.

## 5. Architectural decisions

### 5.1 One siege configuration registry

Add a pure configuration module expected under:

```text
src/simulation/combat/planetSiegeConfig.ts
```

It owns level-10 values from the canonical contract:

| Faction | Demolition points/ship | Destruction chance/ship |
|---|---:|---:|
| Aegis | 100 | 300 basis points |
| Synod | 90 | 250 basis points |
| Veyra | 55 | 150 basis points |

For weapon-upgrade level `L` from 0 through 10:

```text
pointsPerShip = floor(level10Points * L / 10)
chancePerShipBps = floor(level10ChanceBps * L / 10)
```

Level 0 therefore provides no siege contribution. All constants remain centralized and testable.

### 5.2 Siege eligibility and order

Post-combat siege is evaluated only when at least one attacker `planet-destroyer` survives Commander recovery.

Order:

1. normal battle, defence recovery, plunder and ordinary combat debris;
2. building demolition when the battle winner is `attacker` or `draw`;
3. whole-planet destruction only when the battle winner is `attacker`;
4. report construction and atomic state reconciliation.

Destroyed planetary resources, queues, inventory and installations create no extra reward or debris beyond the existing combat/plunder result. This avoids adding an unaudited economy multiplier.

### 5.3 Demolition points and thresholds

```text
rawPoints = sum(surviving attacker planet-destroyers * scaled points per ship)
defenceReduction = floor(surviving planetary-defence population / 2500) * 100
finalPoints = max(0, rawPoints - defenceReduction)
```

The canonical threshold table is applied unchanged:

| Final points | Chance per selected building | Maximum selected buildings |
|---:|---:|---:|
| 0–19 | 0% | 0 |
| 20–100 | 20% | 1 |
| 101–200 | 40% | 1 |
| 201–400 | 60% | 1 |
| 401–550 | 50% | 2 |
| 551–700 | 70% | 2 |
| 701–850 | 50% | 3 |
| 851–1000 | 60% | 5 |
| >1000 | 33% | every eligible building |

Annihilator adds its `demolitionBasisPoints` to each selected-building roll, capped at 10000 basis points. It no longer creates a generic combat weapon bonus.

Eligible buildings:

- have level greater than zero;
- are not endgame-locked Galactic Obelisk or Supreme Gates definitions;
- are sorted by stable mechanical ID before deterministic selection.

Each successful roll removes exactly one level. Level zero removes the building entry and recalculates zone usage. An in-progress upgrade of a demolished building is cancelled without refund and its completion event is removed.

### 5.4 Deterministic rolls

All target selection and rolls derive from stable hashes containing:

```text
state.seed · battle event sequence · attacker fleet id · target galaxyPlanetId · domain · building id
```

No `Math.random`, browser timing or array insertion order may affect the outcome. `BattleReport` stores the calculated inputs, selected targets, rolls and applied results.

### 5.5 Whole-planet destruction chance

```text
rawChanceBps = sum(surviving attacker planet-destroyers * scaled chance per ship)
defenceReductionBps = floor(surviving planetary-defence population / 1000) * 100
defenderPlanetKillerReductionBps = sum(surviving defender planet-destroyers * their scaled chance)
poliasReductionBps = active defender Polias reduction
finalChanceBps = clamp(0, 3000,
  rawChanceBps
  - defenceReductionBps
  - defenderPlanetKillerReductionBps
  - poliasReductionBps
)
```

The destruction roll uses a separate deterministic domain hash. If the defender owns only one active colony, `finalChanceBps` is presented but the destruction result is blocked with reason `LAST_COLONY_PROTECTED`. Demolition may still occur.

### 5.6 Atomic destroyed-planet reconciliation

Introduce a pure boundary expected under:

```text
src/simulation/planet/reconcileDestroyedPlanet.ts
```

Given the post-battle state and target, it must atomically:

- remove the target `PlanetState`;
- clear `ownerEmpireId` on the underlying galaxy position;
- remove building, production and defence-repair queues with no refund;
- remove research/ship-upgrade queue items tied to the planet and their completion events;
- delete logistics routes using the planet as either endpoint;
- cancel active world events targeting the planet and their end events;
- remove fleets stationed on the destroyed planet;
- rehome surviving fleets whose `originPlanetId` was destroyed to the nearest owned colony, ordered by coordinate then ID;
- convert other outbound/holding fleets targeting the destroyed planet into deterministic returns to their valid origin/rehome colony and replace obsolete arrival events;
- clear commander flagship references to fleets removed by reconciliation;
- retain intelligence observations/alerts and historical reports as snapshots with coordinates;
- re-key combat debris to the stable `galaxyPlanetId` and preserve its coordinate;
- keep command/event history unchanged.

Last-colony protection guarantees a rehome colony for the destroyed owner. Invalid state must fail tests rather than silently drop a surviving fleet.

### 5.7 Recovery and recolonization

Recovery means the destroyed coordinate returns to the normal unowned Universe pool. It is not automatically rebuilt and has no new cooldown in this batch.

The existing colonization command may claim it again when ordinary colony-limit, technology, biome, fleet and cargo rules pass. The new colony receives a fresh active `PlanetState` from the existing colony constructor.

Recycle targeting must accept debris at an unowned/released coordinate using its stable galaxy-planet ID and coordinate, without requiring an active `PlanetState`.

### 5.8 Reports, UI and bots

Extend `BattleReport` with optional siege data:

- demolition points and reductions;
- selected buildings, roll basis points and levels removed;
- destruction chance, reductions, roll and blocked reason;
- `planetDestroyed`;
- target coordinate and galaxy-planet ID.

Unified reports display demolition/destruction summaries and retain exact map backlinks after the colony is removed.

Player UI must show the structural risk before attack when full current level-three intelligence exposes the relevant target information. Hidden owner/building/fleet data remains redacted below existing intelligence thresholds.

Bots do not receive a new command or hidden state. They use their existing perception and ordinary attack planner. Siege capability may affect target scoring only from current level-three intelligence and own fleet composition.

## 6. Implementation sequence

Detailed file maps and gates are recorded in:

- `docs/audits/contracts/planet-demolition-destruction-01-prs.md`;
- `docs/audits/contracts/planet-demolition-destruction-01-rules.md`;
- `docs/audits/evidence/planet-demolition-destruction-01-graphify.md`.

Strict order:

```text
#122 PLANET-DEMOLITION-CONTRACT
→ #123 PLANET-DESTRUCTION-RECOVERY-GATE
```

Each branch starts from the latest merged `main` after its dependency.

## 7. Determinism, persistence and performance

- schema remains v14; no migration or new persisted collection;
- old schema-v14 saves parse unchanged;
- reports use optional additive fields;
- same state, event sequence and command produce the same selected buildings, rolls and cleanup;
- one destruction transition performs linear passes over bounded state collections;
- selectors must not repeatedly scan all state inside render loops;
- failed/blocked destruction does not add a separate command or mutate state beyond the already resolved battle/demolition outcome;
- route/filter state remains outside `GameState`.

## 8. Required validation

Every implementation PR runs asset check, lint, TypeScript, full unit suite, production build, Chromium Browser E2E and Graphify.

Batch-specific gates:

- exact faction profile and level-scaling matrix;
- every demolition threshold boundary;
- stable selected-building order and independent per-building rolls;
- Annihilator bonus and removal of the incorrect generic weapon bonus;
- defence-population reductions;
- defending planet-destroyer and Polias reductions;
- 30% destruction cap;
- attacker win/draw/defender outcomes;
- last-colony protection;
- building level/zone/queue reconciliation;
- fleet origin, target, return-event and flagship reconciliation;
- research, upgrade, logistics and world-event cleanup;
- historical intelligence/report retention and exact coordinate backlink;
- debris recycling without active colony;
- recolonization of the released coordinate;
- schema-v14 serialize/parse/checksum/replay stability;
- bot hidden-information isolation;
- Browser E2E for attack report, demolished building, protected last colony, destroyed secondary colony, map backlink, active-colony fallback, reload and both release viewports;
- combined headless sequence: attack → demolition → destruction → save/load → recycle → recolonize.

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| removal leaves dangling fleet/event references | one pure reconciliation boundary plus cross-reference invariant tests |
| detonation changes normal combat damage | separate post-combat siege phase; remove commander demolition from weapon bonus |
| hidden target data leaks through risk preview | preview consumes existing redacted intelligence view only |
| destruction deletes the final playable colony | universal last-colony guard before roll application |
| destroyed-position debris becomes unreachable | stable galaxy-planet debris target accepted without active colony |
| old reports lose map backlinks | persist optional coordinate and galaxy-planet ID in the battle report |
| queue deletion creates free refunds | all destruction cancellations are explicitly no-refund |
| endgame scope leaks into ordinary attacks | endgame-locked buildings are ineligible; sun/system/alliance work excluded |

## 10. Evidence classification and unknowns

### VERIFIED

The attack resolver, mission arrival, planet model, colony creation, fleet references, research/upgrade queues, logistics, intelligence, world events, reports, save validator, Commander effects and canonical destruction contract were inspected on exact baseline `818aba011199dd5a96518f859ed35de671be892f`.

The existing PR #120 Graphify graph covers the same runtime baseline family with 2,130 nodes, 6,795 relationships, 103 communities, 100% extracted and 0% inferred. Audit PR #121 must pass a fresh Graphify run before merge.

### INFERRED

A separate post-combat siege phase is the lowest-risk integration because the current battle resolver already provides surviving units, defence population, Commander effects, report creation and deterministic seed inputs.

### DECISION

- heavy two-PR batch;
- no new mission kind;
- no schema migration;
- level-10 canonical values scale linearly by weapon-upgrade level;
- demolition on attacker win or draw; whole destruction on attacker win only;
- last colony cannot be destroyed;
- destroyed coordinates become immediately eligible for normal recolonization;
- no additional destruction loot/debris beyond current combat output.

### UNKNOWN

No critical unknown remains. Implementation may discover ordinary code defects, but any material change to these mechanics or cleanup rules requires an amended/replacement audit rather than silent expansion.

## 11. Acceptance gate for Audit PR #121

Before merge:

- documentation/status-only diff;
- exact baseline and two-PR sequence recorded;
- JSON status/roadmap files valid;
- asset audit, lint, TypeScript, full tests and production build pass;
- Browser E2E passes;
- fresh Graphify passes;
- generated Graphify/Playwright/diagnostic outputs are absent;
- critical unknowns remain zero.

After squash merge, create PR #122 from fresh post-#121 `main` and implement only `PLANET-DEMOLITION-CONTRACT`. Do not begin #123 in the same branch or PR.