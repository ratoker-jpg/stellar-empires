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

`POST-1.0-STRATEGIC-FEEDBACK-TRUTH` is COMPLETE. There is no PR4.

## 2. Evidence

Repository-pinned Graphify is `0.8.38`. The runtime tree remains the PR #185 tree:

- 464 code files;
- 3,639 nodes;
- 12,757 edges;
- 145 communities;
- 100% extraction.

Graphify is an accelerator only; controller findings below were resolved against direct current-main source.

### 2.1 `SaveManager.import()` production callers — CLOSED

Graphify import-dependency evidence for current runtime shows production imports of `SaveManager` from:

- `src/main.ts`;
- `src/runtime/campaignBootstrap.ts`;
- `src/storage/AutoSaveController.ts`;
- `src/storage/loadAutosave.ts`;
- `src/ui/saveManager.ts`.

Direct inspection of those production files finds the player-facing `.import(...)` call only in `src/ui/saveManager.ts#onImport()`.

The other production consumers use construction plus save/snapshot/recover/bootstrap behavior and do not call `SaveManager.import(...)`.

`tests/storage/saveManager.test.ts` also imports `SaveManager`, but it is test-only and is not a production authority path.

Therefore there is no unresolved second production import caller: player-facing import safety can be enforced at the save-manager UI boundary. Generic `SaveManager.import()` may still be hardened if a focused regression proves that is the minimal safer implementation, but such hardening is not required by architecture.

## 3. Strongest VERIFIED gap — campaign lifecycle authority

The strongest gap is one coherent player-facing `System / Saves → persistence authority → bootstrap` lifecycle problem:

1. ordinary fresh-game bootstrap reuses one hard-coded seed source;
2. safe New Campaign replacement is missing and old autosave can resurrect during reload;
3. current manual-slot activation can write selected B into primary and then old in-memory A can pagehide-flush over B;
4. current Import can bypass storage-only intent and write a payload directly into reserved `autosave` / `autosave.snapshot` authority.

These are one implementation boundary, not four separate features.

### 3.1 Hard-coded real-browser seed

`src/main.ts#createFreshGame()` currently uses:

```text
createInitialGameState('stellar-empires-m1', ...)
```

Seed materially drives deterministic generated-world/PvE variation.

**Classification:** VERIFIED replayability gap.

### 3.2 New-campaign resurrection race

Current page lifecycle can flush the old campaign through `pagehide`, hidden `visibilitychange`, campaign-clock and application-transition autosave producers. Reserved-slot deletion before writer quiescence can therefore recreate the old campaign.

**Classification:** VERIFIED lifecycle/data-integrity gap.

### 3.3 Manual-slot activation resurrection race

Current `src/ui/saveManager.ts#activateSlot()` does:

```text
load manual B
→ save B into primary autosave
→ reload
```

while the old A `AutoSaveController` remains live. Reload can let old A overwrite B.

**Classification:** VERIFIED lifecycle/data-integrity gap.

### 3.4 Reserved-slot import authority bypass

Current `src/ui/saveManager.ts#onImport()` computes:

```text
targetSlotId =
  target.length > 0 && !isReservedSlot(target)
    ? target
    : undefined
```

and calls:

```text
options.manager.import(json, targetSlotId)
```

Current `SaveManager.import()` uses:

```text
const slotId = targetSlotId?.trim() || parsed.value.slotId;
```

Therefore blank target or a typed reserved target can pass `undefined`, allowing a payload whose own `slotId` is `autosave` or `autosave.snapshot` to mutate reserved campaign authority.

Consequences:

- imported `autosave` can be overwritten by the live old writer;
- imported `autosave.snapshot` can become unexpected future recovery authority;
- Import can silently become a campaign-authority transition even though the UI presents it as storage import.

**Classification:** VERIFIED P2 authority-bypass gap.

### 3.5 Browser picker reachability

Browser E2E runs with `VITE_E2E=1`, while current `createFreshGame()` bypasses the real picker under that mode. One narrow deterministic E2E seam remains required for truthful lifecycle acceptance.

## 4. DECISION — one implementation PR

Proposed batch:

`POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE`

Only work item:

`POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE`

Exact implementation count: **1**.

Reason: New Campaign, manual activation and import/storage all meet at one `System / Saves` authority boundary; seed/new-game bootstrap is the same player lifecycle. Splitting the P2 into a second PR would create duplicate authority rules and an intermediate unsafe UI state.

Implementation remains unauthorized until controller-approved merge of Audit #186.

## 5. Player-facing seed contract

- player-facing seed is explicit uint32;
- explicit numeric seed becomes exact persisted `GameState.seed`;
- legacy string source remains compatible through existing `normalizeSeed(string)`;
- real UI may suggest/reroll a uint32 via Web Crypto before state creation;
- same explicit seed + same faction/settings reproduces the same deterministic initial world;
- different explicit seeds must produce different deterministic world evidence;
- no global-history uniqueness promise;
- `Date.now()`, wallclock-derived seed and `Math.random()` are forbidden;
- unit/Browser tests use explicit fixed seeds;
- schema v19 / save v6 / migration none.

## 6. Binding common campaign-switch authority

Any actual switch away from current in-memory campaign A must obey:

```text
validate target/intent
→ block new old-page autosave requests
→ drain pending/active old-writer work with failure propagation
→ dispose/quiesce old AutoSaveController
→ perform authoritative persistence switch
→ reload through existing bootstrap
```

After quiescence, `pagehide`, hidden `visibilitychange`, campaign-clock checkpoints and application transitions may not write A again.

`src/storage/AutoSaveController.ts` remains read/verify by default. Main/UI coordination is preferred if existing controller semantics are sufficient.

### 6.1 New Campaign

```text
confirm
→ quiesce old writer
→ delete autosave.snapshot
→ delete autosave
→ reload/bootstrap
→ loadAutosave() == missing
→ real new-game path
```

Manual/user-named slots survive.

### 6.2 Manual `Загрузить`

Recovery precedence is direct-source resolved:

- valid primary wins;
- snapshot is fallback only when primary is missing/invalid.

Binding ordering:

```text
validate/load manual B
→ block A autosave producers
→ drain/quiesce/dispose A writer
→ delete stale autosave.snapshot(A)
→ write B state + B runtimeMetadata into primary autosave
→ preserve manual B
→ reload/bootstrap
→ loadAutosave() resolves primary B
```

Immediate B snapshot recreation is not required; if implementation creates one immediately, it may contain B only.

## 7. Binding Import contract — STORAGE ONLY

Import is **not** a campaign switch.

Player-facing Import must never directly mutate reserved campaign authority.

### 7.1 Required UI target

On JSON import the UI requires an explicit target slot that is:

- non-empty;
- not `autosave`;
- not `autosave.snapshot`.

Binding validation:

- blank target → explicit validation error, no import;
- target `autosave` → explicit validation error, no import;
- target `autosave.snapshot` → explicit validation error, no import;
- player UI must never call `SaveManager.import(json, undefined)`.

### 7.2 Payload `slotId` has no player-facing authority

Imported JSON may claim any original `slotId`, including:

- `autosave`;
- `autosave.snapshot`;
- another manual name.

For player UI import, that original ID is data only. The UI-selected explicit manual target controls storage destination.

Example:

```text
payload.slotId = autosave
target = manual-import
→ store rewritten envelope only as manual-import
→ primary autosave unchanged
→ autosave.snapshot unchanged
```

### 7.3 No writer quiescence and no reload for Import

Because compliant Import is storage-only:

- current primary/snapshot authority stays unchanged;
- current campaign stays active;
- old `AutoSaveController` does not need quiescence;
- no reload occurs;
- Import never silently activates the imported campaign.

To play an imported campaign:

```text
Import JSON → manual slot
→ user later presses Загрузить
→ safe campaign-switch contract from §6.2
→ only then imported campaign becomes active
```

This preserves exactly one campaign-authority transition: `Загрузить`.

### 7.4 Generic API policy

Direct caller resolution proves the only production `SaveManager.import(...)` consumer is `src/ui/saveManager.ts`.

Therefore the binding minimum is UI-boundary enforcement. `src/storage/SaveManager.ts` remains implementation-authorized and may be hardened with a narrow helper/API guard if focused regression evidence shows that is the simplest safer implementation.

No new persistence architecture is authorized.

## 8. Binding failure semantics

### New Campaign

- cancel before quiesce → no change;
- quiesce/drain failure → delete neither reserved slot;
- snapshot delete failure → primary untouched;
- primary delete failure → surviving primary remains recovery authority;
- no failed switch leaves autosave silently disabled indefinitely.

### Manual activation

- load/validation failure → no switch;
- quiesce/drain failure → persistence untouched; A remains authority;
- stale snapshot delete failure → do not overwrite primary;
- B primary write failure after snapshot deletion → no ambiguous reload; prior committed primary A remains authority and may be reloaded;
- successful B write → reload only with old writer inert and stale A snapshot absent;
- manual source B remains preserved.

### Import

- blank target → validation error, no import;
- reserved target → validation error, no import;
- malformed JSON → existing parse/validation error, no storage mutation;
- valid manual target → exactly that manual slot is written;
- any import failure → current primary and snapshot unchanged;
- import never silently activates the imported campaign.

## 9. Deterministic E2E seam

Existing Browser tests retain current fixture bootstrap.

Focused lifecycle acceptance may use:

```text
VITE_E2E=1
+ interactiveNewGame=1
+ campaignSeed=<explicit fixed uint32>
```

Exact query names may vary, but semantics are binding:

- default E2E behavior stays deterministic and unchanged;
- only focused lifecycle test reaches real picker;
- focused test uses fixed explicit seed, never Web Crypto;
- seam may live in `src/runtime/e2eScenario.ts` plus narrow `src/main.ts`;
- `playwright.config.ts` remains read/verify unless regression proves a minimal change necessary.

## 10. Authorized implementation paths after Audit merge only

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

Expected focused tests include:

- `tests/simulation/createInitialGameState.test.ts`;
- `src/ui/newGameFactionPicker.test.ts`;
- `tests/storage/saveManager.test.ts`;
- focused campaign lifecycle/autosave authority regressions;
- focused Browser lifecycle spec.

## 11. Regression-first implementation contract

Implementation starts with semantic RED coverage for:

1. repeated hard-coded default seed/world;
2. new-campaign reset resurrection;
3. manual-slot activation resurrection;
4. reserved-slot import authority bypass;
5. current E2E real-picker bypass.

### 11.1 Import RED/acceptance matrix

**A — payload primary + blank target**

```text
payload.slotId = autosave
target = blank

CURRENT: can write reserved autosave through fallback.
EXPECTED: rejected before authority mutation.
```

**B — payload snapshot + reserved target**

```text
payload.slotId = autosave.snapshot
target = autosave.snapshot

CURRENT: UI converts target to undefined, generic import falls back to reserved payload id.
EXPECTED: rejected.
```

**C — reserved payload + explicit manual target**

```text
payload.slotId = autosave
target = manual-import

EXPECTED:
stored only as manual-import
primary autosave unchanged
snapshot unchanged
current campaign unchanged
no reload
```

**D — activation only through `Загрузить`**

```text
valid manual import
→ user presses Загрузить manual-import
→ quiesced manual-activation contract
→ imported campaign becomes active only here
```

### 11.2 Existing lifecycle regressions retained

New Campaign regression must prove pending/current A cannot recreate deleted reserved state through simulated pagehide/reload.

Manual activation regression must prove:

```text
A in memory
+ primary A
+ snapshot A
+ manual B
+ pending/current A writer
→ activate B
→ quiesce A
→ delete stale snapshot A
→ primary B
→ simulated pagehide/reload
→ loadAutosave() resolves B
→ never A
→ manual B remains
```

## 12. Focused unit/storage acceptance

Minimum deterministic coverage:

1. explicit uint32 seed persistence/reproducibility/difference;
2. legacy string-seed compatibility;
3. New Campaign quiescence before reserved deletion;
4. successful reset + pagehide/reload leaves `loadAutosave()` missing;
5. manual activation quiesces A before stale snapshot deletion / B primary write;
6. successful manual activation + pagehide/reload resolves B and never A;
7. manual source slot remains present;
8. blank import target is rejected before `SaveManager.import`;
9. `autosave` import target is rejected;
10. `autosave.snapshot` import target is rejected;
11. payload `slotId=autosave` + `manual-import` target writes only `manual-import`;
12. payload `slotId=autosave.snapshot` + manual target also writes only manual target;
13. primary/snapshot/current campaign remain unchanged after storage-only import;
14. malformed/failing import leaves authority untouched;
15. existing save/import/export/recovery tests remain green.

## 13. Browser acceptance

Focused lifecycle Browser acceptance must prove:

### New Campaign

- persisted A + snapshot + manual save;
- cancel preserves A;
- confirm quiesces A before deletion;
- real reload cannot resurrect A;
- actual picker is reached via deterministic E2E seam;
- explicit fixed seed is honored/reproducible;
- manual saves survive.

### Manual activation

- manual B exists;
- current A is changed so A/B have distinguishable seed/state/runtime evidence;
- primary/snapshot A exist;
- `Загрузить B`;
- real reload occurs after quiescence and stale snapshot removal;
- B seed/state/runtime wins;
- A cannot overwrite B on pagehide or return via recovery;
- manual B remains.

### Import storage-only

1. current campaign A active;
2. primary A + snapshot A exist;
3. choose JSON whose original `slotId` is `autosave`;
4. blank target is rejected;
5. reserved `autosave` target is rejected;
6. reserved `autosave.snapshot` target is rejected;
7. primary A unchanged;
8. snapshot A unchanged;
9. no reload/campaign switch occurs;
10. import same JSON with explicit `manual-import`;
11. `manual-import` appears in save list while A stays active;
12. click `Загрузить manual-import`;
13. reuse safe manual activation assertions so quiescence occurs and imported campaign becomes active only then.

Assertions may share helpers with the manual-load Browser scenario; do not duplicate the entire flow unnecessarily.

Production Pages smoke and full Browser suite remain mandatory.

## 14. Determinism / persistence / performance

- schema v19;
- save format v6;
- migration none;
- `GameState.seed` remains deterministic authority;
- no wallclock RNG for campaign seed;
- Web Crypto only suggests real-user pre-state seed;
- import does not mutate active campaign authority;
- no new persistence subsystem;
- no new simulation loop;
- Organic Fresh Game → Terminal, Organic Obelisk, terminal save-load/partition determinism, bounded faction matrix and catch-up performance remain mandatory.

## 15. Risks / non-goals

Primary risks:

- old A resurrection on New Campaign;
- old A overwriting manually activated B;
- stale A snapshot recovering over B;
- reserved import silently mutating primary/snapshot authority;
- import target validation accidentally falling back to payload `slotId`;
- silent disabled autosave after failed switch;
- false seed reproducibility;
- Browser acceptance that bypasses real picker.

Non-goals:

- no Import-as-campaign-switch flow;
- no new persistence architecture;
- no schema/save bump;
- no second implementation PR for import repair;
- no achievements/meta progression;
- no cloud saves;
- no Bank/credit subsystem;
- no moving trajectories;
- no combat/economy/bot rebalance;
- no campaign difficulty system.

## 16. Critical UNKNOWN closure

```text
criticalUnknownsResolved = true
criticalUnknowns = []
```

Resolved:

1. numeric seed authority;
2. common old-writer quiescence rule;
3. New Campaign snapshot/primary ordering;
4. manual activation snapshot authority;
5. manual-switch failure semantics;
6. deterministic real-picker E2E reachability;
7. all production `SaveManager.import(...)` callers;
8. Import product decision: storage-only;
9. reserved target policy: both reserved IDs forbidden;
10. payload `slotId` cannot grant player-facing authority;
11. storage-only import does not quiesce writer or reload;
12. imported campaign becomes active only through safe `Загрузить`.

## 17. Audit acceptance gate

Before #186 may be Ready:

- diff remains docs/control-plane only;
- binding docs mirror seed, New Campaign, manual activation and storage-only import authority;
- P2 reserved-import review thread is replied to only after docs contain:
  - storage-only decision;
  - reserved-target prohibition;
  - direct-callers closure;
  - unit/storage regressions;
  - Browser acceptance;
- then P2 thread is resolved;
- fresh exact-head CI SUCCESS after final docs commit;
- fresh exact-head Graphify SUCCESS using pinned 0.8.38;
- fresh exact-head Browser E2E SUCCESS;
- production Pages smoke SUCCESS;
- unresolved review threads = 0;
- reviews and comments checked;
- no blocking review;
- `mergeable=true`;
- base remains `main`;
- live `main` unchanged or explicitly reconciled;
- PR head stable;
- PR body contains final exact-head evidence;
- PR Ready (`draft=false`) and not merged.

## 18. Stop boundary

After #186 is Ready: **STOP for controller review. Do not merge Audit. Do not create implementation branch. Do not start PR1.**
