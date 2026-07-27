# AI Continuation Guide

**Status:** PR #118 completes `ESPIONAGE-COUNTERINTELLIGENCE` on merge  
**Updated:** 2026-07-27  
**Current batch:** `ORDINARY-MISSIONS-INTELLIGENCE-01` · Audit #116  
**Next implementation after #118 merge:** #119 `INTELLIGENCE-REPORTS-PRESENTATION`

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
- #118: deterministic scout composition, intelligence tiers, cooldown, detection, probe loss and defender alerts.

## PR #118 result

The existing `scout` mission now has a complete deterministic contract:

- exactly one scout-role ship and zero cargo;
- observer strength uses existing sensor research plus the probe baseline;
- counter-strength uses defender sensor research plus target sensor-grid level;
- relative strength produces level-1 identity, level-2 economy/buildings or level-3 defense/fleet intelligence;
- cooldown derives from saved observation history and opens on its exact boundary;
- detection is seeded by game seed, event sequence, fleet ID and target ID;
- detected probes preserve the observation, create a bounded defender alert, are removed and do not return;
- undetected probes follow the existing return lifecycle;
- schema remains v14 with no new persisted field or migration.

## Remaining accepted chain

```text
#119 INTELLIGENCE-REPORTS-PRESENTATION
→ #120 MISSION-INTELLIGENCE-BOT-GATE
```

## Next work item

PR #119 may derive and route intelligence reports and incoming-flight presentation from existing observations, alerts and fleet state. It must preserve redaction and must not add persisted report state.

## Invariants

- no new mission enum values or command family;
- no schema migration;
- reducer remains authoritative;
- player and bots consume shared selectors and validators;
- route/report state remains outside `GameState`;
- reports derive from bounded observations and alerts;
- no hidden foreign owner/composition data;
- every implementation PR starts from fresh merged `main`.

## Explicit exclusions

Planet destruction/recovery, economy/logistics redesign, pirate raid, Space Trip, alliances, solar war, Obelisks, Gates, victory, broad balance and mobile redesign remain for later audits.

## Immediate route

After #118 merges, create only PR #119 from fresh post-#118 `main`. Do not start #120 and do not expand #119 beyond `INTELLIGENCE-REPORTS-PRESENTATION`.
