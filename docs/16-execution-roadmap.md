# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Release 1.0 closed; previous post-1.0 batch complete; Audit #178 under controller FIX review  
**Updated:** 2026-08-22  
**Verified runtime main:** `53cf207f30f1a51f864d77f61969937e0d1ad59c`  
**Last merged PR:** #177 `POST-1.0-PR4-LOW-COST-QUALITY-GATES`  
**Runtime:** schema v19 / save format v6 / migration none  
**Implementation authorized:** false

## Authoritative files

```text
AGENTS.md
docs/28-audit-first-autonomous-delivery-protocol.md
docs/audits/current-execution-state.md
docs/audits/current-batch-audit.md
docs/project-status.json
docs/roadmap-pr-index.json
docs/17-continuation-guide.md
```

Actual GitHub state wins over stale prose.

## Completed boundary

`POST-1.0-NEMEXIA-PARITY` is complete through #177. There is no PR5 from that batch.

## Current entrypoint

Only docs-only Audit #178 is active:

`POST-1.0-NEXT-PRODUCT-AUDIT`

Chosen proposal, still **not authorized**:

`POST-1.0-BOT-STRATEGY-DIFFERENTIATION`

Exact ordered work items:

1. `POST-1.0-PR1-COMPRESSED-PERSONALITY-STRATEGY`
2. `POST-1.0-PR2-PERSONALITY-TACTICAL-RISK`
3. `POST-1.0-PR3-BOT-OUTCOME-ADAPTATION-GATE`

No implementation PR exists.

## Critical UNKNOWN closure

Audit #178 now records:

`criticalUnknownsResolved = true`

`criticalUnknowns = []`

The two prior critical questions are resolved as Stellar-native DECISIONs.

### Tactical-risk DECISION

Single truth source in proposed PR1:

`src/simulation/bots/strategyPolicy.ts`

Field:

`maxAttackRiskPermille`

- industrial / Aegis = 700;
- explorer / Synod = 800;
- aggressive / Veyra = 900.

PR2 requires both `fleetMissionPlanner.ts` and `threatRecoveryPlanner.ts` to use that same threshold. Current full level-3 intel, mission availability and reducer validation remain mandatory.

### Outcome-window DECISION

`RECENT_BOT_BATTLE_WINDOW = 3`.

Only the three latest relevant resolved own PvP battle reports count, ordered deterministically by:

1. `event.executeAt`;
2. `event.sequence`;
3. `report.id`.

No wall clock, persisted counters, new AI memory, schema or save change.

### Exact PR3 seam

New helper:

`src/simulation/bots/outcomeSignals.ts`

Function:

`deriveRecentBotBattleOutcomeSignal(state, empireId)`

Direct runtime consumer:

`src/simulation/bots/threatRecoveryPlanner.ts`

`src/simulation/bots/scheduler.ts` is read/verify only for PR3.

## Non-critical boundary

PR1 fixture source ordering may change only inside the accepted personality intent if a fixture exposes starvation. Such an adjustment cannot change mandatory invariants, reducer validation, acceptance gate, schema/save or the PR1→PR2→PR3 contract.

Achievements/extra score layers, moving objects and Bank credit are outside the chosen batch and are not critical unknowns.

## Delivery model

```text
Audit PR #178 docs FIX
→ reply/resolve P1 + P2 threads
→ fresh exact-head CI + Graphify + Browser/production smoke
→ verify main unchanged + mergeable=true + unresolved threads=0 + draft=false
→ STOP for controller review
```

Audit readiness does not authorize implementation.

## Permanent boundaries

- no implementation branch while `implementationAuthorized=false`;
- no guessed Nemexia formula;
- no unplanned schema/save migration;
- no new persisted AI memory for this batch;
- every future implementation PR starts only after explicit controller approval and fresh-main verification.

## Next action

Finish the docs-only controller FIX inside existing PR #178, resolve its two valid review threads with evidence, require fresh exact-head gates, verify Ready state, and STOP. Do not merge. Do not create PR1.
