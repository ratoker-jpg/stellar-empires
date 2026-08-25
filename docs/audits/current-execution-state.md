# Current execution state

**State:** only implementation PR #187 / final batch closure staged for controller review  
**Updated:** 2026-08-25  
**Batch:** `POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE`  
**Accepted Audit:** #186 — MERGED at `de5e37f4ac69bbcf8707267272fe03a1e2c3b7ba`  
**Active PR:** #187 `feat: add safe replayable campaign lifecycle`  
**Branch:** `agent/post-1.0-replayable-campaign-lifecycle`  
**Work item:** `POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE`  
**Exact starting main:** `de5e37f4ac69bbcf8707267272fe03a1e2c3b7ba`  
**Runtime:** schema v19 / save format v6 / migration none

## Accepted Audit boundary

Audit #186 is merged and controller-accepted at:

`de5e37f4ac69bbcf8707267272fe03a1e2c3b7ba`

Its accepted contract is preserved verbatim at:

`docs/audits/completed/post-1.0-replayable-campaign-lifecycle.md`

Audit #186 authorized exactly one implementation item: `POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE`. There is no PR2.

## Regression-first evidence

Historical RED commit:

`e1b402442b437d581bb10b59782332a47a354b82`

Historical RED CI: **#2300**.

Assets, lint and typecheck were green before the intended lifecycle assertions failed. The semantic RED exposed:

1. ordinary fresh-game bootstrap hard-coding one seed source;
2. New Campaign resurrection by the old autosave writer;
3. manual Load B being overwritten by old in-memory campaign A;
4. Import payload authority reaching reserved `autosave` / `autosave.snapshot` destinations;
5. `VITE_E2E=1` bypassing the real new-game picker.

## Delivered lifecycle

#187 implements the audited common authority boundary without changing persistence versions.

### Seed / fresh game

- player-facing seed is exact uint32 `0..4294967295`;
- numeric seeds persist exactly as `GameState.seed` without string re-hashing;
- legacy string seed source compatibility remains;
- the real picker exposes seed input plus Web Crypto reroll/suggestion before state creation;
- no wallclock/`Date.now()`/`Math.random()` simulation seed;
- same explicit seed + same faction/settings reproduces deterministic initial-world evidence;
- different explicit seeds change deterministic world evidence.

### Common campaign switch authority

Every real campaign switch first enters one shared main-level single-flight gate. A second Load/New Campaign attempt while a switch is active is rejected before its lifecycle callback starts, so it cannot quiesce, delete, save, enter recovery, or issue a second reload.

The active switch then follows:

```text
validate target/intent
→ block old-page autosave producers
→ drain pending/active old-writer work with failure propagation
→ dispose/quiesce old AutoSaveController
→ authoritative persistence switch
→ reload through existing bootstrap
```

New Campaign:

```text
confirm
→ quiesce A
→ delete autosave.snapshot
→ delete autosave
→ reload
→ loadAutosave() missing
→ real new-game picker/bootstrap
```

Manual Load:

```text
validate/load manual B
→ quiesce A
→ delete stale autosave.snapshot(A)
→ write B state + runtimeMetadata as primary autosave
→ preserve manual B
→ reload
→ primary B wins recovery
```

A failed quiesce mutates no reserved authority. Snapshot deletion precedes primary deletion/write so stale A recovery cannot override a successful switch. The page does not intentionally continue with autosave silently disabled after a failed authoritative switch.

### Import is storage only

Player Import requires an explicit non-empty manual target and rejects `autosave` and `autosave.snapshot`.

Payload `slotId` does not grant destination authority. Import writes only the explicit manual target, does not quiesce the writer, does not reload, and does not activate the imported campaign. Activation happens only when the user later presses `Загрузить`, which reuses the safe campaign-switch path above.

### Save-manager failure/race protection

The save-manager async rendering path ignores stale render completions so an older asynchronous list result cannot overwrite newer lifecycle state after a switch/import refresh.

A rendered manual slot can become missing/invalid before click. `Загрузить` now catches that activation rejection, routes a clear error through the existing save-manager message/status path, and re-enables its action button. Validation failure occurs before quiescence, so authority is unchanged and no reload is issued; the rejection is handled rather than escaping as an unhandled promise rejection.

## Focused acceptance

Unit/storage regression coverage proves:

- uint32 boundaries, exact numeric persistence, same-seed reproduction and different-seed variation;
- legacy string seed compatibility;
- quiescence-before-mutation for New Campaign and manual Load;
- failure ordering for snapshot/primary authority changes;
- manual source slot preservation;
- Import target rejection and storage-only destination rewriting;
- reserved authority remains unchanged by Import;
- controlled Load B → New Campaign and New Campaign → Load B concurrency is single-flight, the second switch starts no persistence mutation, and only one reload intent is produced;
- stale save-manager render completion cannot overwrite the newest rendered state.

Focused Browser `tests/e2e/campaignLifecycle.spec.ts` proves on the real app/storage path:

- real picker reached through the deterministic interactive-new-game seam;
- fixed seed honored and reproduced after another campaign;
- a different seed changes deterministic galaxy evidence;
- New Campaign cancel preserves A;
- New Campaign confirm clears reserved A authority and real reload cannot resurrect A;
- manual saves survive reset;
- a real autosave mechanism creates a non-null `autosave.snapshot` containing A;
- Import leaves active A, primary A and snapshot A unchanged;
- Import writes distinct campaign B to `manual-import` without reload;
- only `Загрузить manual-import` performs the real reload and makes B authoritative;
- after Load/reload, primary and any recreated snapshot contain B, never stale A;
- manual-import/manual-b/manual-survivor remain manual slots with their expected campaign seeds;
- when a previously rendered manual slot is removed before `Загрузить`, the player receives a visible error, the Load control is re-enabled, the current document/authority remains active, and no page-level unhandled error appears.

## Pre-closure runtime gates

Exact pre-closure runtime head:

`5e60bd7998e031b04b67826caae6e7103c6d7f3b`

Controller-verified on that head:

- CI #2314 — SUCCESS, including asset audit/lint/typecheck/tests/build plus Campaign catch-up performance, Compressed progression, Organic Obelisk, Organic Fresh Game → Terminal, Organic terminal save-load/partition determinism, and bounded faction terminal matrix;
- Graphify #1443 — SUCCESS;
- Browser E2E #1544 — SUCCESS;
- production Pages smoke #1544 — SUCCESS.

These are pre-closure evidence only and are not final exact-head evidence after later control-plane or implementation commits.

## Batch closure

The closing chain is:

```text
Audit #186 → de5e37f4ac69bbcf8707267272fe03a1e2c3b7ba
PR1 #187  → implementation + closure PR; generated squash SHA unknown until controller merge
```

#187 is the only implementation PR. Runtime implementation is complete. Closure is staged now and becomes COMPLETE only after controller-approved merge of #187. No #187 merge SHA is invented. There is no PR2.

After controller merge, the only authorized next category is a fresh docs-only Audit from fresh `main`. Do not start it before merge.

## Exact next action

Require fresh exact-head CI + Graphify + Browser E2E + production Pages smoke after the final implementation/control-plane commit; inspect inline threads, submitted reviews, conversation comments and changed files; verify `mergeable=true`, stable head/base and live `main`; finalize the PR body; mark #187 Ready; perform a post-Ready exact-head recheck; then STOP for controller review.

**Do not merge #187. Do not create PR2. Do not start the next Audit.**
