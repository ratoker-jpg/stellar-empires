# Implementation contracts — SUSTAINABLE-PVE-OPERATIONS-01

**Audit PR:** #142  
**Baseline:** `0167ad689e299438c9d0550ee20ba53452c93d39`  
**Complexity:** medium  
**Implementation count:** exactly 4 PRs  
**Implementation PRs:** #143–#146  
**Target schema:** v16  
**Target save format:** v3

## Shared batch invariants

All four PRs must preserve:

- current immutable campaign settings and progression profiles;
- the chronological active/offline campaign-time path;
- ordinary player and bot commands;
- hidden-information boundaries;
- bounded state history;
- direct/chunked/save-loaded determinism;
- permanent 15-case progression matrix;
- isolated seven-day catch-up below 30 seconds;
- Browser E2E and Graphify.

No PR may add a new PvE currency, reputation tree, Arena, Admiral service, alliance mechanic, endgame system or continuously running server.

# #143 — `PVE-TARGET-RECOVERY`

## Purpose

Make the existing space-object, pirate-base and pirate-hunt loops mechanically sustainable in long active and offline campaigns without changing state schema or save format.

## Player-visible outcome

- depleted objects visibly recover instead of remaining permanently dead;
- raided or destroyed pirate bases return after a predictable campaign-time recovery window;
- pirate-hunt becomes a real targeted reward opportunity;
- recovery behaves identically across active time, offline catch-up, partitioned advances and save/load.

## Verified current state

- space objects already expose `initialYield`, `remainingYield`, control and cooldown fields;
- final depletion currently has no replenishment path;
- pirate bases are ordinary finite zero-production planets;
- battle reports preserve target ID, galaxy position, PvE mode and destruction outcome;
- world-event evaluation already occurs every 1,800 campaign seconds;
- `pirate-hunt` has no targeted mechanical reward helper;
- current history limits are sufficient for the six-hour recovery window under normal bounded processing.

## Expected paths

```text
src/simulation/pve/spaceObjects.ts
src/simulation/pve/neutralForces.ts
src/simulation/pve/worldEvents.ts
src/simulation/pve/pveBalance.ts
src/simulation/combat/resolveAttackMission.ts              only reward integration if required
src/simulation/reducer.ts                                  only deterministic boundary wiring if required
src/storage/saveFormat.ts                                  validation only if existing shapes need clarification
tests/simulation/spaceObjects.test.ts
tests/simulation/worldEvents.test.ts
tests/simulation/pveBalance.test.ts
tests/simulation/neutralForces.test.ts                     new if no focused file exists
tests/audit/pveTargetRecovery.test.ts                      new
```

## Required functions and decisions

### Space-object recovery

Add pure/reducer-safe recovery logic with these constants:

```text
PVE_TARGET_RECOVERY_SECONDS = 21_600
SPACE_OBJECT_ACTIVE_COOLDOWN_SECONDS = 300
```

Rules:

1. non-final extraction retains the existing five-minute cooldown;
2. final depletion sets `cooldownUntil = resolvedAt + 21_600`;
3. at the first world-event evaluation at or after `cooldownUntil`, restore `remainingYield = initialYield`;
4. clear controller/control expiry when recovery occurs;
5. keep object ID, system, position, kind, initial yield and hazard stable;
6. apply each recovery exactly once.

### Pirate recovery

Export or centralize deterministic pirate baseline construction so initial creation and recovery cannot diverge.

Rules:

1. latest completed PvE battle report at the base determines recovery timing;
2. a surviving base becomes eligible six hours after that report;
3. eligible recovery restores baseline resources and active defenses for its deterministic tier;
4. building identity, target identity and galaxy position remain stable;
5. a destroyed base becomes eligible six hours after the destruction report;
6. respawn only when its original galaxy position remains unoccupied;
7. never overwrite a player, bot, neutral or newly colonized planet;
8. apply at most one pirate recovery or respawn per world-event evaluation;
9. deterministic ordering is eligible time, target galaxy coordinate, then report/base ID;
10. recovery does not erase battle reports, debris or prior rewards.

### Pirate-hunt effect

Add:

```text
PIRATE_HUNT_REWARD_PERMILLE = 1_500
```

The targeted base's ordinary PvE reward multiplier becomes:

```text
anti-repeat reward multiplier × pirate-hunt multiplier
```

Round once at the final permille boundary. Do not alter threat scaling, combat outcomes or non-targeted bases.

## Persistence impact

- no new state field;
- no schema migration;
- no save-format bump;
- old saves recover through the same deterministic evaluation path;
- pending events remain unchanged unless implementation proves a new event is strictly necessary. If a new persisted event payload becomes necessary, stop and amend Audit #142 before expanding.

## Deterministic and performance constraints

- no scanning beyond bounded world-event/battle history and current targets on each 30-minute evaluation;
- no recovery loop at every simulation second;
- at most one pirate recovery per evaluation;
- object recovery may process all simultaneously eligible objects in stable object-ID order;
- direct, chunked and save-loaded 48-hour fixtures must be equal;
- target counts and IDs must remain bounded.

## Acceptance gate

- final depletion recovers exactly after six campaign hours;
- non-final extraction still uses five minutes;
- surviving and destroyed pirate bases recover without overwriting occupied positions;
- pirate-hunt reward applies only to the active target;
- active/offline and save-loaded equality passes;
- schema v16/save v3 round trips remain valid.

## Explicit non-goals

- new target kinds;
- random live-service spawning;
- new currencies or reputation;
- pirate fleet AI;
- player-facing UI redesign;
- bot mission selection.

# #144 — `PVE-OPERATIONS-INTELLIGENCE-UX`

## Purpose

Create one pure, canonical PvE opportunity model and use it across Operations and reports so the player can understand availability, recovery, risk and current world-event relevance.

## Player-visible outcome

The Operations surface clearly answers:

- what PvE action is available;
- which fleet/hull role is required;
- how long it takes and what fuel is required;
- current yield, hazard, controller and cooldown/recovery state;
- whether an active world event changes the opportunity;
- what happened in prior reports;
- when a depleted or raided target returns.

## Verified current state

- routed Operations modes already own expeditions, objects and events;
- command paths already exist and must remain unchanged;
- each mode currently derives its own state directly;
- unified mission reports already support battle, expedition, space-object and world-event records;
- world-event reports are generic zero-reward rows without effect detail;
- release viewports and browser-history behavior are already gated.

## Expected paths

```text
src/simulation/pve/pveOperationsView.ts                    new pure selector
src/simulation/pve/expeditions.ts                          exported estimate/reason helpers only if needed
src/simulation/pve/spaceObjects.ts                         exported availability/recovery helpers
src/simulation/pve/worldEvents.ts                          exported effect/recovery helpers
src/simulation/reports/missionReports.ts
src/ui/operationsWorkspace.ts
src/ui/reportsWorkspace.ts                                only shared presentation wiring if required
src/styles/operationsWorkspace.css
src/styles/expeditions.css
src/styles/spaceObjects.css
src/styles/worldEvents.css
tests/simulation/pveOperationsView.test.ts                new
tests/ui/operationsWorkspace.test.ts
tests/simulation/missionReports.test.ts
tests/e2e/appShellOperations.spec.ts
```

## Canonical opportunity model

The pure selector must return stable ordered entries for:

- expedition positions;
- space objects;
- pirate bases;
- active world-event targets.

Every entry must expose only applicable fields from this shared vocabulary:

```text
id
kind
title
coordinate
status
availabilityCode
availabilityExplanation
requiredShipRole
activeFleetId
flightDurationSeconds
fuelRequired
yieldRemaining
yieldInitial
hazardPermille
controllerEmpireId
controlExpiresAt
cooldownUntil
recoveryAt
eventDefinitionId
eventEndsAt
rewardMultiplierPermille
threatMultiplierPermille
```

Stable order:

1. actionable active world-event target;
2. available object/pirate/expedition opportunity;
3. active operation;
4. cooling/recovering target;
5. unavailable target;
6. coordinate, kind, ID.

The selector must not mutate state and must not inspect future event outcomes.

## Operations UX contract

- keep the existing canonical `#/operations/*` routes;
- no new independently mountable panel;
- expedition/object/event modes consume the shared selector;
- show explicit labels for all form controls;
- preserve ordinary `START_EXPEDITION`, `START_SPACE_OBJECT_MISSION`, `SEND_FLEET` and `RECALL_FLEET` paths;
- expose pirate-hunt target navigation and its reward effect;
- show recovery countdowns for depleted objects and recovering pirate bases;
- preserve unsaved form drafts as presentation-only state;
- Back/Forward/reload preserve canonical route, not drafts;
- no horizontal overflow at 1440×900 and 390×844.

## Reporting contract

- world-event reports use catalog name and target label rather than raw definition ID only;
- include the event's mechanical effect in the summary;
- recovered object/base lifecycle is visible as system reporting only when a normal bounded report already exists or can be derived without persisted telemetry;
- do not invent reward rows for passive recovery;
- existing report filters remain compatible.

## Acceptance gate

- pure selector ordering and reason codes are deterministic;
- player can start and recall expedition/object operations from the canonical surface;
- pirate-hunt target/effect is visible and navigable;
- depleted/recovering targets show exact campaign-time availability;
- reports identify the actual world-event effect;
- Browser E2E covers navigation, reload, keyboard labels and both viewports.

## Explicit non-goals

- new route family;
- mobile redesign beyond release-viewport protection;
- new tutorial/onboarding;
- new meta progression;
- bot behavior.

# #145 — `BOT-PVE-OPERATIONS`

## Purpose

Let autonomous empires participate honestly in the existing expedition, space-object and targeted pirate-hunt loops through the same ordinary commands and public information available to the player.

## Player-visible outcome

Bot empires compete for objects, take expedition risks and react to active pirate opportunities instead of leaving the PvE layer exclusively to the player.

## Verified current state

- bots already use ordinary commands, deterministic scheduler audits and cached perception;
- perception excludes objects, expedition positions and world events;
- fleet planner handles transport, recycle, colonize, scout, attack and deploy only;
- scheduler has no `pve` source;
- specialist ship roles and ordinary special-mission validators already exist;
- current production/economy planners remain authoritative for building and producing hulls.

## Expected paths

```text
src/simulation/bots/perception.ts
src/simulation/bots/pveOperationsPlanner.ts               new
src/simulation/bots/scheduler.ts
src/simulation/bots/fleetMissionPlanner.ts                event-aware attack ordering only if required
src/simulation/bots/researchProductionPlanner.ts          dependency wiring only if required
src/simulation/pve/pveOperationsView.ts                    consume pure opportunity model
src/simulation/progression/scenarioRunner.ts               instrumentation only if required
tests/simulation/botPerception.test.ts
tests/simulation/botPveOperationsPlanner.test.ts          new
tests/simulation/botScheduler.test.ts
tests/audit/botPveInformationBoundary.test.ts             new
```

## Perception boundary

Bots may perceive globally public data:

- undeveloped expedition positions;
- object identity, coordinate, kind, remaining yield, public controller and cooldown;
- active world-event definition, target and end time;
- public pirate base contact/coordinate.

Bots may not perceive:

- hidden player resources or fleets;
- unobserved private planetary defenses;
- future expedition outcomes;
- future object hazard rolls;
- unpublished battle results;
- event selection before it starts.

Changing hidden player state must not change a bot PvE plan unless that change becomes public through existing intelligence/public-contact rules.

## Planner source and command limit

Add scheduler source:

```text
pve
```

Issue at most one `pve` command per bot decision.

Allowed ordinary commands:

```text
CREATE_FLEET
START_EXPEDITION
START_SPACE_OBJECT_MISSION
SEND_FLEET       # targeted pirate-hunt attack only
RECALL_FLEET     # only for a now-invalid special operation
```

The planner may create a fleet only from already owned, unqueued inventory. It must not fabricate ships, fuel or resources.

## Personality policy

### Explorer

1. active anomaly opportunity;
2. expedition;
3. asteroid/gas object;
4. pirate hunt.

### Industrial

1. asteroid/gas object;
2. pirate hunt;
3. expedition;
4. anomaly.

### Aggressive

1. active pirate hunt when existing intelligence makes the attack legal and safe;
2. anomaly;
3. asteroid/gas object;
4. expedition.

Within a category, order by:

1. active world-event bonus;
2. lowest required fuel;
3. shortest duration;
4. coordinate;
5. target ID;
6. fleet ID.

## Safety and honesty

- use the canonical opportunity selector and ordinary command validators;
- do not estimate hidden defender power;
- pirate attacks require the same intelligence and safety threshold as ordinary bot attacks;
- do not repeat an identical rejected command in the same decision;
- existing threat/recovery plan remains ahead of opportunistic PvE;
- do not start a special mission when the origin would fall below its existing gas recovery reserve;
- if no legal command exists, return an auditable reason code and no command.

## Scheduler order

Compressed profile order after survival/economy work:

```text
production
research
economy
logistics
threat
pve
fleet
```

Legacy personality arrays place `pve` according to the personality policy without displacing threat recovery.

## Acceptance gate

- deterministic plan from identical visible state;
- hidden player mutations do not alter the plan;
- ordinary command execution succeeds or returns the recorded validator code;
- at most one `pve` audit entry per decision;
- bots can start at least one expedition and one object operation in focused fixtures;
- an aggressive bot attacks an active pirate-hunt target only with legal current intelligence;
- no privileged state mutation exists.

## Explicit non-goals

- bot-only rewards;
- omniscient pirate power;
- new production cheats;
- player PvP strategy redesign;
- alliances/endgame.

# #146 — `PVE-SUSTAINABILITY-GATE`

## Purpose

Validate the combined sustainable PvE loop across all factions and close the M6a batch.

## Expected paths

```text
src/simulation/progression/scenarioRunner.ts              only reusable gate instrumentation
src/testing/e2eRuntime.ts                                 only browser fixture support if required
tests/audit/pveSustainability.test.ts                     new
tests/audit/botPveOperations.test.ts                      new
tests/audit/progressionScenarioExperiment.test.ts
tests/campaign/campaignCatchUpPerformance.test.ts
tests/e2e/appShellOperations.spec.ts
docs/audits/completed/sustainable-pve-operations-01.md
docs/audits/batch-history.md
docs/project-status.json
docs/roadmap-pr-index.json
docs/17-continuation-guide.md
docs/audits/current-execution-state.md
```

## Combined deterministic gate

For Aegis, Synod and Veyra, run deterministic 48-hour fixtures through:

- one direct advance;
- 6-hour chunks;
- save/load at 24 hours then continue;
- offline bootstrap path where practical.

The fixture set must demonstrate across the three factions:

- final object depletion;
- exact six-hour object recovery and reuse;
- pirate base raid and deterministic baseline recovery;
- destroyed pirate base respawn when its original position is free;
- blocked respawn while the position is occupied;
- active pirate-hunt reward effect on only its target;
- world-event chain preservation;
- at least one accepted bot expedition;
- at least one accepted bot object operation;
- at least one legal event-aware pirate-hunt attack;
- no duplicate target IDs or occupied coordinates;
- stable target count;
- bounded command, event and world-event history;
- no hidden resources or privileged commands;
- exact direct/chunked/save-loaded equality.

## Runtime budgets

- keep the permanent 15-case progression matrix green;
- keep isolated seven-day catch-up below 30 seconds;
- add no O(seconds) PvE recovery scan;
- three-faction 48-hour PvE gate must finish within the normal unit-test job budget;
- Browser E2E must pass at both release viewports;
- Graphify must pass on the final code+docs head.

## Batch closure

The last PR must:

- validate every accepted gate from Audit #142;
- archive this contract under `docs/audits/completed/sustainable-pve-operations-01.md`;
- append exact Audit/implementation merge SHAs to `docs/audits/batch-history.md`;
- synchronize project status, roadmap index and continuation guide;
- name the next Audit PR only;
- not begin Arena/Admiral/meta implementation.

## Explicit non-goals for all four PRs

- Arena or ladder;
- Admiral services or paid/temporary boosts;
- new PvE reputation, currency or skill tree;
- new strategic resources;
- server authority or multiplayer;
- alliances, Solar War, Obelisks, Gates or victory/defeat;
- global progression/economy rebalance;
- new schema/save version;
- physical logistics or convoy combat.

## Divergence rule

Stop and amend or replace Audit #142 before expanding implementation if any PR requires:

- schema v17 or save format v4;
- a persisted PvE meta currency/reputation;
- a continuously running target-spawn service;
- a new hidden-information exception for bots;
- global progression timing or starting-bank changes;
- a fifth implementation PR.
