# CAMPAIGN-PROGRESSION-BALANCE-01 — accepted progression profile contract

**Status:** proposed for acceptance in Audit PR #133  
**Complexity:** heavy  
**Implementation count:** exactly 2 PRs  
**State target:** schema v16  
**Save format:** v3 retained

## 1. Deterministic profile identity

Schema v16 adds one immutable field:

```text
CampaignSettings
  scenarioPreset
  worldSpeed
  offlineProgression
  progressionProfile: legacy-v1 | compressed-v1
  createdAtReal
```

Rules:

- every schema-v15 and older campaign migrates to `legacy-v1`;
- every new normal campaign defaults to `compressed-v1`;
- profile is selected before initial state creation and cannot change later;
- profile participates in state checksum, save integrity and replay inputs;
- world speed remains independent and immutable;
- save format stays v3 because the envelope structure does not change;
- existing queued items retain their already-paid cost, target level and completion timestamp after migration;
- no UI/global fallback may infer profile from app version.

## 2. Legacy profile

`legacy-v1` preserves merged PR #132 behavior exactly:

```text
building cost growth 1600 permille
building time growth 1450 permille
research cost growth 1600 permille
research time growth 1450 permille
current caps, requirements, starting economy, unit values and rewards
```

The legacy profile exists for deterministic compatibility, not as the recommended new-game experience.

## 3. Compressed profile — formula constants

```text
building base cost       1000 permille of faction-tuned catalog base
building cost growth     1280 permille per level
building base time        600 permille of faction-tuned catalog base
building time growth     1180 permille per level

research base cost        900 permille
research cost growth     1280 permille per level
research base time        600 permille
research time growth     1180 permille per level

ship/defence base cost    850 permille
ship/defence base time    700 permille
repair base cost          850 permille
repair base time          700 permille
ship-upgrade max level    5
ship-upgrade cost         700 permille of current calculated cost
ship-upgrade time         700 permille of current calculated time
```

All scaling remains integer, deterministic and ceiling-based. No floating-point state is stored.

## 4. Compressed building caps

| Building role | Cap |
|---|---:|
| primary metal / crystal / gas | 10 |
| secondary metal / crystal / gas | 6 |
| tertiary metal | 4 |
| solar power | 10 |
| independent power | 5 |
| hangar | 8 |
| construction complex | 8 |
| advanced factory | 8 |
| metal / crystal / gas storage | 6 |
| scrapyard | 5 |
| trade center | 5 |
| shipyard | 8 |
| research center | 8 |
| spaceport | 8 |
| government | 6 |
| bank | 5 |
| Galactic Obelisk | 1 |
| Supreme Galactic Gates | 1 |

Profile-resolved requirement level is:

```text
min(legacy requirement level, compressed cap of the required definition)
```

This rule applies uniformly to building, laboratory and unit requirements and must be shown identically in validators, bots and UI.

## 5. Compressed research caps

| Research | Cap |
|---|---:|
| physics, chemistry, mathematics, astronomy | 6 |
| espionage, computer systems, ship armor, fuel cells | 6 |
| jet engines, laser science | 6 |
| ion science | 5 |
| plasma science | 4 |
| ecology | 5 |
| hyperspace | 6 |
| parallel universes | 3 |
| improved construction | 6 |
| piercing attack, maneuver defense, critical hit | 5 |
| light / medium / heavy armor | 1 |

Research prerequisites use the same deterministic cap rule.

## 6. Endgame prerequisite timers

Until the real endgame runtime is implemented, these values establish an endgame-ready progression path only:

```text
Galactic Obelisk base build time      14,400 canonical seconds
Supreme Galactic Gates base build time 14,400 canonical seconds
```

Both remain `endgameLocked`. This batch must not invent alliance, Solar War, crystal or victory logic.

## 7. Starting economy and capacity

`compressed-v1` begins with:

```text
metal   15,000
crystal 12,000
gas      6,000
base storage capacity 60,000 per resource
base population capacity 25
```

Profile economy multipliers:

```text
resource-production contributions 6000 permille
storage-capacity contributions     3000 permille
mission/expedition/space-object resource rewards 2000 permille
```

Energy consumption/production ratios, stability rules, field costs, cargo, combat strength, probabilities, debris-from-losses and plunder-from-existing-stock remain unchanged unless an implementation gate proves a deterministic progression deadlock. Any exception requires an explicit contract amendment in the implementation PR, not an unrecorded tuning change.

World speed accelerates time only; it does not multiply these values.

## 8. Faction parity

Existing relative faction tuning remains authoritative:

- profile multipliers apply after/before faction tuning in one documented consistent order;
- the same semantic cap and requirement matrix applies to all three native catalogs;
- faction identity remains in relative economy, time, cost and unit-stat tuning;
- no faction may receive a hidden progression shortcut.

Required parity gate:

```text
for every semantic role and milestone:
  resolved definition exists for Aegis, Synod and Veyra
  cap/requirement structure matches
  only documented faction tuning changes numeric value
```

## 9. Bot progression phases

Bots derive one deterministic phase from their own visible state:

```text
foundation
reconnaissance
first-combat
colonization
heavy-fleet
planet-destruction
endgame-preparation
```

The phase changes planner priority only. Bots continue to use ordinary shared commands, resources, intelligence, queues and validators.

Required x2 bot gates:

- reconnaissance-capable state ≤ 45 real minutes;
- colonization-capable state ≤ 180 minutes;
- heavy-fleet-capable state ≤ 480 minutes;
- endgame-preparation state ≤ 720 minutes.

## 10. Player milestone gates at recommended x2

Audit critical-path maxima:

| Milestone | Maximum real time at x2 |
|---|---:|
| first combat ship | 15 minutes |
| first scout | 25 minutes |
| first colonizer | 120 minutes |
| first planet destroyer | 360 minutes |
| endgame-ready prerequisite path | 720 minutes |

The measurement is deterministic canonical progression time. A full playable headless scenario additionally includes economy waiting, queues, missions and bot pressure.

Accepted complete progression envelope:

```text
recommended x2 target endgame-ready state: 12 real hours
accepted x2 hard maximum:                 16 real hours
x1 exact equivalents:                     24 target / 32 maximum
x5 exact equivalents:                      4.8 target / 6.4 maximum
x10 exact equivalents:                     2.4 target / 3.2 maximum
```

Actual victory/defeat is not an acceptance condition for this batch because alliance/Gate endgame runtime is not implemented yet.

## 11. UI contract

New Game and System/Saves must show:

```text
Compressed · recommended local campaign
Legacy · compatibility profile
```

The player cannot switch profile after creation. Cards, queues, requirements and estimates must all show profile-resolved values. No player-facing manual speed or profile controls are added during a running campaign.

## 12. Closure gates

The second implementation PR cannot merge until:

- schema-v16 migration and legacy replay/save equivalence pass;
- all three factions pass profile parity;
- milestone maxima pass from current source-importing tests;
- deterministic headless x2 progression reaches endgame-ready state within 12-hour target and 16-hour hard maximum across accepted seeds;
- bots meet all phase gates through ordinary commands;
- x1/x2/x5/x10 outcomes are partition-equivalent;
- save/load and offline catch-up preserve profile, state and milestone result;
- Browser E2E covers setup identity, immutable profile, resolved values and both release viewports;
- CI, Graphify and automated review are green.
