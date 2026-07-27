# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-07-27  
**Verified baseline:** merged PR #110, SHA `8e9e848b0725c52263ff7e310bc9d899a81554c4`  
**Active Audit PR:** #111 — `COHERENT-UI-SHELL-01`  
**Release target:** complete offline PvE browser strategy with autonomous bot empires

---

## 1. Purpose

This roadmap defines the path from the current technically strong prototype to a coherent, fully playable game.

The target is not merely to add more mechanics. The target is a complete product loop:

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
→ build or destroy final Gates
→ achieve alliance or solo victory
→ show a deterministic final-round result
```

Confirmed Nemexia references define expected systemic depth, information architecture and historical user flows. They do not authorize copying third-party HTML, CSS, prose, branding or visual assets. Stellar Empires keeps original art, terminology, implementation and configurable balance.

Project-specific rules for suns, Solar Crystals, Obelisks, Supreme Galactic Gates and victory remain authoritative in:

```text
docs/25-solar-war-obelisks-gates-and-progression.md
```

---

## 2. Source-of-truth hierarchy

When documents conflict, use this order:

1. current merged code and tests on `main`;
2. accepted current Audit PR and its contracts;
3. this roadmap and its release gates;
4. `docs/25-solar-war-obelisks-gates-and-progression.md` for endgame;
5. `docs/26-universe-galaxy-solar-system-navigation-contract.md` for completed spatial navigation evidence;
6. `docs/research/nemexia-final-complete-game-concept-2026-07-26.md` for confirmed mechanics;
7. `docs/research/nemexia-navigation-and-ui-reference-2026-07-26.md` for confirmed information architecture;
8. `docs/20-full-project-audit.md` for architectural and stabilization risks;
9. older roadmaps and handoffs only as historical background.

GitHub history overrides stale future PR numbers. Exact delivery sequencing is recorded in:

```text
docs/roadmap-pr-index.json
docs/audits/current-batch-audit.md
docs/audits/current-execution-state.md
```

---

## 3. Delivered baseline after PR #110

### 3.1. Simulation and persistence

Delivered:

- Phaser + TypeScript + Vite client;
- deterministic simulation, commands, events, replay and checksum;
- schema v14 save model;
- deterministic v13 → v14 migration;
- IndexedDB autosave, save slots, import/export, snapshots and recovery;
- separate presentation layer from simulation logic;
- player and bots using the same command validation paths;
- bounded bot timing/history improvements;
- headless catalog and production-path validation.

### 3.2. World, economy and operations

Delivered at prototype or functional depth:

- seeded compact Universe with 20 slots;
- test, campaign and fidelity topology presets;
- multi-colony state and three planet zones;
- resources, energy, storage, population/hangar and stability systems;
- construction, research, unit, defence, repair and ship-upgrade queues;
- logistics and market foundations;
- fleets, missions, combat, plunder, debris and reports;
- colonization, recycling, expeditions and space objects;
- pirates/Renegade-style PvE foundations and world events;
- planetary defence damage, recovery and repair;
- formations, target priorities, ship upgrades and class abilities;
- Admiral progression and Commander Ship framework.

### 3.3. Complete mechanical catalogs

| Category | Aegis | Synod | Veyra | Shared |
|---|---:|---:|---:|---:|
| Buildings | 24 | 24 | 24 | — |
| Technologies | 22 | 22 | 22 | functional matrix |
| Ordinary ships | 13 | 13 | 13 | — |
| Planetary defences | 9 | 9 | 9 | — |
| Commander Ships | — | — | — | 13 |

All 217 complete mechanical IDs resolve through 173 generated catalog runtime images.

### 3.4. Navigable Universe

PR #106–#110 completed `UNIVERSE-NAVIGATION-01`:

- 90 source PNGs preserved behind the source/runtime boundary;
- 102 typed lazy-loaded WebP runtime textures;
- schema v14 canonical coordinates;
- 20 Universe slots and exactly 24 materialized positions per system;
- URL/history-backed Universe → Galaxy → Solar-system navigation;
- exact audited geometry;
- keyboard and reduced-motion parity;
- intelligence-aware object details and explicit action availability;
- target handoff into the existing mission composer;
- report-to-map backlinks;
- semantic SVG route, fleet and mission overlays;
- Browser E2E for reload, history, target prefill, duplicate mission prevention, viewports and runtime budgets.

Navigation does not alter the `GameState` checksum. Map selection never dispatches a mission without fleet/composition/speed selection and confirmation.

### 3.5. Current presentation limitation

The project contains many functional screens, but they are not yet one coherent application shell:

- `src/main.ts` manually mounts many independent UI modules;
- unrelated screens execute accepted commands through Planet presentation state;
- many primary domains exist only as top-level modal dialogs;
- feature modules insert navigation buttons dynamically;
- several implemented screens still correspond to disabled static HUD items;
- only Space Map has canonical application routing/history.

This is the next accepted product gap.

---

## 4. Release 1.0 definition

Release 1.0 is complete only when every gate below is true.

### 4.1. Player loop

A new player can, without developer tools:

- choose any of three factions;
- understand the global header and navigation;
- develop a viable economy;
- unlock the complete catalog without dependency dead ends;
- manage several planets;
- navigate Universe, galaxies and systems;
- launch every supported mission from valid targets;
- inspect intelligence and reports;
- fight fleets and planetary defence;
- use Admiral and Commander Ships;
- interact with PvE objects and economic services;
- join/create an alliance or remain solo;
- complete an alliance or solo victory route;
- save, close, reopen and continue deterministically.

### 4.2. Bot loop

Bots must use the same systems without hidden resources, hidden information or bot-only commands.

At least one full headless match must complete from new game to victory with:

- all three factions represented;
- economy and research progression;
- colonization;
- espionage;
- normal and PvE combat;
- alliance choices;
- sun war;
- final victory.

### 4.3. Product quality

- no core catalog card uses an incorrect fallback image;
- no primary navigation route is a dead end;
- all destructive actions require confirmation and history;
- all state changes are deterministic and serializable;
- save size and event/history growth remain inside explicit budgets;
- desktop paths are fully usable at 1366×768 and 1920×1080;
- keyboard navigation and reduced-motion modes work;
- GitHub Pages build is reproducible;
- Browser E2E covers the main loop and one victory path;
- a long-session/headless test validates save/load reproducibility and bounded growth.

---

## 5. Milestone map

Exact future PR numbers are assigned only by accepted Audit PRs.

| Milestone | Status | Delivery |
|---|---|---|
| M1 — Production assets connected | completed | Audit #101; implementation #102–#105 |
| M2 — Navigable Universe | completed | Audit #106; implementation #107–#110 |
| M3 — Coherent full UI shell | audit active | Audit #111; planned implementation #112–#115 |
| M4 — Ordinary mechanics complete | not audited | economy, missions, espionage, combat and destruction coherence |
| M5 — Full PvE and meta systems | not audited | Renegades, Arena, Admiral meta and economic services |
| M6 — Autonomous bot parity | not audited | bots use all ordinary and meta systems honestly |
| M7 — Complete endgame | not audited | alliances, solar war, Obelisks, Gates and victory |
| M8 — Release candidate quality | not audited | balance, performance, onboarding, QA and Pages release |

---

## 6. Active audited milestone — M3 coherent full UI shell

Audit PR #111 defines medium batch `COHERENT-UI-SHELL-01`:

```text
#112 UI-SHELL-RUNTIME-ROUTER
→ #113 UI-SHELL-DEVELOPMENT-WORKSPACES
→ #114 UI-SHELL-FLEET-OPERATIONS-WORKSPACES
→ #115 UI-SHELL-COMMAND-SYSTEM-GATE
```

### M3 outcome

- one application/runtime controller owns current state and accepted-command notifications;
- one canonical URL/history shell route owns primary workspaces;
- one typed registry owns navigation order and availability;
- Planet, Research, Production, Fleets, Space, Operations, Command, Ranking, Reports and System have obvious routed surfaces;
- one primary workspace is active at a time;
- dialogs are retained only for transient or confirmation flows;
- global HUD shows active colony, time, capacities, rates, energy/population pressure, warnings, queues and save state;
- route-aware context never leaks hidden intelligence;
- back/forward/reload, keyboard, reduced motion and both release viewports pass Browser E2E.

### M3 exclusions

- no new gameplay commands;
- no schema change;
- no alliance route;
- no solar-war or endgame mechanics;
- no framework migration;
- no complete mobile-phone redesign;
- no copied historical UI.

Detailed acceptance criteria are authoritative in:

```text
docs/audits/current-batch-audit.md
docs/audits/contracts/coherent-ui-shell-01-prs.md
docs/audits/contracts/coherent-ui-shell-01-route-layout.md
```

---

## 7. Remaining milestone intent

### M4 — Ordinary mechanics complete

A later audit must reconcile and close ordinary-system gaps, including:

- complete mission coverage and explicit disabled reasons;
- espionage depth and counter-intelligence;
- fleet/planet destruction and recovery rules;
- economy and logistics coherence across several colonies;
- report/history completeness;
- deterministic headless progression through the ordinary loop.

This milestone must not be silently folded into M3.

### M5 — Full PvE and meta systems

A later audit covers the coherent family of:

- Renegade/PvE encounters and rewards;
- Arena or equivalent repeatable competition;
- Admiral and Commander meta depth;
- auctions/bank/economic-service equivalents that fit a non-monetized offline game;
- world-event cadence and strategic-object depth.

Historical Premium/Credits/Platinum mechanics are not automatically transferred.

### M6 — Autonomous bot parity

Bots must use the same commands, coordinates, intelligence limits and economic constraints as the player across every delivered ordinary/meta domain.

The milestone requires:

- full headless progression tests;
- no hidden resources or bot-only state mutation;
- deterministic decisions and bounded catch-up;
- save/load parity;
- observable reason codes for failed plans.

### M7 — Complete endgame

Separate audits must define and implement:

- alliances and diplomacy;
- project-specific solar attack/support/destruction/rebuilding;
- Solar Crystals and Obelisks;
- Supreme Galactic Gates;
- alliance and solo victory;
- deterministic final-round result and defeat behavior.

`docs/25-solar-war-obelisks-gates-and-progression.md` remains authoritative.

### M8 — Release candidate quality

Final release audits cover:

- onboarding and first-session guidance;
- economy/combat/endgame balance runs;
- long-session performance and state growth;
- save corruption/recovery drills;
- accessibility and visual consistency;
- complete Browser E2E and one victory path;
- reproducible GitHub Pages release;
- release notes and known limitations.

---

## 8. Delivery rules for every implementation PR

1. Start from fresh `main` after the previous dependency PR merges.
2. Begin only from an accepted Audit PR and stable work-item ID.
3. Do not combine unrelated roadmap rows.
4. Keep simulation independent from DOM/Phaser.
5. Use the same commands and validators for player and bots.
6. Add migration fixtures for incompatible state changes.
7. Resolve visuals through stable IDs and manifests.
8. Never directly bind UI components to source-library paths.
9. Add focused unit/integration tests and update the headless/browser harness.
10. Run asset checks, lint, typecheck, full tests, production build, Browser E2E and Graphify.
11. Update project status, execution state and continuation instructions.
12. Register procedural art or CSS placeholders in:

```text
docs/asset-prompts/master-runtime-asset-backlog.md
```

A placeholder is explicit debt with a stable ID, target dimensions and generation prompt, not undocumented temporary art.

---

## 9. Audit-first sequencing

The required loop is:

```text
fresh main
→ dedicated Audit PR
→ accepted complexity-sized implementation sequence
→ combined final gate and audit archive
→ next Audit PR
```

The audit determines whether a package is heavy, medium or light. Future milestone descriptions in this roadmap do not authorize implementation by themselves.
