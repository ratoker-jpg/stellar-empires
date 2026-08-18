# PR #156 — ENDGAME-PARTICIPATION-GATE

**Status:** implementation closure complete; final documentation-head validation pending  
**Updated:** 2026-08-18  
**Authorized by Audit PR:** #152 `COMPLETE-ENDGAME-01`  
**Audit squash SHA:** `d777a619109d4a9bfc8e5129bf4c525f3327b9b6`  
**PR #155 squash / exact branch baseline:** `a5c72562200c2a6dfdc49f1e4f07e8a869a6558d`  
**Validated closure code head before docs:** `54cf966bd1058adad667450c0bf5f32f23ae18b9`  
**Branch:** `agent/endgame-participation-gate`  
**Runtime:** schema v18 / save format v5 unchanged

## Closure delivered

- Aegis, Synod and Veyra each migrate from a valid schema-v17/save-v4 envelope through the production parser to schema v18/save v5;
- migration preserves player faction and gives every empire explicit independent participation with `soloEligible: true`;
- every player faction enters Solar War both solo and as an alliance member through ordinary commands;
- duplicate active entry is rejected with `SOLAR_WAR_ENTRY_ACTIVE`;
- all six faction/participation scenarios advance 48 campaign hours by direct, six-hour chunks, save/load and resumable offline runtime paths;
- the four paths require exact equality of the complete `GameState`, not a reduced projection;
- alliance membership and Solar War histories remain bounded to the newest 64 entries;
- malformed current schema-v18/save-v5 Solar War state remains rejected for all three factions;
- compressed progression partition coverage explicitly includes endgame participation state;
- Browser closure covers canonical Operations, HUD and Reports routes, invalid/legal actions, persistence, back/forward, reload and mobile overflow;
- no simulation/runtime production defect was exposed, so #156 adds no product mechanic and changes no runtime code.

## Code-head evidence

Exact code head: `54cf966bd1058adad667450c0bf5f32f23ae18b9`

- CI `32146644545` — success;
- Graphify `32146644566` — success;
- asset audit — success for 747 audited files;
- lint and strict TypeScript — success;
- 153 test files passed, 1 skipped;
- 621 tests passed, 1 skipped;
- new closure matrix: 13/13 passed;
- production build — success;
- permanent compressed progression scenario — success;
- one campaign day `6.261 s < 15 s`;
- seven campaign days `29.846 s < 30 s`;
- Browser E2E code-head run `32146644549` is part of the final pre-doc evidence and must be green before merge.

## Divergence

**None.** Closure work is tests/evidence/documentation plus a stronger assertion in the existing progression partition gate. Schema, save format, balance, bots, catalogs, final objects and terminal behavior are unchanged.

## Hard boundary after merge

`COMPLETE-ENDGAME-01` is closed by this PR. No fifth implementation PR is authorized.

The next work may only be a separate Audit `COMPLETE-ENDGAME-02` covering the already-locked Obelisks/Gates, contributions, final-object combat and persisted terminal victory/defeat. No such mechanic is authorized until that audit is accepted.

The generated #156 squash SHA cannot be embedded in its own commit. The immediately following Audit PR must record that exact SHA before authorizing any new implementation.
