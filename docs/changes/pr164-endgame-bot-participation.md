# PR #164 — ENDGAME-BOT-PARTICIPATION

**Batch:** `COMPLETE-ENDGAME-03`  
**Exact baseline / PR #163 squash:** `46e0966c2843424d6e098e363327ffe5cf74d352`  
**Branch:** `agent/endgame-bot-participation`  
**Runtime:** schema v19 / save format v6 unchanged

## Scope

Add deterministic alliance/solo and Solar War participation planning through existing commands and the existing bot scheduler cadence.

- Aegis uses a stable public/open alliance policy.
- Synod joins an existing public alliance when available, otherwise can create its stable public alliance.
- Veyra remains solo.
- eligible bots enter the current Solar War only with an already-owned legal combat fleet via `ENTER_SOLAR_WAR`.
- the scheduler exposes `endgame` as an ordinary audited planner source only in `endgame-preparation` progression.
- terminal campaigns produce no endgame participation command.

## Release-gate blocker repair

Browser E2E exposed a live-resize race on `/reports/endgame`: after changing an already-mounted desktop page to the 390×844 release viewport, `data-viewport-mode` could remain `compact` for one animation frame. The higher-specificity compact layout therefore kept its 500px minimum topbar track long enough for the document to report 580px horizontal overflow.

The repair keeps viewport-mode derivation unchanged but applies it synchronously from the resize event instead of deferring it through `requestAnimationFrame`. Browser coverage now asserts the desktop-to-mobile transition itself (`data-viewport-mode="mobile"`) before checking the existing no-horizontal-overflow gate, and also verifies the same route after reload.

This does not change report content, route structure, simulation behavior, balance, persistence, or bot planning.

## Hard boundary

No direct qualification/score grant, no final-project start/funding, no Gate attack planning, no hidden foreign-state access, no new persistence, gameplay mechanic, balance, asset, catalog, route or combat engine.
