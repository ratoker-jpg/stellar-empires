# Canonical solar war, obelisks, gates, commander progression and demolition

**Status:** canonical gameplay contract v1  
**Scope:** PvE Stellar Empires campaign  
**Source classes:**

- `USER_CANONICAL` — mechanics explicitly defined by the project owner;
- `PROJECT_BALANCE_V1` — initial values chosen for Stellar Empires and intended to remain configurable;
- `HISTORICAL_REFERENCE` — values cross-checked against the public Nemexia Help and adapted rather than copied blindly.

This document replaces the previous `UNKNOWN` state for solar crystals, faction obelisks and the Supreme Galactic Gates. It is a design contract for future runtime PRs. It does not itself change runtime code.

---

## 1. Core endgame loop

The campaign has two victory paths:

1. **Alliance victory:** an alliance obtains four Solar Crystals and completes the Supreme Galactic Gates on the alliance leader's main planet.
2. **Solo military victory:** a non-allied player interrupts four gate-construction attempts, steals one Solar Crystal from each successful interruption and wins immediately upon obtaining the fourth stolen crystal.

A solo player does not need to construct personal gates after obtaining the fourth stolen crystal. This is the canonical v1 interpretation of the solo route.

---

## 2. Alliances

### 2.1. Membership

- Human players and bots may belong to alliances.
- The alliance leader owns the authoritative alliance endgame state.
- An alliance may have only one active Supreme Galactic Gates construction at a time.

### 2.2. Alliance leader planet

The leader designates one main planet as the alliance endgame planet. The following are built there:

- the faction-specific Galactic Obelisk;
- the Supreme Galactic Gates;
- the defensive fleets and planetary defence protecting the construction.

If leadership changes while no gates are under construction, the alliance may transfer its endgame planet after a configurable cooldown. Leadership cannot be transferred during active gate construction.

---

## 3. Suns and brightness

### 3.1. Brightness state

Every sun has a brightness value:

```text
sunBrightness: 0..100
```

Initial default:

```text
sunBrightness = 100
```

Brightness is authoritative simulation state and must be stored in saves and state history.

### 3.2. Energy effect

Brightness affects only solar energy sources:

- the faction solar-energy building:
  - Aegis `building.aegis.infrared-bot`;
  - Synod `building.synod.infrared-bot`;
  - Veyra `building.veyra.infrared-bot`;
- the service energy satellite:
  - Aegis solar satellite;
  - Synod solar satellite;
  - Veyra organic satellite.

Nuclear, uranium or other non-solar energy sources do not depend on brightness.

Canonical v1 formula:

```text
solarEnergyIncome = baseSolarIncome
                  * (sunBrightness / 100)
                  * scienceAndAdmiralModifiers
```

Examples:

| Brightness | Solar output multiplier |
|---:|---:|
| 100 | 1.00 |
| 75 | 0.75 |
| 50 | 0.50 |
| 25 | 0.25 |
| 0 | 0.00 |

### 3.3. Adjacent-galaxy restriction

A sun may be attacked only from an adjacent galaxy according to the galaxy graph. A fleet may not attack the sun of its own galaxy unless a future scenario explicitly overrides the rule.

The galaxy map, not a hard-coded numeric `galaxy ± 1`, determines adjacency.

---

## 4. Sun Attack mission

### 4.1. Eligibility

A Sun Attack is launched by an alliance. The attacker must:

- belong to an alliance;
- launch from an adjacent galaxy;
- provide a valid fleet;
- target a sun whose system is not currently rebuilding after destruction.

### 4.2. Sun defenders

Any player with an eligible planet near the target sun may send a Sun Support fleet, regardless of whether that player is:

- unaffiliated;
- a member of the attacking alliance;
- a member of another alliance;
- a member of a hostile alliance.

Support eligibility is geographical. Alliance relations affect AI decisions and diplomacy, but do not remove the basic ability to defend the local sun.

### 4.3. Battle

The battle resolves between:

- the alliance attack fleet and its permitted support;
- all valid Sun Support fleets stationed for the defence window.

Only the final battle result awards a crystal or changes brightness.

### 4.4. Successful attack result

On attacker victory:

1. the attacking alliance receives one Solar Crystal;
2. the sun loses brightness;
3. all solar-energy production in the local system updates immediately;
4. the universe receives a global event notification.

Initial balance value:

```text
brightnessLossPerSuccessfulSunAttack = 25
```

Therefore the default progression is:

```text
100 -> 75 -> 50 -> 25 -> 0
```

A crystal is awarded for every successful Sun Attack, including the attack that reduces brightness to zero.

### 4.5. Failed attack result

On defender victory or draw:

- no crystal is awarded;
- brightness does not change;
- surviving fleets return or remain according to the Sun Battle mission contract;
- the result is recorded in the global event feed.

---

## 5. Sun destruction and system regeneration

### 5.1. Destruction

When brightness reaches zero:

- the sun explodes;
- the current star system becomes unavailable;
- planets and system objects are removed from active play according to the destruction migration contract;
- no new flights may target the destroyed system;
- active flights are resolved safely and deterministically before removal.

The implementation must never leave dangling planet, fleet, mission, alliance-support or UI references.

### 5.2. Regeneration phases

Initial configurable defaults:

```text
collapsedSystemDuration = 72 hours
protostarDuration = 72 hours
```

Flow:

1. **Collapsed system:** inaccessible for 72 hours.
2. **Protostar phase:** a new star appears at brightness 25.
3. **Recovery:** brightness increases by 25 every 24 hours until reaching 100.

Initial recovery sequence:

```text
25 -> 50 -> 75 -> 100
```

A recovered system is treated as a new generated system. Old ownership is not restored automatically unless a scenario explicitly requests preservation.

---

## 6. Solar Crystals

### 6.1. Alliance crystals

Solar Crystals are alliance endgame objects, not ordinary tradeable resources.

They:

- cannot be loaded into normal cargo;
- cannot be sold or exchanged;
- cannot be stolen in ordinary raids;
- are stored by the alliance's Galactic Obelisk state;
- are visible in the global endgame race UI.

### 6.2. Crystal owner

For an alliance Sun Attack, the crystal belongs to the attacking alliance rather than to a specific fleet owner.

For a gate interruption:

- if the attacker belongs to an alliance, the stolen crystal is assigned to that alliance;
- if the attacker is solo, it increments that player's `stolenGateCrystals` counter.

The mission initiator receives the crystal. Supporting attackers do not receive duplicate crystals.

---

## 7. Galactic Obelisk

Each faction has a visually unique obelisk but the same mechanical contract:

- Aegis `building.aegis.aksum-obelisk`;
- Synod `building.synod.aksum-obelisk`;
- Veyra `building.veyra.aksum-obelisk`.

### 7.1. Function

The obelisk is the alliance Solar Crystal storage and gate-unlock structure.

Canonical progression:

| Obelisk state | Effect |
|---:|---|
| 0/4 | no crystal installed |
| 1/4 | first crystal installed |
| 2/4 | second crystal installed |
| 3/4 | third crystal installed |
| 4/4 | Supreme Galactic Gates construction unlocked |

The visual level or activation state should reflect the number of installed crystals.

### 7.2. Restrictions

- one obelisk per alliance endgame planet;
- only the alliance leader may begin gate construction;
- crystals remain locked during active gate construction;
- the obelisk cannot be traded or moved while gates are active;
- destroying ordinary building levels must not silently delete endgame crystals.

---

## 8. Supreme Galactic Gates

Faction assets:

- Aegis `building.aegis.supreme-galactic-gates`;
- Synod `building.synod.supreme-galactic-gates`;
- Veyra `building.veyra.supreme-galactic-gates`.

The faction models differ visually. The victory contract is shared.

### 8.1. Construction prerequisites

The alliance leader may start construction when:

- the Galactic Obelisk contains four crystals;
- the target is the leader's designated main planet;
- no other gates are active for the alliance;
- the planet is not occupied or in an invalid destruction state;
- all configurable resource and building prerequisites are satisfied.

### 8.2. Construction duration

Initial value:

```text
gateConstructionDuration = 7 days
```

Gate construction uses a global endgame timer. Ordinary Construction building bonuses do not reduce it.

### 8.3. Global notifications

When construction begins:

- every galaxy receives a notification;
- the target planet is marked on the galaxy map;
- the constructing alliance and current progress are public;
- all players may inspect the remaining time;
- milestones at 25%, 50%, 75% and 90% create additional global events.

### 8.4. Defence

Alliance members may station fleets on the leader's planet to protect the gates. Planetary defence participates normally.

The attacker must defeat:

1. defending and supporting fleets;
2. planetary defence;
3. the gate structure through valid siege or demolition damage.

### 8.5. Alliance victory

If construction reaches 100%:

- the constructing alliance wins the campaign immediately;
- the result is persisted before presentation effects;
- all future simulation ticks enter a completed-match state;
- the victory event records alliance, leader, planet, completion time and participating defenders.

### 8.6. Gate interruption

If the gates are destroyed before completion:

- construction is cancelled;
- one Solar Crystal is transferred to the victorious mission initiator or that initiator's alliance;
- the remaining three crystals return to the defending alliance's obelisk;
- the defending alliance receives a gate restart cooldown;
- the global event feed announces the interruption and crystal transfer.

Initial cooldown:

```text
gateRestartCooldown = 24 hours
```

If multiple hostile fleets participate, the crystal goes to the owner of the resolved attack mission, not automatically to the fleet that dealt the most damage. This keeps reward ownership deterministic.

---

## 9. Solo victory

A solo player has no alliance obelisk or alliance gate construction route.

The solo route is purely military:

```text
stolenGateCrystals = 4 -> solo victory
```

A stolen crystal is awarded only by successfully destroying an alliance's active Supreme Galactic Gates construction.

Requirements:

- the player must not belong to an alliance at the time of the successful interruption;
- each interruption awards at most one crystal;
- crystals persist across different target alliances and repeated attempts;
- joining an alliance converts or locks the solo counter according to the future membership-migration contract; the counter must never duplicate into both ownership models.

On obtaining the fourth crystal, the solo player wins immediately. No personal gate construction is required in canonical v1.

---

## 10. Admiral progression and Commander Ships

### 10.1. Admiral level

Every player has an Admiral. Admiral level is the player's military progression level.

- battle points are earned through combat performance and damage;
- reaching battle-point thresholds increases Admiral level;
- Commander Ships unlock by Admiral level or blueprint requirements;
- the Admiral does not appear as a combat unit.

### 10.2. Ownership limit

A player may own at most one of each Commander Ship type.

With the complete set unlocked, the player may own all 13 different Commander Ships simultaneously, but never multiple copies of the same type.

### 10.3. Active ability

Only one Commander Ship ability is active in a battle: the leading Commander Ship selected by battle priority.

Owning multiple Commander Ships does not stack all commander abilities at once.

### 10.4. Commander ability scaling

Historical public-help values retained as the initial Stellar Empires baseline:

| Commander Ship | Effect per level |
|---|---:|
| Corsair | +0.25% stolen resources in pirate missions |
| Hunter | +0.4% spy-detection chance |
| Executor / Палач | +0.15% fleet attack |
| Juggernaut | +0.15% fleet life |
| Typhoon | +0.1% fleet speed |
| Regenerator / Реаниматор | +0.4% repair chance |
| Viper | +0.075% critical-hit chance |
| Scorpion | +0.1% paralysis chance |
| Corruptor / Фантом | +0.75% chance to return hostile attacks |
| Annihilator | +0.5% building-demolition chance |
| Argo | +0.5% upgrade points gained |
| Punisher / Судья | -0.15 percentage points of enemy armour |

Commander upgrades use their configured base time plus five minutes for every next level.

### 10.5. Polias

Polias is retained as a project-specific late Commander Ship.

Canonical v1 effect:

```text
planetDestructionChanceReduction = 0.5 percentage points per Polias level
maximumPoliasLevel = 10
maximumReduction = 5 percentage points
```

The final planet-destruction chance cannot fall below zero.

---

## 11. Detonation and the displayed `1001%`

The `1001%` value came from the Detonation section of the three planet-killer ship cards:

- Aegis Death Star;
- Synod Titan;
- Veyra Nox Queen.

It is unrelated to suns, Solar Crystals or Supreme Galactic Gates.

The value is a malformed presentation of the threshold **over 1000 demolition points**, not a 1001% probability.

### 11.1. Demolition points

At ship upgrade level 10:

| Ship | Demolition points per ship |
|---|---:|
| Death Star | 100 |
| Titan | 90 |
| Nox Queen | 55 |

Every 2500 population of surviving planetary defence reduces the attacker's demolition pool by 100 points.

### 11.2. Detonation thresholds

| Final demolition points | Result |
|---:|---|
| 0-19 | no building demolition chance |
| 20-100 | 20% chance to remove one level from one building |
| 101-200 | 40% chance to remove one level from one building |
| 201-400 | 60% chance to remove one level from one building |
| 401-550 | 50% chance to remove one level from two buildings |
| 551-700 | 70% chance to remove one level from two buildings |
| 701-850 | 50% chance to remove one level from three buildings |
| 851-1000 | 60% chance to remove one level from five buildings |
| over 1000 | 33% chance to remove one level from every eligible building |

The chance is rolled separately for every targeted building.

Detonation is resolved during an ordinary planet attack when the attacking fleet contains the corresponding planet-killer ships. It may be evaluated even when the battle result is a draw, subject to the final runtime combat contract.

---

## 12. Planet destruction

Planet-killer ships also provide a separate chance to destroy an entire planet.

Historical baseline at ship upgrade level 10:

| Ship | Chance per ship |
|---|---:|
| Death Star | 3% |
| Titan | 2.5% |
| Nox Queen | 1.5% |

Rules retained as the initial baseline:

- base cap: 30%;
- each 1000 population of surviving planetary defence reduces the chance by 1 percentage point;
- defending planet-killer ships reduce the chance according to their own corresponding values;
- Polias then reduces the final chance;
- a player with only one remaining planet cannot lose that planet unless a scenario explicitly enables total elimination.

---

## 13. Project progression formulas

These formulas are `PROJECT_BALANCE_V1`, not historical truth. All coefficients must live in configuration rather than being scattered as literals.

### 13.1. Building cost by level

```text
levelCost(resource, level) = ceil(
  baseCost(resource) * growthCoefficient^(level - 1)
)
```

Initial growth coefficients:

| Building class | Coefficient |
|---|---:|
| extraction and solar energy | 1.50 |
| storage and hangar | 1.55 |
| industry, recycling and trade | 1.60 |
| military and research | 1.65 |
| galactic buildings | explicit fixed endgame costs, not normal level scaling |

### 13.2. Building construction time

```text
buildingTime(level) =
  baseTime * 1.45^(level - 1)
  / (1 + 0.06 * constructionBuildingLevel)
```

The effective time may not fall below 20% of the unmodified level time.

### 13.3. Unit production time

```text
unitProductionTime = baseUnitTime
  / ((1 + 0.05 * shipyardLevel)
     * (1 + 0.08 * advancedFactoryLevel))
```

This applies to ships and planetary defence. It keeps the historical 5% shipyard and 8% advanced-factory roles while avoiding zero or negative production times at high levels.

### 13.4. Research time

```text
researchTime(level) =
  baseResearchTime * 1.60^(level - 1)
  / (1 + 0.07 * researchBuildingLevel)
```

The effective time may not fall below 20% of the unmodified level time.

### 13.5. Storage progression

```text
storageCapacity(level) =
  baseCapacity * 1.75^(level - 1)
```

### 13.6. Extraction progression

```text
hourlyProduction(level) =
  baseProduction * level * 1.10^(level - 1)
```

Solar extraction applies the sun-brightness multiplier after this calculation.

---

## 14. Required authoritative state

Future runtime implementation should add explicit state rather than infer endgame status from UI:

```text
SunState
  brightness
  phase: active | collapsed | protostar
  recoveryAt

AllianceEndgameState
  leaderPlayerId
  endgamePlanetId
  solarCrystals
  gateStatus: unavailable | ready | building | completed | cooldown
  gateProgress
  gateStartedAt
  gateCompletesAt
  gateCooldownUntil

PlayerEndgameState
  stolenGateCrystals
  soloVictoryAchieved

CommanderState
  ownedCommanderTypes
  commanderLevels
  commanderPriority
```

All state transitions must be deterministic, serializable and covered by save migration.

---

## 15. Required notifications and history

The state-history system must record at minimum:

- Sun Attack launched;
- Sun Support committed;
- sun battle result;
- crystal awarded;
- brightness changed;
- sun destroyed;
- protostar created;
- sun restored;
- gate construction started;
- gate progress milestone;
- gate construction interrupted;
- stolen crystal transferred;
- alliance victory;
- solo victory.

History entries must include stable entity IDs and simulation timestamps.

---

## 16. Bot requirements

Bots use the same commands and validation rules as the player.

Bot strategy must be able to:

- join or form alliances;
- decide when to attack an adjacent sun;
- support a local sun;
- protect an alliance leader's gate planet;
- attack vulnerable gate construction;
- pursue the solo route when unaffiliated;
- value brightness loss against local solar-energy dependence;
- respond to global gate notifications.

No bot-only crystal, gate or victory shortcuts are allowed.

---

## 17. Acceptance criteria for implementation PRs

- sun brightness changes solar buildings and satellites immediately;
- non-solar energy remains unaffected;
- only adjacent-galaxy Sun Attacks are accepted;
- valid local players can support a sun regardless of alliance relation;
- successful Sun Attack awards exactly one crystal and removes 25 brightness;
- zero brightness triggers deterministic system collapse and recovery;
- four alliance crystals unlock gates only on the leader's endgame planet;
- gate construction is globally visible and takes seven days by default;
- gate destruction transfers exactly one crystal and returns three;
- fourth stolen crystal triggers solo victory immediately;
- one Commander Ship of each type may be owned;
- only one commander ability applies per battle;
- `1001%` is never represented as a probability in UI or code;
- detonation uses demolition points and the documented threshold table;
- all constants are configurable;
- player and bot commands share the same validation path;
- save/load, deterministic replay and state history are tested.

---

## 18. Source notes

The solar-war, alliance, crystal, obelisk, gate and solo-victory rules are `USER_CANONICAL` project decisions.

Commander ability scaling, the one-leading-commander rule, Admiral progression, demolition points, detonation thresholds, planet-destruction reductions and historical 5%/8% unit-production roles were cross-checked against the public Nemexia Help pages for Commander Ships, Admiral, Ships Skills, Ships Overview, Defence Overview and Military Buildings.

Where this document differs from historical Nemexia, this document is authoritative for Stellar Empires.
