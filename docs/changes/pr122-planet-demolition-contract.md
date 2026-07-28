# PR #122 — PLANET-DEMOLITION-CONTRACT

**Batch:** `PLANET-DEMOLITION-DESTRUCTION-01`  
**Audit:** #121 · `2000a68216c7681fcbea0d69d1ed7e58e0c0c7f9`  
**Squash merge:** `be0caff4fbf06384cdf5d370dbc2da80d4081152`  
**Validated head:** `61d7bd880317598613cf80c787d521c604adf1a7`  
**Scope:** deterministic post-combat building demolition only

## Delivered

- faction-specific level-10 siege profiles for Aegis, Synod and Veyra;
- linear weapon-upgrade scaling from level 0 through 10;
- surviving planet-destroyer contribution evidence;
- canonical demolition thresholds and stable building-selection domains;
- independent deterministic building rolls;
- surviving planetary-defence population reduction;
- Annihilator bonus moved from generic combat damage to demolition roll chance;
- one-level building damage with endgame structures excluded;
- no-refund cancellation of matching building queue items and completion events;
- zone and economy recalculation after structural damage;
- additive demolition evidence inside `BattleReport`;
- routed report-card details for contributions, points, exact basis-point chance, rolls and cancelled queues;
- focused simulation and presentation tests.

## Explicit exclusions

PR #122 does not implement:

- whole-planet destruction;
- final-colony protection execution;
- colony removal or galaxy ownership release;
- fleet, queue, logistics, world-event or flagship reconciliation for a removed planet;
- expedition/space-object `returnPlanetId`;
- debris re-keying or recolonization;
- schema change, new command or new mission kind;
- solar war, alliances or endgame.

These remain owned by PR #123 `PLANET-DESTRUCTION-RECOVERY-GATE`.

## Review resolution

Automated review found one P2: fractional basis-point probabilities were rounded to whole percentages in the report UI. The formatter now preserves `20.5%`/`20.05%` precision as required, with a regression test for an odd Annihilator level. The thread was resolved before merge.

## Validation

- CI `30344313117` — asset audit, lint, TypeScript, full tests and production build;
- Browser E2E `30344317677`;
- Graphify `30344313098`;
- all review threads resolved;
- no generated outputs or #123 implementation entered the diff.
