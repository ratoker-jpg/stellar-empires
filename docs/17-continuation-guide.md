# Continuation guide

## Current handoff

Release 1.0 remains closed. Runtime baseline is schema v19 / save format v6 / migration none.

Previous `POST-1.0-NEMEXIA-PARITY` batch is complete through #177 at:

`53cf207f30f1a51f864d77f61969937e0d1ad59c`

PR5 does not exist and is not authorized.

## Only active work

```text
POST-1.0-NEXT-PRODUCT-AUDIT
PR #178
branch audit/post-1.0-next-product
starting main 53cf207f30f1a51f864d77f61969937e0d1ad59c
implementationAuthorized = false
```

Controller verdict after the first Ready pass:

`FIX — DOCS-ONLY AUDIT CONTRACT COMPLETENESS`

Do not restart the Audit. Do not create implementation branches.

## Chosen proposal — NOT AUTHORIZED

`POST-1.0-BOT-STRATEGY-DIFFERENTIATION`

Exact sequence:

1. `POST-1.0-PR1-COMPRESSED-PERSONALITY-STRATEGY`
2. `POST-1.0-PR2-PERSONALITY-TACTICAL-RISK`
3. `POST-1.0-PR3-BOT-OUTCOME-ADAPTATION-GATE`

## Critical UNKNOWN state

`criticalUnknownsResolved = true`

`criticalUnknowns = []`

### DECISION — one tactical-risk truth

Proposed PR1 owns:

`src/simulation/bots/strategyPolicy.ts`

with derived field:

`maxAttackRiskPermille`

Exact values:

- industrial / Aegis = 700;
- explorer / Synod = 800;
- aggressive / Veyra = 900.

PR2 must remove the current `fleetMissionPlanner.ts` hardcoded `10/12` cutoff and `threatRecoveryPlanner.ts` hardcoded `riskPermille <= 800`, replacing both with the same policy value.

All personalities still require current level-3/full intel and existing mission/reducer validation.

### DECISION — exact recent battle window

`RECENT_BOT_BATTLE_WINDOW = 3`.

Only three latest relevant resolved own PvP `BATTLE_REPORT` entries are considered. Canonical ordering is independent of current array order:

1. `event.executeAt`;
2. `event.sequence`;
3. `report.id`.

Then take the latest three.

No wall clock. No persisted counter. No new AI memory. No schema/save change.

## Exact PR3 seam

New file:

`src/simulation/bots/outcomeSignals.ts`

Public helper:

`deriveRecentBotBattleOutcomeSignal(state, empireId)`

Exact output fields:

- `consideredBattles`;
- `wins`;
- `losses`;
- `draws`;
- `recoveryBias: 'none' | 'loss-dominant'`.

`loss-dominant` means `losses > wins`. Draws are neutral. Wins do not create an unbounded aggression bonus.

Sole direct runtime consumer:

`src/simulation/bots/threatRecoveryPlanner.ts`

Exact data flow:

`GameState.eventLog`
→ `outcomeSignals.ts`
→ `planBotThreatAndRecovery()`
→ existing recovery/action selection
→ scheduler existing threat candidate path
→ `executeCommand()`
→ reducer validation.

For PR3, `src/simulation/bots/scheduler.ts` is read/verify only.

Primary runtime files:

- `src/simulation/bots/outcomeSignals.ts`;
- `src/simulation/bots/threatRecoveryPlanner.ts`.

Read/verify only:

- `src/simulation/bots/scheduler.ts`;
- `src/simulation/types.ts`;
- `src/simulation/combat/types.ts`.

Focused tests:

- `tests/simulation/botOutcomeSignals.test.ts`;
- `tests/simulation/botThreatRecoveryPlanner.test.ts`;
- existing `tests/simulation/botScheduler.test.ts` only if integration/regression evidence is needed.

## PR3 behavior boundary

Outcome adaptation cannot change battle resolution, create persistent bot memory, bypass personality policy, add hidden information or create a new scheduler mode.

A loss-dominant current three-battle window may strengthen existing fleet/recovery posture only. Critical/economic invariants remain higher priority, commands stay ordinary, validators/reducer remain authoritative, and baseline policy returns automatically once the loss leaves the three-battle window.

## Non-critical questions

PR1 fixture source ordering is non-critical. If a fixture shows starvation, implementation may select another ordering only inside the already accepted personality policy and mandatory invariants. It cannot change personality intent, reducer validation, acceptance gates, schema/save or the batch theme.

Achievements, moving-object lifecycle and Bank credit remain outside the chosen batch and are not critical unknowns.

## Read before any continuation

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/project-status.json`
6. `docs/roadmap-pr-index.json`
7. `docs/16-execution-roadmap.md`
8. actual GitHub `main`, PR #178, review threads and exact workflow state

## Next valid action

After the final docs FIX commit:

1. reply to and resolve the P1/P2 review threads with exact evidence;
2. wait for fresh exact-head CI, Graphify, Browser E2E and production smoke SUCCESS;
3. verify `main` unchanged at `53cf207f30f1a51f864d77f61969937e0d1ad59c`;
4. verify unresolved threads = 0, `mergeable=true`, `draft=false`;
5. STOP for controller review.

Do not merge #178. Do not create PR1.
