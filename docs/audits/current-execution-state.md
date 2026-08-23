# Current execution state

**Updated:** 2026-08-23  
**Safe to continue:** PR #181 final validation / controller review only; do not merge or start another Audit/batch  
**Phase:** `POST-1.0-BOT-STRATEGY-DIFFERENTIATION`  
**Exact starting `main` for PR3:** `f0cfcb7d2944b8380cf8b3157ae1570bbbbb17cd`  
**Runtime:** schema v19 / save format v6  
**Migration:** none  
**Release:** 1.0.0 remains closed

| Field | Current value |
|---|---|
| Audit #178 | MERGED → `4b96d457fad1577a0663210864381a0d3a33cb77` |
| PR1 #179 | MERGED → `7620975e1cd604c8bcdce0bac748e32e276061db` |
| PR2 #180 | MERGED → `f0cfcb7d2944b8380cf8b3157ae1570bbbbb17cd` |
| Batch | `POST-1.0-BOT-STRATEGY-DIFFERENTIATION` |
| Active implementation work item | `POST-1.0-PR3-BOT-OUTCOME-ADAPTATION-GATE` |
| Active implementation PR | #181 |
| Branch | `agent/post-1.0-bot-outcome-adaptation` |
| PR3 controller state | runtime accepted; complete-for-controller-review pending fresh docs-head gates |
| Further implementation authorized | false |
| Accepted runtime evidence head | `83905a60b41dcb0ed67901ed4c04e2d05c1bbb5f` |
| PR3 merge SHA | none — PR #181 is not merged |

## PR3 recent-outcome contract

Regression-first commit: `846ec783df14b6c35f993b6353c383369147de3c`.

The red evidence established the baseline gap cleanly: persisted `GameState.eventLog` battle history did not affect `planBotThreatAndRecovery()` recovery selection.

The public pure helper is:

`deriveRecentBotBattleOutcomeSignal(state, empireId)`

with `RECENT_BOT_BATTLE_WINDOW = 3`.

Relevant history is limited to `BATTLE_REPORT` entries where `report.mode === 'pvp'` and the target empire is the attacker or defender. Relevant reports are canonically ordered by:

1. `event.executeAt`;
2. `event.sequence`;
3. `report.id`;

then the latest three are selected. Classification is from the target empire's attacker/defender perspective; draws are neutral. PvE reports and unrelated empires are excluded. Event-array permutation does not alter the considered canonical window or signal.

`recoveryBias` is `loss-dominant` iff `losses > wins`; otherwise it is `none`. Wins create no positive or unbounded aggression bonus. Once a loss ages out of the latest-three relevant window, baseline personality behavior returns automatically.

The only direct runtime consumer is `src/simulation/bots/threatRecoveryPlanner.ts`. `src/simulation/bots/scheduler.ts` runtime is unchanged.

The accepted bounded integration order is:

1. existing critical/economic recovery;
2. existing fleet/high-threat recovery;
3. ordinary fleet action;
4. ordinary research action;
5. only then, in stable state, loss-dominant bounded military-recovery fallback;
6. otherwise no action.

An earlier implementation placed outcome recovery too early and broke Organic Obelisk trajectory evidence; that variant was rejected. The final bounded fallback restores the normal development trajectory while retaining the accepted outcome response.

Save/load preserves both the derived signal and the next bounded recovery decision. No persistent AI memory/counters were added.

## Accepted runtime-head evidence

Exact accepted runtime head: `83905a60b41dcb0ed67901ed4c04e2d05c1bbb5f`.

- CI #2234 — SUCCESS;
- asset audit / lint / typecheck / full tests / build — SUCCESS;
- compressed progression scenario — SUCCESS;
- Organic Obelisk evidence — SUCCESS;
- Organic Fresh Game → Terminal — SUCCESS;
- Organic terminal save/load + partition determinism — SUCCESS;
- bounded organic terminal faction matrix — SUCCESS;
- campaign catch-up performance — SUCCESS:
  - one day `5254.070 ms`, operations `1559`, botAudit `537`, botDiagnostics `559`;
  - seven days `20000.787 ms`, operations `3174`, botAudit `984`, botDiagnostics `1156`;
- Graphify #1369 — SUCCESS;
- Browser E2E #1464 — SUCCESS;
- production Pages smoke in #1464 — SUCCESS;
- unresolved review threads — 0;
- mergeable — true;
- verified `main` remained `f0cfcb7d2944b8380cf8b3157ae1570bbbbb17cd`.

## Next safe action

This control-plane synchronization changes the PR head, therefore #2234/#1369/#1464 remain accepted runtime evidence but are not the final exact-head handoff gates.

1. require fresh CI, Graphify and Browser E2E including production Pages smoke on the final docs head;
2. require every CI job green: assets, lint, typecheck, full tests, build, compressed progression, campaign performance, Organic Obelisk, Organic Fresh Game → Terminal, terminal determinism and bounded faction matrix;
3. verify `main` still equals `f0cfcb7d2944b8380cf8b3157ae1570bbbbb17cd`;
4. verify unresolved review threads = 0 and `mergeable=true`;
5. ensure PR #181 body records the accepted contract, rejected early variant and final exact-head evidence;
6. only when all final-head gates are green, mark #181 Ready for review;
7. STOP for controller review.

Do not merge #181. Do not start another Audit/batch.
