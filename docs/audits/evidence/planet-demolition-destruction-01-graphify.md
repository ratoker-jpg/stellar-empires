# Evidence — PLANET-DEMOLITION-DESTRUCTION-01

**Audit PR:** #121  
**Inspected baseline:** `818aba011199dd5a96518f859ed35de671be892f`  
**Graphify package:** `graphifyy==0.8.38`

## Graph baseline

The final PR #120 runtime graph recorded:

- nodes: 2,130;
- relationships: 6,795;
- communities: 103;
- extracted: 100%;
- inferred/ambiguous: 0%;
- workflow run: `30311719069`.

Post-#120 commits to the audit baseline changed status/documentation only. Audit #121 requires a fresh final-head Graphify run.

## Direct source inspection

| Surface | Verified paths | Finding |
|---|---|---|
| attack arrival | `src/simulation/fleets/flightCommands.ts` | existing `attack` calls one resolver, emits one report and returns survivors |
| combat | `resolveAttackMission.ts`, battle/combat types | battle/recovery/plunder/debris exist; no siege/planet removal |
| ship capability | unit types/catalog | all factions expose planet-destroyer hulls; canonical faction tables are not encoded |
| Commander effects | `commanderShips.ts` | Annihilator/Polias bps exist; demolition is currently a generic weapon bonus |
| planet/colonization | planet types/progression/zones, `colonization.ts` | active colony can be removed; unowned position can create a fresh colony |
| ordinary fleets | fleet types, flight commands, mission rules | origin/location/mission/events may point at removed planet |
| expeditions | `src/simulation/pve/expeditions.ts` | pending report embeds `originPlanetId`; resolver stations survivor/credits reward there; missing origin drops normal reward |
| space-object missions | `src/simulation/pve/spaceObjects.ts` | pending report embeds `originPlanetId`; resolver stations survivor/credits normal reward there while applying object/strategic effects |
| logistics | `logistics/routes.ts` | missing endpoints currently keep retrying |
| intelligence | intelligence types/state/selectors | bounded snapshots with coordinates can remain historical |
| world events | `pve/worldEvents.ts` | planet-target events/end events need cancellation |
| reports | combat/unified reports | additive optional evidence works; coordinate must persist before removal |
| persistence | `storage/saveFormat.ts`, schema-v14 chain | active planet count variable; additive optional report metadata can stay v14 |
| runtime navigation | application controller/shell | active planet normalizes to surviving colony |
| bots | perception/planner/scheduler | shared attack and level-three intelligence; no bot-only command needed |
| canonical design | `docs/25-solar-war-obelisks-gates-and-progression.md` | thresholds, values, reductions, cap and final-colony protection recorded |

## Dependency flow

```text
SEND_FLEET attack
→ availability / intelligence
→ FLEET_ARRIVE
→ resolveAttackMission
→ battle + recovery + plunder + debris
→ [new] demolition
→ [new] destruction
→ [new] destroyed-planet reconciliation
├─ ordinary fleet return reconciliation
├─ EXPEDITION_RESOLVE live return override
└─ SPACE_OBJECT_MISSION_RESOLVE live return override
→ BattleReport / reports / map / HUD
→ save/checksum/replay
```

## High-risk references

```text
PlanetState.id
├─ fleet origin/location/mission
├─ pending completion/arrival/return events
├─ expedition report origin and live return
├─ space-object report origin and live return
├─ research/upgrade queues
├─ logistics routes
├─ active world events
├─ debris identity
├─ intelligence/report snapshots
├─ flagship through removed fleet
└─ active Planet route/context
```

Historical origin evidence remains immutable. Live special-mission return destination must be separate optional metadata.

## Review finding resolved by contract

The initial Audit #121 contract rehomed `FleetState.originPlanetId` but did not explicitly reconcile `EXPEDITION_RESOLVE` and `SPACE_OBJECT_MISSION_RESOLVE` report origins. Direct inspection showed both handlers would station survivors at the deleted origin; expedition and ordinary space-object resources could be lost.

The amended contract now requires:

- immutable historical `originPlanetId`;
- additive optional `returnPlanetId`;
- live destination `returnPlanetId ?? originPlanetId`;
- reward/fleet resolution at the live destination;
- preservation of space-object depletion/control/cooldown/strategic effects;
- focused destroyed-origin tests and save/load coverage.

## Search conclusions

- no existing siege or colony-removal boundary;
- no new mission kind or schema-v15 collection required;
- PR #82 bot timing is already delivered and not duplicated;
- economy/logistics redesign and solar/endgame work remain separate.

## Graphify finalization

Final audit head must pass Graphify, CI and Browser E2E; generated graph/Playwright outputs must remain absent from the diff. Record the exact final head/run after the last contract change.
