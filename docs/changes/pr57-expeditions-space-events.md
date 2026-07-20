# PR #57 — Expeditions and deterministic space events

## Delivered

- Dedicated `START_EXPEDITION` command for scout-equipped stationed fleets.
- Expeditions target undeveloped galaxy positions and reserve round-trip fuel immediately.
- Outcome, reward, losses and narrative are determined from the game seed, event sequence, fleet and target without `Math.random()` or system time.
- Resolution is stored as a normal scheduled `EXPEDITION_RESOLVE` event and later recorded in the standard event log.
- Outcomes include salvage, research cache, environmental hazard and empty sector.
- Surviving fleets return to their origin; rewards respect storage limits and losses cannot make unit counts negative.
- Recall removes the expedition event before scheduling the normal fleet return.
- `SEND_FLEET` cannot bypass the dedicated expedition validation path.
- Pending expeditions round-trip through schema-v12 saves without a schema change.
- A dedicated UI panel provides fleet/target selection, round-trip preview, active expedition recall and completed report history.
- Tests cover launch validation, deterministic reports, single execution, recall, command guard and save persistence.

## Intentional limitations

- Expeditions currently use four core deterministic outcome families; the general multi-stage world-event framework is scheduled in the next batch.
- Expedition rewards are resources only; unique artifacts and technology unlock rewards remain later content.
- Autonomous bots do not launch expeditions yet.
