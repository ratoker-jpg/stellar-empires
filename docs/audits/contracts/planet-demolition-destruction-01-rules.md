# Rules contract — PLANET-DEMOLITION-DESTRUCTION-01

**Audit PR:** #121  
**Authority:** `docs/25-solar-war-obelisks-gates-and-progression.md` plus explicit decisions in this audit.

## 1. Entry point

- Existing ordinary mission `attack` only.
- No new mission enum or command.
- Current level-three intelligence remains required before launch.
- Siege resolves after deterministic combat.

## 2. Faction level-10 profiles

| Faction | Planet-destroyer | Demolition points | Destruction chance |
|---|---|---:|---:|
| Aegis | Death Star class | 100/ship | 300 bps/ship |
| Synod | Titan class | 90/ship | 250 bps/ship |
| Veyra | Nox Queen class | 55/ship | 150 bps/ship |

At weapon upgrade level `L`:

```text
scaledValue = floor(level10Value * clamp(L, 0, 10) / 10)
```

Only surviving post-recovery ships contribute.

## 3. Demolition

Eligibility:

- attacker victory or draw;
- surviving attacker planet-destroyer;
- building level above zero;
- building not endgame-locked.

Points:

```text
raw = sum(attacker survivors * scaled demolition points)
reduction = floor(surviving defence population / 2500) * 100
final = max(0, raw - reduction)
```

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

Annihilator adds its demolition basis points to each building roll; clamp at 10000 bps. Every success removes one level. Selection/rolls are deterministic and independent. An upgrade of an affected building is cancelled without refund.

## 4. Whole-planet destruction

Eligibility:

- attacker victory;
- surviving attacker planet-destroyer;
- defender owns more than one colony.

```text
raw = sum(attacker survivors * scaled destruction chance)
defence = floor(surviving defence population / 1000) * 100
defenderKillers = sum(surviving defender planet-destroyers * scaled destruction chance)
polias = active defender Polias reduction bps
final = clamp(0, 3000, raw - defence - defenderKillers - polias)
```

Calculate risk before the last-colony guard, but never apply successful destruction to the final colony.

Blocked reasons:

- `NO_SURVIVING_PLANET_DESTROYER`;
- `BATTLE_RESULT_INELIGIBLE`;
- `LAST_COLONY_PROTECTED`;
- `ZERO_FINAL_CHANCE`.

## 5. Roll domains

Stable inputs:

```text
state.seed
battle event sequence
attacker fleet id
target galaxyPlanetId
domain label
building id when applicable
```

Demolition selection, each building roll and whole destruction use distinct domains. No browser time, `Math.random`, locale order or mutable insertion order.

## 6. Resolution order

1. battle;
2. Commander recovery;
3. defence recovery;
4. plunder;
5. ordinary combat debris;
6. demolition;
7. destruction chance/roll;
8. atomic reconciliation on success;
9. battle report/event;
10. attacker return.

Destroyed resources, installations, queues and inventory add no extra reward/debris.

## 7. Destroyed-colony reconciliation

Active state:

- remove colony and release the galaxy position;
- remove planet-bound queues, completion events, routes and world events;
- remove stationed fleets;
- rehome surviving fleets to nearest owned colony by coordinate then ID;
- turn ordinary inbound fleets into deterministic returns;
- clear removed flagship references;
- preserve historical logs/intelligence/reports and exact coordinates;
- re-key debris to galaxy-planet ID.

No-refund applies to all cancelled queues.

### Pending special missions

Expedition and space-object resolve reports contain `originPlanetId`, and their handlers normally station survivors and credit ordinary resources there. If that colony is destroyed before resolution:

- keep `originPlanetId` unchanged as historical launch evidence;
- add optional `returnPlanetId` pointing to the deterministic rehome colony;
- live destination is `returnPlanetId ?? originPlanetId`;
- rehome the fleet's own `originPlanetId` to the same colony;
- `EXPEDITION_RESOLVE` remains authoritative, stations survivors at the live destination and credits its reward there;
- `SPACE_OBJECT_MISSION_RESOLVE` remains authoritative, stations survivors/credits normal resources there and still applies depletion, control, cooldown and strategic-resource rewards;
- do not replace either event with an ordinary `FLEET_RETURN`;
- additive optional metadata keeps schema v14 and old reports valid.

A missing live destination after reconciliation is an invariant failure, not permission to discard a surviving fleet or reward.

## 8. Recovery

- no cooldown or automatic restoration;
- ordinary colonization rules apply;
- recreated colony is fresh;
- historical reports/intelligence remain historical only.

## 9. Information policy

- launch still requires current level-three intelligence;
- preview uses only current level-three exposed data;
- bots receive no hidden target state;
- report visibility follows existing lawful scope.

## 10. Endgame separation

Not authorized:

- sun brightness, Sun Attack or Sun Support;
- system collapse/protostar/recovery;
- alliances/crystals/Obelisks/Gates;
- victory or final empire elimination.
