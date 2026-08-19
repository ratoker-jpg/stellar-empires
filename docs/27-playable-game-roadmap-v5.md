# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** M1–M8 mechanically complete; M9 Release Candidate Audit #167 active  
**Updated:** 2026-08-19  
**Last merged PR:** #166 `ENDGAME-BOT-CLOSURE-GATE` · `a6b225fe38c1c320244fc54929534e49029d4026`  
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

All mechanical milestones through M8 are closed on fresh post-#166 main:

`a6b225fe38c1c320244fc54929534e49029d4026`

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
- deterministic save/load/direct/chunk/offline closure.

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

For technical Release 1.0, the built production artifact must additionally:

- tell the truth about available campaign/endgame behavior;
- boot and navigate under the GitHub Pages production base `/stellar-empires/`;
- use coherent package/UI release metadata;
- run on an automated Node baseline supported by current dependencies;
- retain the permanent progression/performance/Browser/Graphify gates;
- have current repository documentation describing the shipped game.

## 6. M9 — Release Candidate

Audit #167 `M9-RELEASE-CANDIDATE-AUDIT` is the mandatory entrypoint.

Recon on fresh post-#166 main found a medium release-hardening batch with critical unknowns = 0. No new gameplay mechanic or schema/save migration is required.

While #167 is open, M9 implementation is unauthorized.

After #167 squash-merges and its generated fresh main is verified, exactly this implementation sequence is authorized:

```text
#168 RELEASE-ONBOARDING-TRUTH
→ #169 RELEASE-PRODUCTION-BROWSER
→ #170 RELEASE-PACKAGING-METADATA
→ #171 RELEASE-1.0-CLOSURE
```

Stable work-item IDs are authoritative if GitHub numbering changes. No fifth M9 implementation PR is authorized by this Audit.

### M9.1 Release onboarding truth

Correct stale new-game claims and add concise first-run orientation using the existing new-game surface. No tutorial state or quest subsystem.

### M9.2 Production browser proof

Keep the existing broad dev-server Browser suite and add a dedicated small smoke against the real production build/base path `/stellar-empires/`, including real fresh-campaign selection and reload.

### M9.3 Packaging and metadata

Make `package.json` the version authority, move the release automation baseline to Node 24, identify the RC as `1.0.0-rc.1` and bring README/current metadata up to the actual shipped state. License selection remains owner-controlled.

### M9.4 1.0 closure

Advance the package-authoritative version to `1.0.0`, run combined exact-head release gates, archive M9, mark technical Release 1.0 complete, squash-merge and verify the resulting `main` plus Pages deployment.

## 7. Remaining milestone map

| Milestone | Status | Delivery |
|---|---|---|
| M1–M8 | completed | through #166 |
| M9 — Release candidate | Audit active | #167; then exactly four implementation work items if Audit merges |
| Release 1.0 | pending M9 closure | target after `RELEASE-1.0-CLOSURE` |

## 8. Key invariants

- current `main` is the only valid merged runtime baseline;
- alliance membership is optional and solo completion remains legal;
- schema v19/save v6 remains the M9 target;
- Solar War and final objects use ordinary commands/mechanics;
- terminal result is persisted, immutable and freezes simulation at the exact terminal second;
- no post-victory continue sandbox exists;
- bots do not gain hidden foreign state;
- progression, determinism, Browser, Graphify and performance gates remain mandatory;
- existing accepted balance is not retuned without measured evidence;
- M9 release hardening must not become a new gameplay expansion.

## 9. Immediate action

Finish Audit #167 on one exact docs-only green head and squash-merge it. Verify generated fresh `main`. Then begin only `RELEASE-ONBOARDING-TRUTH` from that fresh main and execute the accepted M9 sequence linearly.
