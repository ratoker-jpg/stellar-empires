# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** M1–M8 mechanically complete; M9 final Release 1.0 closure #171 active  
**Updated:** 2026-08-20  
**Last merged PR:** #170 `RELEASE-PACKAGING-METADATA` · `1221bfe19cc11f836db7fe7e5720f778419c2dd9`  
**Runtime:** schema v19 / save format v6  
**Release target:** 1.0.0 complete local PvE browser campaign with autonomous bot empires

## 1. Product target

```text
choose faction and immutable campaign settings
→ develop a coherent multi-colony economy
→ configure predictable logistics and market support
→ research and build fleets
→ explore, spy, transport, colonize, recycle, raid and fight
→ compete with autonomous bot empires
→ remain solo or participate in an alliance
→ participate in Solar War
→ build or destroy final Gates
→ reach deterministic persisted victory or defeat
```

## 2. Source-of-truth hierarchy

1. current merged code/tests on `main`;
2. accepted current audit and contracts;
3. `docs/audits/current-execution-state.md`;
4. `docs/project-status.json` and `docs/roadmap-pr-index.json`;
5. this roadmap;
6. canonical product contracts;
7. completed audits/history.

Actual GitHub state overrides stale prose.

## 3. Delivered baseline

All mechanical milestones through M8 are closed, and M9 release hardening through packaging metadata is merged on fresh post-#170 main:

`1221bfe19cc11f836db7fe7e5720f778419c2dd9`

Delivered game scope includes:

- deterministic campaign settings, local active time and offline catch-up;
- three mechanical factions;
- multi-colony economy, logistics and market;
- research, buildings, ships, defenses and upgrades;
- Universe navigation and intelligence;
- ordinary fleet missions, expeditions, objects, events and reports;
- combat, debris, demolition, planet destruction/recovery and recolonization;
- sustainable PvE/meta systems;
- autonomous bot ordinary-campaign and endgame parity;
- optional alliances and solo completion;
- Solar War qualification;
- final Gate projects, vulnerability, destruction/rebuild and host recovery;
- immutable persisted terminal victory/defeat and exact runtime freeze;
- deterministic save/load/direct/chunk/offline closure;
- truthful new-game release orientation;
- production-build Browser smoke under `/stellar-empires/`;
- package-derived release identity and Node 24 release automation baseline.

## 4. Completed milestone map

| Milestone | Delivery |
|---|---|
| M1 — Production assets | Audit #101; #102–#105 |
| M2 — Navigable Universe | Audit #106; #107–#110 |
| M3 — Coherent UI shell | Audit #111; #112–#115 |
| M3b — Navigation/usability repair | Audit #125; #126–#129 |
| M4a — Ordinary missions/intelligence | Audit #116; #117–#120 |
| M4b — Demolition/destruction/recovery | Audit #121; #122–#123 |
| M4c — Local campaign time | Audit #130; #131–#132 |
| M4d — Campaign progression balance | Audit #133; #134–#135 |
| M5 — Multi-colony economy/logistics | Audit #137; #138–#141 |
| M6a — Sustainable existing PvE | Audit #142; #143–#146 |
| M6b — PvE meta foundation | Audit #147; #148–#151 |
| M8.1 — Endgame participation | Audit #152; #153–#156 |
| M8.2 — Final objects/terminal | Audit #157; #158–#161 |
| M8.3 — Bot endgame closure | Audit #162; #163–#166 |

M7 autonomous bot parity is satisfied through the ordinary-campaign work above plus M8.3 final endgame parity.

## 5. Release 1.0 definition

A player can create and resume a deterministic campaign, build and understand a multi-colony economy, configure logistics, unlock the catalog, execute sustainable missions, fight and recover colonies, use bounded PvE/meta systems, remain solo or participate in an alliance, participate in Solar War and reach a persisted victory or defeat.

Bots use the same commands, resources, timing and allowed information classes. Save/load/offline partitions preserve deterministic outcomes.

For technical Release 1.0, the built production artifact additionally:

- tells the truth about available campaign/endgame behavior;
- boots and navigates under the GitHub Pages production base `/stellar-empires/`;
- uses coherent package/UI release metadata;
- runs on an automated Node baseline supported by current dependencies;
- retains the permanent progression/performance/Browser/Graphify gates;
- has current repository documentation describing the shipped game.

## 6. M9 — Release Candidate / 1.0 closure

Audit #167 `M9-RELEASE-CANDIDATE-AUDIT` merged as `f7e14fda42a135f70c0ad95ada7d3080d472176b` and authorized exactly four sequential implementation work items.

```text
#168 RELEASE-ONBOARDING-TRUTH       merged
→ #169 RELEASE-PRODUCTION-BROWSER  merged
→ #170 RELEASE-PACKAGING-METADATA  merged
→ #171 RELEASE-1.0-CLOSURE          active
```

No fifth M9 implementation PR is authorized.

### M9.1 Release onboarding truth — complete

Corrected stale new-game claims and added concise first-run orientation using the existing new-game surface. No tutorial state or quest subsystem.

### M9.2 Production browser proof — complete

Kept the broad dev-server Browser suite and added a dedicated production-build smoke against `/stellar-empires/`, including real fresh-campaign selection, save/load, navigation and reload.

### M9.3 Packaging and metadata — complete

Made `package.json` the version authority, moved automated release jobs to Node 24, identified the RC as `1.0.0-rc.1` and brought README/current metadata to the shipped state. License selection remains owner-controlled.

### M9.4 1.0 closure — active

Advance the package-authoritative version to `1.0.0`, archive M9 and run the combined exact-head release gates. No new gameplay mechanic is part of closure.

After the #171 exact head is fully green, Ready → expected-head squash merge → fresh-main verification → post-merge Pages verification. A tiny docs-only record is permitted only if generated merge/deployment evidence must be written back.

## 7. Remaining milestone map

| Milestone | Status | Delivery |
|---|---|---|
| M1–M8 | completed | through #166 |
| M9 — Release candidate | final closure active | Audit #167; #168–#170 merged; #171 final closure |
| Release 1.0 | pending final #171 gates/merge | package-authoritative `1.0.0` closure |

## 8. Key invariants

- current `main` is the only valid merged runtime baseline;
- alliance membership is optional and solo completion remains legal;
- schema v19/save v6 remains the Release 1.0 runtime;
- Solar War and final objects use ordinary commands/mechanics;
- terminal result is persisted, immutable and freezes simulation at the exact terminal second;
- no post-victory continue sandbox exists;
- bots do not gain hidden foreign state;
- progression, determinism, Browser, production Browser, Graphify and performance gates remain mandatory;
- existing accepted balance is not retuned without measured evidence;
- M9 release hardening must not become a new gameplay expansion.

## 9. Immediate action

Finish `RELEASE-1.0-CLOSURE` #171 from exact base `1221bfe19cc11f836db7fe7e5720f778419c2dd9`. Freeze one exact head, require all release gates, then squash-merge with expected-head protection and verify fresh `main` plus Pages. Do not create a fifth M9 implementation PR.
