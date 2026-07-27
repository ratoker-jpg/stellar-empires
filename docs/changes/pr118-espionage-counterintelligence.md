# PR #118 — espionage and counter-intelligence

**Audit:** #116 `ORDINARY-MISSIONS-INTELLIGENCE-01`  
**Work item:** `ESPIONAGE-COUNTERINTELLIGENCE`  
**Schema:** v14 unchanged

## Delivered

- scout missions require exactly one scout-role ship and zero cargo;
- intelligence tier is derived from observer sensor strength versus defender sensor research and target sensor-grid level;
- level 1 exposes identity, level 2 adds economy/buildings, and level 3 adds defenses/stationed fleets;
- per-target cooldown is derived from existing observations and activates/deactivates on the exact deterministic boundary;
- detection uses the audited deterministic seed/event/fleet/target hash;
- detected probes still create the observer snapshot, create a bounded defender alert, are removed, and receive no return event;
- undetected probes use the existing fleet-return lifecycle;
- observation and alert retention limits remain unchanged;
- the E2E scout fixture uses one legal probe after its deterministic cooldown boundary;
- save/load remains schema v14 with no migration.

## Validation

- asset pipeline passed;
- lint passed;
- TypeScript passed;
- full unit suite: 379 tests passed;
- production build passed;
- Chromium Browser E2E passed on the legal scout fixture;
- Graphify passed.

## Boundaries

No report routing, incoming-flight presentation, bot strategy expansion, new command, new mission kind, save field, migration, balance pass, destruction, alliance, solar-war or endgame work.

## Next

After #118 merges, #119 may implement only `INTELLIGENCE-REPORTS-PRESENTATION` from fresh `main`.
