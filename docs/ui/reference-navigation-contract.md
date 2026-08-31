# Reference navigation contract — 2026-08-31

**Status:** product/visual contract for `REFERENCE-NAVIGATION-REDESIGN-V2`  
**Source:** owner-supplied `stellar_references_and_html.zip`  
**Policy:** use the bundle for composition/interaction evidence; runtime remains Stellar-owned code, branding and assets

## Reference bundle inventory

The supplied bundle contains:

- `stellar_empires_full_command.html` — interactive one-page navigation/visual prototype;
- **20 screenshots total:** 19 desktop screenshots at 1672×941 and one narrow fleet-sidebar crop at 411×897.

Reference screens:

1. `01_planet_main.png`
2. `02_universe.png`
3. `03_fleets_sidebar_reference.png`
4. `04_fleets_send_step2.png`
5. `05_fleets_create_step1.png`
6. `06_fleets_catalog.png`
7. `07_operations.png`
8. `08_science.png`
9. `09_command.png`
10. `10_reports.png`
11. `11_settings.png`
12. `12_rating.png`
13. `13_market.png`
14. `14_resource_zone.png`
15. `15_industrial_zone.png`
16. `16_military_zone.png`
17. `17_solar_war.png`
18. `18_events.png`
19. `19_arena.png`
20. `20_ship_upgrades.png`

The HTML references 60+ distinct existing Stellar repository asset paths and also relies heavily on gradients/canvas/CSS rendering. Procedural rendering is therefore part of the accepted visual approach.

## Canonical primary navigation

The reference HTML defines one persistent primary row. Desktop order and labels are fixed:

| Order | Label | Current route family | Canonical destination |
| ---: | --- | --- | --- |
| 1 | Планета | `planet` | active colony overview |
| 2 | Вселенная | `space` | restored Universe/Galaxy/Solar route |
| 3 | Флоты | `fleets` | restored fleet route |
| 4 | Операции | `operations` | restored operations route |
| 5 | Наука | `research` | research workspace |
| 6 | Командование | `command` | restored command route |
| 7 | Отчёты | `reports` | restored report filter |
| 8 | Рейтинг | `ranking` | ranking/profile |
| 9 | Настройки | `system` | settings experience; campaign/saves remain local system content |

Rules:

- no visible `Игра / Развитие / Данные / Система` group labels in the global row;
- exactly one active primary destination;
- badges do not change order;
- active state is readable without colour alone;
- global navigation and local tabs/filters/zones are visually distinct;
- route memory remains a convenience, not a second navigation authority.

## Persistent shell anatomy

### Header

```text
logo | primary navigation | campaign/world status
```

The header persists across routes. Status/version/save/world-time content remains subordinate to primary navigation.

### Resource/status strip

Current Stellar resource/capacity data remains authoritative. The reference defines density/hierarchy only, not values or formulas.

### Left contextual rail

The left rail is context, not global navigation.

Planet default:

```text
mini planet/context
→ Resource zone
→ Industry zone
→ Military zone
→ active colony selector
→ compact planet passport/status
```

Fleet/task screens may replace some planet context with task lists/filters, matching `03_fleets_sidebar_reference.png`, while global resource/colony context remains available through the shell.

### Main surface

The centre is always the dominant task: planet scene, map, catalog/grid, research tree, table, report reader or settings form.

### Right contextual rail

Render only when it adds task value:

- queue/progress;
- selected object/ship/building details;
- costs/requirements;
- actions;
- profile/campaign summary.

Do not keep filler panels solely to force three columns.

## Route-specific composition

### Planet — refs 01, 14, 15, 16

- persistent top navigation;
- clear planet title/coordinates;
- direct Resource/Industry/Military actions in left context;
- overview as planet command centre;
- zone grid/catalog in centre;
- selected building/queue/actions on right where applicable;
- distinct locked/available/selected/upgrading states;
- Shipyard, Defense and Ship Upgrades remain contextual surfaces under their existing route owner.

### Universe — ref 02

- preserve `Universe → Galaxy → Solar System` hierarchy;
- explicit coordinate jump;
- map/canvas dominates;
- tools remain subordinate;
- selected object detail is stable and obvious;
- map navigation must not mutate `GameState`.

### Fleets — refs 03, 04, 05, 06

- fleet context/list belongs in left rail;
- compose uses staged flow;
- step 1 = composition/ship selection;
- step 2 = destination/mission/summary/confirmation;
- active/battle states retain current semantics;
- catalog/list/detail patterns are consistent.

### Operations — refs 07, 13, 17, 18, 19

- one owner route with explicit local modes;
- overview, market, events, arena and Solar War each get a dominant task surface;
- expeditions, objects, alliances and logistics use the same local-tab/detail language;
- local modes never become global tabs.

### Science — ref 08

- research tree/list central;
- selected technology detail/requirements as secondary context;
- queue/progress visible;
- category controls stay local.

### Command — ref 09

- overview, doctrine, fleet doctrine and upgrades remain local modes;
- game data/mechanics unchanged;
- one consistent local active-state treatment.

### Reports — ref 10

Desktop target where space permits:

```text
filters/folders | report list | selected report reader
```

Compact may collapse to list → reader, but selected report and return path stay explicit.

### Ranking — ref 12

- ranking table/list central;
- profile summary secondary;
- both remain readable at release widths.

### Settings — ref 11

Canonical local categories:

- Graphics;
- Sound;
- Interface;
- Controls;
- Notifications;
- Campaign & Saves.

Existing settings/save semantics remain authoritative; this is visual/navigation regrouping only.

### Ship upgrades — ref 20

Use the reference presentation inside the existing owning production/military/command task context. Do not invent a new gameplay route solely to match the screenshot.

## Visual system rules

- dark industrial sci-fi shell;
- restrained cyan for active/interactive emphasis;
- gold only for commander/campaign/meta emphasis;
- strong thin borders/chamfered geometry where readable;
- consistent panel spacing/title hierarchy/selection states;
- effects never obscure text, focus or pointer targets;
- reduced-motion simplifies non-essential movement;
- procedural CSS/SVG/canvas is preferred over blocking on missing decorative raster art.

## Responsive contract

Required viewports:

- 1920×1080;
- 1672×941 reference baseline;
- 1366×768;
- 1024×768;
- 768×1024.

Desktop preserves the full primary top row and contextual multi-column composition.

Compact/tablet may collapse/stack contextual rails. Every primary destination remains reachable in one deliberate action, local navigation stays distinguishable from global navigation, and the document must not horizontally overflow.

## Asset policy

1. Existing runtime assets first.
2. CSS/SVG/canvas for non-critical decorative visuals where practical.
3. Missing final illustration → procedural fallback + row in `docs/ui/reference-navigation-missing-assets.md`.
4. Never silently copy reference-bundle/external pixels into runtime.
5. Final replacement art requires explicit provenance and runtime binding.

## Acceptance summary

The redesign is complete only when:

- all nine primary destinations use the canonical top navigation;
- the four current navigation groups are no longer rendered as the global shell;
- all 20 reference states have a mapped/reachable Stellar route/state;
- keyboard/history/reload/route-memory behavior remains correct;
- navigation-only actions preserve checksum;
- supported viewports avoid document horizontal overflow and clipped essential actions;
- missing final art is resolved or recorded with stable procedural fallback;
- assets, lint, typecheck, unit, build, Browser E2E, accessibility and intentional visual baselines pass.
