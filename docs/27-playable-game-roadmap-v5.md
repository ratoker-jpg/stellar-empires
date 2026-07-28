# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-07-28  
**Last merged PR:** #126 · `2a9ebcbbe42c67f76f0c78dee9ed431555c9afd1`  
**Runtime baseline:** #126 · `2a9ebcbbe42c67f76f0c78dee9ed431555c9afd1`  
**Accepted batch:** `NAVIGATION-USABILITY-01`  
**Next implementation:** #127 `NAV-CONTEXT-ROUTE-MODEL`  
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

The local campaign contract requires:

- no continuously running game server for Release 1.0;
- immutable world-speed preset chosen when the campaign starts;
- no normal in-session speed controls;
- deterministic offline catch-up at the same selected speed;
- bots, attacks, diplomacy, alliances and endgame continue through ordinary rules while closed;
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

## 3. Delivered baseline through PR #126

### Simulation and persistence

- deterministic command/event/replay/checksum model;
- schema v14 and migration chain;
- IndexedDB autosave, slots, import/export and recovery;
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
- routed development, fleet, operations, command, reports and system workspaces;
- persistent HUD/context, keyboard, reduced motion and release-view Browser E2E;
- player-centered grouped primary navigation.

### Canonical product contract

PR #124 records the local browser campaign, immutable world speed, deterministic offline continuation, bot activity while closed and compressed one-day campaign direction. It changes no runtime or balance.

### Accepted navigation audit

Audit #125 accepted four sequential implementation PRs for player-centered information architecture, typed route/context memory, reversible cross-domain flows and a measured usability gate.

### Delivered primary information architecture

PR #126 delivers:

```text
Игра: Планета · Вселенная · Флоты · Операции
Развитие: Наука · Командование
Данные: Отчёты · Рейтинг
Система: Настройки
```

- Operations is core gameplay rather than utility;
- Space is labeled for its complete Universe scope;
- Reports, Ranking and System have reduced competition with turn-to-turn actions;
- active navigation group is accessible and exposed through DOM metadata;
- mouse and keyboard order follow the same registry;
- route-family IDs, direct URLs and simulation checksums remain unchanged.

Validation: CI `30368968637`, Browser E2E `30368968648`, Graphify `30368970159` — passed.

## 4. Remaining navigation gap

The primary hierarchy is repaired, but complete player context is not yet preserved.

Remaining accepted work:

- family buttons still need remembered valid subroutes rather than generic resets;
- only Planet explicitly carries colony context;
- the application still lacks shared breadcrumbs and return destinations;
- target handoff and reversible cross-domain tasks require typed context;
- current E2E still needs complete-task budgets and final usability closure.

Navigation repair continues before campaign settings/time work so later systems are added to an understandable application.

## 5. Release 1.0 definition

### Player loop

A player can:

- choose any faction and understand the shell/HUD;
- choose immutable campaign settings and understand their effect;
- build a viable multi-colony economy;
- unlock the complete catalog;
- navigate and launch every supported mission without dead ends;
- inspect intelligence/reports and return to the relevant context;
- fight fleets/defence and use Commander/planet-destroyer mechanics;
- safely lose and recolonize secondary colonies;
- interact with PvE/economic systems;
- join/create alliances or remain solo;
- reach alliance/solo victory or lose when another side wins;
- save, close and continue through deterministic offline catch-up.

### Bot loop

Bots use the same commands, resources, timing and intelligence limits. At least one headless match must reach victory with all factions, economy/research, colonization/loss/recovery, espionage, ordinary/PvE combat, alliances, solar war and final victory. The result remains valid through save/load and offline catch-up.

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
| M3b — Navigation/usability repair | 1/4 implementation PRs complete | Audit #125; #126 merged; #127–#129 accepted |
| M4a — Ordinary missions/intelligence | completed | Audit #116; #117–#120 |
| M4b — Planet demolition/destruction/recovery | completed | Audit #121; #122–#123 |
| M4c — Local campaign time/pacing transition | blocked until #129 | Audit #130 next |
| M5 — Multi-colony economy/logistics coherence | not audited | economy/logistics sustainability and bot planning |
| M6 — Full PvE/meta systems | not audited | PvE depth, Arena, Admiral meta, services |
| M7 — Autonomous bot parity | not audited | honest full-domain bot loop and catch-up parity |
| M8 — Complete endgame | not audited | alliances, solar war, Obelisks, Gates, victory/defeat |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 7. Active accepted batch — NAVIGATION-USABILITY-01

```text
#126 NAV-IA-PRIMARY-SHELL — merged
→ #127 NAV-CONTEXT-ROUTE-MODEL
→ #128 NAV-CROSS-DOMAIN-FLOWS
→ #129 NAV-USABILITY-GATE
```

### #126 — primary information architecture — delivered

- grouped core gameplay, development, information/history and utility destinations;
- promoted Operations to core gameplay;
- represented the complete Universe scope in the Space label;
- reduced low-frequency Ranking/System competition with core actions;
- preserved route IDs, accessibility, keyboard behavior and checksum neutrality.

### #127 — route and context model — next

- remember last valid subroute per family;
- add common breadcrumbs and return destination;
- preserve active colony across colony-sensitive workspaces;
- normalize stale context explicitly;
- keep all navigation state outside `GameState`, saves and checksums.

### #128 — direct reversible flows

- Planet → Research/Shipyard/Defence/Upgrades → origin;
- Space/intelligence target → Fleet compose → origin;
- Report → exact map coordinate → same report/filter;
- Operations overview/activity → exact operation mode;
- colony switch retains equivalent valid task.

### #129 — usability gate

- action/transition budgets for common player tasks;
- no dead end or unexplained context reset;
- Back/Forward, reload, keyboard, reduced motion and release viewports;
- obsolete competing launcher cleanup;
- audit archive and batch closure.

### Explicit exclusions

No world-speed state, offline catch-up, schema migration, progression balance, gameplay commands, bot strategy, alliances, endgame implementation, framework rewrite or complete mobile redesign.

## 8. Next ordered audit

After #129 closes:

```text
#130 Audit LOCAL-CAMPAIGN-TIME-PACING-01
```

It must inspect and plan:

- campaign setup and persisted immutable world speed;
- trusted elapsed-time input;
- deterministic bounded offline catch-up;
- bot/diplomacy/endgame catch-up parity;
- return summary and offline victory/defeat presentation;
- progression compression and exact level caps;
- headless campaign-duration balance.

It must not begin before navigation closure.

## 9. Remaining product families

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

## 10. Delivery rules

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
11. Complete #127 → #129 sequentially before Audit #130.

## 11. Immediate action

Create PR #127 from fresh current `main` and implement only `NAV-CONTEXT-ROUTE-MODEL`.
