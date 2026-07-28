# PR #127 — route, colony and return context

**Work item:** `NAV-CONTEXT-ROUTE-MODEL`  
**Audit:** #125 `NAVIGATION-USABILITY-01`  
**Baseline:** `b934ce6b91aeca892b81c30afe2b38b46586d44e`

## Player-visible change

- returning to a primary family restores its last valid meaningful subroute;
- the active colony is restored through campaign-scoped session presentation memory;
- every workspace receives localized shared breadcrumbs;
- a distinct return action points back to the prior family when valid;
- stale colony, local-surface and family-mode context normalizes with a visible reason;
- direct URLs, browser Back/Forward and reload remain canonical.

## Storage boundary

Navigation memory is stored only in browser session presentation state, namespaced by schema version and campaign seed. It is not added to `GameState`, saves, replay, command/event logs or simulation checksums.

## Stable normalization codes

- `STALE_COLONY_CONTEXT`;
- `INVALID_LOCAL_SURFACE`;
- `INVALID_FAMILY_MODE`.

## Excluded

No prepared target/report task model, no cross-domain flow conversion, no gameplay command, save migration, world speed, offline catch-up, balance, alliances or endgame.
