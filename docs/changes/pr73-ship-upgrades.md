# PR #73 — Deterministic ship upgrades

## Delivered

- Schema v13 ship-upgrade state for every empire.
- Per-hull weapon, armor and cargo tracks with ten levels each.
- One deterministic upgrade queue per empire.
- Shipyard level 2 requirement, escalating resource costs and scheduled completion events.
- Cancellation removes the completion event and refunds 70% of the spent resources.
- Weapon and armor upgrades affect only the upgraded hull in combat.
- Cargo upgrades affect fleet capacity when a fleet is created.
- Dedicated upgrade screen with faction ship art, queue status, quotes and cancellation.
- Additive migration from schema v1–v12 and save round-trip coverage.

## Balance model

- Weapons: +6% attack per level.
- Armor: +5% armor and shield durability per level.
- Cargo: +8% cargo capacity per level.
- Maximum level: 10.

## Boundaries

- Existing fleets keep their recorded cargo capacity; cargo upgrades apply when creating a new fleet.
- Speed upgrades are intentionally excluded from this first domain.
- Bots use the same commands but do not yet have an upgrade planner.
- The stale earlier upgrade branch was not merged.
