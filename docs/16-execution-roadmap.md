# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Release 1.0 closed; docs-only Audit #186 active  
**Updated:** 2026-08-25  
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

`POST-1.0-STRATEGIC-FEEDBACK-TRUTH` is complete. There is no PR4.

## Current entrypoint

Only docs-only Audit #186 is active:

`POST-1.0-NEXT-PRODUCT-3`

Branch: `audit/post-1.0-next-product-3`  
Starting main: `e974c09e7779b4cf3bbc6d0279b8d35f177a29e6`

The strongest current product problem is one coherent **campaign switching lifecycle**:

- real fresh-game bootstrap reuses one hard-coded seed source;
- no safe new-campaign replacement flow exists after reserved autosave/recovery;
- existing manual-slot `Загрузить` can write selected B into primary and then have old pagehide autosave from A overwrite B during reload.

## Proposed successor — not authorized

Batch:

`POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE`

Exactly one proposed implementation PR:

`POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE`

Manual-load repair stays inside this same PR because it uses the same old-writer quiescence and persistence/bootstrap boundary as new-campaign reset.

## Binding common lifecycle contract

Every campaign switch must follow:

```text
validate target/intent
→ disable new old-page autosave requests
→ drain + quiesce/dispose current AutoSaveController
→ perform authoritative persistence switch
→ reload existing bootstrap
```

Pagehide, hidden visibilitychange, campaign-clock checkpoints and application transitions must not be able to re-write the old campaign after quiescence.

### New campaign reset

```text
confirm
→ quiesce old writer
→ delete autosave.snapshot
→ delete autosave
→ reload
→ loadAutosave() == missing
```

Manual slots remain untouched.

### Manual slot activation

Direct source establishes that valid primary `autosave` wins and snapshot is only fallback for missing/invalid primary. The Audit therefore fixes stale-snapshot handling explicitly:

```text
validate/load manual B
→ quiesce old writer A
→ delete autosave.snapshot(A)
→ write B state + B runtimeMetadata to primary autosave
→ reload
→ loadAutosave() resolves primary B
```

The source manual slot B remains untouched. Immediate B snapshot recreation is not required; if used, it must contain B only.

Failure rules:

- validation failure: no switch;
- quiesce failure: mutate no persistence;
- snapshot deletion failure: do not overwrite primary;
- primary B write failure after snapshot deletion: do not reload into ambiguity; reload surviving authoritative primary A if needed to restore normal autosave;
- no failure path may leave autosave silently disabled indefinitely.

## Deterministic interactive E2E seam

Browser suite continues with `VITE_E2E=1`. One focused lifecycle mode may reach the real picker:

```text
VITE_E2E=1
+ interactiveNewGame=1
+ campaignSeed=<fixed uint32>
```

All existing E2E fixtures retain deterministic bootstrap. Browser tests use explicit fixed seeds, never Web Crypto.

## Seed contract

- player-facing seed is uint32;
- explicit numeric value becomes exact persisted `GameState.seed`;
- legacy string seed-source behavior remains compatible;
- real UI may suggest/reroll a fresh uint32 via Web Crypto before state creation;
- same explicit seed reproduces the same world;
- different explicit seeds must produce different deterministic world evidence;
- no global uint32 uniqueness promise;
- no wallclock/`Date.now()`/`Math.random()` seed;
- schema v19 / save v6 / migration none.

## Authorized implementation paths after Audit merge only

Primary:

- `src/main.ts`;
- `src/ui/saveManager.ts`;
- `src/storage/SaveManager.ts`;
- `src/simulation/createInitialGameState.ts`;
- `src/simulation/seed.ts` if a narrow uint32 helper is needed;
- `src/ui/newGameFactionPicker.ts`;
- `src/runtime/e2eScenario.ts`.

Read/verify unless a direct regression proves otherwise:

- `src/storage/AutoSaveController.ts`;
- `src/storage/loadAutosave.ts`;
- `src/runtime/campaignBootstrap.ts`;
- `src/storage/IndexedDbSaveRepository.ts`;
- `playwright.config.ts`.

## Required regression/Browser acceptance

Regression-first RED must cover:

1. fixed default seed/replay issue;
2. new-campaign reset resurrection;
3. manual-slot B activation being overwriteable by old A during pagehide/reload;
4. current E2E dialog bypass.

Browser acceptance must prove both real switch paths:

- reset → real reload → no old resurrection → real dialog → fixed seed;
- manual B activation from changed current A → real reload → B state/runtime/seed wins → A cannot overwrite or recover through stale snapshot → manual B remains present.

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
→ controller lifecycle P1s resolved in binding docs
→ final docs/control-plane commit
→ fresh exact-head CI + Graphify + Browser/Pages
→ resolve review thread only after docs are binding
→ threads/reviews/comments clean + mergeable + main unchanged
→ mark #186 Ready
→ post-Ready exact-head recheck
→ STOP for controller review
```

**Do not merge #186. Do not create the implementation branch. Do not start PR1.**
