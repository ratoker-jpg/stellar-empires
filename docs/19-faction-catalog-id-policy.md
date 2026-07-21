# Faction mechanical catalog and ID policy

## Purpose

Faction content uses one deterministic registry for buildings, research and units. Runtime code must not infer that Aegis definitions are globally available.

## Stable ID format

Mechanical IDs use:

`<kind>.<faction>.<slug>`

Supported kinds:

- `building`;
- `technology`;
- `ship`;
- `defense`.

Examples:

- `building.aegis.command`;
- `technology.synod.resonance`;
- `ship.veyra.sun-spear`.

Existing Aegis IDs remain stable. They are never renamed merely to align display names or assets.

## Current transition state

Aegis has a native mechanical catalog. Synod and Veyra currently use explicit `legacy-alias` manifest entries whose source is Aegis. This preserves existing saves while making the temporary compatibility visible and testable.

PR #77–#79 replace those aliases with native catalogs. When a faction receives a native catalog:

1. its manifest source becomes itself;
2. newly created planets and queues use native IDs;
3. legacy Aegis IDs owned by that faction are mapped by an explicit migration table;
4. unknown or ambiguous IDs fail migration instead of silently changing meaning.

## Validation gate

Every native catalog must pass:

- unique IDs across buildings, research and units;
- ID namespace matches the definition faction;
- all building/research prerequisites resolve inside the source catalog;
- all unit requirements resolve;
- player and bot lookup paths use the same registry.

Captured third-party names, formulas and art are not catalog input.
