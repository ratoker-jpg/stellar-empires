# Current execution state

**Updated:** 2026-08-23  
**Safe to continue:** PR #180 final validation only; do not merge or start PR3  
**Phase:** `POST-1.0-BOT-STRATEGY-DIFFERENTIATION`  
**Exact starting `main` for PR2:** `7620975e1cd604c8bcdce0bac748e32e276061db`  
**Runtime:** schema v19 / save format v6  
**Migration:** none  
**Release:** 1.0.0 remains closed

| Field | Current value |
|---|---|
| Audit #178 | MERGED → `4b96d457fad1577a0663210864381a0d3a33cb77` |
| PR1 #179 | MERGED → `7620975e1cd604c8bcdce0bac748e32e276061db` |
| Batch | `POST-1.0-BOT-STRATEGY-DIFFERENTIATION` |
| Active implementation work item | `POST-1.0-PR2-PERSONALITY-TACTICAL-RISK` |
| Active implementation PR | #180 |
| Branch | `agent/post-1.0-personality-tactical-risk` |
| PR2 controller state | complete-for-controller-review; final exact-head validation required after this docs commit |
| PR3 | pending / not started |
| Further implementation authorized | false |
| Runtime implementation evidence head | `eaa8a9b2edfcabce72cef11fb8026be96f9673c7` |
| PR2 merge SHA | none — PR #180 is not merged |

## PR2 tactical-risk contract

The single policy truth is `deriveBotStrategyPolicy(profile).maxAttackRiskPermille`:

- Industrial: `700`;
- Explorer: `800`;
- Aggressive: `900`.

Both tactical consumers now use the same integer risk semantics:

`riskPermille = min(9999, floor(targetPower * 1000 / max(1, ownPower)))`.

`fleetMissionPlanner.ts` no longer uses the legacy `ownPower * 10 >= targetPower * 12` cutoff. `threatRecoveryPlanner.ts` no longer uses a hardcoded `riskPermille <= 800` recommendation gate.

The actual scheduler `BotProfile` is propagated to fleet/threat planner paths. Compatible direct callers resolve the default profile for the matching empire. Unknown or mismatched profiles do not receive a guessed attack threshold.

The threshold does not bypass existing combat-information or command rules:

- attack targeting still requires current full level-3 intelligence;
- stale or partial intelligence cannot produce a tactical attack recommendation;
- `getMissionAvailability()` remains authoritative for ordinary mission legality;
- reducer validation remains authoritative for command acceptance;
- PR1 scheduler ordering is unchanged;
- no schema/save changes were introduced.

## Regression-first evidence

Regression-first commit: `7786534f98c0b5e95e16b28fa8ffa4e3a80ce00d`.

Its red CI established both baseline gaps using real catalog stats:

1. fleet path: legacy `10/12` accepted an Industrial marginal target above `700‰`;
2. threat path: hardcoded `riskPermille <= 800` rejected an Aggressive marginal target above `800‰` and at/below `900‰`.

Final focused tests prove the same deterministic marginal-risk concept across personalities:

- Industrial rejects targets above `700‰`;
- Explorer accepts through `800‰` and rejects above `800‰`;
- Aggressive accepts through `900‰` and rejects above `900‰`;
- a shared `800–900‰` marginal target is rejected by Industrial/Explorer and accepted by Aggressive;
- repeated planning is deterministic;
- unobserved foreign runtime state changes do not alter the tactical decision.

## Green runtime-head evidence

Exact runtime evidence head: `eaa8a9b2edfcabce72cef11fb8026be96f9673c7`.

- CI #2220 — SUCCESS;
- asset audit / lint / typecheck / full tests / build — SUCCESS;
- compressed progression scenario — SUCCESS;
- Organic Fresh Game → Terminal — SUCCESS;
- Organic terminal save/load + partition determinism — SUCCESS;
- bounded organic terminal faction matrix — SUCCESS;
- Organic Obelisk evidence — SUCCESS:
  - Synod queued `346920`, completes `353700` real seconds;
  - Veyra queued `174300`, completes `181080` real seconds;
- campaign catch-up performance — SUCCESS:
  - one day `5364.431 ms`, operations `1559`, botAudit `537`, botDiagnostics `559`;
  - seven days `20285.642 ms`, operations `3174`, botAudit `984`, botDiagnostics `1156`;
- Graphify #1356 — SUCCESS;
- Browser E2E #1450 — SUCCESS;
- production Pages smoke in #1450 — SUCCESS.

## Next safe action

This control-plane synchronization changes the PR head, therefore the runtime-head checks above are evidence but are not the final exact-head handoff gate.

1. require fresh CI, Graphify and Browser E2E including production smoke on the docs head;
2. verify `main` still equals `7620975e1cd604c8bcdce0bac748e32e276061db`;
3. verify unresolved review threads = 0 and `mergeable=true`;
4. ensure PR #180 body reflects the final PR2 implementation/evidence;
5. only when all final-head gates are green, mark #180 Ready for review;
6. STOP for controller review.

Do not merge #180. Do not start PR3.
