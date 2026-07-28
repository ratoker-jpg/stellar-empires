# Rules contract — PLANET-DEMOLITION-DESTRUCTION-01

**Audit PR:** #121  
**Authority:** `docs/25-solar-war-obelisks-gates-and-progression.md` plus explicit project decisions in this audit.

## 1. Entry point

- Existing ordinary mission `attack` only.
- No new mission enum or command.
- Existing current level-three intelligence gate remains required before launch.
- Siege resolves after ordinary deterministic combat.

## 2. Faction level-10 profiles

| Faction | Planet-destroyer | Demolition points | Destruction chance |
|---|---|---:|---:|
| Aegis | Death Star class | 100/ship | 300 bps/ship |
| Synod | Titan class | 90/ship | 250 bps/ship |
| Veyra | Nox Queen class | 55/ship | 150 bps/ship |

Effective contribution at weapon upgrade level `L`:

```text
scaledValue = floor(level10Value * clamp(L, 0, 10) / 10)
```

Only surviving post-recovery attacker ships contribute.

## 3. Demolition

Eligibility:

- result is attacker victory or draw;
- at least one attacker planet-destroyer survives;
- target building level is greater than zero;
- target building is not endgame-locked.

Points:

```text
raw = sum(attacker surviving count * scaled demolition points)
reduction = floor(surviving defence population / 2500) * 100
final = max(0, raw - reduction)
```

Thresholds:

| Final | Base roll | Selected buildings |
|---:|---:|---:|
| 0–19 | 0 bps | 0 |
| 20–100 | 2000 bps | 1 |
| 101–200 | 4000 bps | 1 |
| 201–400 | 6000 bps | 1 |
| 401–550 | 5000 bps | 2 |
| 551–700 | 7000 bps | 2 |
| 701–850 | 5000 bps | 3 |
| 851–1000 | 6000 bps | 5 |
| >1000 | 3300 bps | all eligible |

Annihilator adds its demolition basis points to each building roll. Final building roll chance is clamped to 10000 bps.

Every successful roll removes one level only. Selection and rolls are deterministic and independent. A queue upgrading the affected building is cancelled without refund.

## 4. Whole-planet destruction

Eligibility:

- attacker victory only;
- at least one attacker planet-destroyer survives;
- defender has more than one active colony.

Chance:

```text
raw = sum(attacker surviving count * scaled destruction chance)
defence = floor(surviving defence population / 1000) * 100
defenderKillers = sum(surviving defender planet-destroyers * scaled destruction chance)
polias = active defender Polias reduction basis points
final = clamp(0, 3000, raw - defence - defenderKillers - polias)
```

The last-colony guard is applied after chance calculation so reports can show risk, but before a successful roll can remove the planet.

Blocked reasons:

- `NO_SURVIVING_PLANET_DESTROYER`;
- `BATTLE_RESULT_INELIGIBLE`;
- `LAST_COLONY_PROTECTED`;
- `ZERO_FINAL_CHANCE`.

## 5. Roll domains

Stable hash inputs:

```text
state.seed
battle event sequence
attacker fleet id
target galaxyPlanetId
domain label
building id when applicable
```

Domain labels for demolition selection, each building roll and whole destruction must differ. No browser time, `Math.random`, locale order or mutable collection order.

## 6. Resolution order

1. battle;
2. Commander recovery;
3. defence recovery;
4. plunder;
5. ordinary combat debris;
6. demolition;
7. whole-destruction chance;
8. atomic planet reconciliation when successful;
9. battle report/event;
10. attacker return.

If the planet is destroyed, its remaining resources, installations, queues and inventory create no additional reward/debris.

## 7. Destroyed-colony reconciliation

Active state:

- remove colony;
- release underlying galaxy position;
- remove planet-bound queues/events/routes/world events;
- remove stationed fleets;
- rehome surviving fleets to nearest owned colony by coordinate then ID;
- turn inbound fleets into deterministic returns;
- clear removed flagship references;
- preserve historical logs and intelligence snapshots;
- retain exact coordinate in report;
- re-key debris to galaxy-planet ID.

No-refund applies to all cancelled queues.

## 8. Recovery

- no cooldown;
- no automatic restoration;
- normal colonization rules apply;
- recreated colony is fresh and does not inherit old ownership, buildings, resources, inventory, queues or defence;
- historical reports and intelligence remain historical only.

## 9. Information policy

- launch still requires current level-three intelligence;
- detailed siege preview may use only information exposed at current level three;
- bots receive no hidden building, defence, fleet or Commander data;
- report recipients see only their existing lawful battle/report scope.

## 10. Endgame separation

This contract does not authorize:

- sun brightness;
- Sun Attack or Sun Support;
- system collapse/protostar/recovery;
- alliances/crystals/Obelisks/Gates;
- victory or final empire elimination.
