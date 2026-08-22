# POST-1.0-NEXT-PRODUCT-AUDIT

**State:** complete for controller review after docs-only FIX  
**Audit baseline / exact starting `main`:** `53cf207f30f1a51f864d77f61969937e0d1ad59c`  
**Baseline source:** squash-merged PR #177 `POST-1.0-PR4-LOW-COST-QUALITY-GATES`  
**Runtime baseline:** schema v19 / save format v6  
**Migration:** none  
**Implementation authorized:** false  
**Audit PR:** #178  
**Audit branch:** `audit/post-1.0-next-product`

## Controller gate

This is an amendment of the existing Audit #178 after controller verdict `FIX — DOCS-ONLY AUDIT CONTRACT COMPLETENESS`. It does not restart the Audit, change the chosen theme, authorize implementation, create PR1, or modify runtime/tests/workflows/dependencies.

Evidence states remain:

- **CONFIRMED** — verified in current source/tests, GitHub state or generated Graphify evidence;
- **DISPROVED** — a plausible hypothesis contradicted by current evidence;
- **UNKNOWN** — insufficient evidence, allowed only when non-critical and explicitly bounded;
- **DECISION** — explicit Stellar-native product choice made for the proposed batch.

Critical UNKNOWN items are not allowed to survive Audit merge under `docs/28-audit-first-autonomous-delivery-protocol.md`.

## Executive verdict

The strongest fresh product gap remains opponent strategy differentiation in the recommended `compressed-v1` campaign. The chosen proposal remains exactly:

`POST-1.0-BOT-STRATEGY-DIFFERENTIATION`

Ordered work items, **not authorized**:

1. `POST-1.0-PR1-COMPRESSED-PERSONALITY-STRATEGY`
2. `POST-1.0-PR2-PERSONALITY-TACTICAL-RISK`
3. `POST-1.0-PR3-BOT-OUTCOME-ADAPTATION-GATE`

No implementation PR exists. `implementationAuthorized=false`.

## Reconciled baseline

- #173–#177 is complete;
- #177 squash/current Audit starting `main`: `53cf207f30f1a51f864d77f61969937e0d1ad59c`;
- active implementation PR/work item: none;
- PR5: does not exist / not authorized;
- schema v19;
- save v6;
- migration none.

## Evidence retained from the original #178 Audit

The original #178 survey remains authoritative except where this FIX resolves the two contract gaps below.

### CONFIRMED

- three bot personalities exist and already differ in cadence/command budget and PvE opportunity ordering;
- blanket “personalities unused” is false;
- default `compressed-v1` core economy/research/production/logistics/fleet/threat orchestration is still largely personality-agnostic;
- combat formations, target priorities, class skills, Admiral/commander ships are live deterministic mechanics;
- ranking/profile, stale intelligence/reporting, colony specialization/logistics and space-object gameplay already exist;
- Graphify `0.8.38` on Audit evidence reported 456 code files, 3,546 nodes and 12,388 edges; `compressedCandidate()` is an existing orchestration seam and `BotProfile` is already a non-persisted policy input.

### DISPROVED

- another PR5 from the old batch is required;
- organic endgame needs another closure PR;
- combat depth is absent;
- intelligence/reporting, colony specialization or space-object gameplay are absent;
- another quality-only/refactor batch is required before product work.

### Non-critical RESEARCH / UNKNOWN outside the chosen batch

These do **not** block `POST-1.0-BOT-STRATEGY-DIFFERENTIATION` and cannot change its accepted contract:

- achievement/extra score-layer gameplay value;
- Stellar-native moving-object trajectory/lifecycle contract;
- Bank `bankCreditEfficiencyPercent` consumer remains `UNKNOWN-UNTOUCHED` and is not part of this batch;
- long-run player win-rate rebalance after personality differentiation is post-implementation observation, not an implementation prerequisite.

`criticalUnknownsResolved = true` and `criticalUnknowns = []` for the chosen batch.

## Controller FIX Decision A — exact tactical risk policy

### Current source truth — CONFIRMED

`src/simulation/bots/threatRecoveryPlanner.ts` currently recommends attack when calculated target risk satisfies:

`riskPermille <= 800`

`src/simulation/bots/fleetMissionPlanner.ts` currently uses:

`ownPower * 10 >= targetPower * 12`

which is approximately a target-risk ceiling of 833 permille. The two planner paths therefore encode two different shared attack cutoffs.

### DECISION — single personality policy truth

PR1 owns a new pure policy module:

`src/simulation/bots/strategyPolicy.ts`

It derives policy from the existing `BotProfile.personality`. Its attack-risk field is exactly:

`maxAttackRiskPermille`

Accepted values:

| Personality / default empire | `maxAttackRiskPermille` |
|---|---:|
| `industrial` / Aegis | 700 |
| `explorer` / Synod | 800 |
| `aggressive` / Veyra | 900 |

This is Stellar-native product tuning, not a Nemexia formula.

Rationale:

- Explorer preserves the existing ~800 threat-planner baseline;
- Industrial gets an explicitly safer margin;
- Aggressive gets a bounded marginal-risk window;
- even Aggressive at 900 still requires estimated target power to remain below own estimated power;
- current full-intel requirements and ordinary mission/reducer validation remain mandatory.

### Mandatory PR2 truth-source contract

Both tactical planner paths must consume the same derived `maxAttackRiskPermille` from `src/simulation/bots/strategyPolicy.ts`.

- `src/simulation/bots/fleetMissionPlanner.ts` must replace the hardcoded `10/12` attack cutoff with the exact policy threshold;
- `src/simulation/bots/threatRecoveryPlanner.ts` must replace hardcoded `riskPermille <= 800` with the same exact policy threshold;
- no second personality threshold table is allowed in either planner.

All three personalities must still require:

- current intelligence;
- level 3/full defense estimate;
- `getMissionAvailability()` where the ordinary fleet mission path applies;
- existing command/reducer validation.

### Exact PR2 acceptance fixture

Use one deterministic equal-force/intelligence fixture with at least one candidate target whose `riskPermille` lies strictly between 700 and 900. The fixture must prove:

- Industrial rejects risk above 700;
- Explorer accepts at/below 800 and rejects above 800;
- Aggressive accepts at/below 900;
- the same target around the bounded marginal window is rejected by Industrial and accepted by Aggressive;
- no personality attacks without current level-3 intelligence;
- validator/reducer truth remains authoritative.

The exact tactical margin is therefore **DECISION**, not UNKNOWN.

## Controller FIX Decision B — exact recent battle history window

### DECISION

`RECENT_BOT_BATTLE_WINDOW = 3`

Outcome adaptation considers only the three most recent relevant resolved own PvP battle reports.

A relevant battle is an existing `GameState.eventLog` entry where:

- `entry.event.payload.type === 'BATTLE_REPORT'`;
- the target empire is `report.attackerEmpireId` or `report.defenderEmpireId`;
- the battle is PvP under the existing BattleReport/mode semantics and is not a PvE battle.

Canonical selection must not depend on current `eventLog` array order. Relevant entries are deterministically ordered by these stable keys, ascending:

1. `entry.event.executeAt`;
2. `entry.event.sequence`;
3. `report.id`.

Then take the final three relevant entries.

No wall clock. No persisted counter. No new bot memory. No schema/save change.

For the target empire each considered battle is classified exactly as:

- `win` — `report.winner` equals the side on which the empire participated;
- `loss` — `report.winner` equals the opposing side;
- `draw` — `report.winner === 'draw'`.

Only these three classifications feed the bounded signal.

When a prior loss no longer belongs to the last three relevant battles, it must no longer affect the signal. The bot therefore returns to its baseline personality policy unless the current three-battle window itself is loss-dominant.

This history window is therefore **DECISION**, not UNKNOWN.

## Proposed PR1 — `POST-1.0-PR1-COMPRESSED-PERSONALITY-STRATEGY`

### Purpose

Make compressed-campaign strategy preferences explicit without introducing persisted AI state or bypassing ordinary commands.

### Exact primary paths

- **new:** `src/simulation/bots/strategyPolicy.ts` — pure `BotProfile` → derived policy truth;
- `src/simulation/bots/scheduler.ts` — consume policy in compressed candidate ordering only where personality preference is allowed;
- `src/simulation/bots/profiles.ts` — read/verify existing personality identities and defaults;
- **new focused test:** `tests/simulation/botStrategyPolicy.test.ts`;
- existing `tests/simulation/botScheduler.test.ts` for deterministic integration/regression evidence.

### Data flow

`DEFAULT_BOT_PROFILES` → `deriveBotStrategyPolicy(profile)` → `runProfileDecision()` / `compressedCandidate()` → existing planners → `selectCandidate()` → `executeCommand()`.

### Invariants

- mandatory logistics/endgame/critical recovery invariants stay above flavor ordering where required for correctness/closure;
- no hidden player information;
- no randomness/wall clock;
- ordinary commands/reducer remain authoritative;
- schema v19 / save v6 / migration none.

### Acceptance gate

On an equalized deterministic fixture where multiple ordinary actions are simultaneously valid, all three profiles must show documented distinct strategy preference while accepted commands pass existing validators, repeated results/checksums match, hidden player-state mutation does not alter a bot choice, and Fresh Game→Terminal remains green.

### Non-critical implementation question

The exact fixture-oriented source ordering may need adjustment if a proposed preference starves a mandatory compressed milestone. This is **NON-CRITICAL** because implementation may change ordering only inside the already accepted personality intent and invariants above. It may not change personality intent, validator authority, acceptance gates, schema/save, or the PR1→PR2→PR3 batch contract. If a fixture exposes starvation, choose another ordering inside the accepted policy rather than redesigning the batch.

## Proposed PR2 — `POST-1.0-PR2-PERSONALITY-TACTICAL-RISK`

### Purpose / player-visible outcome

Make personality visible in information gathering and bounded attack/recovery risk without changing combat results.

### Exact primary paths

- `src/simulation/bots/strategyPolicy.ts` — truth source for `maxAttackRiskPermille`;
- `src/simulation/bots/fleetMissionPlanner.ts` — use exact policy threshold instead of hardcoded `10/12` cutoff;
- `src/simulation/bots/threatRecoveryPlanner.ts` — use the same exact policy threshold instead of `riskPermille <= 800`;
- `tests/simulation/botFleetMissionPlanner.test.ts`;
- `tests/simulation/botThreatRecoveryPlanner.test.ts`;
- existing `tests/simulation/botScheduler.test.ts` for integration/regression only as needed.

### Data flow

`BotProfile` → `deriveBotStrategyPolicy(profile).maxAttackRiskPermille` → perception/current full intel → both fleet/threat attack eligibility paths → existing mission/command validators → scheduler → reducer.

### Behavior boundary

- Industrial/Aegis: 700;
- Explorer/Synod: 800;
- Aggressive/Veyra: 900;
- current level-3 intel remains mandatory;
- no hidden information;
- no combat-engine or battle-result change;
- no new mission type;
- no schema/save change.

### Exact acceptance gate

The shared deterministic marginal-risk fixture described in Decision A must prove one policy truth across both planner paths. Industrial rejects a target in the >700 bounded window, Aggressive accepts a target <=900 that Industrial rejects, Explorer follows the 800 boundary exactly, and all three still obey current/full-intel plus mission/reducer validation. Planner results remain deterministic under stable ordering.

No tactical-risk UNKNOWN remains.

## Proposed PR3 — `POST-1.0-PR3-BOT-OUTCOME-ADAPTATION-GATE`

### Purpose / player-visible outcome

Add bounded recovery response to recent own PvP losses using already persisted battle history, then return to baseline when the loss leaves the exact three-battle window.

### Exact new helper path and public contract

**New file:**

`src/simulation/bots/outcomeSignals.ts`

**Public helper:**

`deriveRecentBotBattleOutcomeSignal(state, empireId)`

Exact readonly output contract:

```ts
interface RecentBotBattleOutcomeSignal {
  readonly consideredBattles: number;
  readonly wins: number;
  readonly losses: number;
  readonly draws: number;
  readonly recoveryBias: 'none' | 'loss-dominant';
}
```

`recoveryBias` is `loss-dominant` iff `losses > wins`; draws are neutral. Wins never create a positive/unbounded aggression bonus. Otherwise it is `none`.

The helper is pure and deterministic. It derives only from existing `GameState.eventLog` using `RECENT_BOT_BATTLE_WINDOW = 3` and the canonical ordering/selection semantics in Decision B.

### Exact runtime consumer

**Only direct runtime consumer in PR3:**

`src/simulation/bots/threatRecoveryPlanner.ts`

`planBotThreatAndRecovery()` consumes the derived signal and may apply a bounded recovery bias through its existing recovery/action-selection model.

`src/simulation/bots/scheduler.ts` is **READ/VERIFY ONLY** for PR3 unless a genuine pre-existing contract violation is discovered and the implementation stops/re-audits. Scheduler must not become a direct outcome-signal consumer.

### Exact PR3 data flow

`GameState.eventLog`
→ `src/simulation/bots/outcomeSignals.ts`
→ `deriveRecentBotBattleOutcomeSignal(state, empireId)`
→ `planBotThreatAndRecovery()` in `src/simulation/bots/threatRecoveryPlanner.ts`
→ existing recovery/action selection
→ scheduler existing threat candidate path
→ `executeCommand()`
→ reducer validation.

### Exact PR3 expected files

Primary runtime:

- `src/simulation/bots/outcomeSignals.ts`;
- `src/simulation/bots/threatRecoveryPlanner.ts`.

Read/verify only:

- `src/simulation/bots/scheduler.ts`;
- `src/simulation/types.ts`;
- `src/simulation/combat/types.ts`.

Focused tests:

- `tests/simulation/botOutcomeSignals.test.ts`;
- `tests/simulation/botThreatRecoveryPlanner.test.ts`;
- existing `tests/simulation/botScheduler.test.ts` only for integration/regression evidence if needed.

No alternative helper path or `scheduler.ts and/or ...` seam is allowed.

### Exact PR3 behavior boundary

The outcome signal must not:

- change the combat engine or battle result;
- create persistent bot memory/counters;
- bypass PR1/PR2 personality policy;
- create a new scheduler mode;
- add hidden information;
- create permanent Aggressive/Industrial state;
- create a win-based unbounded aggression bonus.

Allowed bounded behavior:

- when the current three-battle signal is `loss-dominant`, `planBotThreatAndRecovery()` receives recovery bias;
- that bias may strengthen existing fleet/recovery posture only;
- critical/economic invariants remain higher priority;
- chosen actions remain existing ordinary commands;
- validators/reducer remain authoritative;
- when the loss no longer belongs to the latest three relevant battles, the baseline personality policy returns automatically.

### Exact PR3 acceptance gate

Tests must prove:

1. event-array permutation produces the same canonical considered three reports and the same signal;
2. save/load produces the same signal and next threat/recovery decision;
3. own attacker win/loss, own defender win/loss and draw are classified correctly;
4. PvE battle reports do not enter the window;
5. a loss-dominant three-battle window produces bounded safer/recovery posture when a valid recovery action exists;
6. when that loss ages out of the latest three relevant battles, behavior returns to baseline personality policy;
7. wins do not create an unbounded aggression bonus;
8. organic Fresh Game→Terminal, deterministic scheduler/regression, campaign performance, CI, Graphify and Browser gates remain green.

No outcome-history UNKNOWN remains.

## Schema / save assessment

Chosen batch target remains exactly:

- schema v19;
- save format v6;
- migration none;
- strategy policy derived from `BotProfile`;
- recent outcome signal derived from existing persisted `eventLog`;
- no persisted AI memory or counters.

Any discovered requirement for new persisted state is a STOP/re-audit condition, not implicit migration authorization.

## Critical UNKNOWN closure

`criticalUnknownsResolved = true`

`criticalUnknowns = []`

Resolved by Audit DECISION:

- tactical risk margins → 700 / 800 / 900 through one `maxAttackRiskPermille` policy truth;
- recent outcome history window → `RECENT_BOT_BATTLE_WINDOW = 3` with exact canonical ordering and classification;
- PR3 implementation seam → exact `outcomeSignals.ts` helper and sole direct runtime consumer `threatRecoveryPlanner.ts`.

Remaining research areas (achievements, moving objects, Bank) are outside the chosen batch and are not critical unknowns. PR1 fixture ordering is explicitly non-critical and cannot alter the accepted contract.

## Intentional non-goals

- no runtime changes in PR #178;
- no implementation branch / PR1;
- no PR5 continuation of the closed batch;
- no Nemexia formula port;
- no new personality archetypes;
- no combat-engine redesign;
- no achievement/score-layer implementation;
- no moving-object implementation;
- no economy-wide rebalance;
- no broad UI redesign;
- no tooling/dependency/workflow change;
- no Bank/credit system.

## Exact-head validation contract after this FIX

After the final docs commit:

- current `main` must still equal `53cf207f30f1a51f864d77f61969937e0d1ad59c`;
- CI — SUCCESS;
- Graphify — SUCCESS;
- Browser E2E — SUCCESS;
- production smoke — SUCCESS;
- unresolved review threads — 0;
- `mergeable=true`;
- PR #178 remains Ready / `draft=false`.

Then STOP for controller review. **Do not merge. Do not create PR1.**