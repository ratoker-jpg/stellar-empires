# Strict Reference Visual Parity Contract

**Batch:** `STRICT-REFERENCE-VISUAL-PARITY-V3`  
**Baseline:** `main` at `466ec55f1751d36fd4a30175f7669f89ebe9a6a6`  
**Source of truth:** owner-supplied reference screenshots/HTML from `stellar_references_and_html.zip`  
**Goal:** reproduce the supplied references as closely as practical screen-by-screen, not merely reuse their information architecture.

## Acceptance rule

A screen is accepted only when all of the following are true:

1. visible composition matches the corresponding reference;
2. block set matches the reference unless gameplay requires an explicitly documented addition;
3. proportions, spacing, density and hierarchy are close to the reference;
4. color, borders, glow, typography and background treatment belong to the correct race theme;
5. there are no legacy Stellar blocks that are absent from the reference;
6. missing artwork is replaced by a stable procedural CSS/SVG/canvas fallback;
7. every unresolved artwork gap is recorded in `docs/ui/missing-visual-assets.md` with dimensions and theme ownership;
8. comparison is done against the exact reference ID, not against a generic notion of similarity.

The previous `REFERENCE-NAVIGATION-REDESIGN-V2` batch is treated as structural groundwork only. It does not satisfy strict visual parity by itself.

## Shared shell contract

Desktop target:

```text
logo | nine primary tabs | compact campaign/time context
-------------------------------------------------------
planet/faction context | compact resource strip | status
-------------------------------------------------------
left contextual rail | dominant reference task | right queue/detail/actions
```

Primary navigation order remains:

`Планета → Вселенная → Флоты → Операции → Наука → Командование → Отчёты → Рейтинг → Настройки`

### Top resource strip

Keep the reference-style compact resource presentation.

Required visible values:

- Metal;
- Minerals/Crystal according to existing Stellar naming;
- Gas;
- Energy;
- **Population**.

Explicit correction:

- **remove the Hangar card/value from the default top resource strip**;
- Hangar remains available only in the local gameplay surface where it is actually relevant.

## Race-theme architecture

Stellar has three runtime factions and therefore strict parity must support three independent theme layers:

- `Aegis`;
- `Synod`;
- `Veyra`.

The layout contract is shared. Race themes may change:

- panel frame language;
- accent colors and glow;
- background texture/pattern;
- navigation ornament;
- icon treatment;
- queue/detail-card ornament;
- planet-frame treatment;
- faction emblems and decorative motifs.

Race theming must not change route semantics, gameplay state or information hierarchy.

Detailed tokens live in `docs/ui/race-theme-token-spec.md`.

## Screen mapping and strict targets

| Ref | Surface | Required strict-parity focus |
| --- | --- | --- |
| `01_planet_main.png` | Planet overview | hero planet, left rail, planet list/passport, right construction queue, compact top strip |
| `02_universe.png` | Universe | dominant star map, sparse controls, selection/detail placement |
| `03_fleets_sidebar_reference.png` | Fleet left context | fleet/task sidebar proportions and density |
| `04_fleets_send_step2.png` | Fleet send step 2 | destination/mission/summary/confirmation composition |
| `05_fleets_create_step1.png` | Fleet compose step 1 | ship selection/composition composition |
| `06_fleets_catalog.png` | Fleet catalog | catalog/card/list/detail visual hierarchy |
| `07_operations.png` | Operations | overview composition |
| `08_science.png` | Science | category/list/detail/queue arrangement |
| `09_command.png` | Command | command overview hierarchy |
| `10_reports.png` | Reports | list + reader/master-detail structure |
| `11_settings.png` | Settings | local categories + detail panel |
| `12_rating.png` | Ranking | ranking focus + secondary profile block |
| `13_market.png` | Market | market local mode composition |
| `14_resource_zone.png` | Resource zone | resource-zone building/catalog layout |
| `15_industrial_zone.png` | Industrial zone | industry building/catalog layout |
| `16_military_zone.png` | Military zone | military building/catalog layout |
| `17_solar_war.png` | Solar War | hero/event composition and action hierarchy |
| `18_events.png` | Events | event cards/hero composition |
| `19_arena.png` | Arena | arena hierarchy and status/action layout |
| `20_ship_upgrades.png` | Ship upgrades | upgrade list/detail/progression composition |

## Planet overview — first corrective target

`01_planet_main.png` is the first acceptance baseline and defines the shared shell language.

Required corrections from current `main`:

- remove top-strip Hangar;
- keep Population;
- shrink and simplify top navigation/resources to reference density;
- left rail must visually match the reference order: planet visual/context → three zone actions → current planet selector/list → passport;
- central planet becomes the dominant hero element, with title/system subtitle/status positioned like the reference;
- right column is dominated by the construction queue and its management action;
- remove legacy/bulky panels that are not present in the reference;
- reduce rectangular dashboard feel and use thinner sci-fi framing;
- use a procedural planet/space treatment until final theme art exists.

## Procedural fallback policy

Allowed:

- CSS gradients/noise;
- SVG rings, frames and technical ornaments;
- canvas star fields/orbit overlays;
- procedural planet lighting/glow;
- generated faction-neutral/faction-themed placeholders.

A procedural fallback must be deterministic enough for Browser visual regression and must not obscure text/focus.

## Strict visual review gate

Every implementation PR under this contract must include at least one intentional reference-comparison check at `1672×941` plus normal release viewports.

Merge is not allowed merely because:

- routes work;
- blocks exist;
- responsive tests are green.

The controller must be able to compare the produced screen to its named reference and see the same composition and visual language.

## Non-goals

- no simulation/formula/balance changes;
- no save schema/migration changes;
- no copied third-party pixels/code;
- no new route solely to imitate a screenshot;
- no race gameplay bonuses as part of theming;
- no hiding missing final art: every gap goes into the asset ledger.
