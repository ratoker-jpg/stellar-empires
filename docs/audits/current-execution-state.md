# Current execution state

**Updated:** 2026-07-28  
**Safe to continue:** implementation PR #127 only

| Field | Current value |
|---|---|
| Last merged PR | #126 `NAV-IA-PRIMARY-SHELL` · `2a9ebcbbe42c67f76f0c78dee9ed431555c9afd1` |
| Runtime baseline | PR #126 · `2a9ebcbbe42c67f76f0c78dee9ed431555c9afd1` |
| Accepted audit | #125 `NAVIGATION-USABILITY-01` |
| Completed implementation PRs | #126 · `2a9ebcbbe42c67f76f0c78dee9ed431555c9afd1` |
| Active implementation PR | #127 `NAV-CONTEXT-ROUTE-MODEL` |
| Branch baseline | exact current `main` · `b934ce6b91aeca892b81c30afe2b38b46586d44e` |
| Scope | campaign-scoped session route memory, active-colony context, localized breadcrumbs, typed return destination and stale-context normalization |
| Persistence | schema v14; navigation context remains outside GameState, saves and simulation checksums |
| Runtime/mechanics | unchanged |
| Validation required | assets, lint, TypeScript, full tests, build, Chromium Browser E2E and Graphify |
| Exact next action | complete and merge #127; then create #128 `NAV-CROSS-DOMAIN-FLOWS` from fresh merged `main` |

## Accepted sequence

```text
#126 NAV-IA-PRIMARY-SHELL — merged
→ #127 NAV-CONTEXT-ROUTE-MODEL
→ #128 NAV-CROSS-DOMAIN-FLOWS
→ #129 NAV-USABILITY-GATE
```

## Recovery rule

Preserve the grouped primary navigation from #126, route-family IDs, canonical direct URLs, keyboard activation, schema v14, simulation checksum neutrality, intelligence redaction and explicit fleet confirmation.

PR #127 may implement only application/session route memory, shared hierarchy, active-colony context, return destinations and safe normalization. Do not convert prepared fleet/report/operation workflows assigned to #128 and do not add world speed, offline catch-up, progression compression, alliances or endgame.
