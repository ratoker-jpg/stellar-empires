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

This is a fresh product Audit after merged PR #185. It implements no gameplay/runtime change and does not reuse Audit #182 as successor authorization.

## 1. Fresh-main reconciliation

Live `main` was independently verified at:

`e974c09e7779b4cf3bbc6d0279b8d35f177a29e6`

That is the controller-approved squash of PR #185, with parent `691078ab9ce5b0ab48e7aa69e71fe72322528af0`.

Completed chain:

```text
Audit #182 → b09887489db7754f0c0b2672649db9283b879732
PR1 #183  → 83a4942c35aac8d7f0b02f7730f0646c171c98b5
PR2 #184  → 691078ab9ce5b0ab48e7aa69e71fe72322528af0
PR3 #185  → e974c09e7779b4cf3bbc6d0279b8d35f177a29e6
```

`POST-1.0-STRATEGIC-FEEDBACK-TRUTH` is COMPLETE. Archive: `docs/audits/completed/post-1.0-strategic-feedback-truth.md`. There is no PR4.

## 2. Graphify + direct-source evidence

Repository-pinned Graphify is `graphifyy==0.8.38`, driven by `.graphify-version`, `.agents/skills/graphify/` and `scripts/graphify-audit.sh code`.

The final #185 runtime tree and squash `main` share tree `150ce0012cf2fb9e607b0dda33b9e7ecc013c92f`. Graphify evidence for that tree:

- 464 code files;
- 3,639 nodes;
- 12,757 edges;
- 145 communities;
- 100% extraction.

Key verified flows:

```text
bootstrap()
→ createFreshGame()
→ selectNewGameCampaign()
→ createInitialGameState()
→ seed
→ universe / neutral forces / space objects / world-event selection
```

```text
application transitions / campaign clock / page lifecycle
→ AutoSaveController.request()/stage()/flush()
→ autosave.snapshot + autosave
→ loadAutosave() recovery
```

```text
VITE_E2E=1
→ E2E_RUNTIME_ENABLED=true
→ createFreshGame() fixed E2E selection
→ interactive new-game picker currently bypassed
```

Graphify is an accelerator only. The selected findings and controller blockers below were verified directly in current source.

## 3. Fresh product sweep

| Domain | Classification | Current-main finding |
|---|---|---|
| economy / research / production | VERIFIED | Existing producer→consumer paths remain wired; no new blocker found. |
| fleets / combat / PvE / Arena | VERIFIED / DISPROVED stale gaps | Stable combat identity, Arena canonical reports, tactical snapshots and combat-only ranking remain closed. |
| intelligence / logistics / colonization | VERIFIED | Existing deterministic runtime and UI consumers remain live. |
| bots | VERIFIED + RESEARCH | Personality/risk/outcome recovery has consumers; `difficulty` remains internal dead metadata without a current player-facing contract. |
| endgame | VERIFIED | Organic Obelisk, Fresh Game → Terminal, terminal freeze/save-load and bounded faction matrix remain permanent gates. |
| save/load | VERIFIED + VERIFIED GAP | Autosave/recovery/manual slots work, but safe destructive replacement of the active campaign is not exposed and requires writer quiescence before reserved-slot deletion. |
| replayability / browser UX | VERIFIED GAP | Real fresh games reuse one hard-coded seed source; current E2E harness also bypasses the interactive picker that the lifecycle Browser acceptance must exercise. |
| advertised mechanics | VERIFIED seam / DECISION | Bank credit-efficiency remains evidence-gated; no credit system is authorized. |

## 4. Strongest VERIFIED gap — replayable campaign lifecycle

### 4.1 Hard-coded real-browser seed

`src/main.ts#createFreshGame()` currently calls:

```text
createInitialGameState('stellar-empires-m1', ...)
```

for normal fresh campaigns. The seed drives generated universe, neutral forces, space objects and deterministic world-event choice. Same seed source reproduces the same initial state; different seed sources produce different numeric seeds.

**Classification:** VERIFIED replayability gap.

### 4.2 No normal second-campaign lifecycle

Bootstrap restores `autosave`, or `autosave.snapshot` if needed, before it reaches fresh-game selection. Both reserved slots are protected from deletion in the current UI. Terminal campaigns intentionally freeze.

A player therefore has no normal in-app route to replace the current local campaign and reach the normal new-game picker while preserving manual slots.

**Classification:** VERIFIED lifecycle gap.

### 4.3 Controller blocker — autosave resurrection race

Controller direct-source inspection identified a persistence race that the first Audit draft did not bind strongly enough.

`src/main.ts` installs:

- `pagehide → flushAutosave()`;
- `visibilitychange(hidden) → flushAutosave()`.

`flushAutosave()` requests the current campaign and flushes it. `GameApplicationController` transitions and `CampaignClockController` checkpoints can also stage/request autosave. `AutoSaveController` can have a delayed timer, pending save, active write and write chain.

Therefore this sequence is unsafe:

```text
delete autosave.snapshot
→ delete autosave
→ reload
```

because reload/pagehide can re-write the old campaign after deletion.

**Classification:** VERIFIED persistence/lifecycle blocker. Resolved by the binding reset-authority contract in section 9.

### 4.4 Controller blocker — current Browser harness bypasses new-game dialog

`playwright.config.ts` starts the app with:

```text
VITE_E2E=1 npm run dev ...
```

so `E2E_RUNTIME_ENABLED` is always true in the Browser suite. Current `createFreshGame()` uses the fixed E2E selection whenever that flag is true and does not call `selectNewGameCampaign()`.

Therefore an acceptance test that claims:

```text
reset → normal new-game dialog → enter seed → start
```

is unreachable under the current Browser harness unless a narrow deterministic E2E seam is added.

**Classification:** VERIFIED Browser-acceptance blocker. Resolved by the binding E2E contract in section 9.

## 5. Lower-priority findings

- Bank / credit efficiency: producer exists, authoritative credit semantics do not. **REJECT direct implementation**.
- `BotDifficulty`: dead/internal metadata, no current player promise. **RESEARCH / no standalone PR**.
- achievements/meta progression: **RESEARCH**.
- moving-object trajectories: **RESEARCH**.
- further bot differentiation: **RESEARCH**.

Nemexia remains reference, never specification. Replayable campaign lifecycle is `KEEP_STELLAR`; achievements/trajectories remain `RESEARCH`; direct Bank/credit formula port is `REJECT`.

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

One PR is the minimum coherent boundary. Restart without seed variation remains repetitive; seed variation without a reachable restart remains inaccessible. Both use the same bootstrap/persistence/new-game/browser lifecycle and need no schema migration checkpoint.

Implementation remains unauthorized until controller-approved merge of Audit #186.

## 8. Player-facing seed contract

The player-facing campaign seed is an explicit **uint32 numeric seed**.

Binding semantics:

- explicit numeric seed becomes existing persisted `GameState.seed` exactly;
- legacy string seed source remains compatible and continues through existing `normalizeSeed(string)` semantics;
- real UI generates a fresh uint32 seed **suggestion** before GameState creation;
- player may reroll the suggestion;
- same explicit seed + same faction/settings reproduces the same deterministic initial world;
- different explicit seeds must produce demonstrably different deterministic world evidence;
- if restart knows the current campaign seed, implementation may guarantee the immediate suggested replacement differs from that current seed;
- no global-history uniqueness promise is made for a 32-bit space;
- Web Crypto may be used only for the real-user pre-state suggestion;
- `Date.now()`, wallclock-derived seed and `Math.random()` are forbidden;
- unit/Browser tests use explicit fixed seeds only.

Persistence stays schema v19 / save v6 / migration none.

## 9. Binding safe-reset authority contract

### 9.1 Root cause

Reserved-slot deletion is not sufficient while the old campaign still has a live autosave writer. Page lifecycle, campaign clock or application transitions can stage/request that state again.

### 9.2 Required success ordering

After the player confirms destructive new-campaign reset:

1. **Quiesce the current autosave writer before deleting any reserved save.**
2. Disable the live autosave bridge/reference, or an equivalent guard, so pagehide, visibilitychange, campaign-clock checkpoints and application transitions cannot enqueue the old state while reset is in progress.
3. Safely drain any delayed timer, pending save, active write and write chain with error propagation according to actual `AutoSaveController` semantics.
4. Put the writer into a disposed/inert state before the destructive phase. A main-level coordination seam such as disabling the live `autosave` reference, successfully draining via the existing throwing flush semantics, then `await writer.dispose()` is allowed. The exact implementation may differ, but it must prove equivalent quiescence.
5. Only after successful quiescence delete `autosave.snapshot`.
6. Only after snapshot deletion succeeds delete primary `autosave`.
7. Keep every manual/user-named slot untouched.
8. Reload/return through the existing bootstrap only after both reserved deletions succeed.
9. During reload/pagehide/visibilitychange, no callback may be capable of resurrecting the old campaign.

Binding semantic flow:

```text
confirm
→ stop new autosave requests from current page
→ drain + quiesce/dispose writer
→ delete autosave.snapshot
→ delete autosave
→ reload existing bootstrap
→ loadAutosave() == missing
→ interactive new-game picker
```

`src/storage/AutoSaveController.ts` is **read/verify by default**. Do not require changes there if main-level lifecycle coordination proves the contract. A change there is allowed only if a regression demonstrates the existing API cannot safely express the required quiescence.

### 9.3 Failure semantics

The destructive lifecycle must be explicit:

- cancel **before quiesce** → no state changes; current autosave continues normally;
- autosave quiesce/drain failure → do not delete snapshot or primary; keep/re-enable a working autosave path or reload the current surviving campaign; never silently continue with autosave disabled;
- snapshot delete failure → primary must remain untouched and recoverable; because the writer is already quiesced, prefer/allow reload of the surviving primary to restore a normal active autosave controller;
- primary delete failure after snapshot deletion → primary remains the recovery authority; prefer/allow reload of that surviving primary so the page is not left indefinitely with autosave disabled;
- after any destructive-phase failure, do not leave the current page in a silent disabled-autosave state;
- no new persistence subsystem is authorized.

## 10. Binding deterministic E2E seam

Existing Browser tests must retain their current deterministic fixture bootstrap.

Add one narrow E2E-only interactive-new-game mode. Accepted semantic shape:

```text
VITE_E2E=1
+ query flag interactiveNewGame=1
+ explicit fixed uint32 campaignSeed=<value>
```

Exact parameter spelling may be adjusted, but the semantics are binding:

- `VITE_E2E` remains enabled for the suite;
- default existing E2E tests still bypass the interactive picker and receive the current deterministic fixture selection;
- only the focused campaign-lifecycle test opts into interactive new-game mode;
- in that mode `createFreshGame()` must call the real `selectNewGameCampaign()` path instead of the fixed E2E selection;
- the focused test supplies/injects an explicit fixed uint32 seed into the picker so it does not depend on Web Crypto;
- no production-only behavior depends on the E2E seam;
- the seam may live in `src/runtime/e2eScenario.ts` plus narrow `src/main.ts` query/selection coordination;
- `playwright.config.ts` remains read/verify unless a regression proves config change is actually required.

This resolves the Browser reachability UNKNOWN now; it must not be deferred into implementation discovery.

## 11. Expected implementation/read-write paths

Primary authorized runtime paths if Audit is later merged:

- `src/main.ts` — reset orchestration, autosave quiescence guard/reference, E2E interactive-picker selection;
- `src/simulation/createInitialGameState.ts` — narrow explicit numeric-seed path while preserving string-source compatibility;
- `src/simulation/seed.ts` — only if a uint32 validator/helper is needed;
- `src/ui/newGameFactionPicker.ts` — visible seed field, reroll and injectable fixed suggestion;
- `src/ui/saveManager.ts` — confirmed `Новая партия` action and failure presentation;
- `src/storage/SaveManager.ts` — only if ordered reserved-slot deletion benefits from a narrow helper;
- `src/runtime/e2eScenario.ts` — E2E-only `interactiveNewGame` + fixed-seed query seam.

Expected tests:

- `tests/simulation/createInitialGameState.test.ts`;
- `src/ui/newGameFactionPicker.test.ts`;
- `tests/storage/saveManager.test.ts`;
- focused lifecycle/autosave regression covering resurrection;
- focused Browser test such as `tests/e2e/campaignLifecycle.spec.ts`.

Read/verify unless a failing regression proves a necessary change:

- `src/storage/AutoSaveController.ts`;
- `src/storage/loadAutosave.ts`;
- `src/runtime/campaignBootstrap.ts`;
- `playwright.config.ts`;
- universe/world-event/endgame runtime.

No broad persistence rewrite is authorized.

## 12. Regression-first implementation contract

The implementation PR must start with RED semantic regressions before runtime code changes.

Required RED coverage:

1. current real-browser fresh path resolves to the same hard-coded seed/world;
2. current UI has no safe second-campaign path after reserved autosave exists;
3. **autosave resurrection regression:** primary + snapshot + manual slot exist; `AutoSaveController` has pending/current old state; confirmed reset begins; writer is quiesced; snapshot removed; primary removed; simulated pagehide/reload lifecycle occurs; `loadAutosave()` returns `missing`; old campaign is not recreated; manual slot survives;
4. current `VITE_E2E=1` bootstrap bypasses the interactive picker, proving why the dedicated query seam is needed.

RED failure must be on semantic assertions, not lint/type/fixture noise.

## 13. Focused acceptance tests

Minimum unit/integration coverage:

1. explicit uint32 is preserved exactly as `GameState.seed`;
2. same numeric seed produces identical initial state/world evidence;
3. different numeric seeds produce different deterministic world evidence;
4. legacy string seed-source behavior is unchanged;
5. seed UI accepts uint32 bounds and rejects invalid input;
6. real-user generator/reroll returns a uint32 and is injectable/stubbable;
7. quiescence happens before any reserved deletion;
8. snapshot deletion happens before primary deletion;
9. quiesce failure deletes neither reserved slot;
10. snapshot delete failure leaves primary untouched;
11. primary delete failure leaves primary recoverable;
12. failed destructive reset does not leave the page silently without autosave;
13. successful reset leaves `loadAutosave()` missing after simulated pagehide/reload;
14. manual slots survive every reset path;
15. existing save/import/export/recovery tests remain green.

Browser acceptance must prove the real reachable path under `VITE_E2E=1`:

1. start from a persisted running or terminal campaign with primary + recovery state and a manual save;
2. navigate to `System → Saves`;
3. cancel `Новая партия` and prove current campaign remains;
4. confirm reset;
5. exercise the real reload/pagehide lifecycle and prove old autosave is not resurrected;
6. reach the **actual new-game dialog** through the explicit interactive E2E seam;
7. use an explicit fixed uint32 seed supplied by the test, not Web Crypto;
8. start campaign and prove runtime/visible seed equals that value;
9. repeat same seed and prove same deterministic world evidence;
10. use a different fixed seed and prove different deterministic world evidence;
11. prove the manual save survived.

Production Pages smoke and the existing Browser suite remain mandatory.

## 14. Determinism / persistence / performance

- schema v19;
- save format v6;
- migration none;
- existing `GameState.seed` remains persisted deterministic authority;
- no wallclock RNG after or before GameState creation;
- Web Crypto only suggests a real-user pre-state seed;
- tests use explicit fixed seeds;
- no new simulation loop;
- reset touches only two reserved slots and preserves manual saves;
- Organic Fresh Game → Terminal, Organic Obelisk, terminal save-load/partition determinism, bounded faction matrix and campaign catch-up performance remain mandatory.

## 15. Risks / non-goals

Primary risks:

- old campaign resurrection from pagehide/visibility autosave;
- snapshot recovery if primary is deleted first;
- silent disabled autosave after failed destructive reset;
- false seed reproducibility if displayed numeric seed is re-hashed;
- E2E acceptance that never reaches the real picker;
- random/flaky Browser seed generation;
- accidental deletion of manual saves.

Non-goals:

- no achievements/meta progression;
- no global history/seed uniqueness database;
- no cloud saves;
- no Bank/credit subsystem;
- no moving trajectories;
- no combat/economy/bot rebalance;
- no campaign difficulty system;
- no schema/save bump;
- no persistence architecture rewrite.

## 16. Critical UNKNOWN closure

```text
criticalUnknownsResolved = true
criticalUnknowns = []
```

Resolved before Audit readiness:

1. numeric seed authority: explicit uint32 → exact `GameState.seed`; legacy string source remains compatible;
2. default seed wording: fresh suggestion/reroll, not global uniqueness;
3. reset authority: autosave writer must be quiesced before snapshot/primary deletion;
4. reset failure semantics: no reserved deletion on quiesce failure; surviving primary remains recovery authority; no silent disabled-autosave page;
5. resurrection regression: simulated pagehide/reload must leave `loadAutosave()` missing after success;
6. Browser reachability: one deterministic `VITE_E2E=1` query mode reaches the real dialog with an explicit fixed seed.

## 17. Audit acceptance gate

Before Audit #186 may be Ready:

- final diff remains docs/control-plane only;
- controller blockers above are reflected in Audit and mirrored control-plane docs;
- fresh exact-head CI SUCCESS after the last docs commit;
- fresh exact-head Graphify SUCCESS using pinned 0.8.38;
- fresh exact-head Browser E2E SUCCESS;
- production Pages smoke SUCCESS;
- unresolved review threads = 0;
- no blocking submitted reviews/comments;
- `mergeable=true`;
- base remains `main`;
- live `main` remains `e974c09e7779b4cf3bbc6d0279b8d35f177a29e6` unless explicitly reconciled;
- PR head is stable;
- final PR body records controller findings + exact-head evidence;
- PR is Ready (`draft=false`) and not merged.

If controller later merges this Audit, it authorizes only `POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE` under this fixed contract.

## 18. Stop boundary

After Audit #186 is Ready: **STOP for controller review. Do not merge #186. Do not create the implementation branch. Do not start PR1.**
