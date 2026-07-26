# PR #94 handoff — complete defence rosters

## Baseline

- branch started from merged PR #93, merge SHA `ae7940aa5b3f78ea7192cb15d6b003652a38ac59`;
- PR #91 remains superseded and must not be reused;
- PR #94 is the defence stage of the complete-catalog batch.

## Runtime delivered

- `completeDefenseCatalog.ts` owns all 27 canonical planetary-defence definitions;
- each faction has 9 unique defence classes with explicit prerequisites and tuning;
- `FactionMechanicalRoles.defenses.complete` exposes the full roster to bots and UI;
- old prototype IDs resolve through deterministic unit aliases;
- combat profiles, shield networks, mixed-battery bonuses and defensive target priorities are deterministic;
- recovery and repair use per-defence traits without changing the save schema;
- asset manifest records every canonical source path and current runtime fallback.

## Important compatibility rule

`getRegisteredUnitDefinition` checks historical prototype definitions before canonical aliases. This preserves old save behaviour. New systems that need canonical abilities explicitly call `resolveCanonicalUnitId`.

## Next PR

PR #95 must start from fresh `main` after PR #94 is merged and deliver:

- 13 shared Commander Ships;
- Admiral unlock and progression;
- deterministic active abilities;
- bot Commander selection;
- full-game catalog dependency and headless validation.

Do not start Universe navigation, alliances or endgame until the PR #95 catalog gate is complete.
