# Stellar Empires — canonical roadmap to a complete playable game v5

**Status:** M8.1/M8.2 completed; M8.3 `COMPLETE-ENDGAME-03` Audit #162 active  
**Updated:** 2026-08-19  
**Last merged PR:** #161 `ENDGAME-TERMINAL-GATE` · `8f05d22b3475ee99e9af8652d385c956e0acd7c7`  
**Runtime:** schema v19 / save format v6  
**Release target:** complete local PvE browser campaign with autonomous bot empires

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

## 3. Delivered baseline

M1–M6b are complete through #151. M7 autonomous bot parity is substantially delivered for ordinary campaign behavior. M8.1 alliance/solo/Solar-War participation is complete through #156. M8.2 final objects, Gate vulnerability/recovery and terminal campaign closure is complete through #161.

Fresh current main after #161 is:

`8f05d22b3475ee99e9af8652d385c956e0acd7c7`.

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

## 5. M8.3 — COMPLETE-ENDGAME-03

Audit #162 is the mandatory entrypoint for the remaining bot endgame parity gap.

Recon on fresh post-#161 main found:

- the bot scheduler already advances deterministic cadence and emits ordinary reducer commands;
- existing bot perception already protects hidden foreign state but lacks explicit endgame public/owned/allied projections;
- alliance, Solar War, final-project, vulnerable Gate attack/recovery and terminal mechanics are already ordinary gameplay;
- no bot-specific simulation engine, schema/save migration, currency, catalog, asset or combat engine is required;
- M8.3 complexity is medium and critical unknowns are zero.

While Audit #162 is open, implementation is unauthorized.

After #162 itself squash-merges and its generated main is verified, exactly this sequence is authorized:

```text
#163 ENDGAME-BOT-PERCEPTION
→ #164 ENDGAME-BOT-PARTICIPATION
→ #165 ENDGAME-BOT-FINAL-OBJECTS
→ #166 ENDGAME-BOT-CLOSURE-GATE
```

No fifth M8.3 implementation PR is authorized.

### Information parity

Bots may use canonical public alliance/Solar-War/final-project/terminal facts, their own participation/qualification and project-cohort data they are entitled to, plus existing owned state/intelligence/public contacts.

Bots may not read hidden foreign resources, inventories, fleets, queues, logistics, private intelligence or private contribution-source data merely because a foreign endgame object exists.

### Command parity

Bots use the same existing commands for alliance participation, Solar War, project start/contribution and ordinary ATTACK. Existing build events/combat/recovery/terminal semantics remain authoritative.

## 6. Release 1.0 definition

A player can create and resume a deterministic campaign, build and understand a multi-colony economy, configure logistics, unlock the catalog, execute sustainable missions, fight and recover colonies, use bounded PvE/meta systems, remain solo or participate in an alliance, participate in Solar War and reach a persisted victory or defeat.

Bots must use the same commands, resources, timing and allowed information classes. Save/load/offline partitions must preserve deterministic outcomes.

## 7. Remaining milestones

| Milestone | Status | Delivery |
|---|---|---|
| M1–M6b | completed | through #151 |
| M7 — Autonomous bot parity | substantially delivered | final endgame parity in M8.3 |
| M8.1 | completed | #152–#156 |
| M8.2 | completed | #157–#161 |
| M8.3 — Bot endgame closure | Audit active | #162; then #163–#166 if Audit merges |
| M9 — Release candidate | not audited | balance, onboarding, QA, performance and release |

## 8. Key invariants

- current `main` is the only valid merged runtime baseline;
- alliance membership is optional and solo completion remains legal;
- schema v19/save v6 remains the M8.3 target;
- Solar War and final objects use ordinary commands/mechanics;
- terminal result is persisted, immutable and freezes simulation at the exact terminal second;
- no post-victory continue sandbox exists;
- bots do not gain hidden foreign state;
- progression, determinism, Browser, Graphify and performance gates remain mandatory.

## 9. Immediate action

Finish #162 Audit exact-head validation and squash merge. Then implement #163–#166 sequentially from each fresh generated main. After M8.3 closure, M9 must begin with its own Audit before release-candidate implementation.
