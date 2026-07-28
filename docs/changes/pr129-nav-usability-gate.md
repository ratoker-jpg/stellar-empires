# PR #129 — NAV-USABILITY-GATE

## Scope

Close Audit #125 `NAVIGATION-USABILITY-01` with measured player-task coverage instead of route-presence checks alone.

## Gate additions

- verifies all nine primary destinations are reachable and expose one canonical workspace;
- proves obsolete top-level dialogs and competing Operations launchers are absent;
- enforces the accepted action budgets for Research, Shipyard, Defence, Upgrades, Operations and remembered subroutes;
- confirms navigation-only actions remain simulation-checksum neutral;
- verifies keyboard activation, Back/Forward, reload and reduced-motion parity;
- validates the active workspace at 1366×768 and 1920×1080 without horizontal overflow;
- adds deterministic two-colony coverage proving an equivalent Planet task follows an active-colony switch.

## Existing combined evidence

The final gate composes with the Browser E2E delivered by #126–#128:

- grouped primary navigation and keyboard order;
- remembered subroutes, breadcrumbs, active colony and typed return context;
- reload-safe Space target preparation with explicit fleet-send confirmation;
- exact Space/report backlinks and reversible history;
- stale-context normalization and intelligence-safe target validation.

## Invariants

- schema v14 retained;
- no `GameState`, save-envelope, replay or checksum field added;
- no gameplay command, mission kind, formula or bot policy changed;
- `SEND_FLEET` remains an explicit player confirmation;
- no world speed, offline catch-up, progression balance, alliances or endgame implementation.
