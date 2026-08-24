# POST-1.0-NEXT-PRODUCT-3 — fresh product Audit

**State:** docs-only Audit / controller review required  
**Audit PR:** #186 `docs: audit next post-1.0 product batch`  
**Starting `main`:** `e974c09e7779b4cf3bbc6d0279b8d35f177a29e6`  
**Starting tree:** `150ce0012cf2fb9e607b0dda33b9e7ecc013c92f`  
**Previous completed batch:** `POST-1.0-STRATEGIC-FEEDBACK-TRUTH`  
**Proposed next batch:** `POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE`  
**Implementation count:** 1 coherent PR  
**Runtime baseline:** schema v19 / save format v6  
**Implementation authorized:** false  
**Critical UNKNOWNs resolved:** true

This Audit remains docs/control-plane only. It authorizes no implementation before controller-approved merge.

## 1. Fresh-main reconciliation

Live `main` baseline is:

`e974c09e7779b4cf3bbc6d0279b8d35f177a29e6`

Completed chain:

```text
Audit #182 → b09887489db7754f0c0b2672649db9283b879732
PR1 #183  → 83a4942c35aac8d7f0b02f7730f0646c171c98b5
PR2 #184  → 691078ab9ce5b0ab48e7aa69e71fe72322528af0
PR3 #185  → e974c09e7779b4cf3bbc6d0279b8d35f177a29e6
```

`POST-1.0-STRATEGIC-FEEDBACK-TRUTH` is COMPLETE. Archive: `docs/audits/completed/post-1.0-strategic-feedback-truth.md`. There is no PR4.

## 2. Graphify evidence

Repository-pinned Graphify is `0.8.38`. Baseline runtime-tree evidence from #1402 remains valid for the starting runtime tree:

- 464 code files;
- 3,639 nodes;
- 12,757 edges;
- 145 communities;
- 100% extraction;
- exit 0.

Graphify is an accelerator only. Selected findings and controller blockers below are confirmed by direct source/tests/UI.

## 3. Fresh product sweep

| Domain | Classification | Current-main finding |
|---|---|---|
| economy / research / production | VERIFIED | Existing producer→consumer paths remain wired; no new blocker found. |
| fleets / combat / PvE / Arena | VERIFIED / DISPROVED stale gaps | Stable combat identity, Arena canonical reports, tactical snapshots and combat-only ranking remain closed. |
| intelligence / logistics / colonization | VERIFIED | Existing deterministic runtime and UI consumers remain live. |
| bots | VERIFIED + RESEARCH | Personality/risk/outcome recovery has consumers; `difficulty` remains internal dead metadata without a current player-facing contract. |
| endgame | VERIFIED | Organic Obelisk, Fresh Game → Terminal, terminal freeze/save-load and bounded faction matrix remain permanent gates. |
| save/load / campaign switching | VERIFIED GAP | Campaign switching lifecycle is unsafe/incomplete: no safe new-campaign replacement path, and current manual-slot activation can race with the old autosave writer during reload. |
| replayability / browser UX | VERIFIED GAP | Real fresh games reuse one hard-coded seed source; current E2E harness also bypasses the interactive picker required by lifecycle Browser acceptance. |
| advertised mechanics | VERIFIED seam / DECISION | Bank credit-efficiency remains evidence-gated; no credit system is authorized. |

## 4. Strongest VERIFIED gap — campaign switching lifecycle

This is one coherent player-facing lifecycle/data-flow problem, not multiple independent features.

### 4.1 Hard-coded real-browser seed

`src/main.ts#createFreshGame()` currently uses:

```text
createInitialGameState('stellar-empires-m1', ...)
```

for ordinary fresh campaigns. The seed drives generated universe, neutral forces, space objects and deterministic world-event choice. Same seed source reproduces the same initial state; different explicit seeds must produce different deterministic world evidence.

**Classification:** VERIFIED replayability gap.

### 4.2 No safe new-campaign lifecycle

Bootstrap restores a valid primary autosave, or `autosave.snapshot` if primary is missing/invalid, before fresh-game selection. Reserved slots are protected in the current UI and terminal campaigns intentionally freeze.

A player therefore has no normal safe in-app route to replace the current local campaign and reach the real new-game picker while preserving manual saves.

**Classification:** VERIFIED lifecycle gap.

### 4.3 New-campaign autosave resurrection race

`src/main.ts` registers `pagehide` and hidden `visibilitychange` handlers that call the autosave flush path. Campaign-clock checkpoints and application transitions can also stage/request saves. `AutoSaveController` may own a delayed timer, pending save, active write and write chain.

Therefore deleting `autosave.snapshot` and `autosave` before quiescing the old writer is unsafe: reload/pagehide can recreate the old campaign after deletion.

**Classification:** VERIFIED persistence/lifecycle blocker.

### 4.4 Manual-save activation resurrection race

Current `src/ui/saveManager.ts#activateSlot()` does:

```text
load selected manual slot
→ save selected state/runtime metadata into autosave
→ window.location.reload()
```

But the same old page still owns the live autosave writer. During reload, `pagehide`/hidden visibility can request+flush the old in-memory campaign and overwrite the newly selected manual state in primary `autosave`.

This is the same campaign-switch authority race as new-campaign reset. The implementation contract must therefore use one common rule:

```text
ANY CAMPAIGN SWITCH
→ quiesce old writer
→ perform authoritative persistence switch
→ reload/bootstrap
```

Minimum covered switches:

- `Новая партия`;
- `Загрузить` / activate manual save.

**Classification:** VERIFIED P1 lifecycle/data-integrity blocker.

### 4.5 Current Browser harness bypasses the new-game dialog

`playwright.config.ts` runs Browser E2E with `VITE_E2E=1`. Current `createFreshGame()` uses fixed E2E selection whenever E2E runtime is enabled and bypasses `selectNewGameCampaign()`.

A lifecycle Browser test cannot truthfully claim `reset → real new-game dialog → explicit seed` without a narrow deterministic E2E seam.

**Classification:** VERIFIED Browser-acceptance blocker.

## 5. Lower-priority findings

- Bank / credit efficiency: producer exists, authoritative credit semantics do not. **REJECT direct implementation**.
- `BotDifficulty`: dead/internal metadata, no current player promise. **RESEARCH / no standalone PR**.
- achievements/meta progression: **RESEARCH**.
- moving-object trajectories: **RESEARCH**.
- further bot differentiation: **RESEARCH**.

Nemexia remains reference, never specification. Campaign-switch/replay lifecycle is `KEEP_STELLAR`; achievements/trajectories remain `RESEARCH`; direct Bank/credit formula port is `REJECT`.

## 6. DISPROVED stale gaps

Do not reopen without new evidence:

- Organic Fresh Game → Terminal blocked;
- Organic Obelisk unavailable;
- terminal save/load/partition determinism missing;
- faction terminal closure Aegis-only;
- normal/Arena stable combat identity missing;
- Arena absent from unified reports;
- immutable tactical combat feedback missing;
- ranking generic-success inflation;
- bots unable to perform legal PvP;
- bot personalities having no runtime effect;
- research UI/runtime requirement drift;
- fake multiple construction queues;
- wholly static world;
- broad Scrapyard/Trade Center/Ecology advertised-effect ghosts.

## 7. DECISION — one implementation PR

Proposed batch:

`POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE`

Only work item:

`POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE`

Exact implementation count: **1**.

One PR remains the minimum coherent boundary because seed authority, new-campaign reset and manual-save activation all traverse the same bootstrap/persistence/UI lifecycle. Splitting manual activation into a separate PR would duplicate the same writer-quiescence coordination and leave an incomplete campaign-switch boundary.

Implementation remains unauthorized until controller-approved merge of Audit #186.

## 8. Player-facing seed contract

The player-facing campaign seed is an explicit **uint32 numeric seed**.

Binding semantics:

- explicit numeric seed becomes existing persisted `GameState.seed` exactly;
- legacy string seed source remains compatible through existing `normalizeSeed(string)` semantics;
- real UI generates a fresh uint32 seed **suggestion** before GameState creation;
- player may reroll the suggestion;
- same explicit seed + same faction/settings reproduces the same deterministic initial world;
- different explicit seeds must produce demonstrably different deterministic world evidence;
- if restart knows the current campaign seed, implementation may guarantee only the immediate suggestion differs from the current seed;
- no global-history uniqueness promise is made for uint32;
- Web Crypto may be used only for real-user pre-state suggestion;
- `Date.now()`, wallclock-derived seed and `Math.random()` are forbidden;
- unit/Browser tests use explicit fixed seeds only.

Persistence stays schema v19 / save v6 / migration none.

## 9. Binding common campaign-switch authority

### 9.1 General rule

Any switch away from the current in-memory campaign must obey:

```text
validate target/intent
→ block new autosave requests from old page
→ drain pending/active old-writer work with failure propagation
→ dispose/quiesce old AutoSaveController
→ perform authoritative persistence switch
→ reload through existing bootstrap
```

After quiescence, no `pagehide`, `visibilitychange`, campaign-clock checkpoint, application transition or other old-page callback may be able to write the old campaign again.

`src/storage/AutoSaveController.ts` remains **read/verify by default**. Main-level lifecycle coordination is preferred if it can prove this contract. A minimal controller change is allowed only if a regression proves existing public semantics cannot safely express quiescence.

### 9.2 New-campaign reset ordering

After destructive confirmation:

1. block new old-page autosave requests;
2. drain/quiesce/dispose the writer with failure propagation;
3. delete `autosave.snapshot`;
4. only after snapshot deletion succeeds delete primary `autosave`;
5. preserve all manual/user-named slots;
6. reload through existing bootstrap;
7. `loadAutosave()` must be `missing`, so the real new-game path can run;
8. pagehide/visibility cannot resurrect the old campaign.

```text
confirm
→ quiesce old writer
→ delete autosave.snapshot
→ delete autosave
→ reload/bootstrap
→ loadAutosave() == missing
→ interactive new-game picker
```

### 9.3 Manual-slot activation snapshot authority decision

Direct source resolves snapshot precedence now:

- `loadAutosave()` delegates to `SaveManager.recover()`;
- a valid primary `autosave` always wins;
- `autosave.snapshot` is consulted only if primary is missing/invalid.

However leaving an old-campaign snapshot after activating manual B would preserve stale A as future fallback. The binding manual activation contract therefore **must remove the stale snapshot before replacing primary**. No old-A recovery snapshot may remain after the switch.

Immediate recreation of a snapshot is **not required** for correctness. The authoritative minimum is:

```text
manual B validated
→ quiesce old writer A
→ delete stale autosave.snapshot(A)
→ save B state + B runtimeMetadata into primary autosave
→ reload/bootstrap
→ loadAutosave() resolves primary B
```

The manual source slot B itself is never modified/deleted. Normal autosave may create a fresh B-derived recovery snapshot later. If implementation chooses to recreate the snapshot immediately, it may contain only B and must not reintroduce A.

This decision removes the critical UNKNOWN: stale A cannot override or later recover over the selected campaign after a successful manual switch.

### 9.4 Manual-slot activation success ordering

On `Загрузить` manual slot B:

1. validate/load B without changing active state;
2. block new autosave requests from current campaign A;
3. drain pending timer/save, active write and write chain with failure propagation;
4. dispose/quiesce old writer A;
5. delete stale `autosave.snapshot` while primary A remains authoritative;
6. only after snapshot deletion succeeds, write B state and B runtime metadata into primary `AUTOSAVE_SLOT_ID`;
7. keep manual slot B unchanged;
8. reload through existing bootstrap;
9. bootstrap must resolve primary B, never old A;
10. pagehide/visibility during reload cannot write A back.

`src/storage/SaveManager.ts` is implementation-authorized for a narrow ordered campaign-switch helper if that reduces duplication. No new persistence subsystem is authorized.

## 10. Binding failure semantics

### New-campaign reset

- cancel before quiesce → no state change; current autosave continues normally;
- quiesce/drain failure → delete neither reserved slot; keep/re-enable a working autosave path or reload surviving current primary;
- snapshot delete failure → primary remains untouched/recoverable;
- primary delete failure after snapshot deletion → primary remains recovery authority;
- after destructive-phase failure, do not leave the current page indefinitely with autosave silently disabled; reload surviving primary is allowed/preferred.

### Manual-slot activation

- manual load/validation failure → no switch and no autosave shutdown;
- writer quiesce/drain failure → do not delete snapshot, do not overwrite primary, selected manual slot remains untouched, existing campaign A remains authoritative;
- stale-snapshot deletion failure → do not overwrite primary; A remains authoritative;
- primary write of B failure after snapshot deletion → do not reload into a mixed/ambiguous state; existing IndexedDB `put` transaction failure must leave the prior committed primary as authority, and the safest recovery is reload of the surviving primary A to reconstruct a normal autosave controller;
- if primary B write succeeds, B is authoritative; reload is allowed only after the old writer is inert and stale A snapshot is absent;
- no failure path may leave the app silently with autosave disabled indefinitely.

## 11. Binding deterministic E2E seam

Existing Browser tests retain current deterministic fixture bootstrap.

Add one narrow E2E-only interactive-new-game mode, semantic shape:

```text
VITE_E2E=1
+ interactiveNewGame=1
+ explicit fixed uint32 campaignSeed=<value>
```

Exact parameter spelling may be adjusted, but semantics are binding:

- default E2E tests still bypass the interactive picker;
- only focused campaign-lifecycle acceptance opts into the real picker;
- focused test supplies/injects an explicit fixed uint32 seed;
- Browser test never depends on Web Crypto;
- seam may live in `src/runtime/e2eScenario.ts` plus narrow `src/main.ts` coordination;
- `playwright.config.ts` remains read/verify unless a regression proves config change necessary.

## 12. Expected implementation/read-write paths

Primary implementation-authorized paths after Audit merge only:

- `src/main.ts` — common campaign-switch orchestration, old-writer quiescence guard/reference, E2E picker selection;
- `src/ui/saveManager.ts` — `Новая партия` and manual-slot activation through common safe switch contract;
- `src/storage/SaveManager.ts` — ordered reserved-slot switch helper if useful;
- `src/simulation/createInitialGameState.ts` — narrow explicit numeric-seed path;
- `src/simulation/seed.ts` — only if a uint32 validator/helper is needed;
- `src/ui/newGameFactionPicker.ts` — visible seed field, reroll and fixed-seed injection;
- `src/runtime/e2eScenario.ts` — E2E-only interactive-new-game/fixed-seed seam.

Expected focused tests:

- `tests/simulation/createInitialGameState.test.ts`;
- `src/ui/newGameFactionPicker.test.ts`;
- `tests/storage/saveManager.test.ts`;
- focused lifecycle/autosave regressions for reset and manual activation;
- focused Browser test such as `tests/e2e/campaignLifecycle.spec.ts`.

Read/verify unless a failing regression proves a necessary minimal change:

- `src/storage/AutoSaveController.ts`;
- `src/storage/loadAutosave.ts`;
- `src/runtime/campaignBootstrap.ts`;
- `playwright.config.ts`;
- `src/storage/IndexedDbSaveRepository.ts`;
- universe/world-event/endgame runtime.

## 13. Regression-first implementation contract

The implementation PR must start with RED semantic regressions before runtime changes.

Required RED coverage covers three player lifecycle failures plus E2E reachability:

1. current real-browser fresh path resolves to the same hard-coded seed/world;
2. **new-campaign reset resurrection:** primary A + snapshot A + manual slot exist; old writer has pending/current A; reset attempts deletion/reload; pagehide can otherwise recreate A;
3. **manual-slot activation resurrection:** current campaign A in memory, primary A, snapshot A, manual B; current activation writes B primary then reloads while old writer can pagehide-flush A back over B;
4. current `VITE_E2E=1` bootstrap bypasses the interactive picker.

RED failure must be on semantic assertions, not lint/type/fixture noise.

## 14. Focused unit/storage acceptance

Minimum deterministic coverage:

1. explicit uint32 is preserved exactly as `GameState.seed`;
2. same numeric seed produces identical initial state/world evidence;
3. different numeric seeds produce different deterministic world evidence;
4. legacy string seed-source behavior is unchanged;
5. seed UI validates uint32 bounds and generator is injectable;
6. common campaign-switch code quiesces old writer before authoritative persistence mutation;
7. reset snapshot deletion precedes primary deletion;
8. reset failure rules preserve a recoverable current campaign and working autosave after recovery;
9. successful reset plus simulated pagehide/reload leaves `loadAutosave()` missing and manual slots intact;
10. manual B is validated before quiescence;
11. manual switch quiesces A before deleting stale snapshot or overwriting primary;
12. stale snapshot A is removed before B becomes primary;
13. after successful manual activation, `loadAutosave()` resolves B from primary and cannot recover A;
14. simulated pagehide/reload after manual activation cannot overwrite B with A;
15. manual source slot B remains present and unchanged;
16. manual validation/quiesce/snapshot-delete/primary-write failures obey section 10 and do not leave autosave silently disabled;
17. existing save/import/export/recovery tests remain green.

## 15. Browser acceptance

Focused lifecycle Browser acceptance must prove both switch types.

### New campaign

1. start from persisted running/terminal campaign with primary + snapshot + manual save;
2. `System → Saves → Новая партия` is visible;
3. cancel leaves current campaign intact;
4. confirm causes old writer quiescence before reserved deletion;
5. real pagehide/reload does not resurrect old campaign;
6. actual new-game dialog is reached through the dedicated E2E mode;
7. explicit fixed uint32 seed is used, not Web Crypto;
8. same seed reproduces same deterministic world evidence;
9. different seed changes deterministic world evidence;
10. manual save survives.

### Manual save activation

1. create/persist manual slot B;
2. continue/change current campaign A so A and B have distinguishable seed/state/runtime evidence;
3. ensure primary A and recovery snapshot A exist;
4. choose `Загрузить` B;
5. real reload occurs only after old writer A is quiesced and stale snapshot A is removed;
6. loaded runtime/seed/state evidence corresponds to B;
7. pagehide/visibility cannot overwrite B with A;
8. recovery cannot restore A instead of B;
9. manual slot B remains present after activation.

Production Pages smoke and the existing full Browser suite remain mandatory.

## 16. Determinism / persistence / performance

- schema v19;
- save format v6;
- migration none;
- existing `GameState.seed` remains persisted deterministic authority;
- no wallclock RNG;
- Web Crypto only suggests real-user pre-state seed;
- tests use explicit fixed seeds;
- no new simulation loop;
- common campaign-switch coordination is bounded persistence/UI work;
- Organic Fresh Game → Terminal, Organic Obelisk, terminal save-load/partition determinism, bounded faction matrix and campaign catch-up performance remain mandatory.

## 17. Risks / non-goals

Primary risks:

- old campaign resurrection from pagehide/visibility autosave during reset;
- manual activation B overwritten by old in-memory A during reload;
- stale snapshot A surviving a successful switch and later recovering over B;
- silent disabled autosave after failed switch;
- false seed reproducibility if displayed numeric seed is re-hashed;
- E2E acceptance that never reaches the real picker;
- random/flaky Browser seed generation;
- accidental mutation/deletion of manual source slots.

Non-goals:

- no achievements/meta progression;
- no global history/seed uniqueness database;
- no cloud saves;
- no Bank/credit subsystem;
- no moving trajectories;
- no combat/economy/bot rebalance;
- no campaign difficulty system;
- no schema/save bump;
- no persistence architecture rewrite;
- no second implementation PR for manual-load repair.

## 18. Critical UNKNOWN closure

```text
criticalUnknownsResolved = true
criticalUnknowns = []
```

Resolved before Audit readiness:

1. numeric seed authority: explicit uint32 → exact `GameState.seed`; legacy string source remains compatible;
2. default seed wording: fresh suggestion/reroll, not global uniqueness;
3. common switch authority: old autosave writer must be inert before reset deletion or manual activation overwrite;
4. reset snapshot authority: snapshot delete before primary delete;
5. manual activation snapshot authority: stale old-campaign snapshot is deleted before writing selected manual campaign into primary; immediate snapshot recreation is not required;
6. failure semantics: no ambiguous reload and no silently disabled autosave page;
7. reset resurrection regression: successful reset + pagehide/reload leaves `loadAutosave()` missing;
8. manual activation regression: successful B activation + pagehide/reload resolves B and never A;
9. Browser reachability: one deterministic `VITE_E2E=1` query mode reaches the real dialog with explicit fixed seed.

## 19. Audit acceptance gate

Before Audit PR #186 may be Ready:

- diff remains docs/control-plane only;
- all three controller lifecycle blockers are reflected in binding Audit/control-plane docs;
- the P1 manual-activation review thread is replied to only after docs contain quiescence, snapshot authority and regression/Browser coverage, then resolved;
- fresh exact-head CI SUCCESS after the last docs commit;
- fresh exact-head Graphify SUCCESS using pinned 0.8.38;
- fresh exact-head Browser E2E SUCCESS;
- production Pages smoke SUCCESS;
- unresolved review threads = 0;
- submitted blocking reviews = 0;
- comments checked;
- `mergeable=true`;
- base remains `main`;
- live `main` remains starting baseline unless explicitly reconciled;
- PR head stable;
- PR body contains final exact-head evidence;
- PR is Ready (`draft=false`) and not merged.

## 20. Stop boundary

After #186 is Ready: **STOP for controller review. Do not merge the Audit. Do not create the implementation branch. Do not start PR1.**
