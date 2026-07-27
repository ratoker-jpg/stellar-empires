# ORDINARY-MISSIONS-INTELLIGENCE-01 — Graphify and source evidence

**Audit PR:** #116  
**Baseline:** post-PR #115 `main` plus documentation-only audit start record  
**Graphify:** `graphifyy==0.8.38`  
**Workflow run:** `30278509430`

## 1. Fresh graph summary

```text
2,130 nodes
6,795 edges
103 communities
100% EXTRACTED
0% INFERRED
0% AMBIGUOUS
```

Core god nodes remain broad canonical contracts:

| Node | Edges | Significance |
|---|---:|---|
| `GameState` | 181 | rules consume state but must not add route or derived-report state |
| `createInitialGameState()` | 96 | no new initial persisted field is required |
| `executeCommand()` | 79 | shared mission result must remain behind the reducer |
| `GameCommand` | 62 | no new command family is authorized |
| `getUnitDefinition()` | 55 | mission role/armed checks use existing catalog |
| `PlanetState` | 52 | raw foreign planet access is the current information-leak risk |

## 2. Relevant communities and hubs

| Surface | Community | Representative node degree / role |
|---|---:|---|
| flight command/resolution | 70 | `flightCommands.ts`, 60 file edges; `sendFleet`, `applyFlightEvent` |
| intelligence resolver | 48 | `resolveScout.ts`, 30 file edges |
| bot mission planner | 40 | `fleetMissionPlanner.ts`, 44 file edges |
| bot perception | 37 | `perception.ts`, 23 file edges |
| Fleet routed workspace | 33 | `fleetOperationsWorkspace.ts`, 49 file edges |
| unified reports | 54 | `missionReports.ts`, 47 file edges |
| Reports workspace | 61 | `reportsWorkspace.ts`, 31 file edges |
| persistence validation | 9 | `saveFormat.ts`, 77 file edges |

The domains are separate enough for isolated PRs but connected through existing types and imports, supporting a medium four-PR batch.

## 3. Direct dependency evidence

### Mission command core

`flightCommands.ts` directly imports or calls:

- combat attack resolver;
- colonization selectors/resolver;
- intelligence scout resolver;
- debris collector;
- flight calculations;
- research effects;
- unit definitions;
- command/event history.

This is the correct authoritative execution point, but not the correct place to duplicate presentation and bot target logic.

### Bot path

`fleetMissionPlanner.ts` imports `sendFleet()` and tests candidate commands through `sendFleet(state, command).ok`. It also separately encodes mission priority, role checks, target sorting and level-three attack knowledge.

### Player path

`fleetOperationsWorkspace.ts` imports fleet mission types and flight preview helpers but directly enumerates `state.planets`. It does not import the redacted Galaxy intelligence view and currently renders foreign owner IDs.

### Intelligence path

`resolveScout.ts` is reached directly from `applyFlightEvent()`. It imports research effects, faction sensor-grid roles, building levels, history retention and unit ship-role counts. This makes it an isolated deterministic resolver suitable for PR #118.

### Reporting path

`missionReports.ts` derives reports from canonical logs/world events, while `reportsWorkspace.ts` consumes that pure model. Adding reports derived from bounded intelligence state fits this existing pattern without persistence changes.

### Persistence path

`saveFormat.ts` validates mission kinds, fleet transit, observations and alerts. The accepted design keeps all structures unchanged, so persistence work is validation/regression coverage rather than schema migration.

## 4. Source findings that Graphify cannot prove

Direct source inspection additionally verified:

- Fleet composer target labels expose raw `ownerEmpireId` for foreign planets;
- Space intelligence correctly redacts `contact` owner/faction/resources/defenses/fleets;
- flight-slot research is calculated but not enforced by `sendFleet()`;
- reports have no intelligence kind/filter;
- Browser history/focus/hidden text require Playwright, not graph evidence.

## 5. Selected vs rejected candidate scopes

### Selected: missions + intelligence

Reason:

- direct data flow already exists from flight arrival to scout resolver;
- player, bot and command consumers need one shared rule contract;
- all required state is present and bounded;
- no schema migration is necessary;
- report/UI changes can be derived.

### Rejected for this audit: destruction/recovery

Reason:

- would connect combat, building loss, colony survival, bots, reports and project endgame rules;
- likely heavy and persistence-sensitive;
- requires a dedicated audit.

### Rejected for this audit: multi-colony economy/logistics

Reason:

- separate scheduling, economy and balance community;
- no direct requirement to complete the intelligence loop;
- combining it would produce mixed complexity.

## 6. Graph limitations

- Graphify captures imports/calls, not hidden-information semantics.
- It cannot establish whether a DOM label exposes owner identity.
- It cannot verify deterministic random inputs or exact checksum behavior.
- It cannot validate browser history, keyboard focus or responsive layout.
- CSS and visual hierarchy are outside the graph.

Therefore the implementation contract requires direct unit, integration, storage and Browser E2E gates in addition to Graphify.

## 7. Conclusion

Fresh Graphify and direct source evidence support:

```text
shared mission rule core
→ isolated intelligence resolver
→ reports/UI selectors
→ bot parity and combined gate
```

No critical unknown requires a schema change or larger batch.
