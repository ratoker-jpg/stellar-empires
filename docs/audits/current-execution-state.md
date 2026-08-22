# Current execution state

**Updated:** 2026-08-22  
**Safe to continue:** yes — Audit docs FIX only, then controller review  
**Phase:** `POST-1.0-NEXT-PRODUCT-AUDIT`  
**Runtime baseline:** `main` `53cf207f30f1a51f864d77f61969937e0d1ad59c`  
**Runtime:** schema v19 / save format v6  
**Migration:** none  
**Release:** 1.0.0 remains closed

| Field | Current value |
|---|---|
| Previous batch | `POST-1.0-NEMEXIA-PARITY` — COMPLETE |
| #177 | merged → `53cf207f30f1a51f864d77f61969937e0d1ad59c` |
| Exact Audit starting `main` | `53cf207f30f1a51f864d77f61969937e0d1ad59c` |
| Active Audit work item | `POST-1.0-NEXT-PRODUCT-AUDIT` |
| Audit PR | #178 |
| Audit branch | `audit/post-1.0-next-product` |
| Controller verdict | `FIX — DOCS-ONLY AUDIT CONTRACT COMPLETENESS` |
| Active implementation PR | none |
| Active implementation work item | none |
| Implementation authorized | false |
| Recommended next batch | `POST-1.0-BOT-STRATEGY-DIFFERENTIATION` — proposal only |
| Proposed sequence | PR1 → PR2 → PR3 |
| Critical unknowns resolved | true |
| Critical unknowns | `[]` |

## Controller FIX closure

Two post-Ready review findings were valid and are now addressed in the Audit contract rather than merely marked resolved.

### DECISION A — tactical risk

One derived policy truth in `src/simulation/bots/strategyPolicy.ts`:

`maxAttackRiskPermille`

- industrial / Aegis = **700**;
- explorer / Synod = **800**;
- aggressive / Veyra = **900**.

PR2 requires both `fleetMissionPlanner.ts` and `threatRecoveryPlanner.ts` to consume the same threshold. Current/full level-3 intel, mission availability and reducer validation remain mandatory.

### DECISION B — recent outcome window

`RECENT_BOT_BATTLE_WINDOW = 3`.

Only the three latest relevant resolved own PvP `BATTLE_REPORT` entries are considered. Canonical ordering is stable and independent of current array order:

1. `event.executeAt`;
2. `event.sequence`;
3. `report.id`.

No wall clock, persisted counter, new AI memory, schema or save change.

### Exact PR3 seam

New helper:

`src/simulation/bots/outcomeSignals.ts`

`deriveRecentBotBattleOutcomeSignal(state, empireId)`

Exact output fields:

- `consideredBattles`;
- `wins`;
- `losses`;
- `draws`;
- `recoveryBias: 'none' | 'loss-dominant'`.

Sole direct runtime consumer in PR3:

`src/simulation/bots/threatRecoveryPlanner.ts`

`src/simulation/bots/scheduler.ts` is read/verify only for PR3.

## Proposed implementation sequence — NOT AUTHORIZED

1. `POST-1.0-PR1-COMPRESSED-PERSONALITY-STRATEGY`
2. `POST-1.0-PR2-PERSONALITY-TACTICAL-RISK`
3. `POST-1.0-PR3-BOT-OUTCOME-ADAPTATION-GATE`

Target remains schema v19 / save v6 / migration none.

PR1 fixture source ordering is explicitly **non-critical**. If a fixture exposes starvation, implementation may choose another ordering only inside the accepted personality intent and mandatory invariants. It may not change acceptance gates, reducer authority, schema/save or the chosen batch theme.

Achievements/extra score layers, moving objects and Bank credit remain outside this chosen batch and are not critical unknowns.

## Next safe action

After the final docs FIX commit:

1. reply to the P1 thread with decision evidence and resolve it;
2. reply to the P2 thread with the exact seam evidence and resolve it;
3. require fresh exact-head CI, Graphify and Browser E2E including production smoke;
4. verify `main` still equals `53cf207f30f1a51f864d77f61969937e0d1ad59c`;
5. verify unresolved threads = 0, `mergeable=true`, `draft=false`;
6. STOP for controller review.

Do not merge. Do not create PR1 or any implementation branch.
