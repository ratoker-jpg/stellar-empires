# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-07-29  
**Last merged PR:** #132 `CAMPAIGN-CLOCK-OFFLINE-GATE` · `df56566ce6d311ecef81103dddb924b5da0148c1`  
**Runtime baseline:** schema v15 / save format v3 / shared active-offline campaign clock  
**Last completed batch:** `LOCAL-CAMPAIGN-TIME-PACING-01`  
**Next authorized work:** Audit `CAMPAIGN-PROGRESSION-BALANCE-01`  
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
- current delivery authorization: `docs/audits/current-batch-audit.md`;
- completed campaign-time batch: `docs/audits/completed/local-campaign-time-pacing-01.md`;
- PR #131 delivery record: `docs/changes/pr131-campaign-settings-persistence.md`;
- PR #132 delivery record: `docs/changes/pr132-campaign-clock-offline-gate.md`.

## 2. Source-of-truth hierarchy

1. current merged code/tests on `main`;
2. accepted audit and contracts;
3. `docs/audits/current-execution-state.md`;
4. `docs/project-status.json` and `docs/roadmap-pr-index.json`;
5. this roadmap;
6. canonical product/endgame contracts;
7. older audits and handoffs as history only.

## 3. Delivered baseline through PR #132

### Simulation and persistence

- deterministic command/event/replay/checksum model;
- schema v15 immutable checksummed `CampaignSettings`;
- scenario presets `test | campaign | fidelity`;
- immutable world speed `x1 | x2 | x5 | x10`;
- save format v3 integrity over stable envelope fields, runtime metadata and state;
- protected processed cursor, pending catch-up and pending return-summary metadata;
- state v1–v14 and save format v1–v2 migration to x1 using validated envelope time;
- autosave, manual slots, import/export, snapshots and recovery;
- versioned state/runtime-metadata autosave staging resistant to stale writes;
- checksum-safe JSON persistence with cleared optional metadata omitted;
- bounded histories and serialized deterministic bot decision cursors;
- player and bots share ordinary validation and command paths.

### Campaign creation and time

- one accessible transaction selects faction, topology and immutable speed;
- Aegis, Synod and Veyra are available;
- compact, campaign and fidelity topologies are available;
- x2 is presented as recommended;
- offline progression is visibly fixed on;
- one chronological active/offline campaign-time orchestrator;
- scheduled-event, logistics, world-event and bot-decision boundaries;
- fixed-point speed mapping with persistent fractional carry;
- automatic open-session campaign clock;
- bounded resumable offline catch-up with processed-cursor checkpoints;
- cooperative progress and retained retry presentation;
- durable redacted return summary until successful acknowledgement;
- normal player fast-forward controls removed.

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
- persistent HUD, breadcrumbs and route/colony/return context;
- grouped player-centered navigation;
- keyboard, reduced motion and release-viewport Browser E2E;
- campaign-time modal keyboard actions isolated from background Phaser controls;
- measured task budgets and no-dead-end navigation gate.

### PR #132 validation

- final head `67cca4da2c401d2d9f5573e8c463dbbb570204d5`;
- CI `30488370854`;
- Browser E2E `30488370956`, 24/24 Chromium scenarios;
- Graphify `30488370908`;
- all actionable P0/P1/P2 review threads resolved;
- merge `df56566ce6d311ecef81103dddb924b5da0148c1`.

## 4. Next measured gap — progression balance

The campaign now has correct persisted identity, active time and offline continuation, but current progression values have not yet been measured or compressed for the intended complete campaign duration.

`CAMPAIGN-PROGRESSION-BALANCE-01` must audit before any value changes:

- standard complete campaign duration;
- first reconnaissance, combat and colonization timing;
- building/research/production level and queue compression;
- world-speed preset balance and x2 recommendation;
- resource income, storage and population constraints;
- fleet, planet-destroyer and eventual endgame timing;
- repetitive versus meaningful progression steps;
- player and honest-bot ability to reach the same milestones.

The audit must use the delivered fake-clock/headless and Browser E2E foundation, record exact measurements, determine complexity and authorize a bounded implementation batch.

## 5. Release 1.0 definition

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

## 6. Milestone map

| Milestone | Status | Delivery |
|---|---|---|
| M1 — Production assets | completed | Audit #101; #102–#105 |
| M2 — Navigable Universe | completed | Audit #106; #107–#110 |
| M3 — Coherent UI shell | technically completed | Audit #111; #112–#115 |
| M3b — Navigation/usability repair | completed | Audit #125; #126–#129 |
| M4a — Ordinary missions/intelligence | completed | Audit #116; #117–#120 |
| M4b — Planet demolition/destruction/recovery | completed | Audit #121; #122–#123 |
| M4c — Local campaign time foundation | completed | #130 accepted; #131–#132 merged |
| M4d — Campaign progression balance | next audit authorized | separate `CAMPAIGN-PROGRESSION-BALANCE-01` audit |
| M5 — Multi-colony economy/logistics coherence | not audited | sustainability and bot planning |
| M6 — Full PvE/meta systems | not audited | PvE depth, Arena, Admiral meta, services |
| M7 — Autonomous bot parity | not audited | honest full-domain bot loop and catch-up parity |
| M8 — Complete endgame | not audited | alliances, solar war, Obelisks, Gates, victory/defeat |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 7. Key invariants

- current `main` is the only valid baseline;
- the next repository PR must be an Audit PR;
- campaign settings remain immutable deterministic state;
- wall-clock cursor/continuation remain outside `GameState` but integrity protected;
- old saves migrate to x1;
- checkpoint cursor represents processed time only;
- no elapsed duration is silently skipped or capped away;
- active and offline paths use one orchestrator;
- pending summary survives until successful acknowledgement;
- player and bots use ordinary commands and visibility rules;
- no continuously running server is required for Release 1.0;
- no numeric progression change is allowed before the progression audit merges.

## 8. Immediate action

Create Audit PR `CAMPAIGN-PROGRESSION-BALANCE-01` from fresh current `main`. Measure the full affected code, player, bot, persistence, UI and test surface; decide exact progression compression and batch complexity; do not implement balance changes in the audit itself.
