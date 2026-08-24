# POST-1.0-NEXT-PRODUCT-2 — fresh product Audit

**State:** docs-only Audit / controller review required  
**Audit PR:** #182 `docs: audit next post-1.0 product batch`  
**Starting `main`:** `a1249615d55e9ffebc60889c3ab4d5ff72d8933d`  
**Starting tree:** `2d3d6c33668ef295bdad10f0319fd6993c10b187`  
**Previous completed batch:** `POST-1.0-BOT-STRATEGY-DIFFERENTIATION`  
**Proposed next batch:** `POST-1.0-STRATEGIC-FEEDBACK-TRUTH`  
**Complexity:** medium / three ordered implementation PRs  
**Runtime target:** schema v19 / save format v6  
**Migration:** none  
**Implementation authorized:** false  
**Critical UNKNOWNs resolved:** true

This document is a fresh product Audit after merged PR #181. It is not an implementation authorization until the controller merges Audit PR #182. No implementation branch exists.

## 1. Fresh-main and evidence boundary

Live `main` was independently verified before research:

`a1249615d55e9ffebc60889c3ab4d5ff72d8933d`

That is squash PR #181 `feat: adapt bot recovery to recent battle outcomes`.

The previous batch is GitHub-complete:

```text
Audit #178 → 4b96d457fad1577a0663210864381a0d3a33cb77
PR #179    → 7620975e1cd604c8bcdce0bac748e32e276061db
PR #180    → f0cfcb7d2944b8380cf8b3157ae1570bbbbb17cd
PR #181    → a1249615d55e9ffebc60889c3ab4d5ff72d8933d
```

No PR4 from that batch exists or is authorized.

### Graphify evidence

Repository-pinned Graphify is `graphifyy==0.8.38` from `.github/workflows/graphify-audit.yml` and runs `bash scripts/graphify-audit.sh code`.

The most recent successful runtime graph before this Audit is Graphify #1371 from PR #181. Its source tree is exactly `2d3d6c33668ef295bdad10f0319fd6993c10b187`, the same tree carried by current squash `main`, so it is valid current-runtime graph evidence before this docs-only Audit.

Graph summary:

- 3,602 nodes;
- 12,603 edges;
- 141 communities;
- 100% code extraction;
- dominant hubs include `GameState`, `createInitialGameState()`, `executeCommand()`, `getFactionMechanicalRoles()`, `GameCommand`, `FleetState` and `PlanetState`.

Graphify was used as an accelerator to identify actual consumers/hubs. Every priority finding below was then confirmed by direct source/test inspection.

Important graph flows:

- `getCommandCombatEffects()` → normal attack, Solar War, Arena;
- `createUnifiedMissionReports()` → report UIs, HUD/report summaries, ranking, report tests;
- `getPlanetBuildingOperationalSummary()` → progression/research/production consumers, but no credit/loan consumer;
- `deriveRecentBotBattleOutcomeSignal()` → `threatRecoveryPlanner.ts`;
- `getPlanetSpecializationEffects()` → economy/building/production timing;
- no achievement runtime nodes;
- no trajectory/velocity runtime nodes for moving space objects.

## 2. Fresh product classification

Classification vocabulary: `VERIFIED`, `INFERRED`, `UNKNOWN`, `DECISION`, `DISPROVED`.

| Domain | Classification | Fresh finding |
|---|---|---|
| economy | VERIFIED | Resource production/storage/stability, specialization and market consumers exist. No broad economy blocker found. Bank credit efficiency remains a producer-only internal seam. |
| research | VERIFIED / DISPROVED | Runtime and UI use the same registered/compatible research definitions; requirement/cost/queue truth is not the stale mismatch hypothesized in older roadmap prose. |
| production | VERIFIED / DISPROVED | Real ship/defense/build queues and specialization timing exist. Planet UI exposes one real active build slot; slots 02–04 are explicitly locked `Резерв`, not fake active queues. |
| fleets | VERIFIED | Ordinary create/send/return/transport/scout/attack/recycle/colonize/PvE mission lifecycles exist. |
| combat | VERIFIED + gap | Normal attack has full stable fleet identity seed and stable primary defender doctrine. Arena still uses `fleet.id.length` in resolution seed when no persisted seed snapshot exists. |
| PvE | VERIFIED + gap | Expeditions, pirate targets, space objects, Arena, reputation and world events exist. Arena history is not included in unified mission reports. |
| PvP | VERIFIED + gap | Ordinary PvP attack path is live and bots require current full intel plus mission/reducer validation. Tactical decision context is poorly observable in reports. |
| intelligence | VERIFIED | Level-3 snapshots, staleness, counter-intelligence alerts and incoming-contact visibility tiers exist. |
| logistics | VERIFIED | Deterministic recurring routes, reserves, priority ordering, receipts, pause/resume/delete semantics exist. |
| colonization | VERIFIED | Ordinary fleet colonization creates complete colonies, consumes colony ships, stations escorts, handles races and capacity/research gates. |
| world / space objects | VERIFIED + RESEARCH | Static harvestable objects and dynamic scheduled world events exist. Moving-object/trajectory gameplay does not. |
| endgame | VERIFIED / DISPROVED | Organic Fresh Game → Terminal, physical Planet Destroyers, positive Solar War qualification, Organic Obelisk, faction matrix and terminal save/load/partition determinism are permanent gates. |
| bot strategy | VERIFIED + depth opportunity | Personality development/risk/outcome adaptation exists. Personality development is intentionally bounded mainly to first-combat and shared closure-safe ordering later; further differentiation is possible but not currently the strongest gap. |
| reports / observability | VERIFIED gap | Unified reports omit Arena and do not explain existing formation/target-priority/command doctrine/flagship tactical choices. |
| progression / replayability | VERIFIED gap + RESEARCH | Local ranking exists, but its `Победы` metric counts generic successful operations and omits Arena. Achievements/meta-progression are absent but not yet proven worth a new subsystem. |

## 3. Strongest VERIFIED product gaps

### GAP-A — Arena combat identity is still length-based

`resolveAttackMission()` already uses `stableFleetIdentityContribution(attackerFleet.id)`, and `tests/simulation/combatIdentityDoctrine.test.ts` proves equal-length different fleet IDs produce different normal-attack seeds.

Arena is different. `applyArenaResolutionEvent()` currently derives:

```text
mixSeed(entry.challenge.combatSeed ^ event.sequence ^ fleet.id.length)
```

Two equal-length Arena fleet IDs therefore contribute identical fleet-identity entropy. Existing Arena tests cover deterministic challenge generation, costs, resolution, save/load and bounded history, but not full fleet identity.

**Classification:** VERIFIED correctness gap.

**Compatibility constraint:** changing the resolution formula directly would change the future outcome of already-saved active Arena entries. New entries must therefore snapshot a new full-identity resolution seed at entry time, while legacy entries without the snapshot retain the exact old length-based fallback. This resolves the compatibility question before implementation.

### GAP-B — “Unified” reports omit Arena

`PveMetaState.arenaHistory` persists Arena results with difficulty, outcome, initial/remaining fleets, reward and reputation award. `arenaOperationsPanel.ts` exposes that history separately.

`createUnifiedMissionReports()` aggregates battle eventLog, expeditions, space-object missions, world events, intelligence and Solar War, but not Arena history. Both report UI consumers and aggregate consumers rely on this hub.

Player-visible consequences:

- Arena combat is absent from the main reports timeline;
- the combat filter does not show Arena;
- unified PvE summaries/comparison omit Arena;
- downstream scoring built from unified reports cannot count Arena victories.

**Classification:** VERIFIED observability/data-flow gap.

### GAP-C — reports hide the tactical choices that already changed the battle

Normal attacks, Solar War and Arena all consume command combat effects. Normal BattleReport already persists formation, target priority and commander IDs. Player UI separately allows changing command doctrine, Admiral level progression and flagship assignment.

The report UIs show outcome, losses, rewards, threat/reward multipliers and combat-v2 damage rows, but not the selected formation/priority, command doctrine/level, flagship state or commander identity as tactical context.

Historical doctrine must never be reconstructed from current command state because the player may change doctrine later. New combat reports therefore require an immutable optional tactical snapshot written at resolution. Legacy reports without it remain valid and display a truthful “not recorded”/partial context rather than current-state inference.

**Classification:** VERIFIED player-feedback gap.

### GAP-D — ranking `Победы` is semantically wrong

`commandRanking.ts#countVictories()` uses all unified reports and counts any report whose primary empire has `outcome === 'success'`. That includes successful expeditions and space-object operations. Meanwhile Arena victories are absent because Arena is not in unified reports.

`commandRankingScreen.ts` presents the result to the player as `Победы` and the score adds `victories * 500`.

The score is therefore deterministic but semantically inconsistent with its player-visible combat label.

**Classification:** VERIFIED scoring/truth gap.

## 4. Lower-priority candidates

### Bank / `bankCreditEfficiencyPercent`

The complete building catalog still produces `bankCreditEfficiencyPercent: 5` and `buildingOperations.ts` aggregates it. No credit/loan consumer is present in the current graph/runtime.

Previous advertised-effect cleanup intentionally left this evidence-gated rather than inventing a credit formula.

Fresh evidence does not establish a player-visible promise that requires a banking subsystem now.

**Classification:** VERIFIED internal producer-without-consumer seam; DECISION: do not create credit/loan gameplay from this field in the next batch.

### Moving objects / trajectory lifecycle

`SpaceObjectState` has system/position/coordinate/yield/hazard/control/cooldown but no trajectory/velocity state. The world is nevertheless not globally static: deterministic world events (`solar-storm`, `mineral-bloom`, `pirate-hunt`, `anomaly-aftershock`) have real scheduled lifecycle and effects.

**Classification:** moving-object absence VERIFIED; product value/canonical reference behavior UNKNOWN. Heavy persistence/targeting/UI coupling makes this RESEARCH, not the next batch.

### Additional bot differentiation

Current policy proves different first-combat development preferences plus tactical risk `700/800/900` and latest-three loss recovery. It also deliberately returns to a shared closure-safe development/opportunity order outside the bounded differentiation window.

**Classification:** VERIFIED remaining depth opportunity, but not a correctness gap. Expanding it now risks disturbing proven Organic Terminal behavior and delivers less immediate feedback value than fixing current combat truth.

### Achievements / extra scoring

No achievement runtime graph exists. Stellar already has command/Admiral levels, reputation, Solar War score and a local empire ranking.

**Classification:** absence VERIFIED; need/value UNKNOWN. Do not build an achievement system before the existing ranking score is truthful.

## 5. DISPROVED stale hypotheses

The fresh Audit explicitly rejects these as current gaps unless new evidence appears:

1. **DISPROVED — Organic campaign cannot reach terminal.** Permanent organic terminal gate exists and requires physical Planet Destroyers + positive Solar War.
2. **DISPROVED — Obelisk progression needs state injection.** Organic Obelisk evidence records storage preparation and real queue/completion boundaries.
3. **DISPROVED — terminal determinism is unproven.** Save/load and partition continuation are checksum-equivalent through terminal.
4. **DISPROVED — faction closure is single-faction only.** Bounded Synod/Veyra terminal matrix exists in addition to Aegis canonical path.
5. **DISPROVED — normal attack seed only uses fleet ID length.** Normal `resolveAttackMission()` uses full stable identity and has an equal-length regression test. The remaining issue is specifically Arena.
6. **DISPROVED — defender doctrine depends on fleet array order.** Stable primary defender selection is regression-tested.
7. **DISPROVED — research UI can drift from runtime definitions.** Current research screen reads the registered runtime definition/requirements/cost path.
8. **DISPROVED — planet UI presents several functional build queues.** Only slot 01 is active; 02–04 are explicitly locked reserve presentation.
9. **DISPROVED — bots cannot perform real PvP due hidden-state policy.** Fleet planner attacks only with current level-3 intelligence and preserves mission/reducer validation.
10. **DISPROVED — bot personalities are only names.** First-combat development preference, tactical risk and recent-outcome recovery are real consumers.
11. **DISPROVED — all advertised salvage/market/ecology effects still lack consumers.** Scrapyard/Trade Center producer-only effects and Ecology capacity advertising were removed. Bank is the intentional remaining evidence-gated exception.
12. **DISPROVED — world gameplay is wholly static.** Scheduled world events and space-object control/depletion exist; only physical trajectory/movement remains absent.

## 6. Nemexia-reference classification

| Candidate/reference idea | Classification | Decision |
|---|---|---|
| richer achievement / Achievement Point layer | RESEARCH | Potential replayability value, but do not import before existing ranking semantics are truthful. |
| extra resource/battle scoring formulas | RESEARCH | Current Stellar ranking is native and understandable; do not guess Nemexia formulas. |
| moving object / trajectory gameplay | RESEARCH | Could add map dynamism, but current canonical behavior and player value are not evidence-complete and coupling is heavy. |
| Bank / credit-efficiency mechanics | REJECT | Reject direct speculative credit-system import. Preserve Stellar truth-first rule; separately remove/redefine ghost field only if later Audit justifies it. |
| Admiral / command doctrine progression | KEEP_STELLAR | Stellar already has level 1–40, doctrine choice, flagship and Commander Ships. Improve report feedback rather than replace it. |
| deterministic dynamic world pressure | KEEP_STELLAR | Existing world events, pirate hunts, Arena and reputation already provide a stronger integrated Stellar-native loop than copying reference names. |
| combat-result tactical explanation | KEEP_STELLAR | Close feedback around Stellar’s own real formation/doctrine/flagship mechanics rather than importing a foreign formula. |
| more bot personality depth | KEEP_STELLAR | Existing bounded policy remains the correct base. Revisit only with a separate future Audit if feedback truth is complete. |

No Nemexia mechanic is authorized merely because it exists in the reference game.

## 7. DECISION — next coherent batch

Chosen batch:

`POST-1.0-STRATEGIC-FEEDBACK-TRUTH`

Why this batch wins:

- all four core gaps are direct-source VERIFIED;
- they affect decisions the player already makes, rather than adding speculative surface area;
- PR2 and PR3 share the high-traffic `createUnifiedMissionReports()` data flow, so coupling is coherent rather than artificial;
- PR1 closes the remaining combat-identity exception before reports/ranking make Arena more prominent;
- the batch requires no schema/save version change, no migration, no new world subsystem and no guessed Nemexia formula;
- it improves strategic readability/replay learning while preserving proven Organic Terminal and bot behavior.

Exactly three implementation PRs are proposed. There is no PR4 in the accepted proposal.

## 8. Implementation contract

Implementation remains forbidden until this Audit is controller-approved and merged. Each successor must start from fresh merged `main` after its predecessor.

### PR1 — `POST-1.0-PR1-ARENA-COMBAT-IDENTITY-TRUTH`

**Purpose / player-visible outcome**

Arena combat must use full stable fleet identity for new entries, so equal-length different fleet IDs cannot alias the battle seed, while already-saved active entries preserve their legacy outcome semantics.

**VERIFIED current state**

- normal attack uses `stableFleetIdentityContribution(fleet.id)`;
- Arena resolution uses `fleet.id.length`;
- ArenaEntry persists challenge/fleet/timing but no resolved seed snapshot;
- Arena save/load coverage exists but no equal-length identity regression exists.

**Expected files to change**

- `src/simulation/pveMeta/arena.ts`;
- `src/simulation/pveMeta/reputation.ts`;
- `tests/simulation/arenaPveChallenges.test.ts`.

Read/verify only unless a regression proves otherwise:

- `src/simulation/combat/combatIdentity.ts`;
- `src/storage/saveFormat.ts`.

**Important functions/types**

- `stableFleetIdentityContribution(fleetId)`;
- `enterArenaChallenge()`;
- `applyArenaResolutionEvent()`;
- `ArenaEntry`;
- `normalizeArenaEntry()`.

**Dependency/data-flow**

```text
Arena challenge combatSeed
+ entry event sequence
+ stableFleetIdentityContribution(fleet.id)
→ persisted optional ArenaEntry.resolutionSeed
→ applyArenaResolutionEvent()
→ resolveBattle()
```

Legacy path:

```text
ArenaEntry.resolutionSeed absent
→ exact existing mixSeed(challenge.combatSeed ^ event.sequence ^ fleet.id.length)
```

**Consumers**

Player and bot Arena entry/resolution share the same reducer/event path.

**Persistence/save impact**

- add one optional non-negative `resolutionSeed` field to `ArenaEntry`;
- normalizer must preserve it when present and accept absence for legacy saves;
- schema stays v19;
- save format stays v6;
- migration none.

**Deterministic constraints**

- same challenge/event/fleet ID => same new resolution seed;
- equal-length different fleet IDs => distinct full-identity contribution/seed;
- legacy active entry without snapshot => exact previous seed path;
- save/load of new entry => same snapshot and same resolution;
- event partitioning remains equivalent.

**Performance constraints**

One FNV-style pass over fleet ID at Arena entry; no loop over world state and no campaign-time complexity change.

**Exact tests**

Extend `tests/simulation/arenaPveChallenges.test.ts` with:

1. equal-length different fleet IDs create different `resolutionSeed` values;
2. repeated same entry inputs create the same seed;
3. new entry save/load preserves `resolutionSeed` and final result;
4. fixture with omitted `resolutionSeed` uses legacy length fallback and remains save/load stable;
5. existing Arena challenge/cost/reward/history tests remain green.

**Risks**

- accidental cross-version outcome change for active legacy entries;
- accidentally recomputing the snapshot from mutable fleet state.

**Non-goals**

- no combat formula changes;
- no Arena reward/difficulty changes;
- no new RNG source;
- no schema/save bump.

**Ordered steps**

1. add regression-first equal-length and legacy-entry tests;
2. extend `ArenaEntry` normalization with optional seed;
3. snapshot full-identity seed in entry command path;
4. use snapshot with exact legacy fallback at resolution;
5. run focused + full deterministic/save tests.

**Acceptance gate**

Focused Arena suite green, full CI green, existing Organic Terminal/determinism/performance gates green, Graphify green.

**Unresolved questions**

None critical.

**Verification method**

Direct seed assertions + save/load resolution equality + full CI matrix.

---

### PR2 — `POST-1.0-PR2-UNIFIED-COMBAT-FEEDBACK`

**Purpose / player-visible outcome**

Every important combat result, including Arena, appears in the same report system and explains the immutable tactical choices that actually affected resolution.

**VERIFIED current state**

- `createUnifiedMissionReports()` is a high-traffic reports/ranking/HUD hub;
- Arena results are stored in `pveMeta.arenaHistory` but omitted from that hub;
- normal BattleReport stores formation/target priority and commander IDs;
- command doctrine/Admiral level/flagship affect normal attack, Solar War and Arena but are not snapshotted for historical report presentation;
- report UIs do not render tactical context.

**Expected files to change**

Runtime/data:

- `src/simulation/combat/types.ts`;
- `src/simulation/combat/resolveAttackMission.ts`;
- `src/simulation/endgame/solarWar.ts`;
- `src/simulation/pveMeta/arena.ts`;
- `src/simulation/pveMeta/reputation.ts`;
- `src/simulation/reports/missionReports.ts`.

UI:

- `src/ui/reportsWorkspace.ts`;
- `src/ui/missionReportsPanel.ts`.

Tests:

- `tests/simulation/combatIdentityDoctrine.test.ts`;
- `tests/simulation/arenaPveChallenges.test.ts`;
- `tests/simulation/pveBalanceAndReports.test.ts`;
- `tests/e2e/combatFeedback.spec.ts` (new focused browser regression).

Read/verify only unless type consolidation requires an import-only adjustment:

- `src/simulation/command/commandDoctrine.ts`;
- `src/ui/commandDoctrineScreen.ts`;
- `src/ui/globalHudViewModel.ts`.

**Important functions/types**

- `BattleReport`;
- `ArenaResult`;
- `getCommandCombatEffects()` / command state lookup;
- `resolveAttackMission()`;
- `applySolarWarResolutionEvent()` / `resolveEntry()`;
- `applyArenaResolutionEvent()`;
- `normalizeArenaResult()`;
- `UnifiedMissionReport`;
- `createUnifiedMissionReports()`;
- report card renderers.

**Dependency/data-flow**

```text
command doctrine + Admiral level + flagship assignment
+ fleet formation/target priority + commander identity
→ immutable optional combat-decision snapshot at resolution
→ BattleReport / ArenaResult
→ createUnifiedMissionReports()
→ Reports workspace + legacy reports panel + summaries
```

Arena path:

```text
pveMeta.arenaHistory
→ synthesized unified kind='battle', mode='pve'
→ normal combat report filter/summary flow
```

**Consumers**

- Reports workspace;
- legacy mission reports panel;
- global report summaries/HUD through unified report hub;
- `compareEmpirePvePvp()`;
- PR3 ranking consumer.

**Persistence/save impact**

- new tactical snapshot fields must be optional/backward-compatible;
- Arena normalizer must preserve them when present and accept absence;
- old BattleReport/ArenaResult entries remain loadable;
- UI must never infer historical doctrine from current command state;
- schema v19 / save v6 / migration none.

**Deterministic constraints**

- snapshot derives only from authoritative state at resolution;
- report generation remains pure and does not mutate state;
- identical state produces identical report order/content;
- legacy history without snapshot remains deterministic and truthful with partial context.

**Performance constraints**

- no new simulation loop;
- report synthesis remains linear in already bounded histories;
- Arena history remains capped at 64;
- no increase to campaign-time scheduler work.

**Exact tests**

1. normal attack report snapshots command doctrine/level/flagship plus existing formation/priority/commander and round-trips through save/load;
2. Solar War report snapshots the same available player tactical context;
3. Arena result snapshots context and normalization preserves it after save/load;
4. legacy reports/results without snapshot still load and render without current-state inference;
5. `createUnifiedMissionReports()` includes Arena exactly once as PvE combat;
6. unified summary/comparison includes Arena reward/loss/outcome once;
7. report ordering remains deterministic;
8. browser report route shows Arena and tactical context;
9. existing intelligence privacy/visibility tests remain green.

**Risks**

- double-counting Arena in PvE summaries;
- leaking current/hidden enemy state into historical reports;
- making optional legacy data look complete when it is not;
- widening report kind filters incorrectly.

**Non-goals**

- no combat balance/formula change;
- no new hidden information;
- no full replay viewer;
- no achievement/scoring formula in this PR;
- no report-history persistence duplication.

**Ordered steps**

1. add regression tests for missing Arena/unrecorded tactical context;
2. define minimal optional immutable tactical snapshot;
3. populate normal attack, Solar War and Arena at resolution;
4. extend Arena normalization with legacy-safe optional fields;
5. synthesize Arena through the existing unified report hub exactly once;
6. render context in both report consumers;
7. run focused privacy/save/report/browser regressions.

**Acceptance gate**

Focused report/context/save tests + browser regression green; full CI/Graphify/Browser/smoke green; no hidden-state regression; Organic Terminal/performance gates green.

**Unresolved questions**

None critical. Exact display copy may be adjusted inside the fixed data contract but may not change what data is authoritative.

**Verification method**

Direct source assertions on persisted snapshots, save/load equality, unified report counts and browser-visible report context.

---

### PR3 — `POST-1.0-PR3-COMBAT-RANKING-TRUTH`

**Purpose / player-visible outcome**

The ranking field labelled as combat victories must count combat victories—not successful mining/expedition operations—and must include Arena after PR2.

**VERIFIED current state**

- `countVictories()` counts generic `outcome === 'success'` for the primary empire across all unified report kinds;
- successful expedition/space-object reports therefore inflate `Победы`;
- Arena victories are currently absent from unified reports;
- `commandRankingScreen.ts` exposes `Победы` and ranking score adds `victories * 500`;
- existing ranking tests cover deterministic sorting/economy boost but not victory semantics.

**Expected files to change**

- `src/ui/commandRanking.ts`;
- `src/ui/commandRankingScreen.ts`;
- `src/ui/commandRanking.test.ts`;
- `tests/e2e/combatFeedback.spec.ts` from PR2 may be extended for the ranking label/count.

Read/verify only:

- `src/simulation/reports/missionReports.ts`;
- `src/simulation/endgame/solarWar.ts`;
- `src/simulation/pveMeta/reputation.ts`.

**Important functions/types**

- `countVictories()` (rename to `countCombatVictories()` is permitted/expected);
- `createEmpireRanking()`;
- `createPlayerCommandProfile()`;
- `UnifiedMissionReport`.

**Dependency/data-flow**

```text
PR2 truthful unified combat reports
→ combat-only victory classification
→ ranking entry.victories
→ score component victories * 500
→ Command Ranking UI
```

Allowed victory sources:

- attacker/primary victory in `kind='battle'` (PvP, pirate combat, Arena);
- defender/secondary victory in `kind='battle'` when attacker outcome is failure;
- primary Solar War combat victory.

Explicitly excluded:

- expedition success;
- space-object success;
- intelligence/world-event/system success;
- Arena withdrawal/draw/defeat.

**Consumers**

- command ranking list;
- player command profile;
- any future consumer of the ranking entry.

**Persistence/save impact**

None. Ranking remains derived from current persisted histories. Schema v19 / save v6 / migration none.

**Deterministic constraints**

- same state => identical score/rank;
- report array order must not alter victory total;
- each report ID counts once via unified-report uniqueness;
- tie ordering remains existing deterministic rule.

**Performance constraints**

Single pass over bounded unified reports per empire; no scheduler/simulation impact.

**Exact tests**

1. successful expedition does not increment combat victories;
2. successful space-object operation does not increment combat victories;
3. PvP attacker win increments attacker only;
4. PvP defender win increments defender only;
5. pirate/Arena combat victory increments primary empire;
6. Solar War victory increments participant;
7. draw/defeat/withdrawal do not increment;
8. ranking score changes by exactly the documented combat-victory component;
9. UI label is explicit (`Боевые победы` or equivalent truthful copy);
10. existing deterministic ranking tests remain green.

**Risks**

- expected ranking positions change because previously inflated success counts disappear;
- accidental double count of an Arena result after PR2.

**Non-goals**

- no Nemexia scoring formula;
- no achievement points;
- no global leaderboard/server persistence;
- no balance tuning of the 500-point weight unless regression evidence proves the existing coefficient invalid.

**Ordered steps**

1. add regression-first ranking fixtures with mixed operation kinds;
2. restrict derived victory semantics to combat kinds/outcomes;
3. make player copy explicit;
4. verify score/rank deterministic behavior;
5. close batch with full report/ranking/browser and campaign gates.

**Acceptance gate**

Focused ranking/report browser regressions green; full CI, Graphify, Browser E2E/production smoke, Organic Terminal, Obelisk, terminal determinism, faction matrix and campaign performance green.

**Unresolved questions**

None critical.

**Verification method**

Mixed-history unit fixtures + browser-visible ranking assertion + full exact-head delivery matrix.

## 9. Critical UNKNOWN closure

```text
criticalUnknownsResolved = true
criticalUnknowns = []
```

Resolved before Audit merge:

1. **Arena legacy determinism:** use optional persisted new-entry `resolutionSeed`; legacy entries without it use exact old length fallback.
2. **Historical doctrine truth:** snapshot at resolution; never derive historical doctrine from current mutable command state.
3. **Arena report taxonomy:** synthesize Arena as existing combat `kind='battle'`, `mode='pve'` so current combat filters and ranking consume one canonical combat stream without introducing a parallel report kind.
4. **Persistence/versioning:** all added report/Arena fields are optional and backward compatible; no state schema/save format bump or migration is required.
5. **Ranking meaning:** `Победы` means combat victories only; non-combat operation success is excluded.

## 10. Batch-wide invariants

All three PRs must preserve:

- state schema v19;
- save format v6;
- migration none;
- ordinary commands/reducer authority;
- current/full intelligence boundaries;
- existing combat math, doctrine effects and commander effects;
- Organic Fresh Game → Terminal;
- Organic Obelisk evidence;
- bounded faction terminal matrix;
- terminal save/load + partition determinism;
- campaign catch-up performance budgets;
- bot personality 700/800/900 tactical risk and latest-three outcome recovery;
- legacy `BattleReport.mode` compatibility;
- Browser/production smoke and Graphify gates.

## 11. Explicit non-goals for the batch

- achievements/meta-progression subsystem;
- Nemexia scoring parity;
- moving-object trajectory subsystem;
- Bank/credit/loan subsystem;
- more bot personality states/memory;
- new scheduler mode;
- combat rebalance;
- UI redesign unrelated to tactical feedback;
- dependency/refactor cleanup unrelated to accepted seams.

## 12. Audit acceptance gate

Before this Audit may be Ready:

- docs/control-plane consistent with merged #181 and this proposed batch;
- final diff docs-only;
- fresh exact-head normal CI SUCCESS;
- fresh exact-head Graphify audit SUCCESS using pinned 0.8.38;
- Browser E2E / production Pages smoke SUCCESS if workflow triggers;
- unresolved review threads = 0;
- `mergeable=true`;
- live `main` still resolves to `a1249615d55e9ffebc60889c3ab4d5ff72d8933d` unless explicitly reconciled;
- PR is Ready, not merged.

Audit merge, if controller-approved later, authorizes only the ordered three-work-item contract above. It does not authorize PR4 or a follow-on batch.

## 13. Stop boundary

After this docs-only Audit is Ready:

**STOP for controller review. Do not merge the Audit. Do not create PR1. Do not implement any gameplay.**