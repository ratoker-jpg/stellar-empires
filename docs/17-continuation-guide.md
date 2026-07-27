# AI Continuation Guide

**Status:** Audit PR #116 defines `ORDINARY-MISSIONS-INTELLIGENCE-01`  
**Updated:** 2026-07-27  
**Last completed batch:** `COHERENT-UI-SHELL-01` · #111–#115  
**Active Audit:** #116 — accepted when merged  
**Next implementation after audit merge:** #117 `MISSION-RULES-REGISTRY`

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
- #111–#115: one coherent nine-route application shell, persistent HUD/context and full Browser E2E.

## Current audited problem

The ordinary mission loop is implemented but inconsistent across consumers:

- `sendFleet()` owns command checks;
- Fleet UI separately enumerates missions and raw targets;
- bot planner separately chooses/validates missions;
- flight-slot research is not enforced;
- scout intelligence has no cooldown/probe-loss/report route;
- Fleet composer can show foreign owner IDs that Space intelligence correctly redacts.

## Accepted implementation chain

```text
#116 Audit ORDINARY-MISSIONS-INTELLIGENCE-01
→ #117 MISSION-RULES-REGISTRY
→ #118 ESPIONAGE-COUNTERINTELLIGENCE
→ #119 INTELLIGENCE-REPORTS-PRESENTATION
→ #120 MISSION-INTELLIGENCE-BOT-GATE
```

## Batch outcome

After #120:

- six existing ordinary missions share one availability/reason contract;
- flight slots are enforced using the existing research effect;
- attack requires current full intelligence;
- scouting has deterministic tier, cooldown, detection and probe loss;
- incoming fleets and intelligence reports are redacted and routed;
- bots use the same allowed information and mission rules;
- save schema remains v14.

## Invariants

- no new mission enum values or command family;
- no schema migration;
- reducer remains authoritative;
- player and bots use shared selectors/validators;
- specialized Expedition and Space Object commands remain separate;
- route/report filters remain outside `GameState`;
- reports derive from bounded observations/alerts;
- no hidden foreign owner/composition data;
- every implementation PR starts from fresh merged `main`.

## Explicit exclusions

Planet destruction/recovery, economy/logistics redesign, pirate raid, Space Trip, alliances, solar war, Obelisks, Gates, victory, broad balance and mobile redesign remain for later audits.

## Immediate route

While #116 is open: finish and merge the documentation-only audit. After merge: create only PR #117 from fresh post-#116 `main`. Do not start #118 until #117 merges and do not add work outside `MISSION-RULES-REGISTRY`.
