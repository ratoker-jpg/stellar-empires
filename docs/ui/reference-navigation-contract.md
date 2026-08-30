# Reference navigation contract — 2026-08-31

**Status:** product/visual contract for `REFERENCE-NAVIGATION-REDESIGN-V2`  
**Source:** owner-supplied `stellar_references_and_html.zip`  
**Policy:** reference for composition and interaction only; use Stellar code, branding and owned/generated assets

## Reference bundle inventory

The supplied bundle contains:

- `stellar_empires_full_command.html` — interactive one-page visual/navigation prototype;
- 20 desktop reference screenshots at 1672×941;
- one narrow fleet-sidebar crop (`03_fleets_sidebar_reference.png`, 411×897).

Reference screenshots:

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

## Canonical primary navigation

The reference HTML defines one persistent primary navigation row. Stellar must preserve this order and visible label set at desktop widths:

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

- no visible `Игра / Развитие / Данные / Система` group labels in the primary row;
- one active tab only;
- badges may appear on a primary tab but may not change its position;
- active state is readable without colour alone;
- global navigation remains separate from local tabs/filters;
- route memory remains a convenience, not a second hidden navigation system.

## Persistent shell anatomy

### Header

Reference structure:

```text
logo | primary navigation | campaign/world status
```

Keep the header persistent across all routes. The campaign/status block may show current world time, save status, version and active world/system context, but must not dominate the primary navigation.

### Resource/status strip

Resource and capacity status is persistent and visually compact. Current Stellar data remains authoritative. The visual target is the reference hierarchy, not reference values.

### Left contextual rail

The left rail is **context**, not global navigation.

Planet default:

```text
mini planet
→ Resource zone
→ Industry zone
→ Military zone
→ active colony selector
→ compact planet passport/status
```

Fleet/task screens may replace part of the left rail with fleet/task lists or filters, matching `03_fleets_sidebar_reference.png`, while retaining access to active colony/resources through the shell.

### Main surface

The center is always the dominant task. It may be a planet scene, map, card/catalog grid, technology tree, reports reader, table or settings form.

### Right contextual rail

Use only when the task benefits from it:

- build/production queue;
- selected object/ship/building details;
- costs/requirements;
- action controls;
- campaign/profile summary.

Do not render a generic right rail with low-value filler merely to preserve a three-column shape.

## Route-specific composition

### Planet

Reference: `01`, `14`, `15`, `16`.

- top navigation remains visible;
- planet title and coordinates are clear;
- three zone actions remain visible in the left rail;
- overview is a visual planet command centre;
- zone screens use building/catalog grid in the center and queue/detail/actions on the right;
- locked/available/selected/upgrading states are visually distinct;
- `Shipyard`, `Defense` and `Ship Upgrades` stay contextual surfaces under their current owning route contract.

### Universe

Reference: `02`.

- keep `Universe → Galaxy → Solar System` breadcrumb hierarchy;
- coordinate jump is explicit;
- map/canvas dominates;
- map tools are subordinate and do not cover selected objects;
- selected object/planet detail is obvious and stable;
- no map navigation mutates simulation state.

### Fleets

Reference: `03`, `04`, `05`, `06`.

- fleet context/list belongs in the left rail;
- compose uses a clear staged flow rather than a wall of controls;
- step 1: fleet composition/ship selection;
- step 2: destination/mission/summary/confirmation;
- active/battle views keep current route semantics;
- catalogs and upgrades use consistent card/list/detail patterns.

### Operations

Reference: `07`, `13`, `17`, `18`, `19`.

- one operations owner route with explicit local modes;
- overview, market, events, arena and Solar War each get a dominant task surface;
- remaining current modes (`expeditions`, `objects`, `alliances`, `logistics`) use the same local-tab and detail pattern;
- operation tabs may wrap/compact at small widths but never become global tabs.

### Science

Reference: `08`.

- research tree/list is central;
- selected technology detail and requirements are right-context content;
- queue/progress is visible;
- category filters stay local to research.

### Command

Reference: `09`, with ship-upgrade presentation coordinated with `20` where relevant.

- overview, doctrine, fleet doctrine and upgrades remain local command modes;
- current game data and mechanics are unchanged;
- local tabs use one consistent active-state treatment.

### Reports

Reference: `10`.

Target three-part reading model when space permits:

```text
report filters/folders | report list | selected report reader
```

At compact widths this may collapse to list → reader navigation, but the selected report and return path must remain explicit.

### Ranking

Reference: `12`.

- ranking table/list is central;
- player/profile summary is a secondary context panel;
- ranking and profile must remain readable at release widths.

### Settings

Reference: `11`.

Canonical local sections:

- Graphics;
- Sound;
- Interface;
- Controls;
- Notifications;
- Campaign & Saves.

Existing settings/save behavior remains authoritative. This is a visual/navigation regrouping only.

## Visual system rules

- dark industrial sci-fi shell;
- restrained cyan active/accent states;
- gold reserved for campaign/commander/meta emphasis;
- strong thin borders and clipped/chamfered geometry may be used, but readability wins over decoration;
- cards/panels use consistent spacing, title hierarchy and selected states;
- no decorative effect may obscure text, keyboard focus or pointer targets;
- reduced-motion must disable or simplify non-essential movement;
- procedural CSS/canvas/SVG is allowed and preferred over blocking on missing decorative raster art.

## Responsive contract

Reference fidelity is primarily desktop, but Stellar release gates remain broader.

Required viewports:

- 1920×1080;
- 1672×941 reference baseline;
- 1366×768;
- 1024×768;
- 768×1024.

Desktop: preserve the full primary top row and contextual multi-column layout.

Compact/tablet: contextual rails may collapse or stack. The primary destinations must remain reachable in one deliberate action, local tabs remain distinguishable from primary destinations, and the document must not horizontally overflow.

## Asset policy

The reference HTML contains explicit paths to existing Stellar repository assets and also uses many CSS/canvas procedural visuals. Therefore:

1. use existing runtime assets first;
2. use CSS/SVG/canvas for non-critical decorative visuals where practical;
3. if a final illustration is missing, ship a procedural placeholder and record it in `docs/ui/reference-navigation-missing-assets.md`;
4. never silently copy an image from the reference bundle or an external source into runtime;
5. replacement art must have explicit provenance and an existing/extended runtime asset binding.

## Acceptance summary

The redesign is complete only when:

- all nine primary destinations use the canonical top navigation;
- the four current navigation groups are no longer rendered as the global shell;
- all 20 reference screens have a mapped and reachable Stellar state;
- navigation/history/reload/keyboard behavior stays correct;
- navigation does not mutate the state checksum;
- all supported viewports avoid page-level horizontal overflow and clipped essential actions;
- missing final art is either resolved or recorded with a procedural fallback;
- lint, typecheck, unit, build, asset audit, Browser E2E, accessibility and intentional visual baselines pass.
