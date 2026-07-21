# Native Veyra mechanical catalog

**Status:** Delivered by PR #81  
**Date:** 2026-07-21

## Scope

Veyra now has a complete native mechanical namespace at the same prototype depth as Aegis and Synod:

- 12 buildings;
- 10 technologies;
- 10 ships;
- 5 planetary defenses.

The manifest resolves `veyra` through a native source catalog. New games, colonies, queues, fleets, combat, upgrades, bots and UI therefore use `building.veyra.*`, `technology.veyra.*`, `ship.veyra.*` and `defense.veyra.*` IDs.

## Mechanical identity

Veyra is the fast adaptive faction:

- shorter construction, research and production times;
- stronger mobility and cargo throughput;
- lighter armor and shields than Aegis and Synod;
- plasma-biased organic combat profiles;
- research emphasis on adaptive growth, living propulsion, regeneration and swarm coordination.

The catalog uses original names, values and descriptions. It does not copy Nemexia factions or balance.

## Shared runtime

The existing faction registry and role paths resolve Veyra definitions for:

- starting buildings and planet economy;
- laboratory, shipyard, hangar, sensors and defense-grid capacity;
- research and production commands;
- scout, recycle, colonize, expedition and strategic-object missions;
- combat profiles and ship upgrades;
- economy, research, production, fleet and recovery bot planners;
- planet, research and production presentation.

## Save migration

`migrateLegacyVeyraAliases` deterministically maps alias-era Aegis IDs only inside Veyra-owned contexts. It covers buildings, queues, research, inventory, defenses, fleets, upgrades, intelligence snapshots, pending events and logs, then recalculates affected planet economies. Aegis and Synod contexts are not rewritten.

## Runtime assets

Veyra buildings, ships and defenses use the committed Veyra atlases. Until a dedicated Veyra technology atlas exists, technology cards use deterministic frames from the Veyra building atlas. This fallback is explicit and never displays Aegis technology art.

## Verification

Regression coverage verifies:

- native manifest and catalog validation;
- 12/10/10/5 catalog counts;
- valid starting economy;
- building, research, ship and defense queues;
- faction role capacities;
- scout, recycle and colonize missions;
- combat and bot command paths;
- Veyra-only planet view models;
- deterministic alias-save migration and round-trip persistence;
- Veyra runtime atlas binding.

The implementation workflow completed the full repository gate after the final identity and utility-stat polish: lint, TypeScript typecheck, the complete Vitest suite and production build.
