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

This is a fresh product Audit after merged PR #185. It does not reuse Audit #182 as authorization and it implements no gameplay/runtime change. The purpose is to re-scan the current product from actual source/tests/UI and decide whether another implementation batch is justified at all.

## 1. Fresh-main reconciliation

Live `main` was independently verified before research:

`e974c09e7779b4cf3bbc6d0279b8d35f177a29e6`

That is the controller-approved squash of PR #185 `fix: make combat ranking victories truthful`, with parent `691078ab9ce5b0ab48e7aa69e71fe72322528af0`.

The previous batch is now GitHub-complete:

```text
Audit #182 → b09887489db7754f0c0b2672649db9283b879732
PR1 #183  → 83a4942c35aac8d7f0b02f7730f0646c171c98b5
PR2 #184  → 691078ab9ce5b0ab48e7aa69e71fe72322528af0
PR3 #185  → e974c09e7779b4cf3bbc6d0279b8d35f177a29e6
```

`POST-1.0-STRATEGIC-FEEDBACK-TRUTH` is COMPLETE. Its accepted Audit is archived at `docs/audits/completed/post-1.0-strategic-feedback-truth.md`. There is no PR4. No successor implementation is authorized by #182.

## 2. Graphify evidence

Repository-pinned Graphify is `graphifyy==0.8.38` from `.graphify-version`, executed by `scripts/graphify-audit.sh code` and the committed project skill under `.agents/skills/graphify/`.

The final #185 Graphify run #1402 is valid exact-runtime-tree evidence for this Audit because final PR head `94f6bd0e9b6cb97b37f93e160e724d44699541d7` and squash `main` share tree `150ce0012cf2fb9e607b0dda33b9e7ecc013c92f`.

Graphify #1402:

- version: 0.8.38;
- 464 code files scanned;
- 3,639 nodes;
- 12,757 edges;
- 145 communities;
- extraction: 100% EXTRACTED, 0% inferred/ambiguous nodes;
- three inferred edges, average confidence 0.8;
- exit code 0.

Dominant hubs:

1. `GameState` — 328 edges;
2. `createInitialGameState()` — 240;
3. `executeCommand()` — 164;
4. `getFactionMechanicalRoles()` — 130;
5. `GameCommand` — 95;
6. `getUnitDefinition()` — 94;
7. `ResourceCost` — 80;
8. `FleetState` — 78;
9. `PlanetState` — 76;
10. `FactionId` — 73.

Relevant graph flows confirmed against source:

```text
bootstrap()
→ createFreshGame()
→ selectNewGameCampaign()
→ createInitialGameState()
→ normalizeSeed()
→ createUniverseModel() / neutral forces / space objects
```

```text
AUTOSAVE_SLOT_ID
→ loadAutosave() / campaignBootstrap
→ SaveManager recovery snapshot
→ save-manager UI
```

```text
getCommandCombatEffects()
→ normal attack
→ Arena
→ Solar War
```

```text
createUnifiedMissionReports()
→ ranking
→ reports workspace / legacy report panel
→ HUD / summaries / PvE-vs-PvP comparison
```

```text
getPlanetSpecializationEffects()
→ economy
→ building timing
→ unit production timing
```

Graphify also confirms `BotDifficulty` currently has no strategy consumer beyond its declaration/profile containment, while personality policy has live consumers. This is recorded below as a low-value seam rather than promoted into a feature by default.

Graphify is only an accelerator; every selected high-priority finding below is confirmed by direct source/tests.

## 3. Fresh product sweep

Classification vocabulary: `VERIFIED`, `INFERRED`, `UNKNOWN`, `DECISION`, `DISPROVED`.

| Domain | Classification | Fresh current-main finding |
|---|---|---|
| economy / resources / storage | VERIFIED | Production, energy/stability, storage, specialization, market and endgame storage planning have real runtime/test consumers. No new blocker found. |
| research | VERIFIED / DISPROVED | Registered research definitions, requirements and queues remain covered; the old UI/runtime definition-drift hypothesis is not a current gap. |
| buildings / production | VERIFIED / DISPROVED | Real construction and ship/defense production paths are live; reserve build-slot presentation is not a fake multi-queue promise. |
| fleets / missions | VERIFIED | Creation, send/return, transport, scout, attack, recycle, colonize and special mission lifecycles remain wired and tested. |
| combat / PvP | VERIFIED / DISPROVED | Full stable combat identity, stable defender doctrine, tactical effects and combat-only ranking semantics are current. No new correctness exception found. |
| PvE / Arena / expeditions / pirates / space objects | VERIFIED / DISPROVED | Arena is in canonical reports, its stable identity is persisted, and existing PvE loops have real outcomes/recovery. No reopened #182 gap. |
| intelligence | VERIFIED | Levelled observation, freshness, counter-intelligence and presentation consumers remain live. |
| logistics / routes | VERIFIED | Recurring deterministic routes, reserves, priorities and receipts remain real consumers. |
| colonization | VERIFIED | Ordinary colonization, races/capacity and post-destruction recovery paths remain covered. |
| commanders / doctrine / flagship | VERIFIED | Command doctrine, Admiral level, flagship and Commander Ship effects are real combat inputs and now historical report feedback is persisted. |
| ranking / reports | VERIFIED / DISPROVED | Ranking consumes canonical combat truth and reports include Arena/tactical context. The generic-success inflation gap is closed. |
| world events | VERIFIED | Deterministic scheduled world events and harvest/control space objects provide dynamic pressure. Absence of physical trajectories remains research, not a correctness bug. |
| bots | VERIFIED + RESEARCH | Personality risk/development/outcome recovery has consumers; `difficulty` is currently dead metadata, but no player-facing difficulty promise makes it a priority correctness gap. |
| factions | VERIFIED | Three mechanically separate factions, catalogs, assets and bounded terminal matrix remain covered. |
| endgame | VERIFIED / DISPROVED | Organic Fresh Game → Terminal, Organic Obelisk, Solar War, terminal freeze/save/load and bounded faction terminal matrix are permanent green gates. |
| save/load / determinism | VERIFIED | schema v19/save v6 normalization, autosave/recovery/manual slots and partition determinism remain active. |
| replayability / browser UX | VERIFIED GAP | A finished/current autosaved campaign has no in-app path to start a fresh campaign, and every real fresh game uses the same hard-coded seed source. |
| advertised mechanics | VERIFIED seam / DECISION | Bank still produces `bankCreditEfficiencyPercent` without a credit consumer; current tests intentionally evidence-gate it. No credit system is justified. |

## 4. Strongest VERIFIED gap — replayable campaign lifecycle

The Audit found one high-value current problem with two inseparable symptoms.

### 4.1 Fresh campaigns all use one hard-coded seed

Real browser bootstrap in `src/main.ts#createFreshGame()` calls:

```text
createInitialGameState('stellar-empires-m1', ...)
```

for every non-E2E fresh campaign. The player can choose faction, world topology and speed, but there is no campaign seed input or reroll in `src/ui/newGameFactionPicker.ts`.

This is not cosmetic. `createInitialGameState()` normalizes the seed and passes it into:

- `createUniverseModel()`;
- `createInitialNeutralForces()`;
- `createInitialSpaceObjects()`.

Universe generation then derives galaxy/system/planet occupancy, placement, star classes, biome and size from the seed. World-event evaluation also hashes `state.seed` when choosing event definitions/targets. Existing bootstrap tests explicitly prove same seed source gives identical initial state and different seed sources give different numeric seeds.

Therefore identical topology/faction settings repeatedly create the same generated strategic world rather than a fresh campaign variation.

**Classification:** VERIFIED replayability gap.

### 4.2 There is no normal in-app “start another campaign” path

Terminal behavior is intentionally final: `terminalFreezeSystems.test.ts` proves events, logistics, world events and bot decisions remain inert forever after terminal.

But the browser lifecycle does not expose a replacement/new-campaign action after the first autosave exists:

- bootstrap restores a valid primary autosave or its recovery snapshot before it considers `createFreshGame()`;
- `loadAutosave()` deliberately recovers from `autosave.snapshot` when primary is absent/invalid;
- `src/ui/saveManager.ts` treats both reserved autosave slots as non-deletable in the UI;
- save UI offers manual save/load/import/export/delete but no new-campaign action;
- `src/ui/systemWorkspace.ts` only exposes Saves and presentation Settings.

The storage layer already has safe delete primitives. The missing piece is a player-facing lifecycle, not a new persistence subsystem.

**Classification:** VERIFIED browser UX/replayability gap.

### 4.3 Why these are one work item

A restart button alone would repeatedly recreate the same world seed. Seed variation alone would be unreachable after the first autosave/terminal without clearing browser storage externally. Together they form one player-visible contract:

> A player can deliberately end/replace the current local campaign and create a new, independently seeded but fully reproducible campaign using normal in-game UI.

This flows through one bootstrap/persistence/UI boundary and one Browser acceptance story.

## 5. Lower-priority VERIFIED / research seams

### Bank / credit efficiency

`completeBuildingCatalog.ts` still gives the Bank `bankCreditEfficiencyPercent: 5`; `buildingOperations.ts` aggregates it. No current credit/loan runtime consumer exists. `advertisedEffectTruth.test.ts` intentionally says this Bank effect is evidence-gated and must remain untouched unless evidence justifies semantics.

The thematic names (`Кредитная цитадель`, `Финансовый нексус`, `Шпиль дани`) do not establish a formula or a player promise for a credit subsystem.

**Classification:** VERIFIED producer-without-consumer seam.  
**Decision:** REJECT a speculative Bank/credit implementation batch. Do not guess a formula.

### Bot `difficulty`

`BotProfile` carries `difficulty`; current fixed profiles use `normal/hard/normal`. Graphify finds no policy consumer for `BotDifficulty`. Personality, cadence, command budget and tactical risk do have real consumers.

**Classification:** VERIFIED dead/internal metadata, not a player-facing broken promise.  
**Decision:** do not spend a product batch on it. If a future Audit exposes selectable difficulty, define semantics then; otherwise cleanup may be considered only when naturally adjacent.

### Further bot differentiation

Personality-specific first-combat development, 700/800/900 attack risk and recent-outcome recovery remain real. Later compressed closure ordering is intentionally shared.

**Classification:** VERIFIED depth opportunity, not correctness.  
**Decision:** RESEARCH after replay lifecycle; preserve Organic Terminal guarantees.

### Achievements / meta progression

No achievement runtime graph exists. Stellar already has faction choice, command/Admiral progression, PvE reputation, Solar War score and local ranking.

**Classification:** absence VERIFIED; need/value still UNKNOWN.  
**Decision:** RESEARCH, not implementation.

### Moving-object trajectories

Space objects have position, yield, hazard, control and cooldown; there is no trajectory/velocity lifecycle. The world is nevertheless dynamic through scheduled events and target recovery.

**Classification:** absence VERIFIED; player-value/reference semantics UNKNOWN.  
**Decision:** RESEARCH. Heavy persistence/targeting/UI coupling makes it inappropriate while a smaller verified replayability gap exists.

## 6. DISPROVED stale gaps

Fresh main does not support reopening the following without new evidence:

1. Organic Fresh Game → Terminal is blocked — **DISPROVED** by permanent organic terminal gates.
2. Organic Obelisk requires injected state — **DISPROVED**.
3. terminal save/load/partition determinism is unproven — **DISPROVED**.
4. faction terminal closure is Aegis-only — **DISPROVED** by bounded faction matrix.
5. normal combat seed uses only fleet-ID length — **DISPROVED**.
6. Arena still uses length-only fleet identity for new entries — **DISPROVED** by PR #183 persisted resolution seed path.
7. Arena is missing from unified reports — **DISPROVED** by PR #184 canonical Arena synthesis.
8. tactical choices have no historical combat feedback — **DISPROVED** by PR #184 immutable tactical snapshots/report consumers.
9. ranking `Победы` counts generic successful operations — **DISPROVED** by PR #185 canonical combat-only classification.
10. bots cannot do legal PvP — **DISPROVED** by intelligence-gated fleet planner/reducer path.
11. bot personalities are only labels — **DISPROVED** by live strategy/risk/outcome consumers.
12. research UI/runtime requirement paths drift — **DISPROVED**.
13. planet UI promises several active building queues — **DISPROVED**; reserve slots remain visibly locked.
14. the world is wholly static — **DISPROVED** by scheduled world events plus space-object depletion/control/recovery.
15. broad advertised-effect ghosts remain — **DISPROVED** for Scrapyard/Trade Center/Ecology; Bank is the explicit evidence-gated exception, not authorization for a credit system.

## 7. Nemexia-reference classification

Nemexia remains reference, never specification.

| Candidate | Classification | Fresh decision |
|---|---|---|
| replayable campaign/new-world seed lifecycle | KEEP_STELLAR | This need is proven by Stellar’s own local-campaign lifecycle; no Nemexia formula is required. |
| achievements / Achievement Points | RESEARCH | Optional replayability/meta layer; current product value is not proven. |
| Resource/Battle/Total score formulas | RESEARCH / REJECT direct port | Current native ranking is truthful; do not copy unverified reference formulas. |
| moving objects / trajectories | RESEARCH | Possible world-depth feature, but evidence/value and persistence design are not complete. |
| Bank / credit mechanics | REJECT | No authoritative formula or current player contract justifies inventing credit gameplay. |
| existing command doctrine/Admiral/flagship | KEEP_STELLAR | Already real, persisted and observable; no replacement needed. |
| deterministic world events / Arena / PvE | KEEP_STELLAR | Existing integrated Stellar-native loops remain stronger than copying names. |
| more bot personality depth | KEEP_STELLAR baseline + RESEARCH expansion | Preserve current policy; expand only after a separate value/evidence Audit. |

## 8. DECISION — next batch exists, exactly one implementation PR

Chosen proposed batch:

`POST-1.0-REPLAYABLE-CAMPAIGN-LIFECYCLE`

Exact implementation count: **1**.

Work item:

`POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE`

This is smaller than the old administrative defaults because the current acceleration policy requires the minimum coherent review boundary. Splitting it into two PRs is not justified:

- “restart current campaign” without seed variation leaves repeat worlds;
- seed variation without a restart lifecycle remains inaccessible once autosave exists;
- both use one bootstrap/state-construction/persistence/browser path;
- both can be regression-tested and reviewed as one bounded change;
- no intermediate merged state is required by persistence or architecture;
- one PR remains safely reversible and does not mix an unrelated subsystem.

A zero-PR/no-batch outcome was explicitly considered and rejected because the lack of an in-app second-campaign path is a direct player-facing lifecycle failure, not merely an optional enhancement.

## 9. Implementation contract — `POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE`

### Purpose / player-visible outcome

A player can start another campaign from normal in-game UI—including after terminal—without clearing browser storage externally. Each new real campaign receives a different suggested world seed by default, the seed is visible/editable/reusable, and entering the same seed reproduces the same generated initial world.

### VERIFIED current problem

- real `createFreshGame()` hard-codes seed source `stellar-empires-m1`;
- new-game dialog has no seed control;
- valid autosave or recovery snapshot prevents fresh-game selection;
- reserved autosave/snapshot cannot be deleted in player UI;
- terminal state is intentionally frozen forever;
- `GameState.seed` already exists and is persisted, so this does not need a new save concept.

### Expected runtime paths

Primary expected changes:

- `src/main.ts`;
- `src/simulation/createInitialGameState.ts`;
- `src/simulation/seed.ts` only if a small numeric-seed validator/helper is needed;
- `src/ui/newGameFactionPicker.ts`;
- `src/ui/saveManager.ts`;
- `src/storage/SaveManager.ts` only for a safe ordered clear helper if implementation benefits from centralizing it.

Expected tests:

- `tests/simulation/createInitialGameState.test.ts`;
- `src/ui/newGameFactionPicker.test.ts`;
- `tests/storage/saveManager.test.ts`;
- new focused Browser test such as `tests/e2e/campaignLifecycle.spec.ts` (or an equally focused existing E2E file if reuse is cleaner).

Read/verify only unless a regression proves another necessary change:

- `src/storage/loadAutosave.ts`;
- `src/storage/AutoSaveController.ts`;
- `src/runtime/campaignBootstrap.ts`;
- `src/simulation/universe/model.ts`;
- `src/simulation/pve/worldEvents.ts`;
- terminal/endgame runtime.

### Important functions/types

- `createFreshGame()` / `bootstrap()`;
- `createInitialGameState()`;
- a new explicit numeric-seed bootstrap helper or overload (implementation may choose the smallest typed form without changing string-seed compatibility);
- `normalizeSeed()` / seeded generation utilities;
- `selectNewGameCampaign()` / `NewGameCampaignSelection`;
- `SaveManager.delete()` and/or one narrow safe campaign-reset helper;
- `loadAutosave()`;
- `AUTOSAVE_SLOT_ID`;
- `AUTOSAVE_SNAPSHOT_SLOT_ID`.

### DECISION — seed contract

The new player-facing campaign seed is a **uint32 numeric seed** and the exact numeric value becomes `GameState.seed`.

Reason: `GameState.seed` is already the persisted deterministic authority. Re-hashing a displayed numeric value as text would make a shown seed non-reproducible. Implementation should therefore add the smallest explicit numeric-seed state-construction path while keeping the existing string-source helper for current tests/fixtures/backward compatibility.

Real browser new-game UI:

- shows a numeric seed field;
- pre-fills a suggested uint32 seed;
- offers an explicit reroll/generate action;
- allows the player to type/reuse a valid uint32 seed;
- rejects invalid/out-of-range input before campaign creation.

Suggested seed generation may use Web Crypto (`crypto.getRandomValues`) **only before GameState creation**. It must not use wallclock time and must not introduce nondeterministic simulation behavior. Once selected, the numeric seed is authoritative/persisted and all runtime generation remains deterministic.

E2E/test environments must inject/select an explicit fixed seed rather than rely on Web Crypto so acceptance is reproducible.

### DECISION — new-campaign reset contract

Starting a new campaign is explicit/destructive for the active autosave and requires confirmation.

On confirm:

1. preserve all user-named/manual save slots;
2. remove recovery snapshot first;
3. only after snapshot removal succeeds, remove primary autosave;
4. reload/return through the existing bootstrap;
5. with both reserved slots absent, show the normal new-game dialog;
6. cancel or any failure leaves a recoverable current campaign.

Snapshot-first order is required because deleting primary first while leaving snapshot would make `loadAutosave()` recover the old campaign on reload.

No terminal-only special state path is needed: the action should be available from System/Saves for active and terminal campaigns alike.

### Dependency / data flow

```text
System → Saves → “Новая партия” → confirmation
→ clear autosave.snapshot, then autosave
→ reload existing bootstrap
→ no recoverable autosave
→ selectNewGameCampaign(faction/topology/speed/seed)
→ numeric seed + existing campaign settings
→ createInitialGameState numeric-seed path
→ universe + neutral forces + space objects + world-event seed authority
→ existing autosave/runtime metadata
```

### Consumers

- browser player new-game flow;
- System/Saves workspace;
- universe generation;
- neutral/PvE initialization;
- world-event deterministic selection;
- existing autosave/manual save/export/import flow.

Bots do not need a separate path; they inherit the generated campaign state.

### Persistence / schema / save / migration

**DECISION:** schema v19, save format v6, migration none.

Evidence:

- numeric `GameState.seed` already exists and save validation already requires an integer seed;
- campaign settings need no new required persisted property;
- the reset action deletes only current local reserved slots by explicit player request;
- manual saves and imported legacy/current saves remain unchanged.

Do not bump schema/save merely to expose or vary an already-persisted seed.

### Deterministic constraints

- same explicit numeric seed + same faction/settings => identical initial state/world;
- distinct numeric seeds must demonstrably vary generated world evidence;
- no `Date.now()`/wallclock-derived seed;
- Web Crypto, if used, is only a pre-state seed suggestion and never runtime RNG;
- existing seeded simulation paths remain unchanged after state creation;
- manual saves are not touched by new-campaign reset;
- reset ordering cannot accidentally restore the old snapshot;
- existing terminal and partition determinism gates remain identical.

### Performance constraints

- no new simulation loop;
- numeric seed handling is O(1);
- campaign creation remains existing universe initialization complexity;
- clearing two reserved save records is bounded;
- campaign catch-up performance budgets are unchanged.

### Regression-first strategy

The implementation PR must begin with a clean RED regression commit proving both current failures before runtime code changes:

1. browser/bootstrap-level test demonstrates two ordinary fresh campaign starts with default current path resolve to the same hard-coded seed / generated world;
2. save/new-campaign lifecycle test demonstrates that an existing reserved autosave + snapshot has no player-visible action that reaches the fresh-game selector after terminal/current campaign.

The RED must fail on those semantic assertions, not lint/type/fixture noise. Record commit SHA, CI run and failing assertions in the implementation PR body.

### Focused unit/integration tests

Minimum deterministic coverage:

1. explicit numeric seed is preserved exactly as `GameState.seed`;
2. same numeric seed produces identical initial state;
3. different numeric seeds change deterministic universe evidence;
4. legacy string seed-source API remains unchanged;
5. seed UI accepts min/max valid uint32 and rejects invalid values;
6. reroll/generator returns valid uint32 and can be injected/stubbed in tests;
7. campaign reset deletes recovery snapshot before primary autosave;
8. reset preserves manual slots;
9. failed/cancelled reset keeps a recoverable current campaign;
10. after successful reset, `loadAutosave()` returns missing rather than recovering old snapshot;
11. existing save manager/import/export/recovery tests remain green.

### Browser acceptance

Focused Browser acceptance must prove the real player flow:

1. open a running or terminal E2E campaign with persisted autosave/recovery state;
2. navigate to `System → Saves` and see `Новая партия`;
3. cancel confirmation and verify current campaign remains;
4. confirm new campaign and verify the normal new-game dialog is reached rather than snapshot recovery;
5. select an explicit fixed seed and start;
6. verify the visible/runtime seed equals the chosen numeric seed;
7. prove a second explicit seed yields different deterministic world evidence while repeating the first seed reproduces the first evidence;
8. verify a manual save slot survives the new-campaign reset.

Production Pages smoke and existing full Browser E2E remain mandatory.

### Risks

- deleting primary autosave before snapshot would silently recover the old campaign;
- a displayed seed that is re-hashed rather than used directly would falsely promise reproducibility;
- using time as seed would violate deterministic constraints;
- changing existing string-seed semantics could destabilize hundreds of deterministic fixtures;
- random E2E seed generation would make Browser acceptance flaky;
- accidentally deleting manual slots would be data-destructive.

### Non-goals

- no achievements/meta-progression;
- no global account/profile history;
- no cloud saves;
- no Bank/credit system;
- no moving-object trajectories;
- no combat/economy balance changes;
- no bot strategy rewrite;
- no schema/save bump;
- no new campaign difficulty system;
- no procedural formula redesign beyond choosing the already-supported seed authority.

### Ordered implementation steps

1. regression-first RED for fixed real seed + unreachable fresh-campaign lifecycle;
2. add the narrow numeric seed construction/validation contract while preserving string-seed fixtures;
3. expose seed input + deterministic test injection in new-game UI;
4. add safe confirmed reserved-save reset preserving manual slots;
5. route successful reset back through existing bootstrap/new-game selector;
6. show/reuse the authoritative seed in player-facing campaign information;
7. add focused unit/storage/browser acceptance;
8. run full CI, pinned Graphify, Browser E2E, production Pages smoke and permanent terminal/performance gates;
9. close this one-PR batch in the same implementation PR if controller authorizes the Audit.

### Acceptance gate

The one implementation PR is acceptable only when:

- RED evidence is recorded;
- all focused seed/reset/save/browser tests pass;
- full asset/lint/typecheck/test/build passes;
- campaign catch-up performance passes;
- Organic Obelisk passes;
- Organic Fresh Game → Terminal passes;
- terminal save/load + partition determinism passes;
- bounded organic faction terminal matrix passes;
- Graphify pinned 0.8.38 passes;
- Browser E2E passes;
- production Pages smoke passes;
- no existing manual save/recovery compatibility regression exists.

### Unresolved questions

```text
criticalUnknownsResolved = true
criticalUnknowns = []
```

Non-critical display copy/layout may be refined inside the fixed contract. It may not change the authoritative numeric-seed semantics, deletion order or manual-save preservation.

### Verification method

Direct seed/state assertions, save repository state before/after reset, repeated deterministic world construction, Browser flow through System/Saves → new-game dialog, plus the permanent exact-head gate matrix.

## 10. Why no second implementation PR

A second PR would be administrative decomposition rather than a dependency boundary. No new persisted schema must merge before UI can consume it, and there is no large subsystem replacement. The producer (campaign creation seed), lifecycle boundary (reserved autosave reset), consumer (new-game UI) and Browser acceptance are one bounded path.

One PR is therefore the minimum and the safest review/revert unit.

## 11. Batch-wide invariants

The proposed implementation must preserve:

- schema v19 / save v6;
- existing old-save migrations and normalization;
- deterministic seeded simulation after GameState creation;
- no wallclock RNG/state dependency;
- ordinary command/reducer authority;
- intelligence information boundaries;
- combat/Arena/Solar War formulas and PR1/PR2/PR3 truth contracts;
- ranking/report deterministic ordering;
- Organic Fresh Game → Terminal;
- Organic Obelisk;
- terminal save/load/partition determinism;
- bounded faction terminal matrix;
- campaign catch-up performance;
- manual save/import/export/recovery behavior;
- production Browser/Pages baseline.

## 12. Audit acceptance gate

Before Audit PR #186 may be Ready:

- diff remains docs-only;
- #185 squash/batch closure reconciliation is recorded across control-plane;
- fresh exact-head normal CI SUCCESS;
- fresh exact-head Graphify SUCCESS using pinned 0.8.38;
- Browser E2E and production Pages smoke SUCCESS if triggered;
- unresolved review threads = 0;
- submitted blocking reviews = 0;
- `mergeable=true`;
- base remains `main`;
- live `main` remains `e974c09e7779b4cf3bbc6d0279b8d35f177a29e6` unless explicitly reconciled;
- PR head is stable;
- PR body contains final evidence;
- PR is Ready (`draft=false`) and not merged.

Audit merge, if controller-approved later, authorizes only `POST-1.0-PR1-REPLAYABLE-CAMPAIGN-LIFECYCLE`. It does not authorize a second PR, PR4 from the old batch, or any research-only feature.

## 13. Stop boundary

After Audit #186 is Ready: **STOP for controller review. Do not merge the Audit. Do not create the implementation branch. Do not start PR1.**
