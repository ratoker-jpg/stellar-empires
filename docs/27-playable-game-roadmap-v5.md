# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-07-28  
**Last merged runtime PR:** #123 · `aa1dc67ed874c75aa69af30ce9ced58169793c30`  
**Active documentation:** #124 `LOCAL-CAMPAIGN-WORLD-SPEED-CONTRACT`  
**Next authorized work after #124:** Audit PR #125 only  
**Release target:** complete local PvE browser campaign with autonomous bot empires

## 1. Product target

```text
choose faction and campaign settings
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

Nemexia references define systemic depth only. Stellar Empires keeps original terminology, assets, UI and implementation. Endgame rules remain authoritative in `docs/25-solar-war-obelisks-gates-and-progression.md`.

The campaign-runtime addendum is authoritative in `docs/25a-local-campaign-world-speed-and-offline-progression.md`:

- local browser campaign, no required continuously running server;
- immutable world-speed preset chosen when the campaign is created;
- no normal in-session speed controls;
- deterministic offline catch-up at the same world speed;
- bots, attacks, diplomacy, alliances and endgame continue through ordinary rules while closed;
- target complete campaign length of roughly one active day after later progression compression and balance work.

## 2. Source-of-truth hierarchy

1. current merged code/tests on `main`;
2. accepted current audit and contracts;
3. this roadmap;
4. canonical endgame and campaign-runtime contracts;
5. status/roadmap indexes;
6. research references;
7. older audits/handoffs as history only.

Exact current sequencing:

```text
docs/roadmap-pr-index.json
docs/audits/current-batch-audit.md
docs/audits/current-execution-state.md
```

## 3. Delivered baseline through PR #123

### Simulation and persistence

- deterministic command/event/replay/checksum model;
- schema v14 and migration chain;
- IndexedDB slots, autosave, import/export and recovery;
- bounded histories and serialized deterministic bot timing;
- player and bots share validation/command paths.

### World and mechanics

- 20-slot Universe and topology presets;
- multi-colony economy/research/production foundations;
- complete building, technology, ship, defence and Commander catalogs;
- all six ordinary missions, combat, plunder, debris and reports;
- colonization, expeditions, space objects, logistics, market and PvE foundations;
- formations, priorities, ship upgrades and Commander effects;
- deterministic espionage/counter-intelligence and incoming visibility;
- deterministic building demolition and capped whole-planet destruction;
- final-colony protection, atomic destroyed-colony recovery, debris recycling and fresh recolonization.

### Runtime art and application

- 217 mechanical IDs through 173 catalog runtime images;
- Universe → Galaxy → Solar-system routing;
- intelligence-aware action availability and target handoff;
- one application controller and nine canonical route families;
- persistent HUD/context, keyboard, reduced motion and release-view Browser E2E.

### Known UX gap

The routed shell is technically coherent but not yet proven usable as a complete player workflow. Navigation hierarchy, colony/context continuity, cross-domain actions, backtracking and common task length require a dedicated audit before more systems are layered onto the interface.

## 4. Release 1.0 definition

### Player loop

A player can:

- choose any faction and understand the shell/HUD;
- choose immutable campaign settings and understand their effect;
- build a viable multi-colony economy;
- unlock the complete catalog;
- navigate and launch every supported mission;
- inspect intelligence/reports and return to the relevant context;
- fight fleets/defence and use Commander/planet-destroyer mechanics;
- safely lose and recolonize secondary colonies;
- interact with PvE/economic systems;
- join/create alliances or remain solo;
- reach alliance/solo victory or lose when another side wins;
- save, close and continue through deterministic offline catch-up.

### Bot loop

Bots must use the same commands, resources, timing and intelligence limits. At least one headless match must reach victory with all factions, economy/research, colonization/loss/recovery, espionage, ordinary/PvE combat, alliances, solar war and final victory. The same result must remain valid through save/load and offline catch-up.

### Product quality

- no incorrect core asset fallback;
- no dead primary route or dead-end task flow;
- deterministic/serializable destructive and offline actions with history;
- bounded save/history/catch-up behavior;
- 1366×768 and 1920×1080 desktop usability;
- keyboard/reduced-motion support;
- reproducible GitHub Pages build;
- complete Browser E2E, victory/defeat path and long-session gate;
- balanced standard campaign capable of completing in roughly one active day.

## 5. Milestone map

| Milestone | Status | Delivery |
|---|---|---|
| M1 — Production assets | completed | Audit #101; #102–#105 |
| M2 — Navigable Universe | completed | Audit #106; #107–#110 |
| M3 — Coherent UI shell | technically completed | Audit #111; #112–#115 |
| M3b — Navigation/usability repair | next audit | Audit #125 after docs #124 |
| M4a — Ordinary missions/intelligence | completed | Audit #116; #117–#120 |
| M4b — Planet demolition/destruction/recovery | completed | Audit #121; #122–#123 |
| M4c — Local campaign time/pacing transition | not audited | world speed, offline catch-up, compressed progression |
| M5 — Multi-colony economy/logistics coherence | not audited | economy/logistics sustainability and bot planning |
| M6 — Full PvE/meta systems | not audited | PvE depth, Arena, Admiral meta, services |
| M7 — Autonomous bot parity | not audited | honest full-domain bot loop and catch-up parity |
| M8 — Complete endgame | not audited | alliances, solar war, Obelisks, Gates, victory/defeat |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 6. Immediate ordered route

### PR #124 — canonical product contract

Documentation only:

- local browser campaign;
- immutable world-speed setting;
- deterministic offline continuation;
- bots and endgame remain active while closed;
- compressed one-day campaign direction;
- no runtime or balance implementation.

### Audit PR #125 — navigation/usability first

The audit must:

- reconcile the live Pages build, route registry, shell controller, workspace modules and Browser E2E;
- map common player tasks and count route changes, clicks, context loss and dead ends;
- verify active-colony continuity, report/map/fleet handoffs and browser back/reload behavior;
- rebaseline this roadmap against the local-campaign contract;
- authorize only a bounded navigation implementation batch;
- name the later separate audit for campaign time/pacing transition.

### After navigation closure

Create a separate audit for:

- persisted campaign settings;
- immutable world-speed semantics;
- trusted elapsed-time input and deterministic offline catch-up;
- bot/diplomacy/endgame catch-up parity;
- return summary;
- progression compression, exact level caps and campaign-duration balance.

Do not combine these simulation/persistence/balance changes with the navigation implementation batch.

## 7. Remaining product families

### Local campaign time and pacing

World-speed settings, offline catch-up, campaign-result handling and progression compression. Exact values require current-code audit, save-schema decision, deterministic chunking tests and headless duration runs.

### Multi-colony economy/logistics

Specialization, logistics lifecycle/capacity/failures, market coherence, honest bot economic planning and long-run sustainability under compressed campaign timing.

### PvE and meta

Deeper PvE encounters/rewards, repeatable competition, Admiral/Commander meta, non-monetized economic services and world-event depth.

### Bot parity

Full headless progression, no hidden resources/bot-only mutation, deterministic bounded catch-up, save/load parity and observable failure reasons.

### Endgame

Alliances/diplomacy, solar attack/support/destruction/rebuilding, Solar Crystals, Obelisks, Supreme Gates, victory and deterministic defeat behavior, including offline resolution.

### Release candidate

Onboarding, balance runs, campaign-duration targets, long-session/catch-up performance, recovery drills, accessibility/visual consistency, complete E2E and reproducible release.

## 8. Delivery rules

1. Start every implementation from fresh merged `main`.
2. Use an accepted audit and stable work-item ID.
3. Do not combine mixed-complexity roadmap families.
4. Keep simulation independent from DOM/Phaser.
5. Use the same commands/validators for player and bots.
6. Add migration fixtures only for incompatible state changes.
7. Resolve visuals through stable IDs/manifests.
8. Add focused unit/integration/headless/browser coverage.
9. Run assets, lint, TypeScript, full tests, build, Browser E2E and Graphify.
10. Update status/execution/continuation documents.
11. Navigation implementation must close before the campaign time/pacing audit begins.

## 9. Immediate action

Complete and merge documentation PR #124. Then create Audit PR #125 from fresh merged `main`. No runtime implementation begins before Audit #125 is accepted.
