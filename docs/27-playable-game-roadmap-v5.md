# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** active canonical product roadmap  
**Updated:** 2026-07-29  
**Last merged PR:** #131 `CAMPAIGN-SETTINGS-PERSISTENCE` · `257e3effaab4e34285d00db64b6676fda364fcfd`  
**Runtime baseline:** schema v15 / save format v3  
**Accepted batch:** `LOCAL-CAMPAIGN-TIME-PACING-01`  
**Next implementation:** #132 `CAMPAIGN-CLOCK-OFFLINE-GATE`  
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
- active batch contract: `docs/audits/current-batch-audit.md`;
- PR #131 delivery record: `docs/changes/pr131-campaign-settings-persistence.md`.

## 2. Source-of-truth hierarchy

1. current merged code/tests on `main`;
2. accepted audit and contracts;
3. `docs/audits/current-execution-state.md`;
4. `docs/project-status.json` and `docs/roadmap-pr-index.json`;
5. this roadmap;
6. canonical product/endgame contracts;
7. older audits and handoffs as history only.

## 3. Delivered baseline through PR #131

### Simulation and persistence

- deterministic command/event/replay/checksum model;
- schema v15 immutable checksummed `CampaignSettings`;
- scenario presets `test | campaign | fidelity`;
- immutable world speed `x1 | x2 | x5 | x10`;
- save format v3 integrity over stable envelope fields, runtime metadata and state;
- protected processed cursor, pending catch-up and pending return-summary shapes;
- state v1–v14 and save format v1–v2 migration to x1 using validated envelope time;
- autosave, manual slots, import/export, snapshots and recovery;
- ordinary saves preserve the processed cursor until time is actually processed;
- pending target/remainder metadata requires exact cursor consistency;
- bounded histories and serialized deterministic bot decision cursors;
- player and bots share ordinary validation and command paths.

### Campaign creation

- one accessible transaction selects faction, topology and immutable speed;
- Aegis, Synod and Veyra are available;
- compact, campaign and fidelity topologies are available;
- x2 is presented as recommended;
- offline progression is visibly fixed on;
- System / Saves displays immutable campaign identity and processed cursor.

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
- measured task budgets and no-dead-end navigation gate.

### PR #131 validation

- CI `30405640769`;
- Browser E2E `30405640704`;
- Graphify `30405640711`;
- Codex P1/P2 findings fixed and resolved;
- final re-review returned 👍;
- merge `257e3effaab4e34285d00db64b6676fda364fcfd`.

## 4. Remaining campaign-time gap

World speed is now part of persisted campaign identity, but it does not yet drive real elapsed time.

Until #132 merges:

- open-session progression still uses manual Planet time controls;
- offline elapsed time is not processed;
- overdue bots are evaluated against the final post-jump state;
- no active clock or fractional carry exists;
- no catch-up progress surface is mounted;
- pending summary types exist, but return-summary presentation does not run;
- normal player fast-forward controls remain.

## 5. PR #132 — CAMPAIGN-CLOCK-OFFLINE-GATE

Create only from fresh current `main`.

Required delivery:

- one DOM-independent campaign-time orchestrator;
- chronological boundaries for pending events, logistics, world-event evaluation, bot decisions and target time;
- bots evaluated at scheduled world state through ordinary commands;
- fixed-point x1/x2/x5/x10 mapping with fractional carry;
- active open-session clock;
- bounded resumable offline bootstrap;
- protected pending target/remainder/fraction/summary;
- checkpoints advancing the real cursor only by processed time;
- additional elapsed time during catch-up processed after the original target;
- final state/cursor/summary saved before interaction;
- pending summary retained across reload until acknowledgement;
- normal player fast-forward controls removed;
- one-day/seven-day deterministic, Browser E2E and performance gates;
- audit archive and batch closure.

Central invariant:

```text
one large duration
== any valid smaller time partition
== any valid operation-budget partition
```

## 6. Progression compression split

PR #132 must not change level caps, costs, durations, unlock requirements or rewards.

After #132, `CAMPAIGN-PROGRESSION-BALANCE-01` must use delivered fake-clock/headless runs to determine:

- standard campaign duration;
- first reconnaissance/combat/colonization timing;
- level and queue compression;
- world-speed preset balance;
- planet-destroyer and endgame timing;
- repetitive versus meaningful progression steps.

## 7. Release 1.0 definition

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

## 8. Milestone map

| Milestone | Status | Delivery |
|---|---|---|
| M1 — Production assets | completed | Audit #101; #102–#105 |
| M2 — Navigable Universe | completed | Audit #106; #107–#110 |
| M3 — Coherent UI shell | technically completed | Audit #111; #112–#115 |
| M3b — Navigation/usability repair | completed | Audit #125; #126–#129 |
| M4a — Ordinary missions/intelligence | completed | Audit #116; #117–#120 |
| M4b — Planet demolition/destruction/recovery | completed | Audit #121; #122–#123 |
| M4c — Local campaign time foundation | 1/2 implementation PRs merged | #130 accepted; #131 merged; #132 next |
| M4d — Campaign progression balance | blocked until #132 | separate audit |
| M5 — Multi-colony economy/logistics coherence | not audited | sustainability and bot planning |
| M6 — Full PvE/meta systems | not audited | PvE depth, Arena, Admiral meta, services |
| M7 — Autonomous bot parity | not audited | honest full-domain bot loop and catch-up parity |
| M8 — Complete endgame | not audited | alliances, solar war, Obelisks, Gates, victory/defeat |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance, release |

## 9. Key invariants

- current `main` is the only valid baseline;
- create only PR #132 next;
- campaign settings remain immutable deterministic state;
- wall-clock cursor/continuation remain outside `GameState` but integrity protected;
- old saves migrate to x1;
- checkpoint cursor represents processed time only;
- no elapsed duration is silently skipped or capped away;
- active and offline paths use one orchestrator;
- pending summary survives until acknowledgement;
- player and bots use ordinary commands and visibility rules;
- no continuously running server is required for Release 1.0;
- no numeric progression rebalance in #132.

## 10. Immediate action

Create PR #132 `CAMPAIGN-CLOCK-OFFLINE-GATE` from fresh current `main`, implement only the accepted clock/catch-up contract, and close the batch after CI, Browser E2E, Graphify and clean review.
