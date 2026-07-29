# CAMPAIGN-PROGRESSION-BALANCE-01 — accepted progression profile contract

**Status:** proposed for acceptance in Audit PR #133  
**Complexity:** heavy  
**Implementation count:** exactly 2 PRs  
**State target:** schema v16  
**Save format:** v3 retained

## Deterministic profile identity

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

- schema-v15 and older campaigns migrate to `legacy-v1`;
- new normal campaigns default to `compressed-v1`;
- profile is selected before state creation and cannot change later;
- profile participates in state checksum, save integrity and replay inputs;
- world speed remains independent and immutable;
- save format stays v3;
- existing queued items retain paid cost, target level and completion timestamp;
- no app-version/UI fallback may infer profile.

## Legacy profile

`legacy-v1` preserves merged PR #132 behavior exactly:

```text
building cost growth 1600 permille
building time growth 1450 permille
research cost growth 1600 permille
research time growth 1450 permille
current caps, requirements, starting economy, units and rewards
```

It exists for deterministic compatibility, not as the recommended new-game experience.

## Compressed formula constants

```text
building base cost       1000 permille of faction-tuned base
building cost growth     1280 permille per level
building base time        600 permille
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
ship-upgrade cost         700 permille of current calculation
ship-upgrade time         700 permille of current calculation
```

Scaling remains integer, deterministic and ceiling-based. No floating-point state is stored.

## Compressed building caps

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

Profile-resolved requirement level is exactly:

```text
min(legacy requirement level, compressed cap of the required definition)
```

The rule applies to building, laboratory, research and unit requirements and must resolve identically in validators, bots and UI.

## Compressed research caps

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

## Endgame-ready prerequisite timers

Until endgame runtime exists:

```text
Galactic Obelisk base build time        14,400 canonical seconds
Supreme Galactic Gates base build time  14,400 canonical seconds
```

Both remain `endgameLocked`. This batch must not invent alliance, Solar War, crystal or victory logic.

## Starting economy and capacity

`compressed-v1` begins with:

```text
metal   15,000
crystal 12,000
gas      6,000
base storage capacity 60,000 per resource
base population capacity 25
```

Profile multipliers:

```text
resource-production contributions                 6000 permille
storage-capacity contributions                     3000 permille
mission/expedition/space-object resource rewards   2000 permille
```

Energy ratios, stability, field costs, cargo, combat strength, probabilities, debris-from-losses and plunder-from-existing-stock remain unchanged unless a deterministic implementation gate proves a deadlock. Any exception requires an explicit recorded contract amendment and full matrix rerun.

World speed accelerates time only; it does not multiply these values.

## Faction parity

- the same semantic cap/requirement matrix applies to Aegis, Synod and Veyra;
- existing relative faction tuning remains authoritative;
- profile/tuning order must be documented and identical across player, bots and UI;
- no faction receives a hidden progression shortcut.

## Bot phases

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

The phase changes priority only. Bots retain ordinary resources, intelligence, queues, commands and validators.

Required x2 gates:

- reconnaissance-capable ≤45 minutes;
- colonization-capable ≤180 minutes;
- heavy-fleet-capable ≤480 minutes;
- endgame-preparation ≤720 minutes.

## Player milestone gates at recommended x2

The accepted candidate measurement is archived in `docs/audits/evidence/campaign-progression-balance-01-candidate.md`.

| Milestone | Maximum real time at x2 |
|---|---:|
| first combat ship | 16 minutes |
| first scout | 30 minutes |
| first colonizer | 120 minutes |
| first planet destroyer | 360 minutes |
| endgame-ready prerequisite path | 720 minutes |

The candidate measured 15.08 / 27.85 / 104.89 / 221.53 / 352.58 minutes respectively. A playable headless scenario must additionally include economy waiting, queues, missions and bot pressure.

Accepted progression envelope:

```text
x2 target endgame-ready state: 12 real hours
x2 hard maximum:               16 real hours
x1 exact equivalents:          24 target / 32 maximum
x5 exact equivalents:           4.8 target / 6.4 maximum
x10 exact equivalents:          2.4 target / 3.2 maximum
```

Actual victory/defeat is outside this batch because alliance/Gate endgame runtime is not implemented.

## UI contract

New Game and System/Saves show:

```text
Compressed · recommended local campaign
Legacy · compatibility profile
```

Cards, queues, requirements and estimates display profile-resolved values. No runtime profile or world-speed switching is added.

## Closure gates

PR #135 cannot merge until:

- schema-v16 migration and legacy replay/save equivalence pass;
- all three factions pass profile parity;
- player milestone and bot-phase maxima pass;
- accepted deterministic seeds reach endgame-ready state within 12-hour target and 16-hour hard maximum;
- x1/x2/x5/x10 outcomes are exact time-scaled equivalents;
- save/load/offline catch-up preserve profile, state and milestone checksum;
- Browser E2E covers setup identity, immutable profile, resolved values and both release viewports;
- CI, Graphify and automated review are green.
