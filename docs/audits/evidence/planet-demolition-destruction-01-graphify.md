# Evidence — PLANET-DEMOLITION-DESTRUCTION-01

**Audit PR:** #121  
**Inspected baseline:** `818aba011199dd5a96518f859ed35de671be892f`  
**Graphify package:** `graphifyy==0.8.38`

## Graph baseline

The final clean PR #120 graph covered the runtime baseline immediately before post-merge metadata-only commits:

- nodes: 2,130;
- relationships: 6,795;
- communities: 103;
- extracted: 100%;
- inferred: 0%;
- ambiguous: 0%;
- workflow run: `30311719069`.

Post-PR #120 commits through `818aba011199dd5a96518f859ed35de671be892f` changed authoritative documentation/status metadata only. Audit PR #121 still requires a fresh Graphify run on its final documentation head before merge.

## Direct source inspection

| Surface | Verified paths | Finding |
|---|---|---|
| attack arrival | `src/simulation/fleets/flightCommands.ts` | existing `attack` arrival calls one resolver, emits one report and returns surviving attacker |
| combat | `src/simulation/combat/resolveAttackMission.ts`, `resolveBattle.ts`, combat types | battle/recovery/plunder/debris exist; no building or planet destruction |
| ship capability | unit types and complete ship catalog | all factions expose a planet-destroyer class; generic ability does not encode faction-specific canonical tables |
| Commander effects | `src/simulation/command/commanderShips.ts` | Annihilator and Polias basis points exist; demolition is currently converted into generic weapon bonus |
| planet state | planet types, progression, zones | active colony owns buildings/queues/economy/inventory/defence; removal requires zone/queue cleanup |
| colonization | `src/simulation/colonization/colonization.ts` | unowned galaxy position can create a fresh colony through existing rules |
| fleets | fleet types, flight commands, mission rules | origin/location/mission/event references can point at a removed planet |
| logistics | `src/simulation/logistics/routes.ts` | route endpoints are planet IDs; missing endpoints currently keep retrying |
| intelligence | intelligence types/state/selectors | observations/alerts are bounded snapshots with coordinates and may remain historical |
| world events | `src/simulation/pve/worldEvents.ts` | active planet-target events and pending end events require cancellation |
| reports | combat report and `src/simulation/reports/missionReports.ts` | optional fields can extend reports; exact coordinate must be persisted before target removal |
| persistence | `src/storage/saveFormat.ts`, schema-v14 migration chain | active planet count is variable; no tombstone required; additive optional report data can remain schema v14 |
| runtime navigation | `GameApplicationController`, app shell, main bootstrap | active planet already normalizes to a surviving player colony after state changes |
| bots | perception, fleet mission planner, scheduler/worker | ordinary attack and current level-three intelligence are shared; no bot-only command required |
| canonical design | `docs/25-solar-war-obelisks-gates-and-progression.md` | exact demolition thresholds, level-10 faction values, reductions, cap and last-colony protection are recorded |

## Dependency flow

```text
SEND_FLEET attack
→ mission availability / level-three intelligence
→ FLEET_ARRIVE
→ resolveAttackMission
→ resolveBattle + recovery + plunder + debris
→ [new] resolvePlanetDemolition
→ [new] resolvePlanetDestruction
→ [new] reconcileDestroyedPlanet
→ BattleReport event
→ unified reports / Space backlink / HUD-context refresh
→ save/checksum/replay
```

## High-risk references to verify after implementation

```text
PlanetState.id
├─ fleet origin/location/mission
├─ pending completion/arrival/return events
├─ research and ship-upgrade queues
├─ logistics routes
├─ active world events
├─ debris target identity
├─ intelligence snapshots
├─ battle/unified reports
├─ commander flagship through removed fleets
└─ active Planet route/context
```

Historical logs, reports and intelligence snapshots are intentionally exempt from live-reference deletion when they contain coordinates and are not treated as active targets.

## Search conclusions

- no existing planet-demolition resolver;
- no existing whole-colony removal boundary;
- no separate demolition mission kind is needed;
- no schema-v15 state is required for ordinary colony destruction;
- PR #82 already delivered deterministic persisted bot timing, so this audit must not duplicate that work;
- economy/logistics redesign remains separate; only invalid route cleanup belongs here;
- solar/system destruction is structurally different and remains excluded.

## Graphify finalization

Before Audit PR #121 merges, update this section with the final workflow run and verify:

- install/build succeeds;
- generated graph output validates;
- no generated outputs enter the diff;
- direct inspection still matches the final documentation contract.
