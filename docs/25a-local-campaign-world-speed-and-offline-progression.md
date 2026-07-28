# Canonical local campaign, world speed and offline progression

**Status:** canonical gameplay addendum v1  
**Scope:** local PvE Stellar Empires campaign  
**Authority:** `USER_CANONICAL`  
**Parent contract:** `docs/25-solar-war-obelisks-gates-and-progression.md`

This document adds the campaign-runtime and pacing decisions made by the project owner. It does not replace or rebalance the existing victory, alliance, Solar Crystal, Obelisk, Supreme Galactic Gates, demolition or planet-destruction rules. Those rules remain authoritative in the parent contract.

---

## 1. Product format

Stellar Empires is primarily a **local single-player PvE browser campaign with autonomous bot empires**.

Canonical v1 product decisions:

- the normal campaign does not require a continuously running game server;
- the browser owns the active runtime;
- campaign state is stored locally through the existing persistence layer;
- autosave, manual slots, snapshot recovery and import/export remain supported;
- the player may close the browser and later continue the same deterministic campaign;
- a future online mode is not required for Release 1.0 and must not complicate the local campaign architecture prematurely.

The word `server speed` may be used in player-facing language because it is familiar from browser strategies, but technically it is the immutable **world speed of the local campaign**.

---

## 2. Campaign setup settings

The new-game flow must present campaign settings before initial state creation.

Initial canonical settings contract:

```text
CampaignSettings
  scenarioPreset
  worldSpeed
  offlineProgression
  createdAtReal
```

### 2.1. World speed

The player selects one world-speed preset when creating the campaign:

```text
x1  Classic
x2  Standard / recommended
x5  Fast
x10 Express
```

The exact public preset list remains configurable during balance work, but the mechanical contract is fixed:

- world speed is selected before the campaign starts;
- world speed is persisted in the save and included in deterministic validation/checksum inputs where appropriate;
- world speed cannot be changed after campaign creation;
- the player does not receive runtime pause, fast-forward or temporary speed controls as a normal gameplay feature;
- developer/test acceleration may exist outside the player-facing campaign contract.

Example:

```text
base ship production time = 10 real minutes at x1
x1 world = 10 real minutes
x2 world = 5 real minutes
x5 world = 2 real minutes
x10 world = 1 real minute
```

### 2.2. Uniform time contract

World speed accelerates **canonical simulation time**, rather than scattering speed divisions across every mechanic.

```text
gameTimeElapsed = realTimeElapsed * worldSpeed
```

Therefore the same multiplier applies consistently to:

- resource and energy production;
- building construction and cancellation windows;
- research;
- ship and planetary-defence production;
- repair and ship upgrades;
- fleet travel, return and recall timing;
- expeditions and space-object operations;
- logistics routes and market/world-event timing;
- bot decision cadence;
- diplomacy and alliance timers;
- solar war, system regeneration, Obelisk and Gate timers;
- every other mechanic expressed in canonical simulation time.

World speed does **not** multiply combat strength, costs, cargo capacity, probabilities, fleet slots, demolition chance, destruction chance, rewards per completed action or other non-time balance values.

A single game hour must produce the same deterministic outcome at every world speed. Only the amount of real time required to advance that game hour changes.

---

## 3. Offline progression

The recommended campaign contract keeps the world active while the browser is closed.

On save/close, the runtime records the latest trusted real timestamp. On the next load:

```text
realOfflineDuration = currentRealTime - lastActiveAtReal
offlineGameDuration = realOfflineDuration * worldSpeed
```

The simulation then advances from the saved canonical game time to the target game time through the same event queue, reducers, validators and deterministic bot scheduler used during an open session.

### 3.1. Required offline processing

Offline catch-up must process chronologically:

- economy production and capacity limits;
- building, research, unit, defence, repair and upgrade completion;
- fleet departures, arrivals, battles, returns and recalls already represented by valid state/events;
- expeditions, space objects, logistics and world events;
- bot economy, research, production, reconnaissance, fleet and recovery decisions;
- bot attacks against the player and other bots;
- diplomacy, alliance formation, alliance changes and alliance strategy when those systems exist;
- solar war and final-victory progress when those systems exist.

Closing the browser must not create a protected ceasefire. If a bot can legally scout, prepare and attack within the elapsed game time, the attack resolves normally.

### 3.2. Fairness

Offline actions must obey the same rules as open-session actions:

- no bot-only resources, commands or shortcuts;
- no synthetic `player is offline` damage rule;
- bots must possess resources, intelligence, ships, fuel and valid targets;
- all actions pass through ordinary commands and validators;
- battles use the ordinary deterministic combat resolver;
- the existing final-colony protection remains authoritative unless a future scenario explicitly enables total elimination.

The player can lose fleets, resources, buildings and secondary colonies while away. The player can also return to completed construction, returned fleets, successful defence or bot losses. Offline progression is a continuation of the same world, not a reward-only calculation.

### 3.3. Bounded deterministic catch-up

Large offline intervals must be processed in bounded internal chunks to protect browser responsiveness and memory, but the implementation must not silently skip required events or bot decisions.

If processing cannot complete in one UI frame, the application may show a deterministic loading/progress screen. The final state must equal the state produced by advancing the same game-time interval through valid smaller steps.

### 3.4. Return summary

After catch-up, the player receives a structured summary and access to full reports/history.

Minimum summary groups:

- real time absent and game time simulated;
- resources produced or lost;
- completed construction, research, production, repair and upgrades;
- fleet departures, arrivals and returns;
- battles, attacks, defence results and colony damage/loss;
- bot and alliance activity;
- major world/endgame events;
- final victory or defeat when another side completed the campaign.

---

## 4. Victory and defeat in the local campaign

The parent contract keeps its two victory routes unchanged:

- alliance victory by completing the Supreme Galactic Gates;
- solo military victory by obtaining four stolen Gate crystals.

For the local player:

- **victory** occurs when the player or the player's alliance satisfies a canonical victory route;
- **defeat** occurs when a hostile solo empire or hostile alliance satisfies a canonical victory route first;
- the completed result is persisted before presentation effects;
- offline catch-up may legitimately reach victory or defeat if the required deterministic events occur during the elapsed game time;
- the return summary must explain the event chain that caused the result;
- the player may inspect the final world/reports and then start or load another campaign.

Final-colony protection is not itself a victory condition. It prevents accidental total elimination under the ordinary planet-destruction contract, while the campaign is ultimately decided through the canonical endgame race unless a future scenario defines another explicit result.

---

## 5. Compressed campaign direction

Stellar Empires must preserve the strategic depth of economy, research, fleets, colonies, intelligence, alliances, solar war and Gates without preserving the multi-day waiting structure of an MMO.

Product target:

```text
one complete standard campaign should be finishable in roughly one day of active play,
with faster fixed world-speed presets supporting shorter repeat campaigns
```

World speed alone is not sufficient. Future balance audits must also remove repetitive progression steps while preserving meaningful choices.

Expected direction, not final numeric balance:

- fewer repetitive levels for extraction and routine infrastructure;
- fewer but more meaningful technology and upgrade levels where current depth creates clicking without strategy;
- earlier access to reconnaissance, first combat, colonization and faction identity;
- planet-destroyer capability before the final campaign phase rather than after several real days;
- alliances and endgame pressure early enough that the match converges instead of stalling indefinitely;
- every retained level should provide a visible economic, tactical or unlock consequence.

This addendum does not immediately change existing level caps, formulas, costs or durations. Exact compression values require a dedicated current-code and balance audit, deterministic headless runs and player-flow validation.

---

## 6. Required authoritative state

Future implementation should model the campaign contract explicitly rather than infer it from UI settings:

```text
CampaignSettings
  scenarioPreset
  worldSpeed: 1 | 2 | 5 | 10
  offlineProgression: true
  createdAtReal

CampaignRuntimeMetadata
  lastActiveAtReal
  lastCatchUpRealDuration
  lastCatchUpGameDuration

MatchResult
  status: active | victory | defeat
  winnerPlayerId
  winnerAllianceId
  victoryRoute
  completedAtGameTime
```

Real timestamps are inputs for calculating elapsed offline duration. All resulting gameplay transitions occur through canonical simulation time and must remain deterministic from the accepted saved state plus the accepted elapsed-time input.

---

## 7. Implementation boundaries

This document is a product decision, not implementation authorization.

Separate audits are required for:

1. navigation and usability repair;
2. campaign settings, persistence and deterministic offline catch-up;
3. progression compression and world-speed balance;
4. diplomacy/alliance/endgame runtime;
5. final release balance and complete campaign-duration validation.

Navigation is the first implementation priority because the existing game must become understandable before more systems and campaign settings are layered onto it.
