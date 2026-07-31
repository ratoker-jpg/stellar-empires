# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-07-31  
**Last merged PR:** #135 `COMPRESSED-CAMPAIGN-PROGRESSION-GATE` · `3bcd5c0ae67d17f8e6159a19091fe1b6b4e62992`  
**Runtime baseline:** schema v16 / save format v3 / immutable dual progression profiles  
**Last completed batch:** `CAMPAIGN-PROGRESSION-BALANCE-01`  
**Current authorized work:** Audit PR #137 `MULTI-COLONY-ECONOMY-LOGISTICS-01`  
**Release target:** complete local PvE browser campaign with autonomous bot empires

## 1. Product target

```text
choose faction and immutable campaign settings
→ develop a coherent multi-colony economy
→ research and build fleets
→ explore Universe / Galaxy / Solar systems
→ spy, transport, colonize, recycle, raid and fight
→ damage or destroy rival secondary colonies
→ compete and negotiate with autonomous bot empires
→ participate in alliances and Solar War
→ build or destroy final Gates
→ reach deterministic alliance or solo victory, or lose when another side wins
```

Nemexia references define systemic depth only. Stellar Empires keeps original terminology, assets, UI and implementation.

Canonical contracts:

- current delivery authorization: `docs/audits/current-batch-audit.md`;
- M5 implementation contract: `docs/audits/contracts/multi-colony-economy-logistics-01.md`;
- local campaign/world speed/offline progression: `docs/25a-local-campaign-world-speed-and-offline-progression.md`;
- endgame: `docs/25-solar-war-obelisks-gates-and-progression.md`.

## 2. Source-of-truth hierarchy

1. current merged code/tests on `main`;
2. accepted current audit and contracts;
3. `docs/audits/current-execution-state.md`;
4. `docs/project-status.json` and `docs/roadmap-pr-index.json`;
5. this roadmap;
6. canonical product/endgame contracts;
7. completed audits and older handoffs as history.

## 3. Delivered baseline through PR #135

### Simulation and persistence

- deterministic command/event/replay/checksum model;
- schema v16 immutable checksummed campaign settings and `legacy-v1 | compressed-v1` profile;
- save format v3 with protected cursor, continuation and return-summary metadata;
- state v1–v15 and save v1–v2 migration;
- autosave, manual slots, import/export, snapshots and recovery;
- bounded histories and deterministic bot cursors;
- player and bots share ordinary validation and commands.

### Campaign creation, time and progression

- faction, topology and immutable x1/x2/x5/x10 world speed;
- one chronological active/offline campaign-time orchestrator;
- bounded resumable catch-up and durable redacted return summary;
- compressed starting economy, capacity, production/storage/reward profile;
- deterministic phase-aware bot economy/research/production/fleet behavior;
- permanent 5-seed × 3-player-faction progression matrix;
- measured x2 median 14 h 28 m and maximum 15 h 18 m;
- seven-day catch-up 9.99 seconds against the 30-second gate.

### World and mechanics

- 20-slot Universe and three topology presets;
- multi-colony economy/research/production foundations;
- planet specializations and development templates;
- persistent abstract logistics routes and dynamic local market;
- complete building, technology, ship, defence and Commander catalogs;
- ordinary missions, combat, plunder, debris, reports, expeditions and space objects;
- deterministic intelligence, demolition, planet destruction, recovery and recolonization.

### Runtime art and application

- 217 mechanical IDs through 173 runtime images;
- Universe → Galaxy → Solar-system routing;
- one application controller and canonical route families;
- routed development, fleet, Operations, command, reports and system workspaces;
- persistent HUD, breadcrumbs and colony/return context;
- keyboard, reduced motion and release-viewport Browser E2E.

## 4. Current measured gap — M5 colony coherence

The required state and commands already exist, but they are not yet one coherent player/bot system.

Audit #137 verifies:

- Empire Overview lacks route inflow/outflow and sustainability health;
- route creation allows duplicate keys;
- paused routes resume from stale departure time;
- Operations logistics lacks editing and full diagnostics;
- market silently acts on the active colony rather than an explicit selection;
- duplicate legacy market/logistics panels remain uncalled;
- bots do not allocate colony roles or operate logistics routes.

M5 is therefore a medium four-PR batch:

```text
#138 COLONY-PORTFOLIO-FOUNDATION
#139 LOGISTICS-ROUTE-LIFECYCLE
#140 COLONY-OPERATIONS-UX
#141 BOT-COLONY-LOGISTICS-GATE
```

The batch retains schema v16/save v3 and abstract fixed-interval logistics. It does not add physical convoys, fuel, distance, interception or route combat.

## 5. Release 1.0 definition

A player can:

- choose any faction and immutable campaign settings;
- leave and resume through deterministic offline catch-up;
- build and understand a viable multi-colony economy;
- configure predictable logistics and local market support;
- unlock the complete catalog;
- navigate and launch every supported mission without dead ends;
- inspect intelligence/reports and return to relevant context;
- fight fleets/defence and use Commander/planet-destroyer mechanics;
- safely lose and recolonize secondary colonies;
- interact with complete PvE/economic systems;
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
| M4c — Local campaign time foundation | completed | Audit #130; #131–#132 |
| M4d — Campaign progression balance | completed | Audit #133; #134–#135 |
| M5 — Multi-colony economy/logistics coherence | audit active | Audit #137; #138–#141 after merge |
| M6 — Full PvE/meta systems | not audited | PvE depth, Arena, Admiral meta, services |
| M7 — Autonomous bot parity | not audited | honest full-domain bot loop beyond colony economy |
| M8 — Complete endgame | not audited | alliances, Solar War, Obelisks, Gates, victory/defeat |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 7. Key invariants

- current `main` is the only valid baseline;
- Audit #137 must merge before #138 starts;
- campaign settings and progression profile remain immutable deterministic state;
- no elapsed duration is silently skipped or capped away;
- active and offline paths use one orchestrator;
- player and bots use ordinary commands and visibility rules;
- schema v16/save v3 remain unless an audit is replaced;
- M5 does not alter progression constants or accepted duration gates;
- no continuously running server is required for Release 1.0.

## 8. Immediate action

Finish Audit PR #137, run CI/Browser E2E/Graphify, resolve review and squash merge. Then create only PR #138 `COLONY-PORTFOLIO-FOUNDATION` from the resulting fresh `main`.