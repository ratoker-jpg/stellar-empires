# 16 — Differences from current roadmap

## Confirmed architecture mismatch

The current Stellar Empires prototype defines four top-level planet zones:

- `industrial`;
- `military`;
- `science`;
- `orbital`.

The browser audit and historical Help both support a three-zone progression model:

- **Resource**;
- **Industry**;
- **Military**.

This does not mean Stellar Empires should copy Nemexia terminology, layouts, values or implementation. It means the existing four-zone prototype should be migrated to an original three-domain structure before more dependent systems are built.

## Required 17-step migration sequence

1. Freeze existing prototype behaviour with tests and reference screenshots.
2. Replace `PlanetZoneId` with versioned original IDs for `resource`, `industry` and `military`.
3. Remove `science` and `orbital` as top-level planet zones.
4. Add `resource` as the dedicated extraction, storage, energy and capacity domain.
5. Move the existing metal, crystal/mineral, gas and power buildings into Resource.
6. Keep command, logistics and general production infrastructure in Industry.
7. Move the research laboratory and other science buildings into Industry while retaining Science as a separate game system and screen.
8. Move the shipyard into Industry or keep it as a separate screen explicitly unlocked from Industry; do not model it as an Orbital zone.
9. Keep fortifications, sensors and defensive infrastructure in Military.
10. Update the building catalogue, stable entity IDs, asset references and prerequisite graph for the new domains.
11. Update initial planet generation, zone field limits, occupied-field accounting and bot fixtures.
12. Update construction and research queues so their state remains serializable and deterministic.
13. Update the planet UI, navigation, view models and locked/unlocked states without copying source-game screens.
14. Add a save-schema migration that maps existing `science` and `orbital` buildings into the new domains and preserves queued work where possible.
15. Update unit tests, persistence validation, replay/checksum fixtures, accessibility checks and responsive checks.
16. Update the roadmap and bot-development order so economy, research, shipyard and defence depend on the migrated domain model.
17. Stage the migration behind a feature flag, retain export/rollback support, and balance only with original tuning data and playtests.

## Data contracts required before implementation

The migration should define stable, versioned contracts for:

- named resource costs;
- build and research duration;
- prerequisites and unlocks;
- zone/domain ownership;
- queue state;
- capacity and production effects;
- asset IDs;
- save migration metadata.

## Product impact

Stellar Empires currently exposes an original Galaxy scene and a playable Planet screen, while Science, Fleet, Reports and System navigation remain incomplete. The audit supports future original work on progression information architecture, explicit locks, deterministic exploration, fleets, combat and endgame—but it does not justify copying Nemexia art, screens, balance, wording or code.

Current Horus building cards, defence cards, several technology semantics, galaxy result schemas and battle-resolution contracts remain intentionally `UNKNOWN` or `LOCKED`. Historical Help relationships are research evidence, not production balance requirements.

This document is a migration plan only. PR #16 makes no product-code changes.