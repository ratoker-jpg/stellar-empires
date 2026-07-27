# PR #120 — Mission intelligence bot gate

**Audit:** #116  
**Batch:** `ORDINARY-MISSIONS-INTELLIGENCE-01`  
**Work item:** `MISSION-INTELLIGENCE-BOT-GATE`

## Delivered

- bot perception exposes owned state, public redacted contacts and the bot empire's own observations/alerts only;
- the planner consumes the shared ordinary mission availability contract;
- attack selection requires a current level-three observation;
- scout targets are prioritized deterministically and current full-intelligence targets pass to attack selection;
- flight-slot, scout-cooldown, fuel and intelligence failures produce stable planner reason codes and exact availability codes;
- scheduler and worker diagnostics preserve the selected reason and availability code;
- a deterministic headless sequence covers scout, observation, return, schema-v14 save/load and eligible attack;
- Browser E2E executes the same combined loop.

## Boundaries

No new command, mission kind, persisted field, schema migration or balance table was introduced. Destruction, alliances, solar war and endgame remain outside this batch.

## Validation

Source head `787fdfb2b72b2b976828aa0c3e0a1e7e71b0ec80` passed asset audit, lint, TypeScript, 392 unit tests, production build, Chromium Browser E2E and Graphify.
