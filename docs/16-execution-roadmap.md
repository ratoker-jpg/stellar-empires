# Execution Roadmap Stellar Empires — complete core gameplay v4

**Status:** Accepted  
**Updated:** 2026-07-26  
**Baseline:** merged PR #93  
**Release target:** 1.0

## 1. Release boundary

Release 1.0 is a complete offline single-player browser strategy:

> choose faction → develop colonies → research and produce → explore and fight bots → complete the core catalog → navigate the Universe → form or oppose alliances → contest suns → build the final gates → win or lose → review round statistics.

Included:

- three mechanically asymmetric factions;
- deterministic economy, research, production, fleets, combat and bots;
- complete core catalogs before metagame expansion;
- living Universe, PvE, alliances and endgame;
- Commander Ships, achievements and local rankings;
- original production UI/assets/audio and accessible GitHub Pages release.

Excluded:

- network multiplayer;
- server accounts or cloud saves;
- payments, Premium or live-service systems;
- copied Nemexia HTML, CSS, art, prose, formulas or exact balance.

## 2. Delivery rules

- GitHub history and current `main` are authoritative.
- Every implementation PR starts from fresh `main` after the previous PR is merged.
- Required CI gate: lint → typecheck → full tests → production build.
- Simulation remains independent from DOM and Phaser presentation.
- Players and bots use the same commands, validators and state.
- Incompatible state changes require deterministic save migration and fixtures.
- Source assets are not runtime assets until registered, processed and tested.
- Final asset swaps use stable mechanical IDs and manifests, not direct component imports.
- The canonical design documents `docs/25-*` and `docs/26-*` remain deferred contracts until the core gameplay batch is complete.

## 3. Delivered baseline through PR #93

### Runtime foundation

- Phaser/TypeScript/Vite application;
- deterministic state, commands, events, replay and checksums;
- IndexedDB saves, slots, import/export, migration and recovery;
- economy, buildings, research, production and fleets;
- transport, deploy, scout, attack, recycle, colonize and expeditions;
- combat, plunder, debris, reports and planetary defence lifecycle;
- multi-colony specialization, logistics and market;
- honest autonomous bot planners with serialized deterministic timing;
- bounded long-session histories;
- formations, priorities, upgrades, command doctrine and flagship framework;
- 24 functional buildings per faction;
- 22 canonical technologies per faction with deterministic compatibility aliases;
- 13 ordinary ships per faction with complete service, combat and mission coverage.

### Documentation and asset baseline

- complete captured catalog of 72 buildings, 39 ordinary ships, 27 defences, 22 sciences and 13 Commander Ships;
- 174 new source assets committed by PR #86;
- canonical solar-war and final-gates design in PR #87;
- canonical Universe navigation design in PR #88.

The source catalog and design documents are evidence and project contracts. They do not by themselves mean the runtime gameplay is complete.

## 4. Active core-gameplay batch

PR #91 was closed without merge and replaced by clean PR #92. All later planned numbers shifted by one.

| PR | Status | Scope | Runtime outcome |
|---:|---|---|---|
| **#89** | merged | Complete-catalog foundation | Stable shared/faction IDs, target manifests, rollout metadata, registry validation, asset resolver and compatibility reporting |
| **#90** | merged | Complete 24-building economy | 24 functional buildings per faction, full resource/energy/storage/industry progression, bot and UI integration |
| **#91** | superseded | Interrupted technology attempt | Closed without merge; no runtime delivery |
| **#92** | merged | Complete 22-technology tree | 22 sciences with real economy, fleet, combat and prerequisite effects for every faction |
| **#93** | merged | Complete 13-ship rosters | 13 ordinary ships per faction, service/combat roles, missions, bot role use, abilities and asset bindings |
| **#94** | active | Complete 9-defence rosters | 9 planetary defences per faction, shields, mixed batteries, recovery, repair and combat targeting integration |
| **#95** | planned | Commander Ships and full-game validation | 13 shared Commander Ships, Admiral unlock/progression, one active ability, bot selection and deterministic full-game harness |

### Gate after PR #95

- every faction has 24 buildings, 13 ordinary ships and 9 defences;
- all factions use the same 22-science functional matrix with explicit faction modifiers where intended;
- all 13 Commander Ships are real producible units with deterministic effects;
- every catalog entry has valid prerequisites, producer, asset resolution and UI presentation;
- all ordinary missions have at least one valid unit role;
- bots can develop, research, produce, fight, recover and progress through the complete catalogs;
- old saves migrate without losing levels, queues, inventories, fleets or reports;
- full-game headless runs reveal no dependency dead ends;
- CI remains green.

## 5. Universe and ordinary strategic play after core completion

| Planned PR | Scope |
|---:|---|
| **#96** | Runtime Universe → Galaxy → Solar-system navigation with deterministic procedural visuals and asset manifests |
| **#97** | Complete coordinate-based missions, route timing, direct map actions, tooltips and report backlinks |
| **#98** | Alliance creation, membership, leadership, relations and bot diplomacy |

The exact PR numbers may shift if a required stabilization fix is inserted. The ordering must not shift: complete core gameplay first, then spatial navigation, then alliances.

## 6. Solar war and endgame after alliances

| Planned PR | Scope |
|---:|---|
| **#99** | Sun brightness, Sun Attack, Sun Support, Solar Crystals and destroyed-system lifecycle |
| **#100** | Galactic Obelisks, Supreme Galactic Gates, alliance victory, solo stolen-crystal victory and final round screen |

No solar-war or gates implementation begins before PR #98 is merged and the complete core catalogs are playable.

## 7. Product completeness after the first full victory path

Planned work includes:

- achievements, local rankings and round statistics;
- tutorial, contextual help and encyclopedia;
- deeper bot expedition, diplomacy and endgame planning;
- notifications, reports, bookmarks and explanation quality;
- save-schema consolidation and offline resimulation;
- large headless balance batches and a balance pass;
- faction art/effects/audio polish;
- accessibility and localization readiness;
- performance, memory and low-end budgets;
- browser E2E, visual regression and release QA.

## 8. Cross-cutting acceptance gates

Every gameplay system provides:

- deterministic domain logic and focused tests;
- player and bot command paths;
- save serialization or explicit proof that no migration is needed;
- reports or explainable feedback;
- accessible UI state;
- original terminology and asset provenance;
- performance limits.

Project-wide gates:

- save/load must not change bot behaviour;
- different time-step sizes must produce equivalent deterministic outcomes;
- state and save growth remain inside explicit budgets;
- no catalog may contain unreachable entries or broken dependency cycles;
- source assets never bypass runtime processing and manifests;
- browser E2E must eventually cover the main vertical slice and one complete victory path.

## 9. Explicit non-goals

- multiplayer or network authority;
- payments and premium services;
- account moderation;
- exact emulation of Nemexia economy or balance;
- captured third-party HTML, CSS or art;
- implementing final gates before the ordinary game is complete.
