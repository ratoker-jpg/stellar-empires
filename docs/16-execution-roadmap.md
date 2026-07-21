# Execution Roadmap Stellar Empires — mechanics-informed v3

**Status:** Accepted  
**Updated:** 2026-07-21  
**Baseline:** merged PR #65  
**Release target:** 1.0

## 1. Release boundary

Release 1.0 is a complete offline single-player browser strategy:

> choose faction → develop colonies → research and produce → explore and fight bots → form or oppose coalitions → contest strategic stars → build coalition projects → complete a final transit nexus → win/lose → review round statistics.

Included:

- three mechanically asymmetric factions;
- deterministic economy, research, production, fleets, combat and bots;
- living galaxy, PvE, diplomacy, coalition and endgame;
- command doctrine, flagships, achievements and local rankings;
- original production UI/assets/audio and accessible GitHub Pages release.

Excluded:

- network multiplayer;
- server accounts/cloud saves;
- payments, Premium/Credits and live-service;
- copied Nemexia names, UI, art, formulas or exact balance.

## 2. Rules

- GitHub history and current `main` are authoritative.
- Each PR starts from fresh `main`.
- CI gate: lint → typecheck → tests → production build.
- Simulation stays independent from DOM/Phaser and deterministic.
- Players and bots use the same commands and constraints.
- Every incompatible state change gets a schema migration and fixtures.
- Research is inspiration; adopted systems require original names, values and presentation.
- Source assets are not runtime assets until optimized, registered and tested.

## 3. Delivered baseline through PR #65

### Foundation and vertical slice

- Phaser/TypeScript/Vite, deterministic state/events/replay/checksum;
- IndexedDB autosave, slots, import/export and recovery;
- seeded galaxy and three-zone planets;
- economy, buildings, research, production and fleets;
- transport, deploy, scout, attack, recycle and colonize;
- combat, plunder, debris and reports;
- multi-colony management, specialization, logistics and market.

### Living galaxy and bots

- honest bot perception/memory and deterministic planners;
- autonomous Worker scheduler and personalities;
- fog-aware galaxy intelligence;
- pirates, expeditions, space objects and world events;
- PvE anti-farm/threat scaling and unified reports;
- planetary defense damage/repair lifecycle;
- combat v2 counters.

### Factions and visual redesign

- three faction identities, selection and persistence;
- generated runtime atlases/hero/emblem/background registry;
- design system and UI sandbox;
- structured global HUD/navigation;
- rebuilt planet overview and zone presentation.

## 4. Active visual/content batch

| PR | Scope | Gate |
|---:|---|---|
| **#66** | Mechanics reference, full project gap audit, roadmap v3 and source asset intake | honest docs; provenance recorded; no runtime regression |
| **#67** | Fleet mission flow and production galaxy presentation | all missions visible; targets understandable; galaxy/pirate/ship art integrated |
| **#68** | Remaining generated faction source asset intake | archive provenance/inventory complete; no runtime regression |
| **#69** | Market, logistics, PvE, world events and reports presentation | coherent operations workspace with preserved commands |
| **#70** | Command profile, local ranking and faction polish | profile/ranking read models and faction identity |
| **#71** | Responsive, keyboard/accessibility, performance and visual QA | 1366×768/1920×1080, keyboard path and budgets |

## 5. Military and faction architecture

| PR | Scope |
|---:|---|
| **#72** | Reimplement ship upgrades on fresh main with migration/tests |
| **#73** | Formations, target priorities and original class skills |
| **#74** | Command doctrine progression and flagship framework |
| **#75** | Faction mechanical catalog architecture and ID migration policy |
| **#76** | Full Aegis economy/buildings/research/unit roster |
| **#77** | Full Synod economy/buildings/research/unit roster |
| **#78** | Full Veyra economy/buildings/research/unit roster |

Gate after #78: three factions are mechanically distinct, bot-usable and save-compatible.

## 6. Diplomacy, coalition and endgame

| PR | Scope |
|---:|---|
| **#79** | Relations, reputation and diplomatic positions |
| **#80** | Treaties, wars, coalition creation, roles and AI decisions |
| **#81** | Coalition contributions, shared projects and coalition world |
| **#82** | Strategic stars, support/assault operations and group battles |
| **#83** | Rare meta-resource, anti-snowball and intermediate anchor arrays |
| **#84** | Final transit nexus, victory/defeat and post-round state |

Original terminology is mandatory. The external crystal/obelisk/gate chain is only a structural reference.

## 7. Product meta and completeness

| PR | Scope |
|---:|---|
| **#85** | Achievements, local rankings and round statistics |
| **#86** | Tutorial, contextual help and encyclopedia |
| **#87** | Bot expedition/object/repair/diplomacy/endgame planning |
| **#88** | Audio system, faction sound language and music |
| **#89** | Notifications, reports, explanations and bookmarks |
| **#90** | Save schema consolidation and offline resimulation |
| **#91** | Balance harness and headless simulation batches |
| **#92** | Economy/progression/battle/endgame balance pass |
| **#93** | Aegis production content/art/effects/audio polish |
| **#94** | Synod production content/art/effects/audio polish |
| **#95** | Veyra production content/art/effects/audio polish |
| **#96** | Accessibility and localization readiness |
| **#97** | Performance/memory/startup budget and low-end fallback |
| **#98** | Regression, migrations, replay and browser matrix |
| **#99** | Release candidate, docs, credits/provenance and Pages QA |
| **#100** | Release 1.0 stabilization and tagged public build |

## 8. Cross-cutting acceptance gates

Every gameplay system provides:

- deterministic domain logic and tests;
- player and bot command paths;
- save serialization/migration;
- reports or explainable feedback;
- accessible UI state;
- original terminology and asset provenance;
- performance limits.

## 9. Explicit non-goals

- multiplayer/network authority;
- payments and premium services;
- sitters/account moderation;
- exact emulation of Nemexia economy or balance;
- captured third-party HTML, CSS or art.
