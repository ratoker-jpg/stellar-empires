# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-07-28  
**Verified runtime baseline:** merged PR #120 · `c59a2dd7afdc31fc250d2ec21364f655d6a4e665`  
**Verified audit baseline:** post-#120 `main` · `818aba011199dd5a96518f859ed35de671be892f`  
**Active Audit PR:** #121 — `PLANET-DEMOLITION-DESTRUCTION-01`  
**Release target:** complete offline PvE browser strategy with autonomous bot empires

---

## 1. Purpose

This roadmap defines the path from the current deterministic prototype to a coherent, fully playable game.

The target loop is:

```text
choose faction
→ start on one planet
→ develop economy and infrastructure
→ research technologies
→ build civilian and military fleets
→ explore Universe / Galaxy / Solar systems
→ spy, transport, colonize, recycle, raid and fight
→ damage or destroy rival colonies
→ compete with autonomous bot empires
→ join, create or oppose alliances
→ fight over suns and Solar Crystals
→ build or destroy final Gates
→ achieve alliance or solo victory
→ show a deterministic final-round result
```

Confirmed Nemexia references define systemic depth and historical flows only. They do not authorize copying third-party HTML, CSS, prose, branding or visual assets. Stellar Empires keeps original art, terminology, implementation and configurable balance.

Project-specific endgame rules remain authoritative in:

```text
docs/25-solar-war-obelisks-gates-and-progression.md
```

---

## 2. Source-of-truth hierarchy

When documents conflict, use this order:

1. current merged code and tests on `main`;
2. accepted current Audit PR and its contracts;
3. this roadmap and its release gates;
4. `docs/25-solar-war-obelisks-gates-and-progression.md` for demolition baselines and later endgame;
5. `docs/26-universe-galaxy-solar-system-navigation-contract.md` for completed spatial navigation;
6. current status and roadmap indexes;
7. research/reference documents;
8. older audits, roadmaps and handoffs as historical background only.

Exact delivery sequencing is recorded in:

```text
docs/roadmap-pr-index.json
docs/audits/current-batch-audit.md
docs/audits/current-execution-state.md
```

---

## 3. Delivered baseline through PR #120

### 3.1. Simulation and persistence

- Phaser + TypeScript + Vite client;
- deterministic simulation, commands, events, replay and checksum;
- schema v14 save model and deterministic migration chain;
- IndexedDB autosave, slots, import/export, snapshots and recovery;
- bounded commands/events/reports/intelligence/world-event history;
- presentation separated from simulation logic;
- player and bots using shared command validation;
- serialized deterministic bot decision cursors and bounded catch-up;
- headless and production-path validation.

### 3.2. World, economy and operations

- seeded Universe with 20 slots and test/campaign/fidelity presets;
- multi-colony state and three planet zones;
- resources, energy, storage, population/hangar and stability;
- building, research, unit, defence, repair and ship-upgrade queues;
- logistics and market foundations;
- fleets, all six ordinary missions, combat, plunder, debris and reports;
- colonization, recycling, expeditions and space objects;
- pirate/PvE foundations and world events;
- planetary defence damage/recovery/repair;
- formations, target priorities, ship upgrades and class abilities;
- Admiral progression and Commander Ships;
- deterministic espionage/counter-intelligence and incoming-flight visibility.

### 3.3. Complete mechanical catalogs and art

| Category | Aegis | Synod | Veyra | Shared |
|---|---:|---:|---:|---:|
| Buildings | 24 | 24 | 24 | — |
| Technologies | 22 | 22 | 22 | functional matrix |
| Ordinary ships | 13 | 13 | 13 | — |
| Planetary defences | 9 | 9 | 9 | — |
| Commander Ships | — | — | — | 13 |

All 217 complete mechanical IDs resolve through 173 generated catalog runtime images.

### 3.4. Navigable application

- schema-v14 canonical coordinates;
- 20 Universe slots and 24 positions/system;
- Universe → Galaxy → Solar-system URL/history navigation;
- intelligence-aware details and explicit action availability;
- target handoff into the Fleet composer;
- report-to-map backlinks and semantic overlays;
- one application controller and nine canonical primary route families;
- routed development, fleet, operations, command, reports and system workspaces;
- persistent HUD and route-aware context;
- keyboard/reduced-motion parity and release viewport Browser E2E.

### 3.5. Ordinary mission/intelligence contract

PR #116–#120 completed:

- one reducer/UI/bot ordinary mission availability contract;
- research-derived flight-slot enforcement;
- redacted targets and current level-three attack intelligence;
- deterministic scout tiers, cooldown, detection, probe loss and defender alerts;
- derived intelligence reports with exact backlinks;
- sensor-tiered incoming-flight presentation without cargo leakage;
- bot perception restricted to owned/public/own-intelligence state;
- stable planner blocker diagnostics;
- scout → save/load → attack integration and Browser E2E gate.

---

## 4. Release 1.0 definition

Release 1.0 is complete only when all gates below are true.

### 4.1. Player loop

A new player can, without developer tools:

- choose any faction;
- understand the shell and global HUD;
- develop a viable multi-colony economy;
- unlock the complete catalog without dead ends;
- navigate Universe, galaxies and systems;
- launch every supported mission from valid targets;
- inspect intelligence and reports;
- fight fleets and planetary defence;
- use planet-destroyer and Commander mechanics;
- lose/recover secondary colonies safely;
- interact with PvE objects and economic services;
- join/create an alliance or remain solo;
- complete an alliance or solo victory route;
- save, close, reopen and continue deterministically.

### 4.2. Bot loop

Bots must use the same systems without hidden resources, hidden information or bot-only commands.

At least one full headless match must complete from new game to victory with:

- all three factions;
- economy/research progression;
- colonization and secondary-colony loss/recovery;
- espionage;
- normal/PvE combat;
- alliance choices;
- sun war;
- final victory.

### 4.3. Product quality

- no core catalog card uses an incorrect fallback;
- no primary route is a dead end;
- destructive actions have confirmation/history where player-triggered;
- all state changes are deterministic and serializable;
- save size and state-history growth stay within budgets;
- desktop paths work at 1366×768 and 1920×1080;
- keyboard and reduced motion work;
- GitHub Pages build is reproducible;
- Browser E2E covers the main loop and a victory path;
- long-session/headless testing proves reproducibility and bounded growth.

---

## 5. Milestone map

Exact future PR numbers are assigned only by accepted Audit PRs.

| Milestone | Status | Delivery |
|---|---|---|
| M1 — Production assets connected | completed | Audit #101; implementation #102–#105 |
| M2 — Navigable Universe | completed | Audit #106; implementation #107–#110 |
| M3 — Coherent full UI shell | completed | Audit #111; implementation #112–#115 |
| M4a — Ordinary missions and intelligence | completed | Audit #116; implementation #117–#120 |
| M4b — Planet demolition/destruction/recovery | audit active | Audit #121; planned #122–#123 |
| M4c — Multi-colony economy/logistics coherence | not audited | separate future audit |
| M5 — Full PvE and meta systems | not audited | PvE depth, Arena, Admiral meta and services |
| M6 — Autonomous bot parity | not audited | bots use every ordinary/meta system honestly |
| M7 — Complete endgame | not audited | alliances, solar war, Obelisks, Gates and victory |
| M8 — Release candidate quality | not audited | balance, performance, onboarding, QA and Pages release |

---

## 6. Active audited milestone — M4b planet demolition and destruction

Audit PR #121 defines heavy batch `PLANET-DEMOLITION-DESTRUCTION-01`:

```text
#122 PLANET-DEMOLITION-CONTRACT
→ #123 PLANET-DESTRUCTION-RECOVERY-GATE
```

### #122 outcome

- faction-specific planet-destroyer profiles;
- weapon-upgrade scaling;
- canonical demolition point thresholds;
- deterministic building selection/rolls;
- defence population reduction;
- Annihilator building-roll bonus rather than generic combat damage;
- one-level damage, zone reconciliation and no-refund queue cancellation;
- extended battle reports and routed presentation.

### #123 outcome

- canonical whole-planet destruction chance;
- defence, defending planet-destroyer and Polias reductions;
- 30% cap and final-colony protection;
- atomic cleanup/rehome of fleets, queues, events, routes, world events and flagship references;
- historical intelligence/report retention with exact coordinates;
- debris recycling at released positions;
- ordinary recolonization and active-colony fallback;
- bot, save/load, headless and Browser E2E gate;
- batch archive/closure.

### M4b exclusions

- no new mission or command;
- no schema migration/tombstone collection;
- no final-colony destruction or empire elimination;
- no extra destruction loot;
- no economy/logistics redesign;
- no Sun Attack/system collapse;
- no alliances, crystals, Obelisks, Gates or victory;
- no copied historical UI/assets.

Detailed acceptance criteria are authoritative in:

```text
docs/audits/current-batch-audit.md
docs/audits/contracts/planet-demolition-destruction-01-prs.md
docs/audits/contracts/planet-demolition-destruction-01-rules.md
```

---

## 7. Remaining milestone intent

### M4c — Multi-colony economy/logistics coherence

A separate audit must close:

- meaningful specialization and inter-colony dependencies;
- logistics route lifecycle, capacity and failure handling;
- market/economic-service coherence;
- player and bot economic planning across several colonies;
- long-run economic sustainability and reportability.

### M5 — Full PvE and meta systems

A later audit covers:

- deeper Renegade/PvE encounters and rewards;
- Arena/equivalent repeatable competition;
- Admiral and Commander meta depth;
- non-monetized auctions/bank/economic-service equivalents;
- world-event cadence and strategic-object depth.

Historical Premium/Credits/Platinum mechanics are not automatically transferred.

### M6 — Autonomous bot parity

Bots must use the same commands, coordinates, intelligence and economic constraints as the player across every delivered ordinary/meta domain.

Required:

- full headless progression;
- no hidden resources or bot-only mutation;
- deterministic decisions and bounded catch-up;
- save/load parity;
- observable failure reason codes.

### M7 — Complete endgame

Separate audits define and implement:

- alliances and diplomacy;
- solar attack/support/destruction/rebuilding;
- Solar Crystals and Obelisks;
- Supreme Galactic Gates;
- alliance and solo victory;
- deterministic result/defeat behavior.

`docs/25-solar-war-obelisks-gates-and-progression.md` remains authoritative.

### M8 — Release candidate quality

Final audits cover:

- onboarding and first-session guidance;
- economy/combat/endgame balance runs;
- long-session performance/state growth;
- save corruption/recovery drills;
- accessibility/visual consistency;
- complete Browser E2E and one victory path;
- reproducible GitHub Pages release;
- release notes and known limitations.

---

## 8. Delivery rules for every implementation PR

1. Start from fresh `main` after the previous dependency merges.
2. Begin only from an accepted Audit PR and stable work-item ID.
3. Do not combine unrelated roadmap rows.
4. Keep simulation independent from DOM/Phaser.
5. Use the same commands/validators for player and bots.
6. Add migration fixtures only for incompatible state changes.
7. Resolve visuals through stable IDs/manifests.
8. Never bind runtime UI to source-library paths.
9. Add focused unit/integration tests and update headless/browser gates.
10. Run asset checks, lint, TypeScript, full tests, build, Browser E2E and Graphify.
11. Update status, execution and continuation entrypoints.
12. Register procedural-art/CSS placeholders in the asset backlog.

---

## 9. Audit-first sequencing

```text
fresh main
→ dedicated Audit PR
→ accepted complexity-sized implementation sequence
→ combined final gate and audit archive
→ next Audit PR
```

No implementation work may start from stale chat memory, abandoned branches or an unmerged audit.
