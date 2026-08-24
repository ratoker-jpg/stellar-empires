# Current execution state

**State:** PR1 complete-for-controller-review  
**Updated:** 2026-08-24  
**Accepted Audit:** #182 `docs: audit next post-1.0 product batch` — MERGED  
**Audit squash / exact PR1 starting main:** `b09887489db7754f0c0b2672649db9283b879732`  
**Active implementation PR:** #183 `fix: preserve full Arena combat identity`  
**Branch:** `agent/post-1.0-arena-combat-identity-truth`  
**Work item:** `POST-1.0-PR1-ARENA-COMBAT-IDENTITY-TRUTH`  
**Runtime:** schema v19 / save format v6 / migration none

## Current batch

Batch: `POST-1.0-STRATEGIC-FEEDBACK-TRUTH`.

Ordered state:

1. `POST-1.0-PR1-ARENA-COMBAT-IDENTITY-TRUTH` — #183 active / complete-for-controller-review;
2. `POST-1.0-PR2-UNIFIED-COMBAT-FEEDBACK` — pending / not started;
3. `POST-1.0-PR3-COMBAT-RANKING-TRUTH` — pending / not started.

The batch is not closed. PR2 and PR3 are not authorized to start before controller handling of PR1.

## PR1 implementation truth

Regression-first RED commit:

`c4ac9ac234c0ab160d64c9a15a8dfc90d8847693`

The old Arena resolution formula remains the exact compatibility fallback for legacy active entries that have no snapshot:

```text
mixSeed(entry.challenge.combatSeed ^ event.sequence ^ fleet.id.length)
```

New Arena entries snapshot the full stable fleet identity at entry time:

```text
mixSeed(
  challenge.combatSeed
  ^ sequence
  ^ stableFleetIdentityContribution(fleet.id)
)
→ ArenaEntry.resolutionSeed
```

Resolution consumes `ArenaEntry.resolutionSeed` when present and only uses the old length-based formula when the field is absent.

`ArenaEntry.resolutionSeed` is optional, readonly and normalized with the existing non-negative safe-integer seed domain. Legacy field absence stays valid and stays absent through save/load. No schema or save migration was added.

Runtime implementation head before this control-plane commit:

`f0d9d9c7d80d42c31250e853a8db502dfde72a16`

Runtime-head evidence was fully green before control-plane synchronization:

- CI #2244 — asset audit, lint, typecheck, full tests and build SUCCESS;
- focused Arena file inside the full suite — `tests/simulation/arenaPveChallenges.test.ts`: 14/14 SUCCESS;
- compressed progression SUCCESS;
- campaign catch-up performance SUCCESS;
- Organic Obelisk SUCCESS;
- Organic Fresh Game → Terminal SUCCESS;
- terminal save/load + partition determinism SUCCESS;
- bounded organic faction matrix SUCCESS;
- Graphify #1377 with repository-pinned `graphifyy==0.8.38` SUCCESS;
- Browser E2E #1474 SUCCESS;
- production Pages smoke #1474 SUCCESS.

Because this control-plane commit changes the exact head, fresh exact-head CI, Graphify, Browser E2E and production smoke are required again before #183 is marked Ready.

## Scope boundary

PR1 changes only Arena combat identity truth and compatibility tests/control-plane state.

Unchanged:

- normal attack seed;
- `resolveBattle()` and combat formulas;
- weapon/armor/doctrine/commander/formation/priority mechanics;
- Arena difficulty, enemy generation, costs, rewards, reputation, timing and history limit;
- bot behavior;
- schema v19;
- save v6.

## Next action

Require fresh exact-head gates after this control-plane commit, inspect review threads, re-check live `main`, require `mergeable=true`, mark #183 Ready, then STOP for controller review.

**Do not merge #183. Do not create or start PR2.**