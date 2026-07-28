# PR #125 — navigation and usability audit

## Decision

Accept medium batch `NAVIGATION-USABILITY-01` from exact post-PR #124 `main` at `cdd112c544ce8d37af17e938867d4588bedcf152`.

## Verified problem

The current shell has canonical routes, browser history, keyboard support and release-viewport coverage, but those checks prove technical routing rather than convenient play.

The audit confirmed:

- nine top-level route families compete with similar visual weight;
- Operations is incorrectly classified as utility despite owning frequent gameplay;
- family buttons usually return to generic overview/default destinations;
- only Planet encodes colony context while other colony-sensitive workspaces use implicit active state;
- Space has breadcrumbs, but the wider shell has no common hierarchy/return model;
- target preparation relies on window events and local workspace memory;
- existing E2E does not measure task length, source restoration or context loss.

## Authorized sequence

```text
#126 NAV-IA-PRIMARY-SHELL
→ #127 NAV-CONTEXT-ROUTE-MODEL
→ #128 NAV-CROSS-DOMAIN-FLOWS
→ #129 NAV-USABILITY-GATE
```

## Product relationship

PR #124 established the local-campaign world-speed/offline-progression direction. This audit does not implement that time model. It prioritizes navigation first so the current game is understandable before campaign settings, offline summaries and more systems are added.

After #129 closes, the next allowed action is Audit #130 `LOCAL-CAMPAIGN-TIME-PACING-01`.

## Boundary

Documentation/status only. No runtime, route implementation, schema, commands, mechanics, balance, world speed, offline catch-up, alliances or endgame are changed in PR #125.
