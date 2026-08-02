# Audit evidence scaffold — COMPLETE-ENDGAME-01

**Status:** investigation required  
**Audit PR:** #152 candidate  
**Baseline:** `73ed5536cb994a78fe7cdd45a41e0240901d7fe1`  
**Evidence date:** 2026-08-02

## Baseline synchronization

PR #151 `BOT-PVE-META-GATE` was squash-merged as:

```text
73ed5536cb994a78fe7cdd45a41e0240901d7fe1
```

Validated documentation head before squash:

```text
088644aeaba88a8e8d95b0d9a1684752517fdf35
```

Final gates:

```text
CI             30762531028 — success
Browser E2E    30762531023 — success
Graphify       30762531017 — success
1 day              6.099 s < 15 s
7 days            28.838 s < 30 s
```

## Verified roadmap state

`docs/27-playable-game-roadmap-v5.md` defines the remaining major gaps as:

```text
M7 — Autonomous bot parity: substantially delivered; endgame parity remains
M8 — Complete endgame: not audited
M9 — Release candidate: not audited
```

The release target still requires alliances or explicit avoidance, Solar War participation, final Gates and deterministic victory/defeat.

## Verified completed prerequisites

- deterministic schema-v17/save-v4 local campaigns;
- active/offline chronological time;
- finite compressed progression;
- complete faction catalogs and runtime art;
- ordinary missions, intelligence, combat and planet destruction;
- coherent multi-colony economy and logistics;
- sustainable PvE;
- persistent PvE reputation and local Arena;
- honest bot economy/logistics/PvE/meta participation;
- permanent progression, performance, Browser and Graphify gates.

## Investigation matrix

The following table is a checklist for the next chat. It is not yet evidence of absence or presence.

| Surface | Required verification | Evidence method | Status |
|---|---|---|---|
| alliance/diplomacy domain | types, state, commands, tests | Graphify + code search + direct files | UNKNOWN |
| Solar War | mechanics versus documentation-only references | docs/catalog/code search | UNKNOWN |
| Obelisks | catalog IDs, assets, build/use mechanics | manifests/resolvers/simulation | UNKNOWN |
| Gates | catalog IDs, construction/destruction/completion | catalogs/buildings/combat | UNKNOWN |
| victory/defeat | terminal state, reports, routes, save semantics | state/reducer/runtime/UI/tests | UNKNOWN |
| bot endgame parity | perception, planner, scheduler, visibility | bot modules and tests | UNKNOWN |
| offline finalization | partition equality and autosave behavior | campaign runtime/save tests | UNKNOWN |
| UI ownership | Operations/Reports/HUD route placement | route and UI modules | UNKNOWN |
| migration | whether schema/save bump is needed | state shape/save parser/migrations | UNKNOWN |
| performance | endgame event frequency and history bounds | performance tests/profiling | UNKNOWN |

## Required Graphify work

1. validate or rebuild the graph on exact `main`;
2. search nodes and paths for alliance, diplomacy, solar, war, obelisk, gate, victory, defeat, terminal and campaign result;
3. inspect coupling around `GameState`, `GameCommand`, `executeCommand`, save migration, campaign time, bot scheduler and application routing;
4. record node/edge/community counts and graph limitations;
5. use direct source inspection to confirm every material conclusion.

## Required source inspection

At minimum, inspect:

- `AGENTS.md`;
- `docs/27-playable-game-roadmap-v5.md`;
- endgame/product contracts referenced by the roadmap;
- `src/simulation/types.ts`;
- `src/simulation/reducer.ts`;
- `src/simulation/createInitialGameState.ts`;
- `src/storage/saveFormat.ts` and migrations;
- building/technology/unit catalogs and faction mechanical roles;
- bot perception/planner/scheduler modules;
- campaign time/runtime/autosave modules;
- application routing, Operations, Reports and HUD;
- progression, performance, audit and browser tests.

Exact paths may differ; the completed audit must use current repository paths rather than this preliminary list when they conflict.

## Critical questions before batch authorization

1. Are alliances a prerequisite for endgame mechanics, or can a solo empire participate directly?
2. Does the project already have final-structure catalog entries that must be activated rather than added?
3. Is campaign terminal status persisted inside `GameState`, runtime metadata or both?
4. Must active/offline advancement stop at the exact victory/defeat boundary?
5. Can one heavy batch safely introduce both alliance state and terminal victory, or must they be split into separate audits?
6. What public/allied/hidden information may bots use?
7. What is the smallest Browser E2E flow proving a complete campaign ending and reload?

## Evidence rule

Do not convert an `UNKNOWN` to `VERIFIED` based on names, old docs or assumptions. Cite current code, tests, Graphify output or authoritative product contracts. Implementation remains blocked until the audit contract resolves all critical unknowns.
