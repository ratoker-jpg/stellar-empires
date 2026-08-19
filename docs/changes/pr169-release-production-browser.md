# PR #169 — Release production browser proof

Baseline: `bd6f0302ef55f0d8f68c6fa619ecd1e07540aa9a` (PR #168 squash / fresh `main`).

This PR adds no gameplay or persistence mechanic. It adds a dedicated production-build Playwright smoke alongside the existing broad dev-server Browser suite.

The new smoke:

- runs the normal Vite production build with base `/stellar-empires/`;
- serves `dist` through Vite preview rather than source/dev middleware;
- opens the real new-game dialog with no `VITE_E2E` state injection;
- verifies a production faction asset loads and is browser-decodable;
- creates a real compact x10 Aegis campaign;
- navigates to System/Saves, creates manual slot `manual-1`, loads it into autosave and survives the resulting reload;
- navigates to Reports and survives another reload under the production base;
- fails on any observed `/stellar-empires/` 404;
- retains a separate `playwright-production-report` artifact in CI.

## Release blocker found by the production smoke

The first strict production run exposed a real showcase-asset defect that the dev-server suite did not prove: faction `hero.webp`, `emblem.webp` and `background.webp` URLs returned HTTP 200 but the checked-in files were tiny invalid WebP placeholders, so Chromium could not decode them (`naturalWidth === 0`).

The correction does not add or regenerate art. `factionRuntimeAssets` now reuses the repository's existing canonical `GENERATED_FACTION_IDENTITY_ASSETS` bridge, which lets Vite emit the valid PNG identity art already stored under `assets/source/generated-factions-v1/factions/`. Mechanical atlases, control sets and procedural fallbacks remain on the existing runtime registry. Unit coverage locks this binding, and the production smoke remains strict rather than accepting a 200 response for an undecodable image.

Runtime remains state schema v19 / save format v6.
