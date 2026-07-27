# ORDINARY-MISSIONS-INTELLIGENCE-01 — rules and information contract

**Audit PR:** #116

## 1. Ordinary mission table

| Mission | Fleet requirement | Visible target source | Knowledge requirement | Resolution owner |
|---|---|---|---|---|
| Transport | cargo within capacity | owned colonies | owned state | `applyFlightEvent` unload/return |
| Deploy | any valid fleet, target capacity remains enforced by existing systems | owned colonies | owned state | station at target |
| Scout | exactly one scout-role ship; zero cargo | redacted foreign contacts/current/stale observations | stable target ID/coordinate only | intelligence resolver |
| Attack | at least one armed ship | current foreign intelligence | current level 3 | combat resolver |
| Recycle | recycler role | known non-empty debris | debris selector | debris collector |
| Colonize | colonizer role | unclaimed non-gas position | public spatial state | colonization resolver |

## 2. Ordered availability reasons

The shared rule returns the first applicable reason in this order so UI, bots and reducer agree:

1. `FLEET_NOT_FOUND`
2. `NOT_FLEET_OWNER`
3. `FLEET_NOT_STATIONED`
4. `FLIGHT_ORIGIN_NOT_FOUND`
5. `FLIGHT_ORIGIN_NOT_OWNED`
6. `FLIGHT_SLOT_LIMIT_REACHED`
7. `FLEET_TARGET_IS_ORIGIN`
8. mission-specific target existence/relationship reason
9. mission-specific ship/cargo requirement
10. knowledge/cooldown requirement
11. route unavailable
12. insufficient fuel
13. `MISSION_READY`

Existing public command codes may be preserved where already stable. New preflight codes must map one-to-one to command rejection and Russian UI copy.

## 3. Flight slots

```text
capacity = max(1, 1 + calculated research flightSlots)
used = non-stationed fleets belonging to the empire
available = max(0, capacity - used)
```

Rules:

- the fleet being sent is stationed and is not already counted;
- returning and holding fleets count;
- ordinary, expedition and space-object active fleets count;
- recall preserves used count until return;
- command rejection is checksum-neutral and does not spend fuel.

## 4. Redacted target model

A mission target view model may contain:

```text
stable target ID
coordinate
system/position label
visibility: owned | current | stale | contact | unclaimed
known display name when allowed
known owner/faction only when allowed
mission-specific availability code/message
```

It must not contain canonical hidden resources, buildings, defenses, fleets, cargo or owner identity for `contact` targets.

## 5. Intelligence resolution

### Strength

```text
observerStrength = sensorStrength(observer) + 1
counterStrength = sensorStrength(defender) + sensorGridLevel(target)
delta = observerStrength - counterStrength
```

### Tier

| Delta | Snapshot level | Player label |
|---:|---:|---|
| >= 3 | 3 | Full |
| 0..2 | 2 | Detailed |
| < 0 | 1 | Basic |

Level payload remains the current schema-v14 contract:

- level 1: identity/coordinate shell;
- level 2: resources, energy and buildings;
- level 3: defenses and stationed fleets additionally.

### Cooldown

```text
clamp(300, 7200, 3600 - observerStrength * 120 + counterStrength * 60)
```

The latest observation for the same observer and target determines `nextAllowedAt`. Stale status and cooldown are independent: an observation may be current while another scout attempt is allowed, or stale while cooldown still remains only at exact boundary fixtures.

### Detection and loss

```text
chance = clamp(5, 90, 30 + counterStrength * 10 - observerStrength * 7)
roll = deterministic hash(seed, event sequence, fleet ID, target ID) % 100
detected = roll < chance
```

- observation is always recorded;
- defender alert is recorded when detected;
- detected scout probe is removed and no return event is scheduled;
- undetected probe returns through the existing return path;
- no extra random call or wall-clock source is allowed.

## 6. Attack knowledge

Attack target eligibility requires:

- target is foreign;
- newest observation is unexpired at current game time;
- snapshot level is 3;
- fleet is armed;
- all shared route/slot/fuel rules pass.

The command must reject a target that the UI previously rendered but whose observation expired before confirmation.

## 7. Incoming-flight visibility

For transit fleets whose destination is a colony owned by the viewing empire:

| Viewing sensor strength | Visible data |
|---:|---|
| 0–4 | generic contact, target, ETA |
| 5–9 | source empire, target, ETA |
| >=10 | mission kind and composition, plus source/target/ETA |

A current level-three observation connected to the source/attacker may promote the view to the highest tier. Cargo remains hidden in this batch.

## 8. Derived intelligence reports

`UnifiedMissionReport.kind` gains presentation-only `intelligence`.

Observer report:

- ID based on observation ID;
- target and coordinate from observation;
- tier, freshness-at-view and detected status in summary;
- outcome `completed` when undetected, `failure` when detected/probe lost;
- no resource reward or unit-loss duplication beyond the probe outcome summary.

Defender report:

- ID based on alert ID;
- target is defended colony;
- source empire follows alert confidence and may be unknown;
- outcome `recovered`/system-style counter-intelligence result;
- exact coordinate backlink.

Reports are regenerated from bounded intelligence state. They do not enter `eventLog` or save schema.

## 9. Bot information contract

Bots may consume:

- owned planets/fleets/research;
- public coordinates/contact IDs;
- own observations and alerts;
- shared redacted target models and availability results.

Bots may not consume:

- canonical owner/faction of an unobserved contact;
- foreign resources, defenses or fleets outside snapshot tier;
- future event results;
- bot-only commands or direct state mutation.

The planner should prefer:

1. resolve an existing ready mission;
2. scout stale/unknown relevant targets when a scout is available and cooldown/slot allow;
3. attack only current level-three targets within its existing power policy;
4. return an observable reason when no mission is available.

## 10. Non-goals

No pirate raid, Space Trip, attack quota, beginner protection, demolition, planet destruction, alliance support, sun mission or broad balance pass belongs to this contract.
