# PR #93 — Complete ordinary ship rosters

## Runtime

- replaces the 10-ship prototype layer with 13 ordinary ships for Aegis, Synod and Veyra;
- covers two transports, seven combat classes, colonizer, recycler, spy probe and energy satellite;
- adds stable ship classes and explicit deterministic ability metadata;
- integrates class combat profiles, fleet bonuses, mission roles and bot production priorities;
- preserves old saves and runtime references through deterministic unit ID aliases;
- binds all 39 canonical ship IDs to the committed source-asset library while retaining processed runtime atlas fallbacks.

## Faction identity

- Aegis emphasises armor and combat recovery;
- Synod emphasises linked shields and fleet overdrive;
- Veyra emphasises speed, low-cost mass and freezing pressure.

## Intentional boundaries

- planetary destruction and infrastructure detonation remain deferred to the solar-war/endgame implementation;
- energy satellites are registered as stationary units, while their final sun-brightness energy formula remains deferred to the solar-war system;
- planetary defences remain at the existing five-unit prototype depth until PR #94;
- Commander Ships remain deferred until PR #95.

## Validation

- every faction exposes exactly 13 unique reachable ship classes;
- every ship has valid building and technology prerequisites;
- every canonical ship ID resolves a committed source path and a processed runtime fallback;
- regression coverage includes legacy IDs, mission roles, faction abilities and stationary satellites;
- required gate: lint, TypeScript typecheck, full Vitest and production build.
