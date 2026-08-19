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

Browser E2E on the original bot-only candidate head reproduced the same mobile `/reports/endgame` document overflow twice: a 520px combat table caused its `<details>` grid item to retain intrinsic minimum width, expanding the 390px viewport document to 580px. The repair is intentionally presentation-only: the details element now has `width: 100%` and `min-width: 0`, preserving the table's existing internal horizontal scroller without allowing it to widen the page.

This does not change report content, route structure, simulation behavior, balance, persistence, or bot planning.

## Hard boundary

No direct qualification/score grant, no final-project start/funding, no Gate attack planning, no hidden foreign-state access, no new persistence, gameplay mechanic, balance, asset, catalog, route or combat engine.
