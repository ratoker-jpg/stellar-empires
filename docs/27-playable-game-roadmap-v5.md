# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-07-29  
**Last merged PR:** #130 audit · `2379fa7a30974381349433e4f0e0ba43d15f1511`  
**Active implementation:** #131 `CAMPAIGN-SETTINGS-PERSISTENCE`  
**Active baseline:** `1503c7d37fafc623bee4654ed460c92aa55a7b2f`  
**Accepted batch:** `LOCAL-CAMPAIGN-TIME-PACING-01`  
**Next after merge:** #132 `CAMPAIGN-CLOCK-OFFLINE-GATE`  
**Release target:** complete local PvE browser campaign with autonomous bot empires

## 1. Product target

```text
choose faction and immutable campaign settings
→ develop economy and infrastructure
→ research and build fleets
→ explore Universe / Galaxy / Solar systems
→ spy, transport, colonize, recycle, raid and fight
→ damage or destroy rival secondary colonies
→ compete and negotiate with autonomous bot empires
→ participate in alliances and solar war
→ build or destroy final Gates
→ reach deterministic alliance or solo victory, or lose when another side wins
```

Nemexia references define systemic depth only. Stellar Empires keeps original terminology, assets, UI and implementation.

Canonical contracts:

- endgame: `docs/25-solar-war-obelisks-gates-and-progression.md`;
- local campaign/world speed/offline progression: `docs/25a-local-campaign-world-speed-and-offline-progression.md`;
- accepted implementation contract: `docs/audits/current-batch-audit.md`;
- active implementation record: `docs/changes/pr131-campaign-settings-persistence.md`.

The local campaign requires:

- no continuously running game server for Release 1.0;
- immutable world-speed preset chosen before state creation;
- no normal in-session fast-forward controls after the clock foundation is delivered;
- deterministic active and offline progression at the same speed;
- bots and ordinary world rules continue while closed;
- progression later compressed toward a complete roughly one-day active campaign.

## 2. Source-of-truth hierarchy

1. current merged code/tests on `main`;
2. accepted audit and contracts;
3. active PR code and change document while implementation is open;
4. `docs/audits/current-execution-state.md`;
5. `docs/project-status.json` and `docs/roadmap-pr-index.json`;
6. this roadmap;
7. canonical product/endgame contracts;
8. older audits and handoffs as history only.

## 3. Delivered merged baseline through PR #130

### Simulation and persistence

- deterministic command/event/replay/checksum model;
- schema v14 and migration chain on merged `main`;
- IndexedDB autosave, manual slots, import/export, snapshots and recovery;
- bounded command/event histories;
- serialized deterministic bot decision cursors;
- player and bots share ordinary validation and command paths.

### World and mechanics

- 20-slot Universe and three topology presets;
- multi-colony economy/research/production foundations;
- complete building, technology, ship, defence and Commander catalogs;
- ordinary missions, combat, plunder, debris and reports;
- colonization, expeditions, space objects, logistics, market and world-event foundations;
- formations, priorities, upgrades and Commander effects;
- deterministic intelligence and incoming visibility;
- deterministic building demolition and capped planet destruction;
- final-colony protection, atomic recovery, debris recycling and fresh recolonization.

### Runtime art and application

- 217 mechanical IDs through 173 catalog runtime images;
- Universe → Galaxy → Solar-system routing;
- one application controller and nine canonical route families;
- routed development, fleet, operations, command, reports and system workspaces;
- persistent HUD, shared breadcrumbs, route/colony/return context;
- reload-safe Fleet target preparation and exact Space/Report return flows;
- grouped player navigation;
- keyboard, reduced motion and release-viewport Browser E2E;
- measured task budgets and no-dead-end navigation gate.

### Accepted campaign-time architecture

Audit #130 authorizes:

- schema v15 immutable campaign settings;
- save format v3 protected runtime metadata;
- legacy x1 migration using envelope time;
- one future shared active/offline chronological orchestrator;
- chronological bot decision boundaries;
- processed-cursor checkpoints;
- bounded resumable catch-up;
- durable return summary until acknowledgement;
- separation of clock correctness from later numeric balance work.

Audit validation:

- CI `30389103445`;
- Browser E2E `30389103358`;
- Graphify `30389103322`;
- merge `2379fa7a30974381349433e4f0e0ba43d15f1511`.

## 4. Active PR #131 delivery

The implementation branch now delivers the settings and persistence half of the accepted batch.

### Deterministic campaign identity

```text
CampaignSettings
  scenarioPreset: test | campaign | fidelity
  worldSpeed: 1 | 2 | 5 | 10
  offlineProgression: true
  createdAtReal: canonical ISO timestamp
```

- schema v15 stores settings in `GameState` and checksum;
- settings are immutable after creation;
- scenario selects the existing topology preset;
- normal setup supplies a real creation timestamp;
- legacy state/replay overloads stay deterministic x1;
- no economy, combat, reward or duration formula is changed by world speed in #131.

### Campaign creation

One accessible setup transaction selects:

- faction: Aegis, Synod or Veyra;
- scenario: compact, campaign or fidelity;
- fixed speed: x1, x2, x5 or x10;
- x2 is presented as the recommended preset;
- offline progression is visibly fixed on.

### Save format v3

Runtime metadata remains outside deterministic `GameState` but is integrity-protected with the envelope:

```text
lastActiveAtReal
lastCatchUpRealDurationSeconds
lastCatchUpGameDurationSeconds
pendingCatchUp?
  targetAtReal
  remainingRealDurationMilliseconds
  gameTimeFractionNumerator
  accumulatedSummary
pendingReturnSummary?
```

#131 defines, validates, migrates and preserves these shapes but does not execute catch-up.

Persistence semantics:

- v3 checksum covers stable envelope fields, runtime metadata and state;
- manual save, autosave, import/export, snapshot and recovery preserve cursor and continuation metadata;
- pending catch-up prevents normal autosave from stamping unprocessed target time;
- recovery may update display `savedAt` while preserving the accepted runtime cursor;
- System / Saves displays immutable scenario, speed, creation time and last activity.

### Migration and replay

- state v1–v14 migrates to v15;
- save format v1–v2 migrates to v3;
- old saves receive world speed x1;
- scenario derives from existing topology;
- creation/cursor time derives from validated envelope `savedAt`;
- fixed v14 simulation epoch is never treated as real creation time;
- v15 loads still execute alias, world-event schedule and bounded-history reconciliation;
- replay accepts explicit seed, faction and campaign settings while retaining the legacy x1 overload.

### #131 exclusions

- no active ticker;
- no elapsed-time catch-up;
- no chronological bot refactor;
- no removal of manual time controls yet;
- no progression cost/duration/level rebalance;
- no diplomacy/alliance/endgame runtime.

## 5. Remaining campaign-time gap

Until #132 merges:

- world speed is persisted but does not drive real elapsed time;
- open-session progression still depends on manual Planet time controls;
- offline elapsed time is not processed;
- overdue bots are still evaluated against the final post-jump state;
- no catch-up progress surface is mounted;
- pending summary types exist, but no return-summary presentation runs.

## 6. Active implementation sequence

```text
#131 CAMPAIGN-SETTINGS-PERSISTENCE — active; final validation/review
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE — blocked until #131 merges
→ separate CAMPAIGN-PROGRESSION-BALANCE-01 audit
```

## 7. PR #132 — CAMPAIGN-CLOCK-OFFLINE-GATE

After #131 merges, #132 may deliver:

- one DOM-independent campaign-time orchestrator;
- chronological boundaries for pending events, logistics, world-event evaluation, bot decisions and target time;
- bots evaluated at scheduled world state through ordinary commands;
- fixed-point x1/x2/x5/x10 mapping with fractional carry;
- active open-session clock;
- bounded resumable offline bootstrap;
- protected pending target/remainder/fraction/summary;
- checkpoints that advance the real cursor only by processed time;
- time elapsed during catch-up processed after the original target;
- final state/cursor/summary saved before interaction;
- pending summary retained across reload until acknowledgement;
- normal player fast-forward controls removed;
- one-day/seven-day deterministic and Browser E2E gates.

Central invariant:

```text
one large duration
== any valid smaller time partition
== any valid operation-budget partition
```

## 8. Progression compression split

PRs #131–#132 do not change level caps, costs, durations, unlock requirements or rewards.

After #132, `CAMPAIGN-PROGRESSION-BALANCE-01` must use delivered fake-clock/headless runs to determine:

- standard campaign duration;
- first reconnaissance/combat/colonization timing;
- level and queue compression;
- world-speed preset balance;
- planet-destroyer and endgame timing;
- repetitive versus meaningful progression steps.

## 9. Release 1.0 definition

A player can:

- choose any faction and immutable campaign settings;
- leave and resume through deterministic offline catch-up;
- build a viable multi-colony economy;
- unlock the complete catalog;
- navigate and launch every supported mission without dead ends;
- inspect intelligence/reports and return to relevant context;
- fight fleets/defence and use Commander/planet-destroyer mechanics;
- safely lose and recolonize secondary colonies;
- interact with PvE/economic systems;
- join/create alliances or remain solo;
- reach alliance/solo victory or lose when another side wins.

Bots must use the same commands, resources, timing and intelligence limits. At least one headless match must eventually reach a complete result, and save/load/offline processing must preserve deterministic outcomes.

## 10. Milestone map

| Milestone | Status | Delivery |
|---|---|---|
| M1 — Production assets | completed | Audit #101; #102–#105 |
| M2 — Navigable Universe | completed | Audit #106; #107–#110 |
| M3 — Coherent UI shell | technically completed | Audit #111; #112–#115 |
| M3b — Navigation/usability repair | completed | Audit #125; #126–#129 |
| M4a — Ordinary missions/intelligence | completed | Audit #116; #117–#120 |
| M4b — Planet demolition/destruction/recovery | completed | Audit #121; #122–#123 |
| M4c — Local campaign time foundation | implementation active | #130 accepted; #131 active; #132 blocked |
| M4d — Campaign progression balance | blocked until #132 | separate audit |
| M5 — Multi-colony economy/logistics coherence | not audited | sustainability and bot planning |
| M6 — Full PvE/meta systems | not audited | PvE depth, Arena, Admiral meta, services |
| M7 — Autonomous bot parity | not audited | honest full-domain bot loop and catch-up parity |
| M8 — Complete endgame | not audited | alliances, solar war, Obelisks, Gates, victory/defeat |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 11. Key invariants

- current `main` is the only valid baseline;
- finish #131 before starting #132;
- campaign settings are immutable deterministic state;
- wall-clock cursor/continuation remain outside `GameState` but integrity protected;
- old saves migrate to x1;
- checkpoint cursor represents processed time only;
- no elapsed duration is silently skipped or capped away;
- active and offline paths eventually share one orchestrator;
- pending summary survives until acknowledgement;
- player and bots use ordinary commands and visibility rules;
- no continuously running server is required for Release 1.0;
- no numeric progression rebalance in #131–#132.

## 12. Immediate action

Complete CI, Browser E2E, Graphify and automated review on the final PR #131 head. Merge only after all P0/P1 findings are resolved, synchronize the exact merge SHA on `main`, and only then create #132 from fresh `main`.
