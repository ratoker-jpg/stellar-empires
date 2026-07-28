# Evidence — PLANET-DEMOLITION-DESTRUCTION-01

**Audit PR:** #121 · `2000a68216c7681fcbea0d69d1ed7e58e0c0c7f9`  
**Inspected baseline:** `818aba011199dd5a96518f859ed35de671be892f`  
**Accepted audit head:** `5523fa0437b3e838b337a53f58fa5978733827cd`  
**Graphify package:** `graphifyy==0.8.38`

## Final validation

- CI run `30333447008`: asset audit, lint, TypeScript, full tests and production build — passed;
- Browser E2E run `30333446989` — passed;
- Graphify run `30333446959` — passed;
- diff contained documentation/status files only;
- generated Graphify, Playwright and diagnostic outputs were absent;
- all review threads resolved.

## Direct source inspection

| Surface | Finding |
|---|---|
| attack/combat | existing ordinary `attack` resolves battle/recovery/plunder/debris but no siege/planet removal |
| ship/Commander capability | all factions have planet-destroyers; Annihilator/Polias bps exist; Annihilator demolition is currently generic weapon damage |
| planet/colonization | active colony can be removed; unowned position can create a fresh colony |
| ordinary fleets | origin/location/mission/events may point at removed planet |
| expeditions | pending report embeds `originPlanetId`; handler stations survivor/credits reward there; missing origin loses normal reward |
| space-object missions | same origin issue; handler also applies depletion/control/cooldown/strategic effects |
| queues/logistics/world events | planet IDs require atomic cancellation/removal |
| intelligence/reports | bounded historical snapshots can remain when exact coordinate is retained |
| persistence | variable planet count and additive optional report metadata fit schema v14 |
| runtime/bots | active colony normalizes; shared attack/intelligence contract avoids bot-only command |
| canonical design | faction values, thresholds, reductions, cap and final-colony guard are recorded in `docs/25-solar-war-obelisks-gates-and-progression.md` |

## Dependency flow

```text
SEND_FLEET attack
→ FLEET_ARRIVE
→ battle + recovery + plunder + debris
→ #122 demolition
→ #123 destruction + atomic reconciliation
├─ ordinary fleet return
├─ EXPEDITION_RESOLVE live return override
└─ SPACE_OBJECT_MISSION_RESOLVE live return override
→ report / map / HUD
→ save/checksum/replay
```

## Resolved P1 finding

The initial contract rehomed fleet state but did not explicitly reconcile special-mission pending reports. The accepted contract requires:

- immutable historical `originPlanetId`;
- additive optional live `returnPlanetId`;
- live destination `returnPlanetId ?? originPlanetId`;
- survivor stationing and ordinary reward credit at the live destination;
- normal expedition and space-object domain resolution;
- preservation of space-object depletion/control/cooldown/strategic effects;
- destroyed-origin tests and save/load coverage.

## Conclusions

- no new mission kind or schema-v15 collection required;
- no existing siege/removal boundary can be reused as-is;
- economy/logistics redesign and solar/endgame remain separate;
- critical unknowns: zero.
