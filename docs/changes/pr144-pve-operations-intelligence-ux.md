# PR #144 — PVE-OPERATIONS-INTELLIGENCE-UX

**Batch:** `SUSTAINABLE-PVE-OPERATIONS-01`  
**Audit:** #142 · `81f1959b0bdbdd72d05dc21a2dce0a9e1470f010`  
**Predecessor:** #143 · `e3d2c28385abd9772a18257eeb313bd8d45e581e`  
**Baseline:** merged `main` `e3d2c28385abd9772a18257eeb313bd8d45e581e`  
**State schema:** v16 retained  
**Save format:** v3 retained

## Delivered

### Canonical PvE opportunity model

One pure selector now describes all current player-facing PvE opportunities:

- expedition positions;
- space objects;
- pirate bases, including recovering, destroyed and occupied baseline positions;
- active world-event targets.

Each entry exposes stable identity and ordering plus actionable truth:

```text
id · kind · title · coordinate
status · availabilityCode · availabilityExplanation
requiredShipRole · activeFleetId
flightDurationSeconds · fuelRequired
yieldRemaining · yieldInitial · hazardPermille
controllerEmpireId · controlExpiresAt
cooldownUntil · recoveryAt
eventDefinitionId · eventEndsAt
rewardMultiplierPermille · threatMultiplierPermille
```

Ordering is deterministic:

```text
active event
→ available
→ active operation
→ recovering/cooling down
→ unavailable
→ coordinate
→ kind
→ ID
```

The selector is read-only, uses existing #143 lifecycle truth and does not reveal future combat or expedition outcomes.

### Routed Operations intelligence

The existing `#/operations/*` routes consume the shared model without adding a new route family or parallel command path.

- Overview surfaces prioritized opportunity cards.
- Expeditions show exact availability, scout requirement, selected fleet, cycle time and fuel.
- Objects show required specialist role, yield, effective hazard, temporary control, cooldown/recovery and active operation state.
- Events show active effects and pirate-base recovery/availability with reward and threat multipliers.
- Ordinary expedition, object, recall and fleet-target commands remain unchanged.
- Market and logistics remain delegated to their existing canonical panels.
- Target handoff remains presentation-only until the user confirms an ordinary command.

All controls have explicit accessible labels. Cards and forms fit 1440×900, 1920×1080 and 390×844 without horizontal overflow.

### Event report presentation

World-event reports now use catalog names, human-readable target labels and the actual mechanical effect:

- solar storm: +20% operation hazard in its system;
- anomaly aftershock: +30% operation hazard in its system;
- mineral bloom: +30% target-object yield;
- pirate hunt: targeted pirate reward multiplier up to 150% before the existing anti-repeat combination.

Passive object or pirate recovery does not create fake reward rows, command history or mission reports.

## Code-head validation

Code head `09e6dec9817437d31110862738a6c91c005a9399` passed:

- CI `30742965874` — asset audit, lint, strict TypeScript, full tests, build, permanent progression matrix and isolated catch-up performance;
- Browser E2E `30742965877` — routed Operations/Reports, labels, target handoff and release/mobile viewport gates;
- Graphify `30742965865`.

The final documentation head is rerun through all required workflows.

## Explicit exclusions

- bot PvE opportunity selection or mission execution;
- changes to target recovery, spawn or combat lifecycle;
- new route family or legacy dialog resurrection;
- persisted PvE telemetry, currency or reputation;
- Arena, Admiral services, alliances or endgame;
- global progression/economy rebalance;
- schema/save-format change.

## Ordered next work

After #144 merges, create only #145 `BOT-PVE-OPERATIONS` from the resulting fresh `main`. Do not begin #146 early.
