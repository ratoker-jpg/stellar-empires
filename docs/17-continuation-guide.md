# Continuation guide

## Current handoff

Release 1.0 remains closed. Runtime baseline remains schema v19 / save format v6.

Current exact `main` / starting main for active Audit:

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

Binding contract: `docs/audits/current-batch-audit.md`.

## Fresh Audit result

The strongest current player-facing problem is **unsafe/incomplete campaign switching lifecycle**:

1. ordinary fresh-game bootstrap uses hard-coded seed source `stellar-empires-m1`;
2. no safe new-campaign replacement flow exists after reserved autosave/recovery;
3. current manual-slot activation writes selected B into primary autosave and reloads while the old page can still pagehide/visibility-flush current A over B.

These are one bootstrap/persistence/UI lifecycle and remain one proposed implementation PR:

`POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE`

`POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE`

## Common campaign-switch authority

Any campaign switch must first make the old writer inert:

```text
validate target/intent
→ block old-page autosave producers
→ drain pending/active autosave work with failure propagation
→ dispose/quiesce current AutoSaveController
→ perform authoritative persistence switch
→ reload/bootstrap
```

After quiescence, pagehide, hidden visibilitychange, campaign clock and application transitions cannot write the old campaign again.

### New campaign reset

```text
confirm
→ quiesce writer
→ delete autosave.snapshot
→ delete autosave
→ reload
→ loadAutosave() == missing
```

All manual/user-named slots survive.

### Manual slot activation

Direct source: `SaveManager.recover()` prefers valid primary and consults snapshot only when primary is missing/invalid. The Audit therefore removes stale recovery authority explicitly before activating B:

```text
validate/load manual B
→ quiesce old writer A
→ delete stale autosave.snapshot(A)
→ save B state + B runtimeMetadata into primary autosave
→ reload
→ loadAutosave() resolves primary B
```

Manual source B remains unchanged. Immediate B snapshot recreation is not required; if created, it must contain B only.

Failure semantics:

- validation failure → no switch;
- quiesce failure → persistence untouched, A remains authoritative;
- snapshot delete failure → do not overwrite primary;
- primary B write failure after snapshot deletion → do not reload ambiguously; surviving committed primary A remains authority and may be reloaded to restore autosave;
- no failure path may leave autosave silently disabled indefinitely.

## Required regression-first evidence

Implementation RED must cover:

1. fixed default seed/replay issue;
2. new-campaign reset resurrection;
3. manual-slot activation resurrection A-over-B;
4. current `VITE_E2E=1` bypass of real new-game picker.

Manual activation regression minimum:

```text
A in memory
+ primary A
+ snapshot A
+ manual B
+ pending/current old writer A
→ activate B
→ quiesce A
→ remove stale snapshot A
→ primary becomes B
→ simulated pagehide/reload
→ loadAutosave() resolves B
→ never A
→ manual B still exists
```

## Browser acceptance

Focused lifecycle Browser test must cover both switch types.

New campaign:

- cancel preserves A;
- confirm quiesces A before reserved deletion;
- real reload cannot resurrect A;
- actual picker is reached through dedicated E2E mode;
- explicit fixed uint32 seed is used and reproducible;
- manual saves survive.

Manual activation:

- create manual B;
- continue/change current A so A and B are distinguishable;
- ensure primary/snapshot A exist;
- choose `Загрузить` B;
- real reload occurs after A writer quiescence and stale snapshot removal;
- loaded seed/state/runtime evidence is B;
- A cannot overwrite B on pagehide or return via recovery;
- manual B remains present.

## Deterministic E2E seam

Browser suite remains `VITE_E2E=1`. Only lifecycle acceptance opts into real picker semantics:

```text
interactiveNewGame=1
campaignSeed=<explicit fixed uint32>
```

Existing E2E fixtures keep current deterministic bootstrap. Browser tests never depend on Web Crypto.

## Seed contract

- player-visible seed is uint32;
- explicit numeric seed becomes exact `GameState.seed`;
- legacy string seed source keeps existing `normalizeSeed(string)` behavior;
- real UI may generate/reroll a fresh uint32 suggestion via Web Crypto before state creation;
- same explicit seed reproduces the same deterministic world;
- different explicit seeds must change deterministic world evidence;
- no global uniqueness promise;
- no `Date.now()`, wallclock seed or `Math.random()`;
- schema v19 / save v6 / migration none.

## Authorized implementation paths after controller-approved Audit merge only

Primary read/write:

- `src/main.ts`;
- `src/ui/saveManager.ts`;
- `src/storage/SaveManager.ts`;
- `src/simulation/createInitialGameState.ts`;
- `src/simulation/seed.ts` only if narrow helper is needed;
- `src/ui/newGameFactionPicker.ts`;
- `src/runtime/e2eScenario.ts`.

Read/verify unless regression proves otherwise:

- `src/storage/AutoSaveController.ts`;
- `src/storage/loadAutosave.ts`;
- `src/runtime/campaignBootstrap.ts`;
- `src/storage/IndexedDbSaveRepository.ts`;
- `playwright.config.ts`.

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

Finish only Audit #186: resolve binding P1 thread after docs, fresh exact-head gates, Ready transition, post-Ready verification, then STOP.

**Do not merge #186. Do not create an implementation branch. Do not start PR1.**
