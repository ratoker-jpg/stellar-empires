# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-07-30  
**Last merged PR:** #134 `PROGRESSION-PROFILE-FOUNDATION` · `aa87e764ef40444660039dc8d6a96d7f5514cc23`  
**Runtime baseline:** schema v16 / save format v3 / immutable dual progression profiles  
**Last completed batch:** `LOCAL-CAMPAIGN-TIME-PACING-01`  
**Next authorized work:** PR #135 `COMPRESSED-CAMPAIGN-PROGRESSION-GATE`  
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

## 3. Delivered baseline through PR #134

### Simulation and persistence

- deterministic command/event/replay/checksum model;
- schema v16 immutable checksummed `CampaignSettings` with `legacy-v1 | compressed-v1`;
- scenario presets `test | campaign | fidelity`;
- immutable world speed `x1 | x2 | x5 | x10`;
- save format v3 integrity over stable envelope fields, runtime metadata and state;
- protected processed cursor, pending catch-up and pending return-summary metadata;
- state v1–v15 and save format v1–v2 migration to x1 plus `legacy-v1` using validated envelope time;
- autosave, manual slots, import/export, snapshots and recovery;
- versioned state/runtime-metadata autosave staging resistant to stale writes;
- checksum-safe JSON persistence with cleared optional metadata omitted;
- bounded histories and serialized deterministic bot decision cursors;
- player and bots share ordinary validation and command paths.

### Campaign creation and time

- one accessible transaction selects faction, topology and immutable speed;
- Aegis, Synod and Veyra are available;
- compact, campaign and fidelity topologies are available;
- x2 and `compressed-v1` are presented as recommended;
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

### PR #134 validation

- final head `0c5b6940ee25ca28de4ac4d194535f77b0ba332a`;
- CI `30553697886`;
- Browser E2E `30553697703`;
- Graphify `30553697767`;
- no unresolved review threads;
- merge `aa87e764ef40444660039dc8d6a96d7f5514cc23`.

## 4. Current measured gap — compressed campaign closure

The campaign now has schema-v16 dual-profile identity and all existing progression consumers resolve through the immutable profile. The remaining accepted work is the final #135 economy/reward/bot and measured-duration closure.

`COMPRESSED-CAMPAIGN-PROGRESSION-GATE` must deliver:

- compressed starting stocks, capacities, population and storage/production multipliers;
- consistent mission, expedition and space-object rewards;
- deterministic bot progression phases using ordinary commands;
- player and bot milestone gates across the accepted seed/faction matrix;
- exact x1/x2/x5/x10 scaling equivalence;
- active/offline/save-load partition equivalence;
- median ≤12 x2 hours and every accepted seed ≤16 x2 hours;
- release-viewport Browser E2E, change record and completed batch archive.

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
| M4d — Campaign progression balance | implementation active | Audit #133; #134 merged; #135 next |
| M5 — Multi-colony economy/logistics coherence | not audited | sustainability and bot planning |
| M6 — Full PvE/meta systems | not audited | PvE depth, Arena, Admiral meta, services |
| M7 — Autonomous bot parity | not audited | honest full-domain bot loop and catch-up parity |
| M8 — Complete endgame | not audited | alliances, solar war, Obelisks, Gates, victory/defeat |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 7. Key invariants

- current `main` is the only valid baseline;
- the next repository PR must be authorized implementation PR #135;
- campaign settings remain immutable deterministic state;
- wall-clock cursor/continuation remain outside `GameState` but integrity protected;
- old saves migrate to x1 and `legacy-v1`; new campaigns use `compressed-v1`;
- checkpoint cursor represents processed time only;
- no elapsed duration is silently skipped or capped away;
- active and offline paths use one orchestrator;
- pending summary survives until successful acknowledgement;
- player and bots use ordinary commands and visibility rules;
- no continuously running server is required for Release 1.0;
- accepted progression constants may change only through the recorded divergence rule and full matrix rerun.

## 8. Immediate action

Create PR #135 `COMPRESSED-CAMPAIGN-PROGRESSION-GATE` from fresh synchronized `main`. Implement only the accepted economy, reward, bot-phase and measured closure contract; do not implement alliances, Solar War, functional Gates or victory/defeat.
