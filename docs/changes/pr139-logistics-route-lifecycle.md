# PR #139 — LOGISTICS-ROUTE-LIFECYCLE

**Batch:** `MULTI-COLONY-ECONOMY-LOGISTICS-01`  
**Audit:** #137 · `4e7fd20fdc415f30bf8a1476b67c79b0b8e79166`  
**Predecessor:** #138 · `b6a598e1a2d9b4ec30cfaf82c2c21773ea0cea1f`  
**Baseline:** merged `main` `b6a598e1a2d9b4ec30cfaf82c2c21773ea0cea1f`  
**State schema:** v16 retained  
**Save format:** v3 retained

## Delivered

### Route-key integrity

New routes are unique by:

```text
empireId + originPlanetId + targetPlanetId + resourceId
```

Creating a duplicate active or paused route returns stable code `LOGISTICS_ROUTE_DUPLICATE`. A route for another resource or endpoint remains legal.

### Pause, resume and edit semantics

- paused routes perform no departures;
- resume schedules the next departure at `current game time + interval`;
- paused elapsed time is never replayed;
- changing the interval of an active route rebases from current game time;
- amount, reserve and priority-only edits preserve the existing departure time;
- same-time departures remain priority descending, then route ID ascending;
- foreign update/delete attempts remain rejected through the existing owner lookup.

### Ephemeral departure receipts

Every resolved departure emits an immutable in-memory receipt:

```text
routeId
empireId
executedAt
resultCode
amount
```

The shared `ADVANCE_TIME` reducer accumulates receipts across every route boundary. Ordinary `executeCommand()` still returns only `GameState`; campaign-time processing calls the same reducer path with telemetry.

Receipts are never stored in:

- `GameState`;
- save envelopes;
- checksums;
- command/event history;
- replay identity.

Catch-up summaries now count every successful player receipt, including several successes before a later miss and multiple routes at one boundary.

### Legacy save-v3 duplicate repair

Legitimate old saves can contain duplicate route keys. After envelope integrity validation and during schema-v16 finalization, routes are normalized deterministically:

1. group by route key;
2. prefer the lowest numeric `logistics-<sequence>`;
3. prefer a valid numeric ID over malformed legacy IDs;
4. use lexicographic route ID when no numeric ordering resolves the tie;
5. retain the complete survivor object unchanged;
6. discard duplicate siblings before state activation.

No schema or save-format version changes. Repaired saves serialize with one route per key and remain stable on round trip.

## Tests

Focused coverage verifies:

- repeated successful departures and receipt ordering;
- reserve misses;
- duplicate rejection against active and paused routes;
- pause without transfers and resume rebasing;
- active interval edit and non-interval preservation;
- same-time priority then ID ordering;
- exact mixed-result catch-up transfer counts;
- operation-budget continuation;
- direct/partitioned state and summary equality;
- multiple routes at one boundary;
- active/paused legacy duplicate repair, conflicting fields and malformed IDs;
- checksum rejection before repair;
- stable repaired save round trip;
- existing destruction/recovery, progression and performance regressions.

## Code-head validation

Code head `ab8669941d1b8e4c11c4929a697ee6eb3339de4d` passed:

- asset audit, lint and strict TypeScript;
- complete unit/integration suite and build;
- isolated seven-day catch-up performance;
- Graphify `30661187260`.

Final progression, Browser and documentation-head workflow IDs are recorded in the PR before merge.

## Explicit exclusions

- route creation/editing UI redesign;
- selected-colony market workflow;
- bot colony roles or logistics planning;
- physical cargo fleets, distance, fuel, interception or route combat;
- progression/economy rebalance;
- schema/save-format changes;
- PvE/meta, alliances or endgame.

## Ordered next work

After #139 merges, create only #140 `COLONY-OPERATIONS-UX` from fresh `main`.
