# Current execution state

**Updated:** 2026-07-28  
**Safe to continue:** Audit PR #125, then implementation PR #126 only after audit merge

| Field | Current value |
|---|---|
| Last merged PR | #124 `LOCAL-CAMPAIGN-WORLD-SPEED-CONTRACT` · `cdd112c544ce8d37af17e938867d4588bedcf152` |
| Runtime baseline | PR #123 `PLANET-DESTRUCTION-RECOVERY-GATE` · `aa1dc67ed874c75aa69af30ce9ced58169793c30` |
| Canonical product contract | local PvE browser campaign, immutable world speed at creation, deterministic offline continuation, compressed one-day campaign direction |
| Active audit | #125 `NAVIGATION-USABILITY-01` |
| Audit baseline | exact post-#124 `main` · `cdd112c544ce8d37af17e938867d4588bedcf152` |
| Complexity | medium |
| Authorized implementation PRs after audit merge | #126, #127, #128, #129 |
| First work item | #126 `NAV-IA-PRIMARY-SHELL` |
| Active implementation PR | none |
| Persistence | schema v14; navigation context remains outside saves and checksums |
| Runtime/mechanics in Audit #125 | none |
| Exact next action | merge Audit #125 after documentation diff, CI, Browser E2E, Graphify and review; then create #126 from fresh merged `main` |

## Accepted sequence

```text
#126 NAV-IA-PRIMARY-SHELL
→ #127 NAV-CONTEXT-ROUTE-MODEL
→ #128 NAV-CROSS-DOMAIN-FLOWS
→ #129 NAV-USABILITY-GATE
```

## Recovery rule

Preserve all runtime behavior delivered through PR #123 and the product decision recorded by PR #124. Audit #125 authorizes navigation/presentation work only. Do not add campaign settings, world speed, offline catch-up, schema migration, progression compression, alliances or endgame in #126–#129.

After #129 closes, the next repository action must be Audit #130 `LOCAL-CAMPAIGN-TIME-PACING-01`.
