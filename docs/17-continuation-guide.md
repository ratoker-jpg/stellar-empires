# Continuation guide

## Current handoff

Release 1.0 remains closed. Runtime baseline remains schema v19 / save format v6.

Current exact `main` / starting main for the active Audit:

`e974c09e7779b4cf3bbc6d0279b8d35f177a29e6`

That is merged PR #185.

## Previous batch — complete

```text
POST-1.0-STRATEGIC-FEEDBACK-TRUTH
Audit #182 → b09887489db7754f0c0b2672649db9283b879732
PR1 #183  → 83a4942c35aac8d7f0b02f7730f0646c171c98b5
PR2 #184  → 691078ab9ce5b0ab48e7aa69e71fe72322528af0
PR3 #185  → e974c09e7779b4cf3bbc6d0279b8d35f177a29e6
```

Archive: `docs/audits/completed/post-1.0-strategic-feedback-truth.md`. There is no PR4.

## Only active work

```text
POST-1.0-NEXT-PRODUCT-3
Audit PR #186
branch audit/post-1.0-next-product-3
starting main e974c09e7779b4cf3bbc6d0279b8d35f177a29e6
kind docs-only Audit
implementationAuthorized = false
```

The binding contract is `docs/audits/current-batch-audit.md`.

## Fresh Audit result

The strongest current player-facing gap is replayable campaign lifecycle:

1. normal fresh-game bootstrap always uses hard-coded seed source `stellar-empires-m1`;
2. seed materially controls generated world/PvE variation;
3. valid autosave or its recovery snapshot prevents normal new-game selection;
4. terminal campaigns intentionally freeze;
5. no safe in-game action replaces the active campaign while preserving manual saves.

Proposed batch, still unauthorized:

`POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE`

Only proposed work item:

`POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE`

## Controller blocker resolution — autosave authority

The first Audit draft's `snapshot delete → primary delete → reload` ordering was incomplete.

Current source has page lifecycle autosave flushes and other write producers. A live `AutoSaveController` can still own pending/active work while reload begins. Therefore deletion can otherwise be followed by resurrection of the old campaign.

Binding success contract:

```text
confirm destructive reset
→ disable current-page autosave producers/bridge
→ drain pending/active autosave work with failure propagation
→ dispose/quiesce writer
→ delete autosave.snapshot
→ delete autosave
→ reload existing bootstrap
→ loadAutosave() must be missing
```

Manual/user-named slots remain untouched.

Failure semantics:

- cancel before quiesce changes nothing;
- quiesce failure deletes neither reserved slot and must restore/retain a working autosave path;
- snapshot delete failure leaves primary untouched;
- primary delete failure leaves primary recoverable;
- after a destructive-phase failure the page must not remain silently with autosave disabled; reload of the surviving primary is allowed/preferred.

Implementation must include a regression with pending/current autosave plus simulated pagehide/reload proving old state cannot reappear after successful reset.

`src/storage/AutoSaveController.ts` is read/verify by default; main-level coordination is preferred if sufficient.

## Controller blocker resolution — Browser reachability

`playwright.config.ts` starts with `VITE_E2E=1`, and current `createFreshGame()` bypasses `selectNewGameCampaign()` whenever E2E runtime is enabled.

Audit therefore authorizes one narrow deterministic E2E-only interactive mode. Accepted semantics:

```text
VITE_E2E=1
interactiveNewGame=1
campaignSeed=<explicit fixed uint32>
```

- existing E2E tests keep current deterministic fixture bootstrap;
- only the lifecycle test opts into the real new-game dialog;
- fixed seed is supplied by the test, not Web Crypto;
- `src/runtime/e2eScenario.ts` may hold the query/test-mode helper;
- `src/main.ts` may select between normal E2E fixture and interactive picker;
- `playwright.config.ts` stays read/verify unless proven necessary.

## Seed contract

- player-visible seed is uint32;
- explicit numeric seed becomes exact `GameState.seed`;
- legacy string seed source retains existing `normalizeSeed(string)` behavior;
- real UI may generate/reroll a fresh uint32 suggestion via Web Crypto before state creation;
- same explicit seed reproduces the same deterministic world;
- different explicit seeds must produce different deterministic world evidence;
- no global uniqueness promise;
- no `Date.now()`, wallclock seed or `Math.random()`;
- unit/Browser tests use explicit fixed seeds;
- schema v19 / save v6 / migration none.

## Authorized implementation paths after controller-approved Audit merge only

Primary read/write:

- `src/main.ts`;
- `src/simulation/createInitialGameState.ts`;
- `src/simulation/seed.ts` only if a narrow helper is needed;
- `src/ui/newGameFactionPicker.ts`;
- `src/ui/saveManager.ts`;
- `src/storage/SaveManager.ts` only if ordered deletion is centralized;
- `src/runtime/e2eScenario.ts` for the interactive E2E seam.

Read/verify unless regression proves otherwise:

- `src/storage/AutoSaveController.ts`;
- `src/storage/loadAutosave.ts`;
- `src/runtime/campaignBootstrap.ts`;
- `playwright.config.ts`.

## Required implementation regression/Browser evidence

Regression-first RED must cover:

- fixed current seed path;
- unreachable second campaign with reserved saves;
- pagehide autosave resurrection race;
- current `VITE_E2E=1` dialog bypass.

Final Browser acceptance must prove real reload does not restore old campaign, actual dialog is reached through the dedicated E2E seam, explicit fixed seed is honored/reproducible, a different fixed seed changes deterministic world evidence, and manual save survives.

## Research / reject boundary

- achievements/meta progression: RESEARCH;
- moving-object trajectories: RESEARCH;
- more bot differentiation: RESEARCH;
- bot difficulty: no current player contract;
- Bank/credit system: REJECT without authoritative semantics.

Critical UNKNOWNs:

```text
criticalUnknownsResolved = true
criticalUnknowns = []
```

## Required reading for continuation

1. `AGENTS.md`;
2. `docs/28-audit-first-autonomous-delivery-protocol.md`;
3. `docs/audits/current-batch-audit.md`;
4. `docs/audits/current-execution-state.md`;
5. `docs/audits/batch-history.md`;
6. `docs/audits/completed/post-1.0-strategic-feedback-truth.md`;
7. `docs/project-status.json`;
8. `docs/roadmap-pr-index.json`;
9. `docs/16-execution-roadmap.md`;
10. actual GitHub `main`, Audit #186, reviews/threads/comments and exact workflow state.

## Current stop rule

Finish only Audit #186 fresh exact-head gates, review loop and Ready transition, then STOP.

**Do not merge #186. Do not create an implementation branch. Do not start PR1.**
