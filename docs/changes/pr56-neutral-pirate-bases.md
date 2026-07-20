# PR #56 — Neutral forces and pirate bases

## Delivered

- New games deterministically place three pirate bases on previously unclaimed non-gas galaxy positions.
- Pirate bases are ordinary `PlanetState` objects owned by `pirate-neutral`, with military specialization, infrastructure, lootable resources and tiered defenses.
- Pirates are intentionally excluded from managed empires, research, intelligence and the autonomous bot scheduler.
- Occupied pirate positions cannot be colonized while the base exists.
- Existing scout and attack missions target pirate bases without special bypasses.
- Scouting reveals the neutral owner through the standard intelligence snapshot.
- Attacks use the normal flight, fuel, combat, plunder, debris and battle-report pipeline.
- Pirate bases persist through the current save format without a schema change because they reuse existing planet state.
- Tests cover deterministic placement, isolation from empire systems, scouting, attack validation and save round-trip.

## Intentional limitations

- Existing schema-v12 saves are not retroactively seeded with pirate bases; new games receive them automatically.
- Startup pirate forces are planet-bound defenses so the established invariant of no active fleets at new-game start remains intact.
- Roaming pirate patrols and respawn rules belong to later world-event work.
