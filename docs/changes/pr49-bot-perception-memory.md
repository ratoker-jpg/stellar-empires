# PR #49 — Honest bot perception and memory

## Delivered

- A formal bot-perception snapshot built from exact self-state plus public market data.
- Foreign planet knowledge comes only from intelligence observations created by scouting.
- Expired observations remain available as explicitly stale memory instead of silently becoming current truth.
- Alerts and observations form a deterministic memory timeline and summary.
- Own fleets and research are visible to the owning bot; foreign fleets are visible only when present in an intelligence snapshot.
- Tests prove that hidden player resource changes do not alter bot perception without a new observation.

## Invariants

- The perception layer never reads live foreign planet state.
- Stale observations are marked stale and include their age.
- The model is pure and deterministic, ready for economic, research and fleet planners.
