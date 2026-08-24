# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Release 1.0 closed; fresh docs-only Audit #186 active  
**Updated:** 2026-08-24  
**Verified current main / exact Audit starting main:** `e974c09e7779b4cf3bbc6d0279b8d35f177a29e6`  
**Last merged PR:** #185 `fix: make combat ranking victories truthful`  
**Active PR:** #186 `docs: audit next post-1.0 product batch`  
**Runtime:** schema v19 / save format v6  
**Implementation authorized:** false

## Completed boundary

```text
Audit #182 → b09887489db7754f0c0b2672649db9283b879732
PR1 #183  → 83a4942c35aac8d7f0b02f7730f0646c171c98b5
PR2 #184  → 691078ab9ce5b0ab48e7aa69e71fe72322528af0
PR3 #185  → e974c09e7779b4cf3bbc6d0279b8d35f177a29e6
```

`POST-1.0-STRATEGIC-FEEDBACK-TRUTH` is complete. There is no PR4. Audit #182 is archived and is not reusable successor authorization.

## Current entrypoint

Only docs-only Audit #186 is active:

`POST-1.0-NEXT-PRODUCT-3`

Branch: `audit/post-1.0-next-product-3`  
Starting main: `e974c09e7779b4cf3bbc6d0279b8d35f177a29e6`

Pinned Graphify 0.8.38 plus direct source/tests/UI identified one coherent replayability/lifecycle gap:

- real fresh-game bootstrap uses the same hard-coded seed source;
- existing/terminal autosave has no safe normal UI path to another campaign while preserving manual saves.

## Proposed successor — not authorized

Batch:

`POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE`

Exactly one proposed implementation PR:

`POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE`

## Binding lifecycle contract

Controller direct-source review resolved two blockers before Audit readiness.

### Safe autosave reset

The old campaign can be resurrected during reload because `pagehide`, hidden `visibilitychange`, campaign-clock checkpoints and application transitions can feed a live `AutoSaveController`.

If Audit #186 is accepted, reset must follow:

```text
confirm
→ disable new autosave requests from current page
→ drain + quiesce/dispose current autosave writer
→ delete autosave.snapshot
→ delete autosave
→ reload existing bootstrap
```

Manual/user-named slots remain untouched.

Failure rules:

- cancel before quiesce: no change;
- quiesce failure: delete nothing;
- snapshot delete failure: primary stays untouched;
- primary delete failure: primary remains recovery authority;
- no failure path may leave the page silently with autosave disabled; reloading the surviving primary is allowed/preferred after destructive-phase failure.

Implementation acceptance must include an explicit pagehide/reload regression proving the old campaign cannot be written back after successful deletion.

### Deterministic interactive E2E seam

The Browser suite runs with `VITE_E2E=1`, and current E2E bootstrap bypasses the real new-game dialog. The focused lifecycle test therefore gets one narrow test-only mode, semantically:

```text
VITE_E2E=1
+ interactiveNewGame=1
+ campaignSeed=<fixed uint32>
```

All existing E2E fixtures retain their current deterministic bootstrap. Only the lifecycle test reaches the real picker, and it supplies an explicit fixed seed so Browser acceptance does not depend on Web Crypto.

`src/runtime/e2eScenario.ts` is an authorized implementation path for that seam; `playwright.config.ts` remains read/verify by default.

## Seed contract

- player-facing seed is uint32;
- explicit numeric value becomes exact persisted `GameState.seed`;
- legacy string seed-source behavior remains compatible;
- real UI may suggest/reroll a fresh uint32 via Web Crypto before state creation;
- same explicit seed reproduces the same world;
- different explicit seeds must produce different deterministic world evidence;
- no global uint32 uniqueness promise;
- no wallclock/`Date.now()`/`Math.random()` seed;
- tests use fixed seeds;
- schema v19 / save v6 / migration none.

## Authorized implementation paths after Audit merge only

Primary:

- `src/main.ts`;
- `src/simulation/createInitialGameState.ts`;
- `src/simulation/seed.ts` if a narrow uint32 helper is needed;
- `src/ui/newGameFactionPicker.ts`;
- `src/ui/saveManager.ts`;
- `src/storage/SaveManager.ts` if ordered deletion is centralized;
- `src/runtime/e2eScenario.ts` for the E2E-only interactive mode.

Read/verify unless a regression proves otherwise:

- `src/storage/AutoSaveController.ts`;
- `src/storage/loadAutosave.ts`;
- `src/runtime/campaignBootstrap.ts`;
- `playwright.config.ts`.

## Research / rejected items

Not current implementation:

- achievements/meta progression — RESEARCH;
- moving-object trajectories — RESEARCH;
- more bot differentiation — RESEARCH;
- `BotDifficulty` semantics — no current player promise;
- Bank/credit gameplay — REJECT without authoritative semantics.

## Current delivery sequence

```text
fresh main e974c09...
→ docs-only Audit #186
→ controller blockers resolved in binding docs
→ final docs/control-plane commit
→ fresh exact-head CI + Graphify + Browser/Pages
→ threads/reviews/comments clean + mergeable + main unchanged
→ mark #186 Ready
→ re-check exact head and gates
→ STOP for controller review
```

**Do not merge #186. Do not create the implementation branch. Do not start PR1.**
