# Current execution state

**Updated:** 2026-07-28  
**Safe to continue:** documentation PR #124, then Audit PR #125 only

| Field | Current value |
|---|---|
| Last merged runtime PR | #123 `PLANET-DESTRUCTION-RECOVERY-GATE` · `aa1dc67ed874c75aa69af30ce9ced58169793c30` |
| Runtime baseline | PR #123 · `aa1dc67ed874c75aa69af30ce9ced58169793c30` |
| Completed batch | `PLANET-DEMOLITION-DESTRUCTION-01` |
| Active documentation PR | #124 `LOCAL-CAMPAIGN-WORLD-SPEED-CONTRACT` |
| Active implementation PR | none |
| Persistence | schema v14; no migration in PR #124 |
| Product decision | local PvE browser campaign; immutable world-speed preset at campaign creation; deterministic offline catch-up; bots/alliances/endgame continue through ordinary simulation rules; compressed one-day campaign direction |
| Validation boundary | PR #124 is documentation/status only; no runtime, balance, schema or command change |
| Divergence | owner explicitly inserted a product-contract PR before the previously expected next audit; implementation remains blocked |
| Exact next action | merge documentation PR #124 after diff/check review, then create fresh Audit PR #125 from merged `main` |

## Recovery rule

The destructive ordinary-attack branch remains complete and archived at `docs/audits/completed/planet-demolition-destruction-01.md`. Preserve schema v14, final-colony protection, historical report coordinates and special-mission historical `originPlanetId`.

PR #124 records the canonical campaign-runtime direction in `docs/25a-local-campaign-world-speed-and-offline-progression.md`. It authorizes no implementation. Audit PR #125 must rebaseline the roadmap around this decision, audit navigation/usability first and authorize only a bounded navigation implementation batch. Campaign settings, offline catch-up and progression compression require a later separate audit after navigation closure.
