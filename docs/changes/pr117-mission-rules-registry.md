# PR #117 — shared ordinary mission rules

**Audit:** #116 `ORDINARY-MISSIONS-INTELLIGENCE-01`  
**Work item:** `MISSION-RULES-REGISTRY`  
**Schema:** v14 unchanged

## Delivered

- added `src/simulation/fleets/missionRules.ts` as the pure source of truth for transport, deploy, scout, attack, recycle and colonize availability;
- returns stable codes/messages, route and fuel estimates, slot usage and redacted target presentation without mutating `GameState`;
- activated research-derived flight capacity `max(1, 1 + flightSlots)` and counts every non-stationed fleet as one occupied slot;
- routed authoritative `sendFleet()`, Fleet UI target/preview logic and bot preflight through the same selector;
- requires current level-three intelligence for ordinary attacks;
- removed raw unknown foreign owner/faction labels from the Fleet composer;
- preserved separate Expedition and Space Object command ownership.

## Persistence and mechanics boundary

- no new command;
- no new mission kind;
- no new save field;
- no migration;
- no balance-table change;
- no destruction, alliance, solar-war or endgame work.

## Tests

Focused coverage was added for:

- target redaction;
- stable slot-limit rejection;
- attack intelligence precondition;
- deterministic route availability;
- Fleet view-model parity;
- existing deterministic combat and neutral-pirate attacks with valid level-three intelligence fixtures.

## Validation

- asset pipeline check: passed;
- lint: passed;
- TypeScript: passed;
- full unit suite: 370/370 passed;
- production build: passed;
- Chromium Browser E2E: passed;
- Graphify: passed.

A temporary workflow used to capture the complete Vitest failure output was removed before the final clean-head run.

## Next

After #117 merges, PR #118 may implement only `ESPIONAGE-COUNTERINTELLIGENCE` from fresh `main` under Audit #116.
