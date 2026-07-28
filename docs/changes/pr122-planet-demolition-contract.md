# PR #122 — PLANET-DEMOLITION-CONTRACT

**Batch:** `PLANET-DEMOLITION-DESTRUCTION-01`  
**Audit:** #121 · `2000a68216c7681fcbea0d69d1ed7e58e0c0c7f9`  
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
- routed report-card details for contributions, points, chance, rolls and cancelled queues;
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

These remain owned by PR #123 `PLANET-DESTRUCTION-RECOVERY-GATE` after #122 merges.

## Validation surface

- all demolition threshold boundaries including `>1000` select-all behavior;
- Aegis/Synod/Veyra profiles and weapon levels 0/1/5/10;
- attacker win/draw eligibility and defender-win block;
- deterministic target selection and independent rolls;
- endgame-building exclusion;
- one-level removal, zone/economy reconciliation and no-refund queue/event cancellation;
- battle report evidence and routed presentation view-model;
- repository CI, Browser E2E and Graphify.
