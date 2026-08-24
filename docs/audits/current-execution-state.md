# Current execution state

**State:** Audit #186 controller blockers resolved / fresh exact-head gates required before Ready  
**Updated:** 2026-08-24  
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

Strongest verified product gap remains one replay/new-campaign lifecycle:

1. real browser fresh-game bootstrap hard-codes one seed source even though seed drives generated world/PvE variation;
2. after reserved autosave/recovery exists, player UI cannot safely reach another campaign while preserving manual slots.

## Controller findings resolved in Audit contract

### Autosave resurrection race

Current `main.ts` has `pagehide` and hidden `visibilitychange` autosave flushes; application transitions and campaign-clock checkpoints also stage/request saves. `AutoSaveController` can own a timer, pending save, active write and write chain.

Binding safe reset is now:

```text
confirm
→ disable new writes from current page
→ drain + quiesce/dispose autosave writer
→ delete autosave.snapshot
→ delete autosave
→ reload existing bootstrap
```

Manual saves remain untouched.

Failure semantics are fixed:

- cancel before quiesce changes nothing;
- quiesce failure deletes neither reserved slot and must not leave autosave silently disabled;
- snapshot delete failure leaves primary untouched;
- primary delete failure leaves primary as recovery authority;
- after destructive-phase failure, reload of the surviving primary is allowed/preferred to rebuild a normal autosave controller.

Implementation must include a pagehide/reload resurrection regression proving successful reset leaves `loadAutosave()` missing and the old campaign does not reappear.

### E2E new-game reachability

`playwright.config.ts` runs the Browser suite with `VITE_E2E=1`, while current `createFreshGame()` bypasses `selectNewGameCampaign()` whenever E2E runtime is enabled.

The fixed contract authorizes a narrow deterministic E2E-only seam, semantically:

```text
VITE_E2E=1
+ interactiveNewGame=1
+ explicit campaignSeed=<uint32>
```

Default Browser fixtures remain unchanged. Only the focused lifecycle test opts into the real interactive picker. The test supplies a fixed seed and never depends on Web Crypto.

`src/runtime/e2eScenario.ts` is now an authorized implementation path for this seam; `playwright.config.ts` remains read/verify unless a regression proves a config change necessary.

## Seed/persistence contract

- player-facing seed is uint32;
- explicit numeric seed becomes exact persisted `GameState.seed`;
- legacy string seed source retains existing `normalizeSeed(string)` behavior;
- real UI may generate/reroll a fresh uint32 suggestion using Web Crypto before state creation;
- no global uniqueness promise;
- no `Date.now()`, wallclock seed or `Math.random()`;
- Browser/unit tests use explicit fixed seeds;
- schema v19 / save v6 / migration none.

Critical UNKNOWN state:

```text
criticalUnknownsResolved = true
criticalUnknowns = []
```

## Current safety boundary

Audit #186 remains docs-only. No `src/`, `tests/`, package/workflow or runtime dependency change is allowed in this PR. No implementation branch exists.

## Next action

After the final docs/control-plane commit, require new exact-head CI + pinned Graphify + Browser E2E + production Pages smoke. Then check threads/reviews/comments, mergeability, stable head and live main; finalize PR body; mark #186 Ready; re-check the same exact head; STOP.

**Do not merge #186. Do not create the implementation branch. Do not start PR1.**
