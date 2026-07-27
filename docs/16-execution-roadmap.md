# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Audit PR #116 defines the next M4 implementation batch  
**Updated:** 2026-07-27  
**Current baseline:** merged PR #115, SHA `da1b3c943107ab13a003d5eb9bb084a229bdb51c`  
**Release target:** 1.0

## Authoritative roadmap

```text
docs/27-playable-game-roadmap-v5.md
```

The active audit-first implementation contract is:

```text
docs/audits/current-batch-audit.md
docs/audits/contracts/ordinary-missions-intelligence-01-prs.md
docs/audits/contracts/ordinary-missions-intelligence-01-rules.md
docs/audits/evidence/ordinary-missions-intelligence-01-graphify.md
```

The machine-readable PR sequence is:

```text
docs/roadmap-pr-index.json
```

## Reconciled delivered state

- #101–#105 completed catalog runtime-art integration;
- #106–#110 completed schema-v14 Universe navigation and action gates;
- #111–#115 completed the coherent full UI shell.

## Current audited sequence

Audit PR #116 defines medium batch `ORDINARY-MISSIONS-INTELLIGENCE-01`:

```text
#116 Audit ORDINARY-MISSIONS-INTELLIGENCE-01
→ #117 MISSION-RULES-REGISTRY
→ #118 ESPIONAGE-COUNTERINTELLIGENCE
→ #119 INTELLIGENCE-REPORTS-PRESENTATION
→ #120 MISSION-INTELLIGENCE-BOT-GATE
```

Implementation must not begin before #116 merges. Each implementation PR starts from fresh merged `main` and contains only its recorded work item.

## Why missions and intelligence are next

- stable shell routes now support a complete ordinary player loop;
- mission rules are duplicated across command, UI and bots;
- the Fleet composer bypasses redacted intelligence;
- flight-slot and sensor research already exist;
- bounded observations/alerts support deeper intelligence and reports without schema migration.

## Work intentionally deferred

- new mission kinds such as pirate raid, Space Trip or sun missions;
- planet destruction, abandonment and demolition;
- economy/logistics redesign;
- alliances and diplomacy;
- Solar Crystals, Obelisks, Gates and victory;
- schema migration, broad balance, mobile redesign or framework migration.

## Non-negotiable rules

- every implementation PR starts from fresh `main`;
- every coherent batch begins with an accepted Audit PR;
- reducer validation remains authoritative;
- player and bots use the same mission rules and information limits;
- no hidden foreign state reaches UI or bot perception;
- route/report presentation state stays outside `GameState`;
- lint, typecheck, full tests, production build, Browser E2E and Graphify are mandatory;
- `docs/25-solar-war-obelisks-gates-and-progression.md` remains authoritative for future endgame;
- confirmed historical references guide systemic depth, not copied content or automatic balance transfer.
