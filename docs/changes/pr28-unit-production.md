# PR #28 — Shipyard and defense production

The Shipyard and Defense routes now open playable production screens backed by simulation state. Unit batches validate buildings, technologies, resources, population and hangar space before reserving capacity and scheduling a deterministic completion event.

Shipyard and Defense use independent one-slot queues. Completed events add the requested quantity to planet inventory exactly once; cancellation removes the event and refunds 75% of the cost. Queue state, inventory and active reservations survive autosave, manual export and offline time advancement.
