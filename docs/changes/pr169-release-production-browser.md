# PR #169 — Release production browser proof

Baseline: `bd6f0302ef55f0d8f68c6fa619ecd1e07540aa9a` (PR #168 squash / fresh `main`).

This PR adds no gameplay or persistence mechanic. It adds a dedicated production-build Playwright smoke alongside the existing broad dev-server Browser suite.

The new smoke:

- runs the normal Vite production build with base `/stellar-empires/`;
- serves `dist` through Vite preview rather than source/dev middleware;
- opens the real new-game dialog with no `VITE_E2E` state injection;
- verifies a production faction asset loads;
- creates a real compact x10 Aegis campaign;
- navigates to System/Saves, creates manual slot `manual-1`, loads it into autosave and survives the resulting reload;
- navigates to Reports and survives another reload under the production base;
- fails on any observed `/stellar-empires/` 404;
- retains a separate `playwright-production-report` artifact in CI.

Runtime remains state schema v19 / save format v6.
