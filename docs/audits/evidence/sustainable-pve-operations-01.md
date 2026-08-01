# Audit evidence — SUSTAINABLE-PVE-OPERATIONS-01

**Audit PR:** #142  
**Baseline:** `0167ad689e299438c9d0550ee20ba53452c93d39`  
**Updated:** 2026-08-01  
**Roadmap scope:** M6a — sustainable existing PvE operations before new meta systems

## Evidence method

The audit reconciled:

- actual merged `main` and PR #137–#141 history;
- `AGENTS.md` and audit-first delivery protocol;
- current schema-v16 state, command and event contracts;
- campaign-time chronological boundaries;
- expeditions, space objects, neutral forces, world events and PvE balance;
- battle resolution and pirate reward/threat integration;
- bot perception, fleet planning and scheduler sources;
- canonical Operations workspace and unified reports;
- persistence validation, history bounds and permanent CI gates.

Graphify is rerun on the Audit #142 head. Its result supplements but does not override the verified source evidence below.

## VERIFIED — completed M5 baseline

- PR #141 merged as `0167ad689e299438c9d0550ee20ba53452c93d39`.
- M5 delivered a shared multi-colony portfolio, hardened abstract logistics, complete player Operations workflow and ordinary bot colony logistics.
- Schema v16 and save format v3 remain current.
- The permanent progression matrix, Browser E2E and seven-day catch-up performance gates are active.
- `docs/audits/batch-history.md` still contains the pre-merge active M5 row and must be corrected in Audit #142.

## VERIFIED — current PvE simulation

### Expeditions

`src/simulation/pve/expeditions.ts` already provides:

- ordinary `START_EXPEDITION` commands;
- stationed scout requirement;
- deterministic flight/fuel calculation;
- four deterministic outcomes: salvage, research cache, hazard and empty;
- anti-repeat reward multiplier;
- scheduled resolution, losses, reward delivery and return support;
- save/load coverage.

Expedition targets are undeveloped galaxy positions. They do not need a persisted lifecycle object, but repeated use is only discouraged by the two-hour reward multiplier window.

### Space objects

`src/simulation/pve/spaceObjects.ts` creates exactly one deterministic object per materialized system:

- asteroid;
- gas cloud;
- anomaly.

Existing state already contains:

```text
initialYield
remainingYield
hazardPermille
controllerEmpireId
controlExpiresAt
cooldownUntil
```

Operations require the matching recycler, transport or scout role, charge round-trip fuel, apply deterministic hazard losses and create ordinary event-log reports.

After resolution, `remainingYield` is reduced and `cooldownUntil` is set to five minutes. There is no replenishment path after `remainingYield` reaches zero. `START_SPACE_OBJECT_MISSION` permanently rejects a depleted object.

### Pirate neutral forces

`src/simulation/pve/neutralForces.ts` creates three deterministic pirate bases at campaign start.

Current pirate bases:

- use ordinary planets and combat;
- have deterministic tiered buildings and defenses;
- start with finite resource reserves;
- have zero resource production;
- can be attacked through ordinary `SEND_FLEET` commands;
- scale threat by prior pirate victories;
- reduce repeated rewards through the shared PvE anti-repeat multiplier;
- can be destroyed through the ordinary planet-destruction path.

There is no resource/defense recovery or destroyed-base respawn path. Long-running campaigns can therefore drain or remove the finite initial pirate targets.

### World events

`src/simulation/pve/worldEvents.ts` evaluates every 1,800 campaign seconds and currently defines:

- `solar-storm`;
- `mineral-bloom`;
- `pirate-hunt`;
- `anomaly-aftershock`.

Existing mechanical effects:

- solar storm and anomaly aftershock modify object hazard;
- mineral bloom modifies object yield;
- event chains and cooldowns are deterministic and saveable.

`pirate-hunt` selects a pirate base and appears in UI/reporting, but the world-event module exposes no targeted pirate reward or threat modifier. Its current player-visible purpose is therefore mostly descriptive.

### PvE balance and reports

`src/simulation/pve/pveBalance.ts` supplies:

- two-hour repeat windows;
- reward floor of 25%;
- 25% repeat penalty steps;
- pirate threat growth up to 200%;
- ordinary reward/plunder scaling.

`src/simulation/reports/missionReports.ts` already unifies battle, expedition, space-object and world-event reports. World-event reports currently contain generic zero-reward completion rows without effect or target-resolution detail.

## VERIFIED — campaign-time insertion point

`executeAdvanceTimeWithTelemetry()` in `src/simulation/reducer.ts` already advances chronologically across:

- pending events;
- logistics departures;
- world-event evaluations.

The existing 30-minute world-event evaluation is a deterministic partition-safe insertion point for PvE target recovery. No continuously running timer or new real-time system is required.

## VERIFIED — bot gap

`src/simulation/bots/perception.ts` currently exposes:

- owned planets and fleets;
- observed foreign planets;
- public colony contacts;
- owned debris;
- alerts, research and market reserves.

It does not expose:

- undeveloped expedition positions;
- space objects;
- object control/cooldown/yield;
- active world events;
- pirate-hunt target context.

`src/simulation/bots/fleetMissionPlanner.ts` plans ordinary transport, recycle, colonize, scout, attack and deploy missions. It does not issue:

- `START_EXPEDITION`;
- `START_SPACE_OBJECT_MISSION`;
- event-aware pirate-hunt attacks.

The scheduler has no `pve` source. As a result, autonomous empires do not participate in the existing expedition/object loops and do not deliberately respond to world-event PvE opportunities.

## VERIFIED — UI and reporting surface

The routed Operations workspace already owns canonical modes for:

```text
overview
expeditions
objects
events
market
logistics
```

Player expedition and object commands are usable. However, each mode derives its own state directly and there is no shared pure PvE opportunity model covering:

- lifecycle/recovery timers;
- required hull role;
- fuel and duration;
- active mission ownership;
- control and contest state;
- event effect and target relevance;
- target recovery/availability reason.

This makes player UI, reports and future bot logic vulnerable to parallel interpretations.

## VERIFIED — persistence and bounds

- `GameState` already stores every required expedition/object/event/neutral-force input.
- Existing object fields can represent depleted recovery without a new field.
- Pirate recovery can be derived from ordinary battle reports, deterministic baseline generation and the fixed world-event evaluation timeline.
- Command and event history are bounded at 512; world-event history is bounded at 128.
- Old saves contain valid existing fields and do not require additive migration for the decisions below.

## INFERRED

- A long compressed or offline campaign can exhaust space objects and drain pirate targets faster than a legacy campaign because many campaign hours are processed in one session.
- Adding Arena, Admiral services, a new reputation currency or permanent PvE progression in the same batch would mix lifecycle, schema, UI and product-design risk.
- Sustainable target recovery and ordinary bot participation should precede any new PvE meta layer.

## DECISIONS

### Batch boundary

Audit #142 authorizes a medium four-PR batch named:

```text
SUSTAINABLE-PVE-OPERATIONS-01
```

This is M6a, not all of M6. New Arena/Admiral/service meta remains a later audit.

### Compatibility

- retain schema v16;
- retain save format v3;
- do not add persisted PvE telemetry, reputation or currency;
- use existing state fields, event log and world-event evaluation boundary;
- retain ordinary commands for player and bots.

### Recovery constants

```text
PVE_TARGET_RECOVERY_SECONDS = 21_600       # 6 campaign hours
SPACE_OBJECT_ACTIVE_COOLDOWN_SECONDS = 300 # unchanged after non-final extraction
PIRATE_HUNT_REWARD_PERMILLE = 1_500        # targeted base only
DEFAULT_PIRATE_BASE_COUNT = 3              # unchanged
```

### Recovery rules

- final object depletion sets `cooldownUntil` to six campaign hours after resolution;
- at the first world-event evaluation at or after that time, restore `remainingYield` to `initialYield`, clear expired control and keep stable object identity;
- non-final extraction retains the existing five-minute cooldown;
- a surviving pirate base is eligible for deterministic baseline resource/defense recovery six campaign hours after its latest completed PvE battle;
- a destroyed pirate base may respawn at its original galaxy position six campaign hours after the destruction report, only when the position remains free;
- at most one pirate recovery/respawn is applied per 30-minute evaluation;
- recovery uses the original deterministic tier baseline and never overwrites an owned or otherwise occupied position;
- `pirate-hunt` multiplies the targeted base reward by 1.5 after the existing anti-repeat multiplier; threat scaling remains unchanged;
- direct, chunked and save-loaded processing must produce identical state.

### Bot information boundary

Bots may perceive globally public expedition positions, space objects and active world events. They may not read hidden player resources, fleets, future outcomes or unresolved report rolls.

## UNKNOWN

No critical unknown remains.

Non-critical copy/layout choices for the consolidated PvE opportunity UI are deferred to PR #144 but must preserve the command, accessibility and release-viewport contracts in the accepted audit.
