# PR #165 — ENDGAME-BOT-FINAL-OBJECTS

**Batch:** `COMPLETE-ENDGAME-03` / Audit #162  
**Baseline:** `5be7b44eb51cf389e8006f0a0201ab61c0ee0df5`  
**Branch:** `agent/endgame-bot-final-objects`  
**Runtime:** schema v19 / save format v6 unchanged

## Scope

This PR adds deterministic bot planning for the existing final-object path using ordinary commands only:

- public vulnerable Gate response through normal fleet mission validation;
- immutable-cohort project contributions from currently owned resources;
- qualification-gated Obelisk construction through the existing building queue;
- ordinary final-project start after a real positive Solar War qualification.

The qualified Obelisk step is necessary because the generic economy planner intentionally excludes endgame-locked buildings. The new planner does not bypass that lock: it proposes the existing faction Obelisk `QUEUE_BUILDING` command only when the reducer accepts the already-authoritative qualification rule.

## Information boundary

Public final-project identity and phase come from endgame perception. Own resources, buildings, fleets and stored intelligence come from existing bot perception. A rival vulnerable Gate is considered only with current level-3 stored intelligence and a suitable owned fleet; changes to unobserved foreign resources or defences do not affect the decision.

## Exclusions

No direct qualification grant, resource synthesis, direct final-object mutation, special bot simulation path, schema/save migration, new catalog, asset, currency, route, mission family, combat engine or M9 work. Composed closure remains #166.
