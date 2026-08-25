# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Release 1.0 closed; docs-only Audit #186 active  
**Updated:** 2026-08-25  
**Verified current main / Audit starting main:** `e974c09e7779b4cf3bbc6d0279b8d35f177a29e6`  
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

Proposed successor, still unauthorized:

`POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE`

Exactly one implementation PR:

`POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE`

## Strongest verified lifecycle problem

One coherent player-facing problem now includes:

- hard-coded repeated fresh-game seed source;
- unsafe/missing New Campaign replacement;
- unsafe manual `Загрузить` authority switch;
- Import reserved-slot authority bypass.

All are inside one `System / Saves → authority → bootstrap` boundary.

## Binding campaign-switch rule

Actual campaign switches:

```text
validate target/intent
→ quiesce old autosave writer
→ authoritative persistence switch
→ reload/bootstrap
```

New Campaign:

```text
quiesce A
→ delete autosave.snapshot
→ delete autosave
→ reload
```

Manual activation:

```text
validate B
→ quiesce A
→ delete stale autosave.snapshot(A)
→ write B primary
→ reload
```

Manual source B survives. Valid primary wins recovery; stale A snapshot must not survive B activation.

## Binding Import rule — storage only

Import is **not** a campaign switch.

Direct source/caller audit resolves that `src/ui/saveManager.ts#onImport()` is the only production `SaveManager.import(...)` caller.

Player UI must:

- require explicit non-empty target;
- reject `autosave`;
- reject `autosave.snapshot`;
- never pass `undefined`;
- ignore payload `slotId` for destination authority;
- always rewrite valid payload into the explicit manual target.

Therefore:

```text
Import JSON → manual slot only
→ primary/snapshot unchanged
→ current campaign unchanged
→ no writer quiesce
→ no reload
```

An imported campaign becomes active only later through `Загрузить`, which uses the safe campaign-switch contract.

Generic `SaveManager.import()` may be narrowly hardened if regression evidence shows it is the minimal safer implementation; no persistence rewrite.

## Import regressions

Required RED/acceptance:

1. payload `slotId=autosave` + blank target → reject before mutation;
2. payload `slotId=autosave.snapshot` + target `autosave.snapshot` → reject;
3. payload `slotId=autosave` + target `manual-import` → store only manual slot, authority unchanged;
4. later `Загрузить manual-import` → quiesced switch, then and only then activation.

## Browser acceptance

Focused lifecycle Browser acceptance must prove:

- New Campaign real reload cannot resurrect A and reaches real picker through deterministic E2E seam;
- manual B activation quiesces A, removes stale A snapshot and reloads into B;
- storage-only Import rejects blank/reserved targets, preserves A authority/no reload, stores explicit manual target, and activates only through subsequent safe `Загрузить`.

## Seed / E2E contract

```text
VITE_E2E=1
+ interactiveNewGame=1
+ campaignSeed=<fixed uint32>
```

- explicit uint32 = exact `GameState.seed`;
- legacy string seed compatible;
- Web Crypto only for real-user pre-state suggestion;
- no wallclock/`Date.now()`/`Math.random()` seed;
- schema v19 / save v6 / migration none.

## Authorized implementation paths after Audit merge only

Primary:

- `src/main.ts`;
- `src/ui/saveManager.ts`;
- `src/storage/SaveManager.ts`;
- `src/simulation/createInitialGameState.ts`;
- `src/simulation/seed.ts` if narrow helper needed;
- `src/ui/newGameFactionPicker.ts`;
- `src/runtime/e2eScenario.ts`.

Read/verify:

- `src/storage/AutoSaveController.ts`;
- `src/storage/loadAutosave.ts`;
- `src/runtime/campaignBootstrap.ts`;
- `src/storage/IndexedDbSaveRepository.ts`;
- `playwright.config.ts`.

## Current delivery sequence

```text
main e974c09...
→ docs-only Audit #186
→ binding reserved-import P2 resolution
→ fresh exact-head CI + Graphify + Browser/Pages
→ reply/resolve P2 thread
→ threads/reviews/comments clean
→ mergeable + main/head stable
→ final PR body
→ Ready
→ post-Ready recheck
→ STOP
```

**Do not merge #186. Do not create implementation branch. Do not start PR1.**
