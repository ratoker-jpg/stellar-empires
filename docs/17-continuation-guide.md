# AI Continuation Guide

**Status:** PR #117 completes `MISSION-RULES-REGISTRY` on merge  
**Updated:** 2026-07-27  
**Current batch:** `ORDINARY-MISSIONS-INTELLIGENCE-01` · Audit #116  
**Next implementation after #117 merge:** #118 `ESPIONAGE-COUNTERINTELLIGENCE`

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
- #117: shared ordinary mission rules, flight-slot enforcement, redacted Fleet targets and attack-intelligence precondition.

## PR #117 result

`src/simulation/fleets/missionRules.ts` is the source of truth for existing ordinary missions:

```text
transport
 deploy
 scout
 attack
 recycle
 colonize
```

The shared preflight returns stable availability codes, messages, route/fuel estimates, slot usage and a redacted target presentation. It is consumed by:

- authoritative `sendFleet()` dispatch;
- Fleet composer target enumeration and route preview;
- bot fleet mission preflight.

Core rules now active:

- flight capacity is `max(1, 1 + researchEffects.flightSlots)`;
- every non-stationed fleet consumes one slot;
- attack requires current level-three intelligence;
- unknown foreign contacts do not expose owner or faction through Fleet UI;
- specialized Expedition and Space Object commands remain separate;
- state schema remains v14.

## Remaining accepted chain

```text
#118 ESPIONAGE-COUNTERINTELLIGENCE
→ #119 INTELLIGENCE-REPORTS-PRESENTATION
→ #120 MISSION-INTELLIGENCE-BOT-GATE
```

## Next work item

PR #118 completes the existing scout mission contract without introducing a new command or mission kind:

- exactly one scout-role ship and zero cargo;
- deterministic observer-versus-defender intelligence tier;
- derived cooldown from saved state;
- deterministic detection and probe loss;
- defender alert;
- no new persisted field or migration.

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

After #117 merges, create only PR #118 from fresh post-#117 `main`. Do not start #119 and do not expand #118 beyond `ESPIONAGE-COUNTERINTELLIGENCE`.
