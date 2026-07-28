# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-07-28  
**Last merged PR:** Audit #121 · `2000a68216c7681fcbea0d69d1ed7e58e0c0c7f9`  
**Runtime baseline:** PR #120 · `c59a2dd7afdc31fc250d2ec21364f655d6a4e665`  
**Active implementation:** next PR #122 — `PLANET-DEMOLITION-CONTRACT`  
**Release target:** complete offline PvE browser strategy with autonomous bot empires

## 1. Product target

```text
choose faction
→ develop economy and infrastructure
→ research and build fleets
→ explore Universe / Galaxy / Solar systems
→ spy, transport, colonize, recycle, raid and fight
→ damage or destroy rival secondary colonies
→ compete with autonomous bot empires
→ participate in alliances and solar war
→ build or destroy final Gates
→ reach deterministic alliance or solo victory
```

Nemexia references define systemic depth only. Stellar Empires keeps original terminology, assets, UI and implementation. Endgame rules remain authoritative in `docs/25-solar-war-obelisks-gates-and-progression.md`.

## 2. Source-of-truth hierarchy

1. current merged code/tests on `main`;
2. accepted current audit and contracts;
3. this roadmap;
4. endgame and navigation contracts;
5. status/roadmap indexes;
6. research references;
7. older audits/handoffs as history only.

Exact current sequencing:

```text
docs/roadmap-pr-index.json
docs/audits/current-batch-audit.md
docs/audits/current-execution-state.md
```

## 3. Delivered baseline through PR #121

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
- deterministic espionage/counter-intelligence and incoming visibility.

### Runtime art and application

- 217 mechanical IDs through 173 catalog runtime images;
- Universe → Galaxy → Solar-system routing;
- intelligence-aware action availability and target handoff;
- one application controller and nine canonical route families;
- persistent HUD/context, keyboard, reduced motion and release-view Browser E2E.

### Ordinary mission/intelligence gate

PRs #116–#120 delivered:

- one reducer/UI/bot ordinary mission contract;
- flight slots and level-three attack intelligence;
- redacted targets/reports/incoming flights;
- deterministic scout/counter-intelligence;
- bot perception and stable blocker diagnostics;
- scout → save/load → attack integration gate.

### Accepted destruction audit

PR #121 accepted heavy batch `PLANET-DEMOLITION-DESTRUCTION-01`, including the review-amended requirement that pending expedition and space-object missions preserve historical launch origin while receiving a valid live return colony after origin destruction.

## 4. Release 1.0 definition

### Player loop

A player can:

- choose any faction and understand the shell/HUD;
- build a viable multi-colony economy;
- unlock the complete catalog;
- navigate and launch every supported mission;
- inspect intelligence/reports;
- fight fleets/defence and use Commander/planet-destroyer mechanics;
- safely lose and recolonize secondary colonies;
- interact with PvE/economic systems;
- join/create alliances or remain solo;
- reach alliance/solo victory;
- save, close and continue deterministically.

### Bot loop

Bots must use the same commands, resources and intelligence limits. At least one headless match must reach victory with all factions, economy/research, colonization/loss/recovery, espionage, ordinary/PvE combat, alliances, solar war and final victory.

### Product quality

- no incorrect core asset fallback;
- no dead primary route;
- deterministic/serializable destructive actions with history;
- bounded save/history growth;
- 1366×768 and 1920×1080 desktop usability;
- keyboard/reduced-motion support;
- reproducible GitHub Pages build;
- complete Browser E2E, victory path and long-session gate.

## 5. Milestone map

| Milestone | Status | Delivery |
|---|---|---|
| M1 — Production assets | completed | Audit #101; #102–#105 |
| M2 — Navigable Universe | completed | Audit #106; #107–#110 |
| M3 — Coherent UI shell | completed | Audit #111; #112–#115 |
| M4a — Ordinary missions/intelligence | completed | Audit #116; #117–#120 |
| M4b — Planet demolition/destruction/recovery | audit accepted | Audit #121; next #122, then #123 |
| M4c — Multi-colony economy/logistics coherence | not audited | future audit |
| M5 — Full PvE/meta systems | not audited | PvE depth, Arena, Admiral meta, services |
| M6 — Autonomous bot parity | not audited | honest full-domain bot loop |
| M7 — Complete endgame | not audited | alliances, solar war, Obelisks, Gates, victory |
| M8 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 6. Active accepted batch — M4b

```text
#122 PLANET-DEMOLITION-CONTRACT
→ #123 PLANET-DESTRUCTION-RECOVERY-GATE
```

### #122 outcome

- faction-specific planet-destroyer profiles;
- weapon-level scaling;
- canonical demolition points/thresholds;
- deterministic building selection/rolls;
- defence reduction;
- Annihilator roll bonus, not generic battle damage;
- one-level damage, zone and affected-upgrade reconciliation;
- battle report/presentation;
- no planet removal yet.

### #123 outcome

- whole-planet chance/reductions/cap/final-colony guard;
- atomic cleanup/rehome of fleets, queues, events, routes and world events;
- pending expedition/space-object live return destination while historical origin remains immutable;
- debris recycling and ordinary recolonization;
- reports/backlinks, active-colony fallback, bots, save/load and closure gate.

### Exclusions

- no new mission/command or schema migration;
- no final-colony destruction;
- no extra destruction loot;
- no economy/logistics redesign;
- no solar/system destruction, alliances or endgame;
- no copied historical UI/assets.

## 7. Remaining milestones

### M4c

Multi-colony specialization, logistics lifecycle/capacity/failures, market coherence, honest bot economic planning and long-run sustainability.

### M5

Deeper PvE encounters/rewards, repeatable competition, Admiral/Commander meta, non-monetized economic services and world-event depth.

### M6

Full headless progression, no hidden resources/bot-only mutation, deterministic bounded catch-up, save/load parity and observable failure reasons.

### M7

Alliances/diplomacy, solar attack/support/destruction/rebuilding, Solar Crystals, Obelisks, Supreme Gates, victory and deterministic result/defeat behavior.

### M8

Onboarding, balance runs, long-session performance, recovery drills, accessibility/visual consistency, complete E2E and reproducible release.

## 8. Delivery rules

1. Start every implementation from fresh merged `main`.
2. Use an accepted audit and stable work-item ID.
3. Do not combine roadmap families.
4. Keep simulation independent from DOM/Phaser.
5. Use the same commands/validators for player and bots.
6. Add migration fixtures only for incompatible state changes.
7. Resolve visuals through stable IDs/manifests.
8. Add focused unit/integration/headless/browser coverage.
9. Run assets, lint, TypeScript, full tests, build, Browser E2E and Graphify.
10. Update status/execution/continuation documents.
11. Do not start #123 before #122 merges.

## 9. Immediate route

Create PR #122 from fresh current `main` and implement only `PLANET-DEMOLITION-CONTRACT`.
