# Completed implementation batch — PLANET-DEMOLITION-DESTRUCTION-01

**Roadmap milestone:** M4 — Ordinary mechanics complete  
**Complexity:** heavy  
**Audit PR:** #121 · `2000a68216c7681fcbea0d69d1ed7e58e0c0c7f9`  
**Accepted baseline:** `818aba011199dd5a96518f859ed35de671be892f`  
**Implementation PRs:** #122–#123  
**Schema:** v14 retained  
**Divergence:** none

## Delivered chain

| PR | Work item | Result |
|---:|---|---|
| #122 | `PLANET-DEMOLITION-CONTRACT` | faction/weapon-scaled building demolition, Annihilator correction, queue/zone/economy reconciliation and report evidence; squash merge `be0caff4fbf06384cdf5d370dbc2da80d4081152` |
| #123 | `PLANET-DESTRUCTION-RECOVERY-GATE` | whole-planet chance, final-colony guard, atomic live-reference recovery, special-mission returns, released-coordinate debris/recolonization and combined gate; exact merge SHA recorded in GitHub PR #123 merge metadata |

## Final product outcome

The existing ordinary `attack` flow now resolves deterministically through:

```text
battle
→ surviving planet-destroyer capability
→ building demolition
→ whole-planet destruction roll
→ atomic live-reference reconciliation
→ reports, recovery, save/load and Browser E2E
```

All three factions use audited siege profiles with linear weapon-upgrade scaling. Demolition may occur on attacker victory or draw. Whole-planet destruction requires attacker victory, surviving planet-destroyer capability and a successful capped deterministic roll. The defender's final active colony is never removed.

Successful destruction removes the active colony, releases galaxy ownership, cleans planet-bound queues/routes/events and rehomes surviving fleets to the nearest valid colony. Historical intelligence and reports remain immutable evidence with exact coordinates. Pending expedition and space-object reports preserve historical `originPlanetId` and use additive live `returnPlanetId`. Debris remains recyclable at the released galaxy position, and later colonization creates a fresh colony identity and state.

## Validation gates

- complete faction and weapon-level scaling coverage;
- demolition thresholds, deterministic selection and independent rolls;
- destruction reductions, cap/floor, blocked reasons and last-colony protection;
- queue, fleet, logistics, world-event and flagship reconciliation;
- ordinary and special mission recovery without reward loss;
- stable report backlinks after active-colony deletion;
- debris recycling and fresh recolonization;
- schema-v14 serialization and parse validation;
- integration and Browser E2E coverage;
- final CI, Chromium Browser E2E, Graphify and automated review on PR #123.

Exact final validation head/run IDs are retained in PR #123. The exact squash merge SHA is written into authoritative `main` metadata after merge.

## Excluded

Final-colony destruction, empire elimination, alliances, solar war, Obelisks, Gates, victory, economy/logistics redesign, extra destruction loot, new mission kinds and schema migration remain outside this batch.
