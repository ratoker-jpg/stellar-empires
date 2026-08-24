# Current execution state

**State:** Audit #186 post-Ready P1 resolved in docs / fresh exact-head gates required before Ready  
**Updated:** 2026-08-25  
**Active Audit:** #186 `docs: audit next post-1.0 product batch`  
**Audit work item:** `POST-1.0-NEXT-PRODUCT-3`  
**Branch:** `audit/post-1.0-next-product-3`  
**Exact starting main:** `e974c09e7779b4cf3bbc6d0279b8d35f177a29e6`  
**Runtime baseline:** schema v19 / save format v6

## Completed boundary

```text
POST-1.0-STRATEGIC-FEEDBACK-TRUTH → COMPLETE
Audit #182 → b09887489db7754f0c0b2672649db9283b879732
PR1 #183  → 83a4942c35aac8d7f0b02f7730f0646c171c98b5
PR2 #184  → 691078ab9ce5b0ab48e7aa69e71fe72322528af0
PR3 #185  → e974c09e7779b4cf3bbc6d0279b8d35f177a29e6
```

Archive: `docs/audits/completed/post-1.0-strategic-feedback-truth.md`. There is no PR4.

## Fresh Audit decision

Proposed batch:

`POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE`

Exactly one proposed implementation item:

`POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE`

Implementation remains unauthorized until controller-approved Audit merge.

Strongest verified product problem is now broader and more precise: **campaign switching lifecycle is unsafe/incomplete**.

1. ordinary fresh-game bootstrap hard-codes one seed source even though seed drives generated world/PvE variation;
2. there is no safe new-campaign replacement flow after reserved autosave/recovery exists;
3. current manual-slot activation writes selected B into primary autosave and reloads while the old page can still pagehide-flush in-memory A over B.

These remain one coherent persistence/bootstrap/browser lifecycle and one implementation PR.

## Binding common campaign-switch authority

Any switch away from current in-memory campaign A must obey:

```text
validate target/intent
→ block new old-page autosave requests
→ drain pending/active autosave work with failure propagation
→ dispose/quiesce old AutoSaveController
→ perform authoritative persistence switch
→ reload through existing bootstrap
```

After quiescence, pagehide, hidden visibilitychange, campaign clock and application transitions must not be able to write A again.

### New campaign reset

```text
confirm
→ quiesce A writer
→ delete autosave.snapshot
→ delete autosave
→ reload
→ loadAutosave() == missing
```

Manual/user-named saves remain untouched.

### Manual slot activation

Current direct-source recovery semantics prefer valid primary and only use snapshot when primary is missing/invalid. To prevent stale A from remaining recovery authority after selecting manual B, the Audit fixes snapshot handling as:

```text
validate/load manual B
→ quiesce A writer
→ delete stale autosave.snapshot(A)
→ write B state + B runtimeMetadata to primary autosave
→ reload
→ loadAutosave() resolves primary B
```

Manual source slot B remains preserved. Immediate recreation of a B snapshot is not required; if implementation creates one immediately, it may contain only B.

Failure semantics:

- validation failure → no switch;
- quiesce failure → mutate no persistence; A remains authoritative;
- stale-snapshot delete failure → do not overwrite primary A;
- primary B write failure after snapshot deletion → do not reload into ambiguity; surviving committed primary A remains authority and reload A is preferred to restore a normal autosave controller;
- no failure path may leave autosave silently disabled indefinitely.

Implementation must include storage/unit regression proving A cannot overwrite B on simulated pagehide/reload and `loadAutosave()` resolves B while manual B remains present.

## Deterministic Browser seam

Browser suite still runs with `VITE_E2E=1`, while current E2E bootstrap bypasses `selectNewGameCampaign()`. The fixed contract retains the narrow deterministic test-only seam:

```text
VITE_E2E=1
+ interactiveNewGame=1
+ explicit campaignSeed=<uint32>
```

Existing Browser fixtures remain unchanged; only lifecycle acceptance reaches the real picker. Fixed Browser seeds never depend on Web Crypto.

Focused Browser acceptance must cover both campaign switches:

- new-campaign reset survives real reload without resurrection and reaches the actual dialog;
- manual B activation after distinguishable current A reloads into B, never A, with stale snapshot unable to recover A and manual B still present.

## Seed/persistence contract

- player-facing seed is uint32;
- explicit numeric seed becomes exact persisted `GameState.seed`;
- legacy string seed source keeps existing `normalizeSeed(string)` behavior;
- real UI may generate/reroll a fresh uint32 suggestion with Web Crypto before state creation;
- no global uniqueness promise;
- no `Date.now()`, wallclock seed or `Math.random()`;
- Browser/unit tests use explicit fixed seeds;
- schema v19 / save v6 / migration none.

## Authorized implementation paths after Audit merge only

Primary read/write:

- `src/main.ts`;
- `src/ui/saveManager.ts`;
- `src/storage/SaveManager.ts`;
- `src/simulation/createInitialGameState.ts`;
- `src/simulation/seed.ts` only if narrow uint32 helper is needed;
- `src/ui/newGameFactionPicker.ts`;
- `src/runtime/e2eScenario.ts`.

Read/verify unless direct regression proves a necessary minimal change:

- `src/storage/AutoSaveController.ts`;
- `src/storage/loadAutosave.ts`;
- `src/runtime/campaignBootstrap.ts`;
- `src/storage/IndexedDbSaveRepository.ts`;
- `playwright.config.ts`.

Critical UNKNOWN state:

```text
criticalUnknownsResolved = true
criticalUnknowns = []
```

## Current safety boundary

Audit #186 remains docs-only. No `src/`, `tests/`, package/workflow or runtime dependency changes are allowed in this PR. No implementation branch exists.

## Next action

After final docs/control-plane commit: fresh exact-head CI + pinned Graphify + Browser E2E + production Pages smoke; reply to and resolve the manual-activation P1 thread only after binding docs contain quiescence/snapshot/regression coverage; check reviews/comments, mergeability, stable head and live main; finalize PR body; mark #186 Ready; post-Ready recheck; STOP.

**Do not merge #186. Do not create the implementation branch. Do not start PR1.**
