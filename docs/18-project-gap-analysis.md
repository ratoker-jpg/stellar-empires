# Full project audit and mechanics gap analysis

**Status:** Accepted  
**Audit date:** 2026-07-21  
**Baseline:** `main` at `5d9566472411714d70365332514273a6477a0b68` (merged PR #65)

## 1. Audit method and honesty boundary

The audit used the current bootstrap, canonical state/command contracts, reducer, representative catalogs, combat profiles, asset registry, persistence/status documentation, tests and the changed-file history of delivered PRs. The repository tree endpoint was not available through the connector, so this document does not claim that every source line was manually reread. It does claim coverage of every current product domain and runtime mount point, checked against the 96-item mechanics reference.

Source-of-truth order:

1. current `main`;
2. current tests and save schema;
3. merged GitHub history;
4. project documentation;
5. external mechanics research as reference only.

## 2. Current architecture snapshot

### Runtime and shell

- Phaser 4.2.1 renders the galaxy scene.
- TypeScript/Vite owns the application shell.
- HTML/CSS panels are mounted from `src/main.ts`.
- IndexedDB autosave, slots, import/export and recovery are present.
- Bot planning runs through a Web Worker controller and applies the same command bridge as the player.
- The visual redesign foundation, global HUD and planet zones are delivered through PR #65.

### Canonical simulation state

Schema v12 currently stores:

- deterministic clock, event queue and command/event logs;
- empires, galaxy and planets;
- research and fleets;
- intelligence and debris;
- logistics routes and market;
- space objects and strategic resources;
- world events.

### Canonical commands

Delivered command families:

- time/event scheduling;
- building queue/cancel;
- specialization and development templates;
- logistics route CRUD;
- market swaps;
- research queue/cancel;
- ship/defense production and defense repair;
- fleet create/disband/send/recall;
- expedition and space-object missions.

## 3. Domain coverage

| Domain | Status | Evidence | Principal gaps |
|---|---|---|---|
| Deterministic time/events | Delivered | reducer, scheduled events, replay logs | offline catch-up UX and stress budget |
| Persistence | Delivered | schema v12, IndexedDB, autosave/recovery | future migrations for meta systems |
| Planet/economy | Delivered core | resources, energy, population, stability, storage, three zones | richer environment pressure, multi-slot/zone queues, broader catalogs |
| Buildings | Partial content | 8 Aegis mechanical definitions shared by all factions | extended catalogs and faction chains |
| Research | Delivered core, partial content | queue/effects and Aegis catalog | categories/branches and faction trees |
| Production/defense | Delivered core | inventory, queues, damaged/repair lifecycle | broader rosters and faction rules |
| Fleets | Delivered core | deploy/transport/scout/attack/recycle/colonize/expedition/space-object | richer UX, holding/support, formations, flight slots |
| Galaxy/intelligence | Delivered data/read model | seeded systems, fog-aware intelligence, filters | production presentation, strategic stars, expanded topology |
| Combat | Delivered v2 core | deterministic rounds, counters, carried damage, reports | priorities, formations, class skills, doctrine/flagships |
| PvE | Delivered core | pirates, expeditions, objects, events, anti-farm | bot use, choices, seasons and richer spending |
| Market/logistics | Delivered core | swap market and recurring routes | bot participation and transport-bound capacity |
| Bots | Delivered core | perception, planners, threat/recovery, Worker scheduler | expeditions, object operations, repair, diplomacy/endgame |
| Factions | Visual identity delivered | selection, persistence, themes, runtime atlases | true asymmetric mechanical catalogs |
| Reports | Delivered core | unified mission reports and filters | notifications/bookmarks/causal explanations |
| Profile/ranking | Prototype/partial | shell/profile presentation | local ranking, achievements, round statistics |
| Diplomacy/coalitions | Missing | roadmap only | relations, treaties, coalition world |
| Command doctrine/flagships | Missing | roadmap/stale upgrade branch only | progression, skills and equipment-inspired original meta |
| Endgame | Missing | strategic resource storage only | stars, projects, megastructures and victory |
| Audio/onboarding/accessibility | Missing/partial | UI foundation | tutorial, encyclopedia, sound/music and full a11y |
| Monetization/account services | Intentionally excluded | product boundary | no Premium, Credits, sitters or live-service |

## 4. Important implementation facts

- `src/main.ts` mounts every current screen and binds faction assets at startup.
- `GameState` has mature galaxy/economy/fleet/PvE fields, but no diplomacy, command doctrine, achievement or endgame state.
- `GameCommand` has no diplomacy, flagship, upgrade, formation, achievement or megastructure commands.
- `canUseMechanicalDefinition` explicitly permits Aegis definitions for all factions.
- The building catalog contains eight Aegis entries; source packs contain many more visual concepts.
- Combat profiles cover the shared Aegis vertical slice and use original weapon/protection categories.
- The building queue is one active item per planet, not a literal copy of Nemexia's multi-zone queue model.
- Existing values are original prototype balance; help-site numbers remain research data.

## 5. Mechanics research translated into original requirements

### Adopt as structural patterns

- layered progression: planet → empire → command doctrine → coalition → endgame;
- faction asymmetry in economy, population, support and fleet doctrine;
- mission families sharing one deterministic flight lifecycle;
- class skills and priorities layered over counter-based combat;
- strategic-star objectives feeding coalition projects and a visible victory race;
- achievements and round statistics for long-term single-player goals;
- environment/capacity pressure that forces trade-offs.

### Adapt substantially

- Sun attacks → original **strategic-star operations**;
- crystals/obelisks/gate → **relic cores / anchor arrays / transit nexus**;
- admiral → **command doctrine**;
- commander ships → **flagships**;
- alliance/team planet → **AI coalitions and coalition world**;
- ozone → broader **planetary stability/environment capacity**.

### Exclude

- Premium/Platinum/Credits/Capsules monetization;
- account/sitter/multi-account rules;
- exact names, formulas, costs, times and balance tables;
- copied Nemexia HTML/CSS/artwork;
- online moderation, payments and live-service.

## 6. Asset gap

Current runtime has compact generated faction atlases and procedural fallbacks. The supplied source library covers:

- galaxy/system backgrounds;
- stars, planets, asteroids and pirates;
- faction identity art;
- starter buildings and ships;
- 39 extended faction ships;
- 54 faction building sheets;
- zone terrain backgrounds;
- optional raster UI skins.

The remaining work is publication, integration, optimization, stable IDs and state coverage—not asset discovery.

## 7. Priority conclusions

1. Finish the visual batch before another large state migration.
2. Integrate galaxy/fleet art in #67 and building/defense art in #68.
3. Resume ship upgrades from fresh `main`; never merge the stale branch directly.
4. Build faction catalog architecture before full faction content.
5. Implement command doctrine/flagships before coalition/endgame.
6. Add diplomacy/coalitions before strategic-star and victory systems.
7. Preserve deterministic, shared-command and save-migration invariants.
