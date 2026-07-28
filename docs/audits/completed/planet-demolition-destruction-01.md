# Completed implementation batch — PLANET-DEMOLITION-DESTRUCTION-01

**Roadmap milestone:** M4 — Ordinary mechanics complete  
**Complexity:** heavy  
**Audit PR:** #121 · `2000a68216c7681fcbea0d69d1ed7e58e0c0c7f9`  
**Accepted baseline:** `818aba011199dd5a96518f859ed35de671be892f`  
**Implementation PRs:** #122–#123  
**Final implementation merge:** `aa1dc67ed874c75aa69af30ce9ced58169793c30`  
**Schema:** v14 retained  
**Divergence:** none

## Delivered chain

| PR | Work item | Result |
|---:|---|---|
| #122 | `PLANET-DEMOLITION-CONTRACT` | faction/weapon-scaled building demolition, Annihilator correction, queue/zone/economy reconciliation and report evidence; squash merge `be0caff4fbf06384cdf5d370dbc2da80d4081152` |
| #123 | `PLANET-DESTRUCTION-RECOVERY-GATE` | whole-planet chance, final-colony guard, atomic live-reference recovery, repeatable special-mission returns, released-coordinate debris/recolonization, outbound recycler retargeting and combined gate; squash merge `aa1dc67ed874c75aa69af30ce9ced58169793c30` |

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

Successful destruction removes the active colony, releases galaxy ownership, cleans planet-bound queues/routes/events and rehomes surviving fleets to the nearest valid colony. Historical intelligence and reports remain immutable evidence with exact coordinates. Pending expedition and space-object reports preserve historical `originPlanetId`, use additive live `returnPlanetId`, and can be rehomed repeatedly if another live return colony is destroyed. Debris remains recyclable at the released galaxy position, later colonization creates a fresh colony identity, and already outbound recycler missions are atomically retargeted to that new identity.

## Validation gates

- complete faction and weapon-level scaling coverage;
- demolition thresholds, deterministic selection and independent rolls;
- destruction reductions, cap/floor, blocked reasons and last-colony protection;
- queue, fleet, logistics, world-event and flagship reconciliation;
- ordinary and repeated special-mission recovery without reward loss;
- stable report backlinks after active-colony deletion;
- debris recycling before and after fresh recolonization;
- outbound recycler retargeting across recolonization;
- schema-v14 serialization and parse validation;
- integration and Browser E2E coverage;
- final CI, Chromium Browser E2E, Graphify and automated review on PR #123.

Final PR head `32e5b4aa0bd7d478022420f2c64b9369b56b7055` passed CI `30355631573`, Browser E2E `30355631835` and Graphify `30355631705`. The exact squash merge is `aa1dc67ed874c75aa69af30ce9ced58169793c30`.

## Excluded

Final-colony destruction, empire elimination, alliances, solar war, Obelisks, Gates, victory, economy/logistics redesign, extra destruction loot, new mission kinds and schema migration remain outside this batch.