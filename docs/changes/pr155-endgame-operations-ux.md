# PR #155 — ENDGAME-OPERATIONS-UX

**Status:** implementation scaffold only  
**Updated:** 2026-08-03  
**Authorized by Audit PR:** #152 `COMPLETE-ENDGAME-01`  
**Audit squash SHA:** `d777a619109d4a9bfc8e5129bf4c525f3327b9b6`  
**PR #154 squash / exact branch baseline:** `b62d8b739c27cf1616b33302886e565d88c04a42`  
**Branch:** `agent/endgame-operations-ux`  
**Runtime:** consume schema v18 / save format v5; no persistence change

## Purpose

Expose the already-implemented alliance/solo and Solar War domains through the existing application shell without creating another primary route family.

## Authorized player-visible result

- add Operations modes `alliances` and `solar-war`;
- show explicit solo eligibility, public alliance roster, own membership and legal create/join/leave actions;
- show current Solar War timing and public opposing-force summary;
- show eligible owned fleets, validation failures and active entry state;
- allow legal `ENTER_SOLAR_WAR` through the ordinary command path;
- show recent public results while keeping owner-only fleet losses/survivors private;
- expose Solar War outcomes under a Reports `endgame` filter;
- show only a compact Solar War cycle/entry indicator in the global HUD;
- preserve route canonicalization, reload, browser history, keyboard access, responsive layouts and reduced motion.

## Expected paths

Create:

```text
src/ui/endgameOperationsViewModel.ts
src/ui/endgameOperationsPanel.ts
tests/ui/endgameOperationsViewModel.test.ts
tests/ui/endgameOperationsPanel.test.ts
```

Modify:

```text
src/ui/appShellRoute.ts
src/ui/appShellController.ts
src/ui/operationsWorkspace.ts
src/ui/reportsWorkspace.ts
src/ui/globalHud.ts
src/ui/globalHudViewModel.ts
tests/ui/appShellRoute.test.ts
tests/ui/operationsWorkspace.test.ts
tests/e2e/appShellOperations.spec.ts
```

## Persistence boundary

No schema/save migration. Presentation state is not persisted. The UI consumes the merged schema-v18/save-v5 alliance and Solar War state from PRs #153 and #154.

## Privacy boundary

Public surfaces may show alliance identity/roster, cycle, opposing-force summary, participation identity, outcome and score. Exact owned fleet losses, survivors and detailed battle report remain visible only to the owning empire.

## Required tests

- pure alliance/Solar War view-model coverage;
- accessible legal and rejected alliance actions;
- accessible legal and rejected Solar War entry;
- route canonicalization for Operations `alliances` and `solar-war` modes;
- Reports `endgame` filter;
- compact HUD state;
- release/mobile viewport fit;
- reload, back/forward, keyboard order and reduced-motion equivalence;
- existing Operations, Reports, Arena, intelligence and navigation regressions.

## Explicit non-goals

No bot Solar War planner, allied perception, private alliances, invitations, ranks, chat, diplomacy matrix, Obelisks/Gates, victory/defeat, terminal overlay, onboarding tour, new currency, new catalog/assets, global rebalance, release polish or M9 work.

## Validation boundary

PR remains draft until focused UI tests, full CI, Browser E2E, Graphify, unchanged progression/performance gates, documentation synchronization, review and mergeability are green.

Solar War and alliance UI implementation has not started in this scaffold commit.
