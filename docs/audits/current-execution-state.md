# Current execution state

**Updated:** 2026-08-23  
**Safe to continue:** PR #179 final validation only; do not merge or start PR2/PR3  
**Phase:** `POST-1.0-BOT-STRATEGY-DIFFERENTIATION`  
**Exact starting `main`:** `4b96d457fad1577a0663210864381a0d3a33cb77`  
**Runtime:** schema v19 / save format v6  
**Migration:** none  
**Release:** 1.0.0 remains closed

| Field | Current value |
|---|---|
| Audit #178 | MERGED → `4b96d457fad1577a0663210864381a0d3a33cb77` |
| Batch | `POST-1.0-BOT-STRATEGY-DIFFERENTIATION` |
| Active implementation work item | `POST-1.0-PR1-COMPRESSED-PERSONALITY-STRATEGY` |
| Active implementation PR | #179 |
| Branch | `agent/post-1.0-compressed-personality-strategy` |
| PR1 controller state | complete-for-controller-review after final exact-head validation |
| PR2 | pending / not started |
| PR3 | pending / not started |
| Further implementation authorized | false |
| Runtime implementation evidence head | `7a1b9c505fb556836b078e55fac86691a0472d5e` |
| PR1 merge SHA | none — PR #179 is not merged |

## PR1 strategy contract

`src/simulation/bots/strategyPolicy.ts` is the pure personality-policy truth source.

Development preference truth:

- Industrial / Aegis: `economy → research → production → logistics`;
- Explorer / Synod: `research → economy → production → logistics`;
- Aggressive / Veyra: `production → research → economy → logistics`.

Closure-safe shared development fallback remains:

`production → research → economy → logistics`.

PR1 personality development arbitration is intentionally bounded. It activates only on the first command of a compressed `first-combat` decision when economy, research and production are all actionable **and** the economy candidate is the ordinary non-resource-spending `SET_PLANET_SPECIALIZATION` command. Outside that bounded early-game state the compressed scheduler uses the closure-safe shared development order.

Compressed opportunity order is shared for PR1:

`pve → fleet`.

The earlier Explorer `fleet → pve` experiment is not part of the final contract: organic closure evidence disproved it.

Future PR2 tactical-risk truth is recorded but not wired:

- Industrial: `maxAttackRiskPermille = 700`;
- Explorer: `maxAttackRiskPermille = 800`;
- Aggressive: `maxAttackRiskPermille = 900`.

`fleetMissionPlanner.ts` and `threatRecoveryPlanner.ts` remain untouched by PR1 threshold wiring.

## Regression / closure evidence

The original broad personality ordering changed the long-run compressed resource/progression trajectory and could leave final projects in `funding` at the accepted terminal horizon. Subsequent evidence also showed that Explorer `fleet → pve` changed organic closure. The accepted fixture-driven adjustment therefore minimizes personality influence instead of weakening campaign gates.

The final controlled scheduler fixture proves, before invoking the scheduler:

- phase is exactly `first-combat`;
- economy is actionable;
- research is actionable;
- production is actionable;
- the state uses ordinary catalog prerequisites rather than outcome/resource bypasses.

On the same equalized state, one ordinary reducer-validated command differs by personality:

- Industrial → `economy`;
- Explorer → `research`;
- Aggressive → `production`.

Repeated executions are equal and hidden player-resource changes do not change the bot audit choice.

## Green runtime-head evidence

Exact runtime evidence head: `7a1b9c505fb556836b078e55fac86691a0472d5e`.

- CI #2207 — SUCCESS;
- full assets/lint/typecheck/tests/build — SUCCESS;
- Organic Fresh Game → Terminal — SUCCESS;
- Organic terminal save/load + partition determinism — SUCCESS;
- bounded organic terminal faction matrix — SUCCESS;
- compressed progression scenario — SUCCESS;
- Organic Obelisk evidence — SUCCESS: Synod queued at `346920`, Veyra at `174300` real seconds;
- campaign performance — SUCCESS: seven days `21974.367 ms`, operations `3174`, botAudit `984`, botDiagnostics `1156`;
- Graphify #1344 — SUCCESS;
- Browser E2E #1437 — SUCCESS;
- production Pages smoke in #1437 — SUCCESS.

The restored Obelisk timestamps and seven-day operation/audit/diagnostic counts match the accepted baseline trajectory, while controlled differentiation remains observable in the bounded fixture.

## Next safe action

This control-plane synchronization changes the PR head, so runtime-head checks above are evidence only and are no longer sufficient for final handoff.

1. require fresh exact-head CI, Graphify and Browser E2E including production smoke after this docs commit;
2. verify `main` still equals `4b96d457fad1577a0663210864381a0d3a33cb77`;
3. verify unresolved review threads = 0 and `mergeable=true`;
4. update the stale PR #179 description with the final bounded policy/evidence;
5. only after every final-head gate is green, mark #179 Ready for review;
6. STOP for controller review.

Do not merge #179. Do not start PR2 or PR3.
