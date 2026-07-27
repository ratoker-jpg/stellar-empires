# AI Continuation Guide

**Status:** PR #119 `INTELLIGENCE-REPORTS-PRESENTATION` merged · `e297f77f8e994f37402090a8d9d7c70e28ce099f`  
**Updated:** 2026-07-27  
**Current batch:** `ORDINARY-MISSIONS-INTELLIGENCE-01` · Audit #116  
**Next implementation:** #120 `MISSION-INTELLIGENCE-BOT-GATE`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

GitHub history and current `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/ordinary-missions-intelligence-01-prs.md`
6. `docs/audits/contracts/ordinary-missions-intelligence-01-rules.md`
7. `docs/audits/evidence/ordinary-missions-intelligence-01-graphify.md`
8. this document
9. `docs/project-status.json`
10. `docs/27-playable-game-roadmap-v5.md`
11. latest merged pull requests and actual `main`

## Completed product state

- #101–#105: catalog runtime art;
- #106–#110: schema-v14 Universe navigation and action gate;
- #111–#115: coherent nine-route application shell, persistent HUD/context and full Browser E2E;
- #116: accepted `ORDINARY-MISSIONS-INTELLIGENCE-01`;
- #117: shared ordinary mission rules, flight slots, redacted Fleet targets and attack-intelligence gate;
- #118: deterministic scout composition, intelligence tiers, cooldown, detection, probe loss and defender alerts;
- #119: derived intelligence reports, exact map backlinks and redacted incoming-flight presentation.

## PR #119 result

The existing intelligence state now has a complete routed presentation without adding save state:

- `#/reports/intelligence` parses, serializes, reloads and participates in browser history;
- observations and defender alerts become derived `intelligence` reports;
- freshness and detection/loss state are calculated at view time;
- exact report coordinates open the canonical solar-system route;
- only reports owned by the player appear in the player intelligence view;
- incoming-flight visibility follows sensor thresholds 0–4, 5–9 and 10+;
- current level-three intelligence on the source promotes the contact to full mission/composition visibility;
- cargo is never part of the incoming-contact model;
- route/filter/HUD/context presentation remains checksum-neutral;
- schema remains v14 with no new command, mission kind or persisted field.

## Remaining accepted chain

```text
#120 MISSION-INTELLIGENCE-BOT-GATE
```

## Next work item

PR #120 must close the batch through the accepted combined mission/intelligence/bot parity gate. It may test and align bot decisions against the shared redacted mission and intelligence selectors, but it must not introduce a new unaudited mechanic.

## Invariants

- no new mission enum values or command family;
- no schema migration;
- reducer remains authoritative;
- player and bots consume shared selectors and validators;
- route/report state remains outside `GameState`;
- reports derive from bounded observations and alerts;
- incoming cargo and unknown foreign details remain hidden;
- every implementation PR starts from fresh merged `main`.

## Explicit exclusions

Planet destruction/recovery, economy/logistics redesign, pirate raid, Space Trip, alliances, solar war, Obelisks, Gates, victory, broad balance and mobile redesign remain for later audits.

## Immediate route

Create only PR #120 from fresh post-#119 `main`. Do not begin any unaudited batch before #120 closes `ORDINARY-MISSIONS-INTELLIGENCE-01`.