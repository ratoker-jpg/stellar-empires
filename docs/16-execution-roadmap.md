# Execution Roadmap Stellar Empires — mechanics-informed v3

**Status:** Accepted  
**Updated:** 2026-07-21  
**Baseline:** merged PR #77  
**Release target:** 1.0

> PR #78 is the full-project audit in `docs/20-full-project-audit.md`. Planned implementation PR numbers after #77 are shifted by one compared with the earlier roadmap revision.

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
- Source assets are not runtime assets until registered and tested.
- `docs/20-full-project-audit.md` defines the current stabilization risks and recommended gates.

## 3. Delivered baseline through PR #77

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

### Factions, assets and visual redesign

- three faction identities, selection and persistence;
- 172 verified source assets across three packs;
- generated runtime atlases/hero/emblem/background registry;
- production galaxy, planet, object, pirate and fleet art;
- design system, structured HUD and rebuilt planet workspace;
- responsive/accessibility runtime and local command ranking;
- per-hull upgrades, formations, target priorities and class skills;
- command doctrine progression and flagship framework;
- faction catalog registry, stable IDs and full native Aegis catalog.

## 4. Completed visual and military batch

| PR | Scope |
|---:|---|
| **#69** | Research, production and planetary defense presentation |
| **#70** | Market, logistics, PvE, world events and reports presentation |
| **#71** | Command profile, local ranking and faction polish |
| **#72** | Responsive, keyboard/accessibility, performance and visual QA |
| **#73** | Deterministic per-hull ship upgrades |
| **#74** | Formations, target priorities and original class skills |
| **#75** | Command doctrine progression and flagship framework |
| **#76** | Faction mechanical catalog architecture and ID migration policy |
| **#77** | Full Aegis economy/buildings/research/unit roster |
| **#78** | Full project audit and stabilization recommendations |

## 5. Faction completion and stabilization gate

| PR | Scope |
|---:|---|
| **#79** | Full Synod economy/buildings/research/unit roster |
| **#80** | Full Veyra economy/buildings/research/unit roster |

Gate after #80:

- three factions are mechanically distinct, bot-usable and save-compatible;
- direct shared Aegis dependencies are audited;
- stabilization priorities from `docs/20-full-project-audit.md` are reviewed before diplomacy begins.

Recommended stabilization package before or alongside diplomacy:

- canonical bot time and catch-up;
- serialized bot timing;
- long-session state/log control;
- temporary complete victory/defeat loop;
- early headless balance harness;
- browser E2E baseline.

## 6. Diplomacy, coalition and endgame

| PR | Scope |
|---:|---|
| **#81** | Relations, reputation and diplomatic positions |
| **#82** | Treaties, wars, coalition creation, roles and AI decisions |
| **#83** | Coalition contributions, shared projects and coalition world |
| **#84** | Strategic stars, support/assault operations and group battles |
| **#85** | Rare meta-resource, anti-snowball and intermediate anchor arrays |
| **#86** | Final transit nexus, victory/defeat and post-round state |

Original terminology is mandatory. The external crystal/obelisk/gate chain is only a structural reference.

## 7. Product meta and completeness

| PR | Scope |
|---:|---|
| **#87** | Achievements, local rankings and round statistics |
| **#88** | Tutorial, contextual help and encyclopedia |
| **#89** | Bot expedition/object/repair/diplomacy/endgame planning |
| **#90** | Audio system, faction sound language and music |
| **#91** | Notifications, reports, explanations and bookmarks |
| **#92** | Save schema consolidation and offline resimulation |
| **#93** | Balance harness and headless simulation batches |
| **#94** | Economy/progression/battle/endgame balance pass |
| **#95** | Aegis production content/art/effects/audio polish |
| **#96** | Synod production content/art/effects/audio polish |
| **#97** | Veyra production content/art/effects/audio polish |
| **#98** | Accessibility and localization readiness |
| **#99** | Performance/memory/startup budget and low-end fallback |
| **#100** | Regression, migrations, replay and browser matrix |
| **#101** | Release candidate, docs, credits/provenance and Pages QA |
| **#102** | Release 1.0 stabilization and tagged public build |

The full audit recommends moving canonical bot time, state-size control, a temporary complete game loop, balance harness and browser E2E earlier than these final completeness PRs.

## 8. Cross-cutting acceptance gates

Every gameplay system provides:

- deterministic domain logic and tests;
- player and bot command paths;
- save serialization/migration;
- reports or explainable feedback;
- accessible UI state;
- original terminology and asset provenance;
- performance limits.

Additional project-wide gates:

- save/load must not change bot behaviour;
- different time-step sizes must produce equivalent deterministic outcomes;
- state and save growth must remain inside explicit budgets;
- at least one complete victory/defeat path must be playable before final endgame expansion;
- browser E2E must cover the main vertical slice.

## 9. Explicit non-goals

- multiplayer/network authority;
- payments and premium services;
- sitters/account moderation;
- exact emulation of Nemexia economy or balance;
- captured third-party HTML, CSS or art.
