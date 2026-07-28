# Current implementation batch audit — PLANET-DEMOLITION-DESTRUCTION-01

**Audit PR:** #121 · `2000a68216c7681fcbea0d69d1ed7e58e0c0c7f9`  
**Status:** accepted  
**Baseline:** exact post-PR #120 `main`, SHA `818aba011199dd5a96518f859ed35de671be892f`  
**Accepted audit head:** `5523fa0437b3e838b337a53f58fa5978733827cd`  
**Validation:** CI `30333447008`, Browser E2E `30333446989`, Graphify `30333446959` — passed  
**Protocol:** `docs/28-audit-first-autonomous-delivery-protocol.md`  
**Roadmap milestone:** M4 — Ordinary mechanics complete  
**Complexity:** heavy  
**Authorized implementation count:** two sequential PRs, #122–#123

## 1. Executive decision

Complete the destructive branch of the existing ordinary attack mission:

```text
ordinary attack
→ deterministic battle
→ surviving planet-destroyer capability
→ building demolition
→ whole-planet destruction roll
→ atomic live-reference reconciliation
→ reports, UI, bots, save/load and Browser E2E
```

| Planned PR | Work item | Outcome |
|---:|---|---|
| #122 | `PLANET-DEMOLITION-CONTRACT` | deterministic faction/weapon-scaled building demolition and report evidence |
| #123 | `PLANET-DESTRUCTION-RECOVERY-GATE` | safe colony removal, special/ordinary fleet recovery, debris/recolonization and combined gate |

This is a heavy two-PR batch because removing a live colony crosses combat, planets, ordinary and special fleets, queues, events, logistics, intelligence, reports, UI, bots and persistence.

## 2. Verified current state

### Combat and destructive capability

- `applyFlightEvent()` resolves ordinary `attack` through `resolveAttackMission()`.
- The resolver already handles battle, Commander recovery, defence recovery, plunder, debris and one `BattleReport`.
- It does not damage buildings or remove planets.
- All three factions have `planet-destroyer` hulls and `planet-breaker` capability.
- Annihilator exposes `demolitionBasisPoints`; Polias exposes `planetDestructionReductionBasisPoints`.
- Annihilator demolition is currently misapplied as a generic weapon bonus and must move to the siege phase.

### Active colony and references

`PlanetState` is an active-colony record. Its ID may be referenced by:

- fleet origin, stationary location, transit endpoints and mission target;
- building/unit/defence-repair completion events;
- research and ship-upgrade queues/events;
- logistics routes;
- active planet-target world events;
- commander flagship through a removed fleet;
- active Planet route/context;
- pending expedition and space-object reports through `originPlanetId`.

Intelligence observations, alerts and historical event/report entries are evidence snapshots and may retain old IDs when they also retain coordinates and are not treated as active targets.

### Special missions

- `ExpeditionReport.originPlanetId` and `SpaceObjectMissionReport.originPlanetId` are embedded in pending resolve events.
- `applyExpeditionEvent()` stations surviving fleets and credits rewards to that report origin.
- `applySpaceObjectMissionEvent()` does the same for ordinary resources while also applying object depletion/control/cooldown and strategic-resource rewards.
- Rehoming only `FleetState.originPlanetId` would therefore leave survivors stationed on a deleted colony and may silently discard ordinary rewards.

### Persistence and recovery

- Schema v14 allows a variable active-planet array.
- A destroyed coordinate can be represented by removing `PlanetState`, clearing galaxy ownership and retaining the underlying Universe position.
- Existing colonization can create a fresh colony at an unowned position.
- Additive optional report fields do not require schema v15 or a tombstone collection.

## 3. Scope

### Included

- faction-specific siege profiles and weapon-level scaling;
- canonical demolition thresholds and deterministic building rolls;
- Annihilator building-roll bonus;
- canonical whole-planet chance, reductions and 30% cap;
- final-colony protection;
- optional siege evidence in battle reports;
- atomic cleanup/rehome of all live references;
- explicit pending expedition/space-object return reconciliation;
- released-coordinate debris recycling and normal recolonization;
- UI/report backlinks, bots, save/load, replay, headless and Browser E2E.

### Excluded

- new mission kind or command;
- final-colony destruction or empire elimination;
- Sun Attack/Support, system collapse/regeneration;
- alliances, crystals, Obelisks, Gates or victory;
- automatic reconstruction/cooldown;
- refunds for destroyed/cancelled queues;
- extra destruction loot/debris;
- economy/logistics redesign;
- new/copies of third-party art, prose or UI;
- broad combat rebalance.

## 4. Mechanical decisions

### 4.1 Siege profiles

| Faction | Level-10 demolition points/ship | Level-10 destruction chance/ship |
|---|---:|---:|
| Aegis | 100 | 300 bps |
| Synod | 90 | 250 bps |
| Veyra | 55 | 150 bps |

At weapon-upgrade level `L`:

```text
scaledValue = floor(level10Value * clamp(L, 0, 10) / 10)
```

Only surviving post-Commander-recovery ships contribute.

### 4.2 Demolition

Eligible on attacker victory or draw when at least one attacker planet-destroyer survives.

```text
rawPoints = sum(survivors * scaled points)
defenceReduction = floor(surviving defence population / 2500) * 100
finalPoints = max(0, rawPoints - defenceReduction)
```

| Final points | Base roll | Selected buildings |
|---:|---:|---:|
| 0–19 | 0 bps | 0 |
| 20–100 | 2000 bps | 1 |
| 101–200 | 4000 bps | 1 |
| 201–400 | 6000 bps | 1 |
| 401–550 | 5000 bps | 2 |
| 551–700 | 7000 bps | 2 |
| 701–850 | 5000 bps | 3 |
| 851–1000 | 6000 bps | 5 |
| >1000 | 3300 bps | every eligible building |

Annihilator adds its demolition bps to each selected-building roll, capped at 10000. Eligible buildings have level >0 and are not endgame-locked. Each success removes one level; level zero removes the entry and recalculates zone use. An affected upgrade queue/event is cancelled without refund.

### 4.3 Whole-planet destruction

Eligible only on attacker victory with a surviving attacker planet-destroyer.

```text
rawChance = sum(attacker survivors * scaled chance)
defenceReduction = floor(surviving defence population / 1000) * 100
defenderKillerReduction = sum(defender surviving planet-destroyers * scaled chance)
poliasReduction = active defender Polias bps
finalChance = clamp(0, 3000,
  rawChance - defenceReduction - defenderKillerReduction - poliasReduction
)
```

Calculate/report risk before the final-colony guard, but never remove an empire's last active colony. Demolition may still occur.

Blocked reasons:

- `NO_SURVIVING_PLANET_DESTROYER`;
- `BATTLE_RESULT_INELIGIBLE`;
- `LAST_COLONY_PROTECTED`;
- `ZERO_FINAL_CHANCE`.

### 4.4 Determinism

Selection and rolls use stable hashes of:

```text
state.seed · battle event sequence · attacker fleet id
· target galaxyPlanetId · distinct domain · building id when applicable
```

No `Math.random`, browser time, locale ordering or mutable insertion order.

## 5. Atomic destroyed-planet reconciliation

Add a pure boundary expected at:

```text
src/simulation/planet/reconcileDestroyedPlanet.ts
```

On successful destruction it must atomically:

- remove the target colony and clear galaxy ownership;
- cancel planet-bound queues/events without refund;
- delete invalid logistics routes and planet-target world events/end events;
- remove fleets stationed on the destroyed planet;
- rehome surviving fleets whose origin was destroyed to nearest owned colony, ordered by coordinate then ID;
- convert ordinary inbound/holding fleets targeting the destroyed planet into deterministic returns and rebuild obsolete events;
- clear flagship references to removed fleets;
- retain historical intelligence/reports with exact coordinates;
- re-key combat debris to stable `galaxyPlanetId` and coordinate;
- keep command/event history immutable.

Invalid post-reconciliation live state is a test failure, not permission to silently discard a surviving fleet or reward.

### 5.1 Pending expedition and space-object missions

Do not convert these domain events into ordinary `FLEET_RETURN`.

When their historical launch colony is destroyed before resolution:

- retain `report.originPlanetId` unchanged as historical launch evidence;
- add optional `report.returnPlanetId` pointing to the deterministic rehome colony;
- rehome the fleet's own `originPlanetId` to that colony;
- handlers use `returnPlanetId ?? originPlanetId` as the live destination;
- surviving fleets station there;
- ordinary resource rewards are credited there;
- expedition rewards must not disappear;
- space-object depletion, control, cooldown and strategic-resource rewards still resolve normally;
- additive metadata keeps schema v14 and old reports/saves valid.

## 6. Recovery, reports, UI and bots

- Released coordinate immediately returns to ordinary unowned colonization rules.
- Recreated colony is fresh; no old buildings/resources/inventory/queues/defence.
- Recycle targeting must accept debris at an unowned position using stable galaxy-planet ID/coordinate.
- `BattleReport` gains optional demolition/destruction inputs, rolls, results, coordinate and galaxy-planet ID.
- Unified reports preserve exact map backlinks after removal.
- UI previews use only current level-three intelligence.
- Bots use existing perception and attack validation; siege scoring may use only own fleet composition and current level-three target intelligence.

## 7. Implementation sequence

```text
#122 PLANET-DEMOLITION-CONTRACT
→ #123 PLANET-DESTRUCTION-RECOVERY-GATE
```

Detailed files/gates:

- `docs/audits/contracts/planet-demolition-destruction-01-prs.md`;
- `docs/audits/contracts/planet-demolition-destruction-01-rules.md`;
- `docs/audits/evidence/planet-demolition-destruction-01-graphify.md`.

Each branch starts from fresh merged `main`.

## 8. Required validation

Every implementation PR: assets, lint, TypeScript, full tests, build, Chromium Browser E2E and Graphify.

Batch gates include:

- faction/scaling matrix and every demolition boundary;
- independent deterministic rolls and Annihilator behavior;
- defence, defender planet-killer, Polias, cap/floor and result eligibility;
- final-colony protection;
- building/zone/queue reconciliation;
- ordinary fleet origin/location/mission/event reconciliation;
- pending expedition destroyed-origin rehome, reward credit, fleet stationing, historical origin and save/load;
- pending space-object equivalent plus depletion/control/cooldown/strategic resources;
- research/upgrade/logistics/world-event/flagship cleanup;
- historical intelligence/report retention and exact backlink;
- debris recycling and recolonization;
- bot hidden-information isolation;
- combined attack → demolition → destruction → save/load → special/ordinary returns → recycle → recolonize headless flow;
- Browser E2E at 1366×768 and 1920×1080.

## 9. Evidence and unknowns

### VERIFIED

Combat, mission arrival, units/Commanders, planets/colonization, ordinary and special fleets, queues/events, logistics, intelligence, world events, reports, persistence, UI routing and bots were inspected on baseline `818aba011199dd5a96518f859ed35de671be892f`.

### DECISION

- heavy two-PR batch;
- existing attack only;
- schema v14 retained;
- demolition on attacker win/draw; destruction on attacker win only;
- final colony protected;
- immediate ordinary recolonization;
- no extra destruction economy output;
- historical special-mission origin separated from live return destination.

### UNKNOWN

No critical unknown remains. Material rule/cleanup changes require amended/replacement audit rather than silent expansion.

## 10. Audit #121 acceptance evidence

- documentation/status-only diff;
- exact baseline and #122→#123 sequence;
- JSON valid;
- final head `5523fa0437b3e838b337a53f58fa5978733827cd` passed CI `30333447008`, Browser E2E `30333446989` and Graphify `30333446959`;
- no generated outputs;
- P1 special-mission review blocker incorporated and resolved;
- critical unknowns zero.

Create #122 from fresh post-#121 `main` and implement only `PLANET-DEMOLITION-CONTRACT`.
