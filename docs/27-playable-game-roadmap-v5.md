# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** proposed canonical execution roadmap  
**Date:** 2026-07-26  
**Baseline:** `main` after merged PR #97 (`9d0cf6c542db2e4468080595d76c1ea5ad2f549a`)  
**Documentation PR:** #98  
**First implementation PR after this roadmap:** #99  
**Release target:** complete offline PvE browser strategy with autonomous bot empires

---

## 1. Purpose

This roadmap replaces the obsolete post-#95 numbering and defines the path from the current technically strong prototype to a coherent, fully playable game.

The target is not “add several more mechanics”. The target is a complete product loop:

```text
choose faction
→ start on one planet
→ develop economy and infrastructure
→ research technologies
→ build civilian and military fleets
→ explore Universe / Galaxy / Solar systems
→ spy, transport, colonize, recycle, raid and fight
→ compete with autonomous bot empires
→ join, create or oppose alliances
→ fight over suns and Solar Crystals
→ build or destroy the final Gates
→ achieve alliance or solo victory
→ show a deterministic final round result
```

The confirmed Nemexia references from PR #96 define the expected depth, information architecture, user flows and historical mechanics. They do not authorize copying third-party HTML, CSS, prose or visual assets. Stellar Empires keeps original art, terminology, implementation and configurable balance.

The project-specific rules for suns, Solar Crystals, Obelisks, Supreme Galactic Gates and victory remain authoritative in:

```text
docs/25-solar-war-obelisks-gates-and-progression.md
```

They must not be replaced by historical Nemexia rules.

---

## 2. Canonical source hierarchy

When documents conflict, use this order:

1. Current merged code and tests on `main`.
2. This roadmap and its explicit acceptance gates.
3. `docs/25-solar-war-obelisks-gates-and-progression.md` for endgame.
4. `docs/26-universe-galaxy-solar-system-navigation-contract.md` for spatial navigation.
5. `docs/research/nemexia-final-complete-game-concept-2026-07-26.md` for confirmed mechanics.
6. `docs/research/nemexia-navigation-and-ui-reference-2026-07-26.md` for confirmed UI/navigation.
7. `docs/20-full-project-audit.md` for architectural and stabilization risks.
8. Older roadmaps and historic handoffs only as background.

GitHub history overrides stale PR numbers in old prose.

---

## 3. Current delivered baseline after PR #97

### 3.1. Simulation and persistence

Already delivered:

- Phaser + TypeScript + Vite client;
- deterministic simulation, commands, events, replay and checksum;
- schema-v13 save model;
- IndexedDB autosave, save slots, import/export, snapshots and recovery;
- deterministic migrations and compatibility aliases;
- separate presentation layer from simulation logic;
- player and bots using the same command validation paths;
- bounded bot timing/history improvements from the stabilization work;
- headless catalog and production-path validation.

### 3.2. World, economy and operations

Already delivered at prototype/functional depth:

- seeded world and multi-colony state;
- three planet zones;
- resources, energy, storage, population/hangar and stability-related systems;
- construction, research, unit, defence, repair and ship-upgrade queues;
- logistics and market foundations;
- fleets, missions, combat, plunder, debris and reports;
- colonization, recycling, expeditions and space objects;
- pirates/Renegade-style PvE foundations and world events;
- planetary defence damage, recovery and repair;
- formations, target priorities, ship upgrades and class abilities;
- Admiral progression and flagship/Commander framework.

### 3.3. Complete mechanical catalogs

PR #89–#95 closed the catalog gate:

| Category | Aegis | Synod | Veyra | Shared |
|---|---:|---:|---:|---:|
| Buildings | 24 | 24 | 24 | — |
| Technologies | 22 | 22 | 22 | functional matrix |
| Ordinary ships | 13 | 13 | 13 | — |
| Planetary defences | 9 | 9 | 9 | — |
| Commander Ships | — | — | — | 13 |

These entries are mechanically registered, dependency-validated and save-compatible.

### 3.4. UI and presentation baseline

Already delivered:

- original design tokens and faction themes;
- persistent HUD foundation;
- planet workspace and zone presentation;
- research, production, defence, market, logistics, reports and ranking presentation;
- responsive and keyboard/accessibility foundation;
- UI sandbox and reusable primitives;
- faction-specific presentation paths.

The current UI is not yet the complete confirmed navigation model from PR #96. Several screens exist as partial operational panels rather than one coherent game shell.

### 3.5. Asset baseline

Available source material includes:

- full building catalog: 72 faction building images;
- full ordinary ship catalog: 39 images;
- full planetary defence catalog: 27 images;
- 13 Commander Ship images;
- complete technology/source catalog material;
- faction heroes, emblems, backgrounds and earlier runtime atlases;
- 90 universe-navigation PNG files from PR #97.

Mechanical/source bindings exist for core catalogs, but many runtime screens still resolve to processed compatibility fallbacks. The presence of a source PNG does not mean the final art is displayed in-game.

---

## 4. Critical truth about the PR #97 Universe assets

PR #97 delivered 90 transparent PNG files:

| Family | Count |
|---|---:|
| Galaxy nebulae | 20 |
| System stars | 12 |
| Active suns | 8 |
| Protostars | 2 |
| Collapsed stellar remnants | 2 |
| Planets | 24 |
| Asteroids | 8 |
| Debris fields | 6 |
| Renegade objects | 6 |
| Generic markers | 2 |
| **Total** | **90** |

This covers the primary physical objects required by the Universe → Galaxy → Solar-system hierarchy.

However, the set is **source-ready, not runtime-ready**.

Confirmed blockers from the PR review:

- all 90 images exceed the contracted canvas sizes;
- the set adds about 130 MiB to `public` and roughly 306 MiB of decoded texture memory;
- the 20 nebulae alone use about 26.5 MiB transfer and 62.9 MiB decoded memory;
- filenames differ from the accepted contract in `docs/asset-prompts/universe-navigation-assets.md`;
- only two generic markers exist, while the map needs multiple semantic mission and status overlays.

Therefore the first implementation batch must process and register these files. Runtime components must not directly load the oversized originals.

---

## 5. Release definition

Release 1.0 is complete only when all gates below are true.

### 5.1. Player loop

A new player can, without developer tools:

- choose any of three factions;
- understand the global header and navigation;
- develop a viable economy;
- unlock the complete catalog without dependency dead ends;
- manage several planets;
- navigate Universe, galaxies and systems;
- launch every supported mission from valid map targets;
- inspect intelligence and reports;
- fight fleets and planetary defence;
- use Admiral and Commander Ships;
- interact with PvE objects and economic services;
- join/create an alliance or remain solo;
- complete an alliance or solo victory route;
- save, close, reopen and continue deterministically.

### 5.2. Bot loop

Bots must be able to use the same systems without hidden resources, hidden information or bot-only commands.

At least one full headless match must complete from new game to victory with:

- all three factions represented;
- economy and research progression;
- colonization;
- espionage;
- normal and PvE combat;
- alliance choices;
- sun war;
- final victory.

### 5.3. Product quality

- no core catalog card uses an incorrect fallback image;
- no navigation page is a dead end;
- all destructive actions require confirmation and generate history;
- all state changes are deterministic and serializable;
- save size and event/history growth stay inside explicit budgets;
- desktop paths are fully usable at 1366×768 and 1920×1080;
- keyboard navigation and reduced-motion modes work;
- GitHub Pages build is reproducible;
- browser E2E covers the main loop and one victory path.

---

## 6. Delivery rules for every implementation PR

Every PR after #98 must follow these rules.

1. Start from fresh `main` after the previous dependency PR is merged.
2. Do not combine unrelated roadmap rows.
3. Keep simulation independent from DOM/Phaser.
4. Use the same commands and validators for player and bots.
5. Add migration fixtures for incompatible state changes.
6. Resolve visuals through stable IDs and manifests.
7. Never directly bind UI components to source-library paths.
8. Add focused tests and update the headless harness.
9. Run lint, typecheck, full tests and production build.
10. Update the roadmap status and handoff.
11. When procedural art or CSS placeholders are introduced, add or update an entry in:

```text
docs/asset-prompts/master-runtime-asset-backlog.md
```

12. A placeholder is not “temporary undocumented art”. It is an explicit debt item with a stable asset ID, target dimensions and generation prompt.

---

## 7. Milestone map

| Milestone | Completion PR | Result |
|---|---:|---|
| M1 — Production assets connected | #104 | Core catalogs display their correct optimized assets |
| M2 — Navigable Universe | #111 | Universe, Galaxy and Solar-system navigation is playable |
| M3 — Coherent full UI shell | #121 | Confirmed navigation model is implemented across all core screens |
| M4 — Ordinary mechanics complete | #132 | Economy, missions, espionage, combat and destruction rules are coherent |
| M5 — Full PvE and meta systems | #138 | Renegades, Arena, Admiral meta and economic services are usable |
| M6 — Autonomous bot parity | #142 | Bots can play all ordinary and meta systems honestly |
| M7 — Complete endgame | #148 | Alliance and solo victory paths are playable |
| M8 — Release candidate quality | #156 | Balance, performance, QA and Pages release are complete |
| Release 1.0 | #157 | Tagged stable build |

---

# Stage A — Production asset integration

This stage has the highest priority. Do not begin the full Universe UI while the core game still displays generic fallback art.

## PR #99 — Asset processing foundation and repository audit

### Scope

- inventory every source, processed and runtime asset;
- produce a machine-readable manifest containing source path, mechanical ID, dimensions, alpha bounds, checksum and runtime destination;
- define target dimensions and compression by family;
- add deterministic processing scripts for PNG/WebP derivatives and atlas packing;
- separate provenance/source originals from runtime derivatives;
- add contact sheets and dark/light background alpha QA;
- establish transfer, decoded-memory and texture-count budgets;
- audit all 90 Universe files and record their actual dimensions and byte sizes;
- resolve the filename-contract mismatch through stable manifest IDs, not fragile direct paths.

### Gate

- no source file is loaded directly by production UI;
- processing is reproducible from a clean checkout;
- CI checks checksum, dimensions, alpha and output budget;
- asset backlog is machine-readable and documented.

## PR #100 — Full building art integration

### Scope

- process all 72 building source images;
- bind every canonical building ID to its own optimized derivative;
- integrate building art in planet zones, cards, queues, tooltips and information dialogs;
- eliminate role-level generic building fallbacks;
- verify all three faction themes and safe areas.

### Gate

- 24/24 buildings per faction resolve to unique intended art;
- no building card silently falls back to an unrelated command/research/shipyard image;
- atlas and memory budgets pass.

## PR #101 — Technology, research and effect art integration

### Scope

- process all technology/source images;
- bind all 22 technologies for each faction namespace;
- add research category art, locked/available/researching/completed states;
- connect effect/status icons for energy, storage, speed, fuel, armour, critical chance and ecology;
- document any missing technology art in the master asset backlog.

### Gate

- every research card has a stable, correct image and readable state;
- no technology uses a building or ship fallback;
- all icons remain readable at compact sizes.

## PR #102 — Ordinary ship art integration

### Scope

- process all 39 ordinary ship images;
- bind all canonical ship IDs to optimized runtime assets;
- integrate art in shipyard cards, fleet selection, inventory, mission composition, reports and combat presentation;
- retain stable mechanical IDs and existing saves;
- validate transparent edges on dark backgrounds.

### Gate

- 13/13 ships per faction display correct art everywhere;
- no ship uses a six-frame vertical-slice fallback;
- fleet/report thumbnails are deterministic and performant.

## PR #103 — Defence and Commander Ship art integration

### Scope

- process all 27 planetary defence images and 13 Commander Ship images;
- integrate them in production, repair, planet defence, battle reports, Admiral roster and flagship selection;
- add locked, owned, queued, damaged and active-ability presentation states;
- record missing ability/VFX art in the master backlog.

### Gate

- 9/9 defences per faction and 13/13 Commander Ships have correct runtime presentation;
- shield and mixed-battery classes are visually distinguishable;
- one-active-Commander state is obvious and accessible.

## PR #104 — Core asset completeness and fallback removal gate

### Scope

- add automated catalog-to-runtime-asset coverage tests;
- fail CI when a core catalog entry resolves to a compatibility fallback;
- add visual contact-sheet snapshots for all catalogs;
- remove obsolete fallback mappings that hide missing art;
- profile startup transfer and decoded texture memory;
- update asset provenance documentation.

### Gate

- core catalog coverage is 100%;
- remaining procedural art exists only for explicitly deferred UI/world effects;
- runtime asset budgets are green.

---

# Stage B — Universe, Galaxy and Solar-system navigation

## PR #105 — Process and register the 90 Universe assets

### Scope

- move oversized PR #97 files behind the source/runtime boundary;
- generate contracted derivatives:
  - galaxies 256×256;
  - system stars 128×128;
  - active/protostar/collapsed suns 512×512 masters with smaller runtime variants;
  - planets 256×256;
  - strategic objects at documented target sizes;
- create `SpaceMapAssetManifest` with stable semantic IDs;
- preserve source files and record checksums;
- normalize or alias filenames from PR #97;
- add lazy loading and per-view texture budgets.

### Gate

- no view downloads all 90 images on initial application load;
- the Universe set is within defined transfer and decoded-memory budgets;
- every source file is represented in the manifest or explicitly rejected.

## PR #106 — Universe root view

### Scope

- implement the 970×468 logical stage;
- implement 20 exact galaxy slots from the canonical contract;
- support scenario-configurable populated galaxy count;
- render current/discovered/unknown states;
- show galaxy number, empire count and system-state summary;
- add hover, focus, keyboard and click behavior;
- use final processed nebula assets with procedural fallback only through the manifest.

### Gate

- all 20 nodes render deterministically;
- selecting a galaxy does not mutate simulation state;
- selected location survives save/load;
- 1366×768 and 1920×1080 layouts pass.

## PR #107 — Galaxy view

### Scope

- implement 970×530 logical stage;
- 9 systems per page with canonical staggered geometry;
- paging, range label, direct coordinate input and breadcrumb;
- render system stars and sun-state aggregates;
- known threat and inhabited-planet summaries respect intelligence/fog;
- reduced-motion support.

### Gate

- navigation across all valid systems is deterministic;
- unknown information is not leaked;
- paging and keyboard controls are tested.

## PR #108 — Solar-system view

### Scope

- implement central sun and all 24 canonical positions;
- render occupied planets, empty colonizable slots, asteroids, debris and Renegades;
- render active/collapsed/protostar/recovering sun states;
- integrate planet relation/status overlays;
- implement deterministic asset selection by world seed and stable IDs.

### Gate

- exactly 24 positions exist and retain identity in saves;
- object types never overlap or disappear through re-render;
- status is not communicated by colour alone.

## PR #109 — Map tooltips, intelligence and object states

### Scope

- implement occupied planet tooltip and intelligence confidence;
- own/allied/hostile/neutral/protected/inactive/blocked/vacation/command states;
- object-specific panels for asteroid, debris, Renegade and sun;
- fog-of-war redaction;
- action availability reasons;
- bookmarks and report backlinks.

### Gate

- every visible action has an explainable enabled/disabled reason;
- no hidden bot/player data leaks through tooltips;
- reports can reopen the relevant coordinate.

## PR #110 — Coordinate actions and mission preparation

### Scope

- launch transport, spy, attack, deploy, colonize, recycle, pirate, asteroid/gas, Renegade and sun-related preparation from map targets;
- never dispatch on the first map click;
- open the existing validated mission composer with target prefilled;
- route preview, distance, time, fuel, arrival and return;
- semantic mission markers and fleet route overlays;
- direct coordinate navigation and validation.

### Gate

- map actions and manual mission composer use the same command path;
- invalid coordinates fail visibly;
- save/load does not duplicate missions.

## PR #111 — Spatial navigation persistence, performance and E2E gate

### Scope

- persist selected map level and coordinate;
- lazy-load and release textures per view;
- pan/zoom fallback below readable scale;
- browser E2E for Universe → Galaxy → System → mission preparation → report backlink;
- visual regression at target desktop sizes;
- memory and interaction profiling.

### Gate

- M2 Navigable Universe achieved;
- no navigation state corruption after reload;
- map performance budgets pass on the low-end preset.

---

# Stage C — Complete confirmed UI and navigation model

The goal is to reproduce the proven information architecture and workflows from PR #96 using the original Stellar Empires skin.

## PR #112 — Persistent global header

### Scope

- resource widgets with current/capacity/tooltips;
- energy, hangar, scrap and ozone/stability warnings;
- Admiral progress and shortcuts;
- server/simulation time;
- current planet switcher with coordinates and thumbnails;
- unread/report counters;
- clear desktop hierarchy and keyboard access.

### Gate

- critical empire state is visible from every screen;
- warning thresholds are deterministic and tested;
- planet switching cannot change another planet’s queued actions.

## PR #113 — Global menu, zones and configurable quick links

### Scope

- primary navigation: Planet, Flights, Universe/Galaxy, Alliance, Personal, Ranking, Commander;
- resource/industry/military/galactic zone selector;
- quick links: Laboratory, Shipyard, Spaceport, Recycling, Trader, Factory, Auction, Bank, Technologies;
- configurable order/favourites without breaking canonical routes;
- route/history state and active markers.

### Gate

- every implemented screen is reachable without developer tools;
- browser back/forward and direct links behave predictably;
- no duplicated navigation source of truth.

## PR #114 — Planet overview and three building zones

### Scope

- complete planet overview;
- zone tabs and all 24 building cards;
- construction queue, requirements, costs, effects and demolition confirmation;
- workers, energy, ozone/stability, storage and hangar details;
- building information panels;
- faction identity without changing layout semantics.

### Gate

- a new player can develop the starting economy using only this UI;
- no hidden prerequisite blocks;
- all values match simulation read models.

## PR #115 — Laboratory and technology screens

### Scope

- Basic, High-tech, Expert and Additional categories;
- dependency tree and requirement explanations;
- global research queue across planets;
- current/next level, cost, time and effect delta;
- one-choice Additional Science rules where applicable;
- research history and completion notification.

### Gate

- all 22 technologies are reachable through UI;
- research cannot be started simultaneously on separate planets when the rules disallow it;
- bots and player use the same definitions.

## PR #116 — Shipyard, defence, Commander and repair screens

### Scope

- ordinary ships, planetary defence and Commander tabs;
- batch quantity, population/hangar, requirements and queue;
- Commander ownership and flagship priority;
- defence damage/repair/recovery presentation;
- ship upgrades and Spaceport linkage;
- full catalog filters and role explanations.

### Gate

- all producible units can be queued and understood;
- invalid quantities and empire-wide Commander duplicates are blocked visibly;
- repair queues survive save/load.

## PR #117 — Flights, missions, battles and simulator

### Scope

- active flight table;
- fleet selection and mission composer;
- arrival/return, distance, speed, fuel and cargo;
- spy visibility controls;
- battle list, reports and simulator;
- target priority and formation controls;
- report-to-map and map-to-mission linkage.

### Gate

- every supported mission is launchable from this screen and from the map;
- no mission has a hidden unit-role requirement;
- simulator does not mutate game state.

## PR #118 — Personal center, inbox, reports and options

### Scope

- message/report categories;
- notifications, administrative/system messages, flights, alliances, achievements and sent items;
- player profile and faction information;
- flight reorganization and Commander priority;
- friends, blacklist, notes and bookmarks adapted for offline bot play;
- protection/vacation equivalents only where meaningful for a single-player simulation.

### Gate

- all generated reports/notifications have a searchable location;
- destructive clearing actions require confirmation;
- no multiplayer-only account feature remains as a dead control.

## PR #119 — Rankings, records and alliance shell

### Scope

- player/bot ranking;
- alliance ranking;
- resource, battle, achievement and round statistics;
- alliance create/join/application placeholder shell backed by real state only after alliance PRs;
- hall-of-fame/final result placeholders driven by scenario history.

### Gate

- rankings are deterministic and derived from state;
- unavailable alliance actions explain their roadmap dependency.

## PR #120 — Economic service screens

### Scope

- Bank;
- Auction;
- Resource Trader and Contracts;
- market offers;
- recycling plant;
- factory/workers;
- ship upgrades;
- remove payment/Credit purchase routes and replace only where the project defines an earned resource.

### Gate

- economic services never create resources without a state-backed transaction;
- bots can use the same service APIs;
- historical monetization controls do not appear as fake buttons.

## PR #121 — UI parity, accessibility and browser E2E gate

### Scope

- screen-route coverage matrix against PR #96;
- keyboard traversal and focus management;
- accessible tooltips, dialogs, tabs and tables;
- 1366×768 / 1920×1080 visual regression;
- reduced motion;
- loading/error/empty/locked states;
- browser E2E for the complete early-game loop.

### Gate

- M3 Coherent full UI shell achieved;
- every confirmed core route has a working Stellar Empires counterpart;
- no core action exists only in a debug panel.

---

# Stage D — Ordinary-game mechanics reconciliation

These PRs audit current mechanics against the complete reference. Existing valid implementation should be retained; only proven gaps or contradictions are changed.

## PR #122 — Economy, workers, ozone/stability and satellite energy

### Scope

- reconcile resource income, storage, energy and hangar behavior;
- formalize workers and advanced-factory effects;
- decide and configure ozone/stability adaptation;
- implement position-based solar satellite energy;
- ensure sun brightness modifies only intended solar sources;
- add balance configuration instead of scattered literals.

### Gate

- economy values are explainable in UI;
- energy never behaves like a stored ordinary resource;
- position and brightness effects are deterministic.

## PR #123 — Building progression, queues and demolition

### Scope

- reconcile build queues and parallel zone rules;
- construction speed and minimum-time caps;
- building level costs/time configuration;
- manual demolition and refunds;
- planet blocking from capacity/environment failures;
- complete requirement and effect explanations.

### Gate

- no queue can create negative resources or impossible levels;
- demolition is deterministic and historical state is recorded.

## PR #124 — Research progression and special-science rules

### Scope

- reconcile research categories and level formulas;
- one global research operation;
- Additional Science selection/locking;
- dependency closure and faction modifiers;
- technology effects in economy, flight and combat;
- migration for any changed IDs/rules.

### Gate

- complete tree is reachable;
- effects are covered by focused tests;
- no UI-only science exists.

## PR #125 — Flight capacity, speed, fuel, cargo and limits

### Scope

- reconcile fleet slot limits;
- speed selection and drive effects;
- gas/fuel payment and recall behavior;
- cargo and plunder capacity;
- route distance and time;
- Space Trip/fleet-save behavior;
- daily/mission limits as configurable scenario rules.

### Gate

- displayed arrival/return exactly matches simulation;
- recall cannot refund fuel incorrectly;
- Commander and Admiral modifiers apply once.

## PR #126 — Complete mission matrix

### Scope

- transport;
- espionage;
- attack;
- deploy/station;
- colonize;
- recycle;
- pirate raid;
- asteroid/gas extraction;
- expedition/Space Trip;
- Renegade espionage and attack;
- Sun Support and Sun Attack preparation hooks;
- team operations hooks for later alliances.

### Gate

- each mission has validation, state transition, report and bot path;
- no mission dispatches through UI-only shortcuts.

## PR #127 — Espionage, scan and intelligence lifecycle

### Scope

- report depth by espionage level;
- detection/counter-detection;
- spy probe visibility and scanning;
- stale intelligence timestamps and confidence;
- map tooltip redaction;
- bot perception memory parity.

### Gate

- hidden information cannot leak through UI or bot planners;
- save/load preserves intelligence age and confidence.

## PR #128 — Combat rounds and report completeness

### Scope

- reconcile round order and group targeting;
- carried damage inside groups;
- weapon/armour interactions;
- victory/draw/defeat;
- losses, resource points, battle points and debris;
- source-by-source bonus breakdown;
- deterministic battle report schema.

### Gate

- replay produces byte-equivalent combat result;
- simulator and real combat share the same resolver;
- reports explain all applied modifiers.

## PR #129 — Ship abilities, formations and target priorities

### Scope

- reconcile ordinary ship skills with the versioned reference;
- ensure critical/crushing mutual exclusion where required;
- armour ignore, bonus life, armour boost, artillery and faction heavy-ship abilities;
- Commander priority and one-active ability;
- user-configurable formation/target priority with deterministic bot defaults.

### Gate

- every ability has caps, trigger tests and report output;
- no stacking ambiguity remains.

## PR #130 — Detonation and building damage

### Scope

- implement demolition points instead of the malformed `1001%` probability;
- threshold table and per-building rolls;
- defence-population reduction;
- Commander/Admiral modifiers;
- eligibility list and protected buildings;
- history and UI explanation.

### Gate

- `1001%` never appears as probability;
- all rolls are deterministic from the battle seed;
- no building drops below zero.

## PR #131 — Planet destruction and system safety

### Scope

- planet-killer chance and cap;
- defence and defending planet-killer reductions;
- Polias reduction;
- last-planet protection;
- colony removal, fleet return, queues, reports and ranking consequences;
- hooks for later destroyed-system lifecycle.

### Gate

- no orphan fleets, queues or references remain after destruction;
- save/load and replay are tested;
- player cannot be silently hard-locked.

## PR #132 — Debris, repair, recycling and ordinary-game gate

### Scope

- debris percentage and Scrap Master;
- recycler mission capacity;
- recycling plant storage/claim/expiry;
- defence recovery and repair;
- ship restoration abilities;
- ensure no duplicate debris rewards;
- full ordinary-game headless run.

### Gate

- M4 Ordinary mechanics complete achieved;
- a player and bots can progress, colonize, spy, fight, recover and continue indefinitely without endgame.

---

# Stage E — PvE and meta systems

## PR #133 — Full Renegade PvE loop

- deterministic one-per-system presence;
- lifecycle and respawn;
- attacker-relative tier/template without hidden cheating;
- espionage, attack, rewards and upgrade points;
- map objects and reports;
- bot planning and anti-farm rules.

## PR #134 — Arena and battle challenges

- Arena entry and matchmaking against generated/bot fleets;
- league/threshold configuration;
- rewards without live-service monetization;
- records, cooldowns and reports;
- deterministic offline opponents.

## PR #135 — Admiral stats, skills, equipment and blueprints

- complete Admiral stat allocation;
- attack/defence/utility skill trees;
- reset cost progression;
- five equipment slots and rarity bonuses;
- Elements resource loop;
- generator/crafting;
- nine-piece blueprints and Commander unlocks;
- bot allocation and equipment choices.

## PR #136 — Bank, market, auction, trader and Contracts

- state-backed Bank loans and repayment;
- NPC/bot market liquidity;
- ship market where retained;
- auction rounds and buyout;
- Resource Trader dynamic rates;
- Contracts earned through play;
- no paid Credits dependency.

## PR #137 — Achievements, rankings and round statistics

- persistent achievements;
- resource/battle/Admiral/PvE/alliance stats;
- local ranking history;
- final-round statistics model;
- notification and UI integration.

## PR #138 — Tutorial, contextual help, encyclopedia and PvE/meta gate

- guided first-session missions;
- contextual explanations for every main screen;
- encyclopedia generated from runtime definitions;
- glossary and effect formulas;
- onboarding for map navigation and first fleet;
- M5 Full PvE and meta systems achieved.

---

# Stage F — Autonomous bot parity

## PR #139 — Strategic bot goals and planning horizon

- long-term goals: economy, research, military, colonization, recovery and victory;
- faction-specific personality without hidden bonuses;
- budget allocation and risk tolerance;
- deterministic reason codes;
- stale-information decisions.

## PR #140 — Bot mission, PvE, market and Admiral parity

- all mission types;
- Renegades and Arena;
- market/bank/auction/trader;
- ship upgrades, skills, equipment and Commander priorities;
- logistics/fleet-save;
- no direct state mutation.

## PR #141 — Bot diplomacy, alliance and endgame planning

- alliance formation/join/leave;
- relations, support and war decisions;
- sun defence and attack;
- Gate protection/disruption;
- solo victory strategy when unaffiliated;
- same command layer as player.

## PR #142 — Long-session bot validation and parity gate

- hundreds of deterministic headless matches;
- save/reload equivalence;
- variable tick-size equivalence;
- reason-code diagnostics;
- deadlock and inactivity detection;
- performance/state-growth budgets;
- M6 Autonomous bot parity achieved.

---

# Stage G — Alliances, solar war and final victory

## PR #143 — Relations and alliance membership

- relations/reputation;
- create/join/apply/invite/leave;
- leader/member roles;
- membership migration for solo crystal state;
- player and bot UI/commands;
- deterministic alliance history.

## PR #144 — Alliance coordination and group operations

- alliance points and level/configuration;
- support fleets;
- team attacks and team piracy where retained;
- command planet and leader protection;
- contributions and shared notifications;
- bot coordination without shared hidden knowledge.

## PR #145 — Sun brightness, Sun Attack and Sun Support

- authoritative `SunState`;
- adjacency validation;
- local support regardless of alliance relationship where canonical;
- successful attack removes 25 brightness and awards exactly one crystal;
- immediate solar energy effects;
- reports, history and global notifications.

## PR #146 — Destroyed-system and recovery lifecycle

- brightness zero collapse;
- planet/fleet/system consequences per canonical design;
- protostar and deterministic recovery;
- restored energy and map states;
- recovery timers and notifications;
- migration and replay coverage.

## PR #147 — Solar Crystals, Obelisks and Supreme Galactic Gates

- alliance crystal ownership;
- faction Obelisk state;
- leader endgame planet;
- seven-day configurable Gate construction;
- public progress and milestones;
- defence and demolition;
- one stolen crystal and three returned on interruption;
- restart cooldown;
- source/runtime building art and construction-state overlays.

## PR #148 — Alliance victory, solo victory and final round

- alliance win at 100% Gate progress;
- solo win after four stolen Gate crystals;
- deterministic completed-match state;
- final result persisted before presentation;
- victory/defeat screen and round statistics;
- post-round read-only review/restart;
- M7 Complete endgame achieved.

---

# Stage H — Balance, production quality and release

## PR #149 — Save-schema consolidation and offline resimulation

- consolidate accumulated state contracts;
- robust migrations from supported older saves;
- offline time advancement with bot parity;
- snapshots and corruption recovery;
- replay/checksum fixtures for full matches.

## PR #150 — Economy and progression balance harness

- configurable scenario presets;
- time-to-building/research/unit milestones;
- resource bottleneck detection;
- faction economic identity;
- colony expansion pacing;
- automated reports across many seeds.

## PR #151 — Combat, PvE and endgame balance pass

- fleet counters and role viability;
- defence/shield balance;
- Commander and Admiral caps;
- Renegade/Arena rewards;
- detonation and planet-destruction risk;
- alliance snowball and Gate timing;
- solo-route feasibility.

## PR #152 — Audio, VFX, notifications and report polish

- original music and faction sound language;
- UI feedback and alerts;
- combat/map/production effects;
- notification severity and grouping;
- reduced-motion and mute controls;
- asset backlog closure for effects.

## PR #153 — Performance, memory and low-end mode

- startup transfer budget;
- texture memory budget;
- lazy loading/unloading;
- long-session state/save budget;
- worker scheduling;
- low-end visual preset;
- profiling on target desktop resolutions.

## PR #154 — Accessibility and localization readiness

- full keyboard path;
- screen-reader labels and live regions;
- contrast and non-colour status encoding;
- reduced motion;
- translatable string extraction;
- Russian and English baseline.

## PR #155 — Browser matrix, E2E and visual regression

- Chromium/Firefox/WebKit where supported;
- new game to first colony;
- new game to first battle;
- save/reload;
- Universe navigation;
- alliance and victory path;
- visual snapshots and migration fixtures.

## PR #156 — Release candidate and Pages QA

- clean production build;
- Pages deployment and base-path audit;
- credits, provenance and licenses;
- final documentation and player guide;
- remove debug-only UI;
- release checklist and known limitations;
- M8 Release candidate quality achieved.

## PR #157 — Release 1.0 stabilization and tag

- fix only release blockers;
- final deterministic headless batch;
- final browser E2E;
- tag release;
- publish final Pages build;
- freeze schema and catalog versions for 1.0.

---

## 8. Asset-generation governance

Every PR that uses procedural or CSS-generated presentation must do all of the following:

1. assign a stable semantic asset ID;
2. add an entry to the master asset backlog;
3. define target dimensions, alpha behavior, safe area and runtime usage;
4. include a generation prompt and negative prompt;
5. define acceptance criteria;
6. keep the placeholder behind the same manifest ID;
7. mark the entry `RUNTIME_READY` only after processing and visual QA;
8. never change save data when replacing art.

A missing visual must never be hidden by permanently reusing a semantically wrong asset.

---

## 9. Known missing Universe/UI visual families

The 90 files cover physical map objects, but the following semantic families still need either generated assets or CSS/SVG primitives registered in the master backlog:

- selection, hover and keyboard-focus rings;
- own/allied/hostile/neutral relation badges;
- protected, inactive, blocked, vacation and command-planet badges;
- colonizable empty-slot marker;
- transport, spy, attack, deploy, colonize, recycle, pirate and Renegade mission markers;
- Sun Attack and Sun Support markers;
- inbound/outbound fleet tokens;
- route line, arrowhead and arrival marker;
- fog/unknown-intelligence overlay;
- sun brightness/damage overlays at 75/50/25/0;
- recovery/protostar timer overlay;
- Solar Crystal marker;
- Obelisk charge states;
- Gate construction milestones and damaged state;
- global event/alert icons;
- map tooltip frame and coordinate controls.

These do not block procedural implementation, but each placeholder must be tracked.

---

## 10. Risk register

### P0 — must be solved before relevant feature ships

- oversized PR #97 assets cannot be loaded directly;
- asset filenames and accepted contract differ;
- core catalogs still contain runtime fallback presentation;
- new PR #96 references were not previously in the startup reading path;
- navigation/endgame docs were previously numbered as implementation PRs but #96/#97 became documentation/assets;
- future PR numbering must follow this roadmap from #99.

### P1 — product risks

- too many systems can exist without a coherent user route;
- bots may technically act but fail long-term strategic goals;
- balance may make late-game systems unreachable;
- reports/history may grow without bounds;
- map and asset loading may exceed memory budgets;
- Nemexia-like structure may be implemented with stale multiplayer-only controls.

### P2 — polish risks

- placeholder effects can become permanent without the asset backlog;
- faction visuals can lose readability if decorative art dominates information;
- mobile/responsive adaptation can break fixed map geometry;
- accessibility can regress as screens become denser.

---

## 11. Immediate next action after PR #98

The next implementation PR is **#99 — Asset processing foundation and repository audit**.

It must not implement Universe navigation yet.

The correct sequence is:

```text
#98 roadmap/docs
→ #99 asset pipeline and audit
→ #100–#104 core catalog art integration
→ #105–#111 Universe navigation
```

Reason: the project already owns the required core art, but the runtime still shows fallbacks. Connecting and optimizing the existing art creates the largest immediate visible improvement and establishes the exact pipeline required by the Universe assets.

---

## 12. Final acceptance statement

Stellar Empires 1.0 is not complete because a list of mechanics exists in code. It is complete when the mechanics, UI routes, bots, assets, saves, reports, balance and victory loop operate as one coherent offline game.

This roadmap is intentionally large. Reducing the number of PRs by combining unrelated systems is not progress; it increases regression and review risk. The order may shift only when a concrete blocker is documented, but milestone dependencies and acceptance gates remain mandatory.
