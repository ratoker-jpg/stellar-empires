# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Release 1.0 closed; fresh post-#181 product Audit active  
**Updated:** 2026-08-23  
**Verified current main:** `a1249615d55e9ffebc60889c3ab4d5ff72d8933d`  
**Last merged PR:** #181 `POST-1.0-PR3-BOT-OUTCOME-ADAPTATION-GATE`  
**Runtime:** schema v19 / save format v6 / migration none  
**Implementation authorized:** false

## Authoritative files

```text
AGENTS.md
docs/28-audit-first-autonomous-delivery-protocol.md
docs/audits/current-batch-audit.md
docs/audits/current-execution-state.md
docs/audits/batch-history.md
docs/project-status.json
docs/roadmap-pr-index.json
docs/17-continuation-guide.md
```

Actual GitHub state wins over stale prose.

## Completed boundary

`POST-1.0-BOT-STRATEGY-DIFFERENTIATION` is complete:

```text
Audit #178 → 4b96d457fad1577a0663210864381a0d3a33cb77
#179 → 7620975e1cd604c8bcdce0bac748e32e276061db
#180 → f0cfcb7d2944b8380cf8b3157ae1570bbbbb17cd
#181 → a1249615d55e9ffebc60889c3ab4d5ff72d8933d
```

No PR4 exists from that batch.

## Current entrypoint

Only a fresh docs-only Audit is active:

`POST-1.0-NEXT-PRODUCT-2`

Branch:

`audit/post-1.0-next-product-2`

Starting main:

`a1249615d55e9ffebc60889c3ab4d5ff72d8933d`

The Audit does not automatically continue the old backlog. It re-verified current runtime/tests with pinned Graphify 0.8.38 plus direct source inspection.

## Fresh decision

Proposed next coherent batch, still **not authorized**:

`POST-1.0-STRATEGIC-FEEDBACK-TRUTH`

Exact proposal:

1. `POST-1.0-PR1-ARENA-COMBAT-IDENTITY-TRUTH`;
2. `POST-1.0-PR2-UNIFIED-COMBAT-FEEDBACK`;
3. `POST-1.0-PR3-COMBAT-RANKING-TRUTH`.

Why this is the current proposal:

- Arena retains a direct full-fleet-identity correctness exception;
- Arena is missing from the canonical unified report stream;
- tactical choices already change combat but are not historically observable in reports;
- player-visible ranking `Победы` counts generic successful operations and omits Arena;
- these are direct-source verified and share one coherent feedback/scoring data flow;
- no new speculative subsystem is required.

Full per-PR contract is binding only in:

`docs/audits/current-batch-audit.md`

## Research-only, not current implementation

- achievements / extra score layers;
- moving-object trajectory/lifecycle gameplay;
- Bank/credit semantics;
- additional bot differentiation.

Do not turn these into work merely because they exist in Nemexia or old roadmap prose.

## Critical UNKNOWN state

```text
criticalUnknownsResolved = true
criticalUnknowns = []
```

Audit decisions already resolve:

- legacy Arena active-entry seed compatibility;
- immutable historical doctrine snapshot authority;
- Arena report taxonomy (`battle` / `pve`);
- schema v19 / save v6 / migration none;
- combat-only meaning of ranking victories.

## Permanent boundaries

- no implementation branch while the Audit is unmerged;
- no guessed Nemexia formula;
- no Bank/credit subsystem from a producer-only field;
- no current-state inference for historical doctrine;
- ordinary commands/reducer validation remain authoritative;
- no hidden foreign-state bot access;
- every implementation successor starts from fresh merged `main` after controller approval.

## Current delivery sequence

```text
fresh research from a1249615...
→ docs-only Audit PR
→ exact-head CI + Graphify + Browser/smoke
→ verify main unchanged + unresolved threads=0 + mergeable=true
→ mark Audit Ready
→ STOP for controller review
```

Audit readiness does not authorize implementation.

## Next action

Finish only the current docs-only Audit, synchronize its assigned PR number into the control plane, require final exact-head gates, mark Ready and STOP.

**Do not merge the Audit. Do not create PR1. Do not implement the proposed batch.**