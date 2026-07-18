# PR #27 — Unit schemas and planet inventories

The first Aegis production catalog defines six ships and three defenses with original costs, build times, capacity usage, requirements and combat-ready stat contracts. Catalog validation rejects duplicate IDs, negative values and unknown building or research dependencies.

Game-state schema v4 adds per-planet ship/defense inventories plus serialized Shipyard and Defense queue contracts. Existing saves migrate with empty inventories and queues. Hangar capacity and used-space selectors are derived from the shipyard and catalog rather than duplicated in UI state.
