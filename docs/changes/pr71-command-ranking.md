# PR #71 — Command profile, local ranking and faction polish

## Delivered

- Deterministic local ranking for every empire in the current save.
- Score derived from colonies, resources, production, buildings, research, units, fleets and victories.
- Player command profile with rank, doctrine and detailed progression metrics.
- Alternative generated faction hero, emblem and card-background assets used only by this screen.
- Rating navigation enabled without adding persistent ranking state.
- Regression tests for deterministic ordering, complete empire coverage and economy-driven rank changes.

## Boundaries

- No schema migration or stored score field.
- The ranking is a local single-player comparison, not an online leaderboard.
- Mechanical faction asymmetry remains scheduled for later content PRs.
