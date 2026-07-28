# Current execution state

**Updated:** 2026-07-28  
**Safe to continue:** implementation PR #126 only

| Field | Current value |
|---|---|
| Last merged PR | Audit #125 `NAVIGATION-USABILITY-01` · `a13f017d79d5dce5fde954e9f6e1419a2182d78e` |
| Runtime baseline | PR #123 `PLANET-DESTRUCTION-RECOVERY-GATE` · `aa1dc67ed874c75aa69af30ce9ced58169793c30` |
| Accepted audit | #125 `NAVIGATION-USABILITY-01` |
| Active implementation PR | #126 `NAV-IA-PRIMARY-SHELL` |
| Branch baseline | exact current `main` · `7ef156160321104cfbcebc803a9b811a04890f02` |
| Scope | grouped primary gameplay, development, information/history and utility navigation; Operations promoted; Space relabeled for Universe scope |
| Persistence | schema v14; navigation remains outside saves and checksums |
| Runtime/mechanics | unchanged |
| Validation required | assets, lint, TypeScript, full tests, build, Chromium Browser E2E and Graphify |
| Exact next action | complete and merge #126; then create #127 `NAV-CONTEXT-ROUTE-MODEL` from fresh merged `main` |

## Accepted sequence

```text
#126 NAV-IA-PRIMARY-SHELL
→ #127 NAV-CONTEXT-ROUTE-MODEL
→ #128 NAV-CROSS-DOMAIN-FLOWS
→ #129 NAV-USABILITY-GATE
```

## Recovery rule

PR #126 may change only the primary navigation hierarchy and related presentation/tests. Preserve route-family IDs, direct URLs, keyboard activation, schema v14, simulation checksums, gameplay commands, intelligence redaction and explicit fleet confirmation.

Do not add remembered subroutes, shared return context, world speed, offline catch-up, progression compression, alliances or endgame in #126.
