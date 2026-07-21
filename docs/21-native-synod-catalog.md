# Native Synod mechanical catalog

Status: implemented in PR #80.

## Scope

Synod now owns a native mechanical namespace instead of resolving through the Aegis legacy alias.

- 12 buildings under `building.synod.*`
- 10 technologies under `technology.synod.*`
- 10 ships under `ship.synod.*`
- 5 defenses under `defense.synod.*`

Veyra remains on the explicit Aegis legacy alias and is outside PR #80.

## Mechanical identity

Synod is built around information and coordination rather than raw structural mass.

- stronger research throughput and sensor growth;
- faster coordinated movement and more precise weapons;
- shield-heavy ships and defenses;
- lower raw armor than comparable Aegis hulls;
- stronger crystal and information economy, with less emphasis on brute-force metal output.

## Resolution architecture

The central faction mechanical registry owns building, research and unit catalog resolution. Global lookup functions are compatibility facades over that registry and no longer default unknown faction content to an Aegis definition.

Faction mechanical roles provide stable capability names for common systems:

- command, laboratory, shipyard and sensor-grid infrastructure;
- construction, energy, sensors, propulsion, protection, weapons and colonization research;
- scout, transport, fighter, frigate, colonizer and recycler hulls.

Fleet missions use hull roles rather than literal Aegis IDs. The same role resolution is used by scouting, recycling, colonization, expeditions, strategic-object operations and bot fleet planning.

## Save migration

PR #80 uses a full deterministic migration, not a permanent compatibility alias.

When a loaded state contains a Synod-owned planet from the alias era, every known Aegis mechanical ID in that Synod context is mapped to its native Synod equivalent. The migration covers:

- planet buildings and queues;
- research levels and queues;
- ship and defense inventories;
- fleets and active missions;
- ship upgrades;
- relevant pending events, command log and event log entries;
- intelligence snapshots that describe Synod planets.

Aegis-owned state is not rewritten. Veyra state is not rewritten because Veyra still intentionally uses the Aegis alias.

After ID replacement, Synod planet economies are recalculated from native building contributions and native research effects. This makes repeated loads deterministic and keeps a save round-trip stable.

New games write only native Synod IDs.

## Runtime assets

Buildings, ships and defenses use the delivered Synod runtime atlases. A dedicated Synod technology atlas is not currently delivered, so technology cards use deterministic frames from the Synod building atlas as an explicit temporary fallback.

The fallback never uses Aegis cards or labels as Synod content. Replacing it later requires only changing the Synod technology asset bindings; mechanical IDs remain stable.

## Bot parity

Synod bots resolve the same definitions and submit the same commands as the player. They receive no hidden resources, free construction, bypassed requirements or faction-specific command path.

## Validation contract

The PR test suite covers:

- zero Synod catalog validation errors and native manifest mode;
- faction-native starting buildings and valid starting economy;
- building, research, ship and defense queues;
- faction-native hangar and defense-grid capacity;
- scout, recycle, colonize and expedition-capable Synod hull roles;
- Synod combat profiles;
- at least one executable Synod bot command;
- faction-correct UI/view-model catalogs;
- deterministic alias-era migration and valid save round-trip.
