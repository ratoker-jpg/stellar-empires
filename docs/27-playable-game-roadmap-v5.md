# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-07-28  
**Last merged PR:** #129 · `a586224aa85eb3bc4676c3f4cd98a0ff7625aafa`  
**Verified baseline:** `45bd3297d402fd96691a26c60e47bd39a420f174`  
**Active audit:** #130 `LOCAL-CAMPAIGN-TIME-PACING-01`  
**Next implementation after audit acceptance:** #131 `CAMPAIGN-SETTINGS-PERSISTENCE`  
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
- local campaign/world speed/offline progression: `docs/25a-local-campaign-world-speed-and-offline-progression.md`.

The local campaign requires:

- no continuously running game server for Release 1.0;
- immutable world-speed preset chosen before state creation;
- no normal in-session fast-forward controls;
- deterministic active and offline progression at the same speed;
- bots and ordinary world rules continue while closed;
- progression later compressed toward a complete roughly one-day active campaign.

## 2. Source-of-truth hierarchy

1. current merged code/tests on `main`;
2. accepted current audit and contracts;
3. this roadmap;
4. canonical endgame and campaign-runtime contracts;
5. status/roadmap indexes;
6. research references;
7. older audits/handoffs as history only.

Exact execution sequencing:

```text
docs/roadmap-pr-index.json
docs/audits/current-batch-audit.md
docs/audits/current-execution-state.md
```

## 3. Delivered baseline through PR #129

### Simulation and persistence

- deterministic command/event/replay/checksum model;
- schema v14 and migration chain;
- IndexedDB autosave, manual slots, import/export, snapshots and recovery;
- bounded histories;
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

### Completed navigation batch

Audit #125 and PRs #126–#129 are complete.

Archive: `docs/audits/completed/navigation-usability-01.md`.

Final #129 validation:

- CI `30384172381`;
- Browser E2E `30384173409`;
- Graphify `30384172385`.

## 4. Current campaign-time gap

The runtime has canonical game seconds but no playable real-time campaign layer.

Verified gaps:

- new game selects only faction;
- no world-speed state exists;
- no active real-time ticker exists;
- normal Planet UI exposes manual fast-forward;
- autosave load ignores elapsed wall time;
- save format has no protected runtime activity cursor;
- bot decisions after a large jump see the final world snapshot;
- no bounded catch-up progress or return summary exists.

The current `ADVANCE_TIME` reducer already provides the deterministic non-bot foundation by processing event, economy, logistics and world-event boundaries. The current bot scheduler provides persisted cursors and bounded due-decision execution. Audit #130 integrates these foundations rather than replacing them with a second simulation.

## 5. Release 1.0 definition

### Player loop

A player can:

- choose any faction and understand the shell/HUD;
- choose immutable campaign scenario and world speed;
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

### Bot loop

Bots use the same commands, resources, timing and intelligence limits. At least one headless match must eventually reach a complete result with all required systems. Save/load and offline catch-up must preserve the same deterministic outcome.

### Product quality

- no incorrect core asset fallback;
- no dead primary/local route or dead-end task flow;
- deterministic/serializable destructive and offline actions with history;
- bounded save/history/catch-up behavior;
- 1366×768 and 1920×1080 desktop usability;
- keyboard/reduced-motion support;
- reproducible GitHub Pages build;
- complete Browser E2E, victory/defeat path and long-session gate;
- balanced standard campaign capable of completing in roughly one active day.

## 6. Milestone map

| Milestone | Status | Delivery |
|---|---|---|
| M1 — Production assets | completed | Audit #101; #102–#105 |
| M2 — Navigable Universe | completed | Audit #106; #107–#110 |
| M3 — Coherent UI shell | technically completed | Audit #111; #112–#115 |
| M3b — Navigation/usability repair | completed | Audit #125; #126–#129 |
| M4a — Ordinary missions/intelligence | completed | Audit #116; #117–#120 |
| M4b — Planet demolition/destruction/recovery | completed | Audit #121; #122–#123 |
| M4c — Local campaign time foundation | audit active | Audit #130; proposed #131–#132 |
| M4d — Campaign progression balance | blocked until #132 | separate future audit |
| M5 — Multi-colony economy/logistics coherence | not audited | sustainability and bot planning |
| M6 — Full PvE/meta systems | not audited | PvE depth, Arena, Admiral meta, services |
| M7 — Autonomous bot parity | not audited | honest full-domain bot loop and catch-up parity |
| M8 — Complete endgame | not audited | alliances, solar war, Obelisks, Gates, victory/defeat |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 7. Active audit — LOCAL-CAMPAIGN-TIME-PACING-01

Complexity: heavy.

```text
#130 audit
→ #131 CAMPAIGN-SETTINGS-PERSISTENCE
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE
```

### #131 — campaign settings and persistence

- schema v15 immutable `CampaignSettings`;
- faction/scenario/world-speed setup before creation;
- save format v3 runtime metadata outside GameState;
- envelope integrity and migration;
- legacy saves use x1;
- replay takes explicit initial campaign configuration;
- import/export/snapshot/recovery preserve runtime cursor semantics;
- no active clock or catch-up yet.

### #132 — active and offline campaign clock

- one chronological DOM-independent orchestrator;
- event, logistics, world-event and bot decision boundaries;
- stable same-time ordering;
- active wall-clock progression with fractional carry;
- bounded resumable offline catch-up and checkpoints;
- structured redacted return summary;
- final state saved before interactive mount;
- normal fast-forward controls removed;
- one-day/seven-day deterministic and browser gates;
- batch archive and status closure.

Detailed contracts:

- `docs/audits/current-batch-audit.md`;
- `docs/audits/contracts/local-campaign-time-pacing-01-clock-catchup.md`;
- `docs/audits/contracts/local-campaign-time-pacing-01-prs.md`.

## 8. Key campaign-time invariants

- world speed changes only real-time-to-game-time mapping;
- x1/x2/x5/x10 use the same canonical game-second formulas;
- settings are immutable checksum state;
- runtime wall-clock cursor is outside GameState;
- old saves migrate to x1;
- no elapsed time is silently discarded;
- huge intervals yield through resumable chunks;
- active and offline paths share one orchestrator;
- bot decisions occur at their scheduled world snapshot;
- any valid time/chunk partition reaches the same final checksum;
- summary does not reveal hidden enemy information;
- no continuously running server is required.

## 9. Progression compression split

Audit #130 does not choose new level caps, costs, durations or unlock requirements.

After #132, a separate `CAMPAIGN-PROGRESSION-BALANCE-01` audit must use delivered fake-clock/headless runs to determine:

- exact standard-campaign duration;
- first reconnaissance/combat/colonization timing;
- level and queue compression;
- world-speed preset balance;
- planet-destroyer and endgame timing;
- repetitive versus meaningful progression steps.

This split prevents clock correctness from being obscured by simultaneous balance changes.

## 10. Remaining product families

### Multi-colony economy/logistics

Specialization, logistics lifecycle/capacity/failures, market coherence, honest bot economic planning and sustainability under compressed timing.

### PvE and meta

Deeper encounters/rewards, repeatable competition, Admiral/Commander meta, non-monetized services and world-event depth.

### Bot parity

Full headless progression, no hidden resources/bot-only mutation, deterministic catch-up, save/load parity and observable failure reasons.

### Endgame

Alliances/diplomacy, solar attack/support/destruction/rebuilding, Solar Crystals, Obelisks, Supreme Gates, victory and deterministic defeat behavior, including offline resolution.

### Release candidate

Onboarding, balance runs, campaign-duration targets, long-session/catch-up performance, recovery drills, accessibility/visual consistency, complete E2E and reproducible release.

## 11. Delivery rules

1. Start every PR from fresh merged `main`.
2. Use an accepted audit and stable work-item ID.
3. Heavy batches contain at most two implementation PRs.
4. Keep simulation independent from DOM/Phaser.
5. Use the same commands/validators for player and bots.
6. Add migration fixtures for incompatible state/save changes.
7. Use injected clocks and no long real waits in tests.
8. Add focused unit/integration/headless/browser coverage.
9. Run assets, lint, TypeScript, full tests, build, Browser E2E and Graphify.
10. Resolve all P0/P1 review findings.
11. Update status/execution/continuation documents.
12. Do not mix progression balance into #131–#132.

## 12. Immediate action

Complete and merge Audit PR #130. Only after acceptance, create #131 `CAMPAIGN-SETTINGS-PERSISTENCE` from fresh merged `main`.
