# PR #161 — ENDGAME-TERMINAL-GATE

**Status:** closure implementation complete; final exact-head validation pending  
**Updated:** 2026-08-19  
**Authorized by Audit PR:** #157 `COMPLETE-ENDGAME-02`  
**Exact branch baseline / PR #160 squash / fresh main:** `8ad44509426e4bb9555a8a6133e1dbdb899dccae`  
**Branch:** `agent/endgame-terminal-gate`  
**Runtime:** schema v19 / save format v6 unchanged

## Purpose

This is the fourth and final bounded implementation-closure PR for `COMPLETE-ENDGAME-02`. It does **not** add a gameplay mechanic. It composes the already delivered #158–#160 final-object/Gate/terminal behavior into one acceptance gate, retains successful Browser evidence, archives the batch and synchronizes continuation state.

## Closure evidence added

`tests/audit/endgameTerminalGate.test.ts` exercises the real current simulation paths and covers:

1. solo project: start → funding → ordinary Gate construction → vulnerable → stabilize → terminal victory;
2. alliance project: member contribution → funding → construction → vulnerable → stabilize → immutable winning cohort victory;
3. save/load evidence before funding, during construction and vulnerability, plus exact whole-state equality after terminal victory;
4. exact direct/chunk equality before, at and after the terminal boundary;
5. actual scheduled `FLEET_ARRIVE` versus `FINAL_GATE_STABILIZE` at the same second in both sequence orders;
6. attack-first vulnerable Gate destruction → zero-contribution funding reset → rebuild → later stabilization victory;
7. host loss → stale stabilizer removal → fresh project on another surviving owned qualified host → later victory;
8. ordinary random demolition at the exact 20-point threshold cannot select the final Obelisk or Gate;
9. post-terminal gameplay rejection and higher-level zero-step time freeze remain intact.

Permanent #160 tests continue to cover due pending events/logistics/world/bot inactivity, all gameplay command families returning `CAMPAIGN_TERMINAL`, active/offline wall-clock backlog consumption, resumable partition equality, immediate durable terminal autosave and existing terminal UI/reload behavior. #159 Gate vulnerability/destruction regression tests remain in the full suite.

The initial closure-suite run exposed two **test-fixture** issues only: save normalization correctly canonicalized artificially inflated test economy, and the reconstructed Gate host needed explicit test-resource replenishment before a second full Gate funding cycle. The fixtures were corrected. No simulation/runtime production defect or accepted-contract divergence was found.

## Browser evidence

The existing `tests/e2e/endgameOperations.spec.ts` terminal scenario remains the canonical user-visible proof for:

- terminal victory on Operations, Reports and Global HUD;
- project/host/funding/stabilization evidence;
- read-only terminal state;
- frozen campaign time;
- reload safety;
- mobile viewport;
- reduced motion.

`.github/workflows/e2e.yml` now retains `playwright-report` with 7-day retention on **successful as well as failed** Browser runs. This is an evidence-retention change only; test execution and product behavior are unchanged.

## Source-of-truth closure

This PR prepares:

- `docs/audits/completed/complete-endgame-02.md`;
- updated `docs/audits/current-execution-state.md`;
- updated `docs/audits/current-batch-audit.md`;
- appended `docs/audits/batch-history.md`;
- updated project/roadmap/continuation entrypoints.

The archive becomes authoritative when #161 squash-merges. The generated #161 squash cannot be embedded in its own commit and must be recorded by the immediately following Audit.

## Scope boundaries preserved

Not added:

- bot Solar War/final-object planner;
- allied/public/owned/hidden bot perception changes;
- currencies or alliance treasury;
- catalogs or assets;
- new mission or route family;
- separate final-object combat engine;
- balance changes;
- continue-after-victory sandbox;
- M9 work.

Those bot endgame concerns remain unaudited `COMPLETE-ENDGAME-03` scope.

## Final merge gate

Before Ready/squash, one exact final head must pass:

- asset audit;
- lint;
- strict TypeScript;
- full Vitest suite including this closure matrix;
- production build;
- permanent compressed progression;
- one-day `<15 s` and seven-day `<30 s` catch-up budgets;
- Browser E2E with retained Playwright success artifact;
- Graphify;
- unresolved review threads = 0;
- submitted/blocking reviews = 0;
- mergeable against unchanged base `8ad44509426e4bb9555a8a6133e1dbdb899dccae`.

If green, mark #161 Ready and squash-merge with expected exact head protection, verify the generated fresh-main SHA, then begin **no gameplay implementation** until a separate `COMPLETE-ENDGAME-03` Audit is accepted.
