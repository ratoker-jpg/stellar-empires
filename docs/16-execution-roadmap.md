# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Audit PR #121 defines the next M4 implementation batch  
**Updated:** 2026-07-28  
**Runtime baseline:** merged PR #120 · `c59a2dd7afdc31fc250d2ec21364f655d6a4e665`  
**Audit baseline:** post-#120 `main` · `818aba011199dd5a96518f859ed35de671be892f`  
**Release target:** 1.0

## Authoritative roadmap

```text
docs/27-playable-game-roadmap-v5.md
```

The active audit-first implementation contract is:

```text
docs/audits/current-batch-audit.md
docs/audits/contracts/planet-demolition-destruction-01-prs.md
docs/audits/contracts/planet-demolition-destruction-01-rules.md
docs/audits/evidence/planet-demolition-destruction-01-graphify.md
```

The machine-readable sequence is:

```text
docs/roadmap-pr-index.json
```

## Reconciled delivered state

- #101–#105 completed catalog runtime-art integration;
- #106–#110 completed schema-v14 Universe navigation and action gates;
- #111–#115 completed the coherent full UI shell;
- #116–#120 completed shared ordinary mission rules, espionage/counter-intelligence, routed reports and honest bot mission parity.

## Current audited sequence

Audit PR #121 defines heavy batch `PLANET-DEMOLITION-DESTRUCTION-01`:

```text
#121 Audit PLANET-DEMOLITION-DESTRUCTION-01
→ #122 PLANET-DEMOLITION-CONTRACT
→ #123 PLANET-DESTRUCTION-RECOVERY-GATE
```

Implementation must not begin before #121 merges. PR #123 must start only from fresh post-#122 `main`.

## Why planet destruction is next

- the ordinary attack/intelligence loop is now complete;
- all three factions already have planet-destroyer hulls and Commander effects;
- canonical demolition/destruction formulas are recorded in `docs/25-solar-war-obelisks-gates-and-progression.md`;
- runtime combat currently has no building demolition or colony removal;
- Audit #116 explicitly required a separate heavy audit because safe removal crosses fleets, queues, events, routes, reports, bots and persistence;
- completing this batch closes the destructive/recovery branch still listed under M4.

## Work intentionally deferred

- multi-colony economy/logistics redesign beyond deleting invalid endpoints;
- Sun Attack, Sun Support and system collapse/regeneration;
- alliances, Solar Crystals, Obelisks, Gates and victory;
- final-colony destruction or empire elimination;
- new mission kinds, broad balance, mobile redesign or framework migration.

## Non-negotiable rules

- every implementation PR starts from fresh `main`;
- existing ordinary `attack` remains the only entry point;
- reducer/combat validation remains authoritative;
- same state/sequence produces identical siege rolls and cleanup;
- the final colony cannot be destroyed;
- historical reports/intelligence keep coordinates without becoming active targets;
- no hidden foreign state reaches UI or bot planning;
- schema remains v14 unless a material audit divergence is recorded;
- lint, typecheck, full tests, production build, Browser E2E and Graphify are mandatory;
- `docs/25-solar-war-obelisks-gates-and-progression.md` remains authoritative for later endgame work.
