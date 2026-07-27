# Current implementation batch audit — ORDINARY-MISSIONS-INTELLIGENCE-01

**Audit PR:** #116  
**Status:** accepted when Audit PR #116 merges  
**Baseline:** post-PR #115 `main`, SHA `da1b3c943107ab13a003d5eb9bb084a229bdb51c`  
**Protocol:** `docs/28-audit-first-autonomous-delivery-protocol.md`  
**Roadmap milestone:** M4 — Ordinary mechanics complete  
**Complexity:** medium  
**Authorized implementation count:** four sequential PRs, planned #117–#120

## 1. Executive decision

The next coherent batch closes the ordinary player loop:

```text
known or unknown target
→ shared mission availability and reason
→ scout when knowledge is insufficient
→ deterministic intelligence / counter-intelligence
→ launch an eligible ordinary mission
→ inspect an intelligence or mission report
→ bots make the same decision from the same allowed information
```

The batch is `ORDINARY-MISSIONS-INTELLIGENCE-01`.

| Planned PR | Work item | Player-visible result |
|---:|---|---|
| #117 | `MISSION-RULES-REGISTRY` | every existing ordinary mission uses one shared availability, target, flight-slot and reason-code contract |
| #118 | `ESPIONAGE-COUNTERINTELLIGENCE` | scout missions have deterministic report tiers, cooldown, detection, probe loss and defender alerts |
| #119 | `INTELLIGENCE-REPORTS-PRESENTATION` | redacted mission composer, incoming-flight awareness and routed intelligence reports |
| #120 | `MISSION-INTELLIGENCE-BOT-GATE` | bots use the same rules and a combined deterministic/headless/browser gate closes the batch |

This is a medium four-PR batch. It connects several existing consumers, but deliberately avoids new persisted mission kinds, save-schema changes, broad combat replacement and planet-destruction mechanics.

## 2. Why this batch is next

### VERIFIED

- PR #115 completed the coherent shell, so ordinary mechanics can now be exposed and tested through stable routes.
- Roadmap M4 explicitly requires complete mission availability, espionage/counter-intelligence, report completeness and deterministic ordinary-loop progression.
- Existing `FleetMissionKind` already covers `transport`, `deploy`, `scout`, `attack`, `recycle` and `colonize`.
- `sendFleet()` validates those missions, `fleetOperationsWorkspace.ts` independently lists targets, and `fleetMissionPlanner.ts` independently decides bot missions.
- Research already computes `flightSlots` and `sensorStrength`, but ordinary flight dispatch does not enforce the slot result.
- Intelligence already persists bounded observations and alerts with level-1/2/3 snapshots, timestamps and deterministic detection.
- The Space intelligence view redacts unknown contacts correctly, while the Fleet composer currently reads raw `GameState.planets` and displays foreign owner IDs.
- Current unified reports omit scout observations and counter-intelligence alerts.

### DECISION

Create one shared simulation-side mission-rule layer before deepening intelligence. Player UI, reducer validation and bot planning must not maintain separate definitions of mission eligibility.

### Why not planet destruction now

Planet demolition/destruction changes buildings, colony survival, fleets, reports, bot strategy and likely persistence invariants. It also overlaps the project-specific endgame contract in `docs/25-*`. It requires a separate heavy Audit PR.

### Why not multi-colony economy now

Logistics and economic coherence are a separate ordinary-loop family with different state, scheduling and balance consumers. Combining them with intelligence would be a mixed-complexity batch.

## 3. Scope boundary

### Included

- shared rules for the six existing ordinary missions;
- explicit target visibility and disabled reasons;
- ordinary flight-slot enforcement using the already delivered research effect;
- dedicated scout-fleet composition rules;
- deterministic intelligence tier, cooldown, detection and probe survival;
- bounded defender alerts and incoming-flight selectors;
- intelligence reports derived from existing observations/alerts;
- redacted Fleet composer and route-aware context;
- player/bot parity and combined deterministic, save and Browser E2E gates.

### Excluded

- new mission enum values, including pirate raid, Space Trip, Sun Support or Sun Attack;
- changing specialized `START_EXPEDITION` or `START_SPACE_OBJECT_MISSION` ownership;
- planet demolition/destruction, planet abandonment or last-colony rules;
- combat-v3 replacement, new plunder balance or new debris formulas;
- alliances, diplomacy, coordinated attacks or alliance targets;
- Solar Crystals, Obelisks, Gates, victory or defeat;
- schema v15 or any save migration;
- new assets, copied Nemexia text/HTML/CSS/art, monetization or premium mechanics.

## 4. Verified current architecture

### 4.1 Mission dispatch

`src/simulation/fleets/flightCommands.ts::sendFleet()` currently owns direct checks for ownership, fleet state, role requirements, target ownership, debris, colonization, route and fuel. `applyFlightEvent()` then resolves scout, attack, recycle, deploy and transport behavior.

The checks are correct as command enforcement, but they are not reusable as a complete presentation contract. The UI previews only route/fuel, and the bot planner probes validity by executing `sendFleet()` against candidate commands.

### 4.2 Player composer

`src/ui/fleetOperationsWorkspace.ts` hardcodes mission labels, mission options and target selection. `getRegularTargets()` reads all canonical planets, and foreign options include `ownerEmpireId`. This bypasses the redacted intelligence model.

### 4.3 Intelligence

`src/simulation/intelligence/resolveScout.ts` already provides:

- deterministic hash-based resolution;
- research and sensor-grid strength;
- three snapshot levels;
- observation freshness;
- detection and defender alerts;
- bounded history through `STATE_HISTORY_LIMITS`.

Current gaps:

- snapshot tier is mostly absolute observer strength rather than observer-vs-defender strength;
- any fleet containing a scout role can scout;
- no cooldown is enforced;
- detected probes always return;
- no player-facing intelligence report route exists;
- incoming flights are not exposed through an intelligence-aware selector.

### 4.4 Bot parity

`src/simulation/bots/fleetMissionPlanner.ts` already scouts stale/public targets and attacks only current level-three observations. This is a strong foundation, but mission selection and reason codes are still duplicated. `BotPerception.publicColonyIds` exposes identifiers for all colonies; no bot implementation may use canonical owner/composition data beyond its perception snapshot.

### 4.5 Persistence

Schema v14 already validates:

- current mission kinds and fleet transit state;
- observation timestamps, levels and `detected`;
- defender alert confidence;
- bounded histories.

The accepted design derives cooldown, reports, flight-slot usage and incoming-flight views from current state. No new persisted field is required.

## 5. Architectural decisions

### 5.1 One ordinary mission registry

Introduce a pure simulation boundary, expected under:

```text
src/simulation/fleets/missionRules.ts
```

It owns:

- ordinary mission definitions and labels/tokens;
- fleet composition requirements;
- target relationship/visibility requirements;
- target candidates visible to an empire;
- flight-slot capacity and usage;
- route/fuel estimate;
- one ordered list of reason codes;
- a final `allowed` result consumed by `sendFleet`, UI and bots.

The reducer remains authoritative. `sendFleet()` calls the shared rule and returns its stable command error code/message. UI and bots may preflight, but cannot bypass command validation.

### 5.2 Existing mission ownership

The shared ordinary registry covers only:

```text
transport · deploy · scout · attack · recycle · colonize
```

`expedition` and `space-object` remain specialized operations started through their existing commands. They may count as active flights, but they are not moved into `SEND_FLEET` or the ordinary composer.

### 5.3 Flight-slot rule

Use the existing research effect without adding state:

```text
capacity = max(1, 1 + researchEffects.flightSlots)
used = number of empire fleets whose status is not "stationed"
```

Returning, holding and specialized-operation fleets consume a slot until stationed again. Recall does not free a slot immediately. A failed send does not consume fuel, slot or command history.

### 5.4 Target-knowledge policy

- `transport` and `deploy`: owned target colony only.
- `colonize`: unclaimed, non-gas, currently unoccupied galaxy position; existing colony-limit and technology rules remain.
- `recycle`: known non-empty debris target and recycler role.
- `scout`: foreign contact/current/stale target identified by stable ID/coordinate; unknown owner remains redacted.
- `attack`: foreign target requires a current level-three observation. Stale or lower-tier intelligence gives an explicit disabled reason.

The composer must never display owner, faction, resources, buildings, defenses or fleets that are absent from the empire's redacted intelligence view.

### 5.5 Scout mission contract

A scout mission uses exactly one ship whose role is `scout`, no other ships and zero cargo. This keeps the existing `scout` mission kind and faction-native hulls; no new probe entity is introduced.

Resolver inputs:

```text
observerStrength = empire sensorStrength + 1
counterStrength = target empire sensorStrength + target sensor-grid level
strengthDelta = observerStrength - counterStrength
```

Report tier:

- delta >= 3: level 3 / full;
- delta >= 0: level 2 / detailed;
- delta < 0: level 1 / basic.

Detection preserves the current deterministic project formula:

```text
chance = clamp(5, 90, 30 + counterStrength * 10 - observerStrength * 7)
```

Cooldown is derived from the newest observation for the same observer/target and is not separately persisted:

```text
cooldownSeconds = clamp(300, 7200, 3600 - observerStrength * 120 + counterStrength * 60)
```

When detected, the observation is still recorded and the defender receives an alert, but the probe is compromised and does not return. When undetected, it returns normally. The existing `detected` field therefore remains sufficient; no schema change is required.

### 5.6 Incoming-flight intelligence

A pure selector derives inbound fleets targeting an empire's colonies:

- always visible: target colony, arrival time and generic contact;
- source empire visible at sensor strength >= 5;
- mission kind and composition visible at sensor strength >= 10 or with current level-three intelligence on the origin/attacker;
- no hidden cargo, exact composition or owner is exposed below the threshold.

This is presentation/perception data derived from canonical fleets. It is not a new saved alert stream.

### 5.7 Intelligence reports

Extend the derived unified report model with presentation kind `intelligence`:

- observer reports derive from `IntelObservation`;
- defender counter-intelligence reports derive from `IntelligenceAlert`;
- no new `GameEventPayload`, report array or save field is introduced;
- add canonical filter `#/reports/intelligence`;
- map backlinks use existing observation/alert coordinates.

## 6. Implementation sequence

Detailed file maps and gates are in:

- `docs/audits/contracts/ordinary-missions-intelligence-01-prs.md`;
- `docs/audits/contracts/ordinary-missions-intelligence-01-rules.md`;
- `docs/audits/evidence/ordinary-missions-intelligence-01-graphify.md`.

Implementation order is strict:

```text
#117 MISSION-RULES-REGISTRY
→ #118 ESPIONAGE-COUNTERINTELLIGENCE
→ #119 INTELLIGENCE-REPORTS-PRESENTATION
→ #120 MISSION-INTELLIGENCE-BOT-GATE
```

Each branch starts from the latest merged `main` after its dependency.

## 7. Determinism, persistence and performance

- All mission availability and intelligence resolution are pure/deterministic for the same state, command and event sequence.
- Route/filter state remains outside `GameState`.
- No schema migration is authorized.
- Save import/export must accept existing schema-v14 fixtures unchanged.
- Observation/alert/report selectors remain bounded by existing history limits.
- Target candidate selectors must avoid repeated full-state scans inside render loops; compute indexed/redacted views once per refresh where practical.
- A failed preflight or command must not change checksum.

## 8. Required validation

Every implementation PR runs asset check, lint, TypeScript, full unit suite, production build, Browser E2E and Graphify.

Batch-specific gates:

- pure mission-rule matrix for all six missions and every reason code;
- flight-slot capacity/usage, recall and specialized-flight counting;
- scout tier/cooldown/detection/probe-loss determinism;
- no raw foreign owner/composition leak in player or bot target selectors;
- save serialize/parse and checksum/replay stability;
- bot scout-before-attack behavior and observable failure reasons;
- intelligence reports and exact map backlinks;
- Browser E2E for disabled reasons, slot exhaustion, scout result, report route, history/reload and both release viewports;
- combined headless sequence: unknown contact → scout → current full intel → eligible attack → report.

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| shared rule module becomes a second reducer | reducer calls the same pure result; no state mutation inside mission rules |
| UI still leaks canonical foreign data | candidate view model contains redacted fields only; E2E asserts absent owner/composition |
| bots gain hidden knowledge | planner accepts `BotPerception` plus shared public/redacted rule inputs; no canonical foreign planet object |
| cooldown blocks deterministic fixtures | explicit clock/observation fixtures and boundary tests |
| probe loss strands invalid fleet state | arrival resolver removes the one probe fleet atomically and records observation/alert before removal |
| reports enlarge saved state | reports are derived from bounded observations/alerts, not stored |
| new balance work expands scope | only the recorded structural constants may change; broader mission/combat balance requires another audit |

## 10. Evidence classification and unknowns

### VERIFIED

The architecture, current formulas, consumers, save validation and history bounds described above were inspected on the exact baseline. Fresh Graphify completed with 2,130 nodes, 6,795 edges, 103 communities, 100% extracted and 0% inferred.

### INFERRED

A shared rule layer will reduce divergence because `flightCommands`, the Fleet workspace and bot planner currently encode overlapping logic. This is supported by direct imports and Graphify paths, but implementation quality still requires the recorded gates.

### DECISION

Use existing schema-v14 structures and mission kinds. Treat detected scout probes as compromised/lost, derive cooldown and reports, and defer destruction/economy/endgame work.

### UNKNOWN — non-blocking

Exact player-facing Russian copy and CSS layout may change within the existing design system. This does not affect mechanics, persistence or implementation order and is verified in Browser E2E/accessibility review.

### Critical unknowns

None.

## 11. Acceptance gate for Audit PR #116

The Audit PR may merge when:

- all required audit/status/roadmap files identify the same batch and PR sequence;
- JSON files parse;
- Graphify evidence is recorded and fresh workflow passes;
- CI and Browser E2E remain green on the documentation-only diff;
- no gameplay source, balance value, asset, schema or migration changes are present;
- PR #117 is identified as the exact next action, but is not created before #116 merges.
