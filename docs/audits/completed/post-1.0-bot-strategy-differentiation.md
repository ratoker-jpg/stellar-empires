# POST-1.0-BOT-STRATEGY-DIFFERENTIATION — archived audit batch

**Roadmap milestone:** post-1.0 opponent strategy differentiation  
**Complexity:** bounded sequential / three implementation PRs  
**Audit PR:** #178  
**Audit squash:** `4b96d457fad1577a0663210864381a0d3a33cb77`  
**Audit baseline:** `53cf207f30f1a51f864d77f61969937e0d1ad59c`  
**Runtime:** schema v19 / save format v6 unchanged  
**Migration:** none  
**Release:** 1.0.0 remains closed  
**Closure PR:** #181 `POST-1.0-PR3-BOT-OUTCOME-ADAPTATION-GATE`  
**Closure squash:** unknown until controller-approved merge

Actual GitHub state is authoritative while #181 remains open. This archive is staged by the final implementation/closure PR and becomes the completed batch record when the controller merges #181. No future #181 squash SHA is invented here.

## Accepted Audit contract

Audit #178 selected exactly one bounded three-PR batch:

`POST-1.0-BOT-STRATEGY-DIFFERENTIATION`

Stable work items:

1. `POST-1.0-PR1-COMPRESSED-PERSONALITY-STRATEGY`;
2. `POST-1.0-PR2-PERSONALITY-TACTICAL-RISK`;
3. `POST-1.0-PR3-BOT-OUTCOME-ADAPTATION-GATE`.

The accepted contract deliberately reused existing bot profiles, ordinary commands, current/full intelligence, mission availability and reducer validation. It did not authorize a new scheduler mode, hidden foreign state, persisted bot memory, combat-result changes, schema/save changes or guessed Nemexia formulas.

## Delivered chain

| PR | Work item | State |
|---|---|---|
| #179 | `POST-1.0-PR1-COMPRESSED-PERSONALITY-STRATEGY` | merged → `7620975e1cd604c8bcdce0bac748e32e276061db` |
| #180 | `POST-1.0-PR2-PERSONALITY-TACTICAL-RISK` | merged → `f0cfcb7d2944b8380cf8b3157ae1570bbbbb17cd` |
| #181 | `POST-1.0-PR3-BOT-OUTCOME-ADAPTATION-GATE` | final implementation / closure PR; merge SHA unknown until merge |

Audit lineage:

```text
Audit #178 → 4b96d457fad1577a0663210864381a0d3a33cb77
PR1 #179  → 7620975e1cd604c8bcdce0bac748e32e276061db
PR2 #180  → f0cfcb7d2944b8380cf8b3157ae1570bbbbb17cd
PR3 #181  → closure staged; generated squash SHA intentionally unknown
```

## Combined delivered outcome

### Bounded compressed personality differentiation

PR #179 introduced a single pure personality policy truth and bounded compressed-campaign differentiation without persistent AI state.

- Industrial/Aegis development preference: economy → research → production → logistics.
- Explorer/Synod development preference: research → economy → production → logistics.
- Aggressive/Veyra development preference: production → research → economy → logistics.
- Closure-safe mandatory development remains able to override flavor when required for campaign correctness.
- Personality activation is bounded rather than a permanent scheduler fork; ordinary commands and reducer authority remain unchanged.

### Tactical risk truth

PR #180 made both tactical planner paths consume the same `maxAttackRiskPermille` policy:

- Industrial/Aegis: `700`;
- Explorer/Synod: `800`;
- Aggressive/Veyra: `900`.

The integer risk semantics remain:

`min(9999, floor(targetPower * 1000 / max(1, ownPower)))`.

Current/full level-3 intelligence remains mandatory. Existing mission availability and command/reducer validation remain authoritative. No combat engine or battle-result formula was changed.

### Recent latest-three PvP outcome recovery

PR #181 derives a pure recent outcome signal from already persisted `GameState.eventLog`:

`deriveRecentBotBattleOutcomeSignal(state, empireId)`

with:

`RECENT_BOT_BATTLE_WINDOW = 3`.

Relevant reports are own PvP `BATTLE_REPORT` entries, canonically ordered ascending by:

1. `event.executeAt`;
2. `event.sequence`;
3. `report.id`;

then limited to the final three relevant battles.

`BattleReport.mode` remains optional. Effective-mode compatibility follows the existing `missionReports.ts` rule exactly:

- explicit `mode` is authoritative;
- omitted mode with a pirate attacker or defender is PvE;
- omitted mode with two non-pirate participants is PvP.

From the target empire perspective, attacker/defender wins and losses are classified normally; draws are neutral. `recoveryBias` is `loss-dominant` iff losses exceed wins. Wins do not grant an aggression bonus, and old losses naturally age out of the three-battle window.

The only direct runtime consumer is `src/simulation/bots/threatRecoveryPlanner.ts`. `src/simulation/bots/scheduler.ts` is unchanged by PR3.

The accepted recovery ordering is bounded:

1. critical/economic recovery;
2. fleet/high-threat recovery;
3. ordinary fleet action;
4. ordinary research action;
5. stable loss-dominant military-recovery fallback;
6. otherwise no action.

An earlier broader placement displaced normal development and broke Organic Obelisk evidence, so it was rejected. The bounded fallback restored the normal trajectory.

## Persistence, information and authority invariants

Across the three PRs:

- schema remains v19;
- save format remains v6;
- migration remains none;
- no new persisted bot memory/counter/marker was added;
- battle outcome adaptation derives from existing persisted history;
- current/full intelligence semantics remain preserved;
- no hidden foreign runtime state is added;
- bots continue to issue ordinary commands;
- mission availability and reducer validation remain authoritative;
- no new combat formula, mission type or scheduler mode was created.

## Combined acceptance evidence

Before closure review, the combined PR3 Ready head passed the required product/runtime matrix:

- asset audit, lint, typecheck, full tests and build;
- compressed progression;
- campaign catch-up performance;
- Organic Obelisk evidence;
- Organic Fresh Game → Terminal;
- Organic terminal save/load + partition determinism;
- bounded organic faction matrix;
- Graphify;
- Browser E2E;
- production Pages smoke.

Review then found two valid closure defects in #181:

1. legacy mode-less battle reports needed the already established pirate/non-pirate effective-mode inference;
2. the final batch closure archive/history/continuation records had not yet been staged.

Both are fixed in the same final closure PR, and all exact-head gates must be rerun after those fixes before controller handoff.

## Closure boundary

`POST-1.0-BOT-STRATEGY-DIFFERENTIATION` has no PR4 and authorizes no additional implementation item.

While #181 is open:

- #181 is the final implementation/closure PR;
- batch closure is staged but not yet GitHub-complete;
- #181 merge SHA remains unknown;
- actual GitHub state is authoritative.

After controller-approved merge of #181:

- the batch is complete;
- there is no active implementation;
- the next valid work category is a new docs-only Audit from the new fresh `main`;
- no implementation may be guessed from backlog without that Audit.
