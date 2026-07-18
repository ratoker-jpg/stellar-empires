# PR #30 — Distance, fuel and flight lifecycle

Schema v6 expands fleets with outbound, holding and returning states plus serialized transit timing. A single deterministic distance function combines system coordinates and orbital positions. Fleet duration derives from the slowest ship and propulsion research; gas is reserved for the round trip before departure.

Sending schedules arrival, arrival places the fleet in holding orbit, and recall schedules return. Recalling an outbound fleet replaces its arrival event and uses elapsed travel time for the return leg. The top-level command dispatcher applies flight events during large or offline time advances, so active flights survive save, reload and replay.
