# STRICT-REFERENCE-VISUAL-PARITY-V3 — corrective visual audit

**State:** docs-only Audit; implementation is blocked until this Audit merges  
**Baseline:** `main` at `466ec55f1751d36fd4a30175f7669f89ebe9a6a6` (PR #202 squash)  
**Reference:** owner-supplied `stellar_references_and_html.zip` and supplied comparison screenshots  
**Complexity:** heavy; two implementation PRs maximum

## Why this audit exists

The structural navigation batch delivered routing, shell and responsive foundations, but controller visual review found that the produced Planet screen is still materially different from the supplied reference. The gap is not a gameplay bug; it is a visual-parity failure.

The next implementation must therefore optimize for screenshot-level visual parity, not generic structural similarity.

## Locked product decisions

- target is as close to 1:1 as practical against each named reference screen;
- `01_planet_main.png` is the first corrective baseline and defines the shared shell language;
- remove **Hangar** from the default top resource strip;
- keep **Population** visible in the top resource strip;
- use procedural CSS/SVG/canvas/generated visuals whenever final art is missing;
- every missing final visual must be recorded with size/format/theme in `docs/ui/missing-visual-assets.md`;
- support three distinct race themes tied to existing factions `Aegis`, `Synod`, `Veyra`;
- race themes are not simple recolors: frame language, ornament, background treatment, active navigation and planet framing may differ;
- layout/information hierarchy remains shared across races;
- no simulation, formula, bot, schema, save or route-semantic changes.

## Long-lived contracts

- `docs/ui/reference-visual-parity-spec.md`
- `docs/ui/missing-visual-assets.md`
- `docs/ui/race-theme-token-spec.md`

## Work item 1 — VISUAL-V3-01-PLANET-STRICT-PARITY

Goal: make Planet overview + Resource / Industry / Military zones visually match refs `01`, `14`, `15`, `16` closely enough that the controller comparison reads as the same interface family and composition.

Required implementation:

1. rebuild top resource strip density; remove Hangar and keep Population;
2. recompose Planet left rail to match reference ordering/proportions;
3. make the central planet a true hero composition instead of a dashboard card;
4. make construction queue the dominant right-side block;
5. remove legacy/bulky panels absent from reference;
6. apply procedural planet/frame/background treatment where final art is unavailable;
7. implement theme-token binding for Aegis/Synod/Veyra without changing gameplay;
8. update missing asset ledger for every unresolved final image;
9. add intentional 1672×941 visual comparison gate for the Planet target.

Expected path envelope:

- `index.html`
- `src/ui/planetScreen.ts`
- `src/ui/globalHud.ts`
- `src/ui/globalHudViewModel.ts`
- `src/ui/shellContextPanel.ts`
- `src/styles/main.css`
- `src/styles/globalHud.css`
- `src/styles/planet.css`
- `src/styles/planetWorkspace.css`
- `src/styles/uiParityShellPlanet.css`
- `src/styles/uiParityPlanetCommandArt.css`
- `src/styles/uiParitySurfaceArt.css`
- `src/styles/uiParityPolish.css`
- new race-theme CSS/token module(s) under `src/styles/`
- focused Browser/visual tests
- `docs/ui/missing-visual-assets.md`

Acceptance:

- Hangar absent from default top strip;
- Population visible;
- reference block order/proportions reproduced;
- theme switches correctly with player faction;
- all three race themes render the same layout with distinct visual language;
- no horizontal/page overflow at 1672×941 and release viewports;
- navigation/game checksum unchanged by visual actions;
- screenshot comparison is controller-acceptable against refs `01/14/15/16`.

## Work item 2 — VISUAL-V3-02-ALL-ROUTES-STRICT-PARITY

Goal: propagate the accepted Planet visual language and race themes across refs `02–13` and `17–20`.

Ordered surfaces:

1. Universe;
2. Fleets;
3. Operations / Market / Solar War / Events / Arena;
4. Science;
5. Command;
6. Reports;
7. Ranking;
8. Settings;
9. Ship Upgrades;
10. final route-wide visual/responsive/accessibility/asset QA.

Expected path envelope is presentation-only and must stay within existing route-owned UI/style/test modules plus the three visual contract docs.

Acceptance:

- every reference ID has a named reachable Stellar state;
- visual composition is compared against that exact reference, not a generic style target;
- no legacy extra blocks remain by default unless explicitly justified;
- every unresolved art gap is ledgered with dimensions/theme;
- Aegis/Synod/Veyra theme binding covers shell, panels, nav active state, hero framing and contextual rails;
- all standard CI/Browser/accessibility/production-smoke gates pass.

## Non-goals

- gameplay/simulation changes;
- bot scheduler work;
- NEM-02 implementation;
- new save schema/migration;
- new route families;
- copied reference/Nemexia pixels/code;
- premium/monetization/social mechanics.

## Batch decision

Heavy, strictly sequential:

1. `VISUAL-V3-01-PLANET-STRICT-PARITY`
2. `VISUAL-V3-02-ALL-ROUTES-STRICT-PARITY`

Implementation begins only after this Audit merges. PR2 starts only from fresh `main` after PR1 merges and passes controller visual review.
