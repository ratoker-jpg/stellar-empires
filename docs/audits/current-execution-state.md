# Current execution state

**Updated:** 2026-07-28  
**Safe to continue:** implementation PR #126 only

| Field | Current value |
|---|---|
| Last merged PR | Audit #125 `NAVIGATION-USABILITY-01` · `a13f017d79d5dce5fde954e9f6e1419a2182d78e` |
| Runtime baseline | PR #123 `PLANET-DESTRUCTION-RECOVERY-GATE` · `aa1dc67ed874c75aa69af30ce9ced58169793c30` |
| Canonical product contract | PR #124 · local PvE browser campaign, immutable world speed at creation, deterministic offline continuation, compressed one-day campaign direction |
| Accepted audit | #125 `NAVIGATION-USABILITY-01` |
| Audit baseline | exact post-#124 `main` · `cdd112c544ce8d37af17e938867d4588bedcf152` |
| Audit merge | `a13f017d79d5dce5fde954e9f6e1419a2182d78e` |
| Validation | CI `30363687162`, Browser E2E `30363686476`, Graphify `30363686266` — passed |
| Complexity | medium |
| Authorized implementation PRs | #126, #127, #128, #129 |
| Current work item | #126 `NAV-IA-PRIMARY-SHELL` |
| Active implementation PR | none |
| Persistence | schema v14; navigation context remains outside saves and checksums |
| Exact next action | create #126 from fresh merged `main` and implement only `NAV-IA-PRIMARY-SHELL` |

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
