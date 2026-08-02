# PR #143 — PVE-TARGET-RECOVERY

**Batch:** `SUSTAINABLE-PVE-OPERATIONS-01`  
**Audit:** #142 · `81f1959b0bdbdd72d05dc21a2dce0a9e1470f010`  
**Predecessor:** #142 · `81f1959b0bdbdd72d05dc21a2dce0a9e1470f010`  
**Baseline:** merged `main` `81f1959b0bdbdd72d05dc21a2dce0a9e1470f010`  
**State schema:** v16 retained  
**Save format:** v3 retained

## Delivered

### Sustainable space objects

Space-object mission resolution keeps the verified baseline command, reward, loss, return and rehome behavior. A narrow post-resolution wrapper applies:

```text
non-final extraction  +300 seconds
final depletion       +21,600 seconds
```

At the first eligible 1,800-second world-event evaluation, a depleted object restores `remainingYield = initialYield`, clears temporary control and resets its cooldown while retaining stable identity, coordinate, kind, hazard and baseline yield.

### Deterministic pirate recovery

Initial pirate creation and recovery share one deterministic baseline constructor. The latest completed PvE battle report determines eligibility.

After six campaign hours:

- a surviving damaged base restores baseline resources and active defenses;
- a destroyed base respawns only when its original galaxy position remains unoccupied;
- occupied player, bot, neutral or recolonized positions are never overwritten;
- at most one pirate base recovers or respawns per evaluation;
- candidates are ordered by eligibility, galaxy coordinate, report ID and base ID;
- prior battle reports, debris and rewards remain intact.

Battle reports executed earlier in the same long `ADVANCE_TIME` are visible to the recovery boundary before final event-history persistence, preserving offline catch-up behavior.

### Mechanical pirate-hunt

An active targeted `pirate-hunt` applies:

```text
PIRATE_HUNT_REWARD_PERMILLE = 1,500
```

The targeted base reward is the anti-repeat multiplier combined with the event multiplier and rounded once at the final permille boundary. Threat scaling, combat outcomes and non-targeted bases are unchanged.

### Determinism and compatibility

A 48-hour gate proves equality across direct, six-hour chunked and save-loaded processing. Existing save-v3 shapes and schema-v16 state remain unchanged; no new persisted event, currency, reputation or telemetry was introduced.

## Code-head validation

Code head `ad23459708d6b7dab57c29c898e5772ba96e8917` passed:

- CI `30741354763` — asset audit, lint, strict TypeScript, full tests, build, permanent progression matrix and isolated catch-up performance;
- Graphify `30741354825`;
- Browser E2E `30741354743` — final result checked before merge.

The final documentation head is rerun through all required workflows.

## Explicit exclusions

- player-facing PvE opportunity or report redesign;
- bot expedition, object or pirate mission planning;
- Arena, Admiral services, PvE currency or reputation;
- new target kinds or continuously running spawn service;
- global progression/economy rebalance;
- schema/save-format change, alliances or endgame.

## Ordered next work

After #143 merges, create only #144 `PVE-OPERATIONS-INTELLIGENCE-UX` from the resulting fresh `main`. Do not begin #145 or #146 early.
