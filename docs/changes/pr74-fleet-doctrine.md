# PR #74 — Fleet formations, target priorities and class skills

## Delivered

- Three deterministic formations: line, screen and wedge.
- Four target priorities: balanced, interceptors, capitals and installations.
- Original class skills for scout, fighter and frigate hulls.
- Formation bonuses and class skills applied inside combat resolution.
- Target priorities redistribute deterministic damage allocation by target size.
- Stationed fleets can change doctrine through the shared command bridge.
- Battle reports record attacker and defender doctrine.
- Dedicated doctrine screen and regression tests.

## Compatibility

Fleet doctrine is an additive schema-v13 field. Older saves and legacy fleet fixtures default to `line` plus `balanced`; no migration or save reset is required.

## Boundaries

- Doctrine can only be changed while a fleet is stationed.
- Skills are automatic hull/formation synergies, not a copied skill tree.
- Bots inherit safe defaults; dedicated doctrine planning remains later AI work.
