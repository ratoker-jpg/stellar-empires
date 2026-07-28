# PR #121 — Audit planet demolition and destruction

## Decision

Accept heavy batch `PLANET-DEMOLITION-DESTRUCTION-01` from exact post-#120 `main` SHA `818aba011199dd5a96518f859ed35de671be892f`.

## Authorized chain

```text
#122 PLANET-DEMOLITION-CONTRACT
→ #123 PLANET-DESTRUCTION-RECOVERY-GATE
```

## Why this batch

The ordinary mission/intelligence loop is complete, but attacks still cannot use the existing planet-destroyer hulls for canonical building demolition or whole-colony destruction. Safe colony removal crosses combat, fleets, queues, events, logistics, reports, navigation, bots and persistence, so Audit #116 correctly deferred it to a separate heavy audit.

## Key decisions

- existing ordinary `attack` only; no new mission kind or command;
- faction-specific level-10 siege profiles scale linearly by weapon upgrade level;
- demolition may resolve on attacker victory or draw;
- whole-planet destruction requires attacker victory;
- final chance is capped at 30% and reduced by surviving defence, defending planet-destroyers and Polias;
- final colonies are protected;
- successful destruction atomically reconciles every live reference;
- destroyed coordinates return to normal unowned colonization;
- schema remains v14; no tombstone collection or migration;
- no extra destruction loot, no economy/logistics redesign and no solar/endgame work.

## Evidence

The audit directly inspected attack resolution, unit/Commander capability, planet and colony state, fleets, queues/events, logistics, intelligence, world events, reports, persistence, UI routing and bot planning. Critical unknowns: zero.

## Validation gate

Documentation/status-only diff, valid JSON, asset audit, lint, TypeScript, full tests, production build, Browser E2E and fresh Graphify. Temporary/generated outputs must be absent.
