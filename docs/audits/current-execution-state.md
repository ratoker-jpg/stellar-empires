# Current execution state

**State:** Audit #186 post-Ready reserved-import P2 resolved in docs / fresh exact-head gates required before Ready  
**Updated:** 2026-08-25  
**Active Audit:** #186 `docs: audit next post-1.0 product batch`  
**Audit work item:** `POST-1.0-NEXT-PRODUCT-3`  
**Branch:** `audit/post-1.0-next-product-3`  
**Exact starting main:** `e974c09e7779b4cf3bbc6d0279b8d35f177a29e6`  
**Runtime baseline:** schema v19 / save format v6  
**Implementation authorized:** false

## Completed boundary

```text
POST-1.0-STRATEGIC-FEEDBACK-TRUTH → COMPLETE
Audit #182 → b09887489db7754f0c0b2672649db9283b879732
PR1 #183  → 83a4942c35aac8d7f0b02f7730f0646c171c98b5
PR2 #184  → 691078ab9ce5b0ab48e7aa69e71fe72322528af0
PR3 #185  → e974c09e7779b4cf3bbc6d0279b8d35f177a29e6
```

There is no PR4.

## Audit decision

Proposed batch:

`POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE`

Exactly one proposed implementation item:

`POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE`

Implementation remains unauthorized until controller-approved Audit merge.

## Strongest verified problem

The player-facing campaign lifecycle authority problem includes:

1. repeated hard-coded default world seed;
2. unsafe/missing New Campaign switch;
3. unsafe manual-slot activation switch;
4. reserved-slot Import authority bypass.

This remains one coherent `System / Saves → persistence authority → bootstrap → seed/new-game` PR.

## Common campaign-switch authority

Actual campaign switches follow:

```text
validate target/intent
→ block new old-page autosave requests
→ drain pending/active work with failure propagation
→ dispose/quiesce old AutoSaveController
→ authoritative persistence switch
→ reload/bootstrap
```

### New Campaign

```text
confirm
→ quiesce A
→ delete autosave.snapshot
→ delete autosave
→ reload
→ loadAutosave() == missing
```

### Manual `Загрузить`

```text
validate/load manual B
→ quiesce A
→ delete stale autosave.snapshot(A)
→ write B state + runtimeMetadata into primary autosave
→ preserve manual B
→ reload
→ loadAutosave() resolves primary B
```

Valid primary wins recovery; snapshot is fallback only for missing/invalid primary. Immediate B snapshot recreation is not required and, if used, may contain B only.

## Import authority — STORAGE ONLY

Direct current-main source proves the P2:

- UI turns blank/reserved target into `undefined`;
- generic `SaveManager.import()` then falls back to payload `slotId`;
- a payload claiming `autosave` or `autosave.snapshot` can therefore write reserved authority.

Direct caller closure:

- production modules importing `SaveManager`: `main.ts`, `campaignBootstrap.ts`, `AutoSaveController.ts`, `loadAutosave.ts`, `ui/saveManager.ts`;
- direct inspection finds `.import(...)` only in `src/ui/saveManager.ts#onImport()`;
- no other production import caller remains UNKNOWN.

Binding player UI contract:

```text
JSON selected
→ require explicit non-empty target
→ reject autosave
→ reject autosave.snapshot
→ call import with explicit manual target only
→ rewrite payload into that manual slot
→ primary/snapshot unchanged
→ current campaign unchanged
→ no quiesce
→ no reload
```

Payload's original `slotId` has no player-facing authority.

To play an imported campaign:

```text
Import → manual slot
→ later Загрузить
→ safe quiesced manual-activation switch
```

Generic `SaveManager.import()` may remain as-is if UI regression proves the boundary sufficient. Narrow API hardening is allowed only if focused regression shows it is minimally safer.

## Failure semantics

Import:

- blank target → explicit validation error, no import;
- reserved target → explicit validation error, no import;
- malformed JSON → existing validation error, no mutation;
- valid manual target → exactly that slot is written;
- import failure → primary/snapshot/current campaign unchanged;
- import never activates a campaign.

Switch failures retain prior contract: no persistence mutation on quiesce failure, no ambiguous reload, no silent disabled-autosave page.

## Required regression-first evidence

RED now covers:

1. hard-coded default seed;
2. New Campaign resurrection;
3. manual activation resurrection;
4. reserved-slot import authority bypass;
5. E2E picker bypass.

Import matrix:

- payload `autosave` + blank target → rejected;
- payload `autosave.snapshot` + target `autosave.snapshot` → rejected;
- payload `autosave` + target `manual-import` → only `manual-import` changes;
- after valid import, campaign activates only when user later presses `Загрузить manual-import`.

## Browser acceptance

Focused lifecycle Browser test must add storage-only import evidence:

1. A active with primary A + snapshot A;
2. import payload whose original ID is `autosave`;
3. blank/reserved target rejected;
4. primary/snapshot A unchanged;
5. no reload and A stays active;
6. import to explicit `manual-import`;
7. manual slot appears while A remains active;
8. `Загрузить manual-import` then reuses safe quiesced manual activation and only then switches.

Existing New Campaign and manual activation acceptance remains binding.

## Seed / E2E contract

- player seed = uint32;
- explicit numeric seed = exact `GameState.seed`;
- legacy string seed remains compatible;
- real UI may use Web Crypto only for pre-state suggestion;
- no wallclock/`Date.now()`/`Math.random()` seed;
- focused Browser real-picker seam remains `VITE_E2E=1 + interactiveNewGame + fixed campaignSeed`;
- schema v19 / save v6 / migration none.

## Authorized implementation paths after Audit merge only

Primary:

- `src/main.ts`;
- `src/ui/saveManager.ts`;
- `src/storage/SaveManager.ts`;
- `src/simulation/createInitialGameState.ts`;
- `src/simulation/seed.ts` only if narrow uint32 helper is needed;
- `src/ui/newGameFactionPicker.ts`;
- `src/runtime/e2eScenario.ts`.

Read/verify unless focused regression proves minimal change necessary:

- `src/storage/AutoSaveController.ts`;
- `src/storage/loadAutosave.ts`;
- `src/runtime/campaignBootstrap.ts`;
- `src/storage/IndexedDbSaveRepository.ts`;
- `playwright.config.ts`.

```text
criticalUnknownsResolved = true
criticalUnknowns = []
```

## Current safety boundary

Audit #186 remains docs-only. No runtime/test/package/workflow implementation changes. No implementation branch exists.

## Next action

After this final docs/control-plane commit:

1. fresh exact-head CI + pinned Graphify + Browser E2E + production Pages smoke;
2. reply to P2 thread with exact storage-only resolution, then resolve it;
3. check unresolved threads/reviews/comments;
4. confirm `mergeable=true`, stable head and live main;
5. finalize PR body;
6. mark Ready;
7. post-Ready exact-head recheck;
8. STOP.

**Do not merge #186. Do not create implementation branch. Do not start PR1.**
