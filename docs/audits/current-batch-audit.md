# Current implementation batch audit

**Status:** draft Audit #152; implementation blocked  
**Updated:** 2026-08-02  
**Candidate batch:** `COMPLETE-ENDGAME-01`  
**Roadmap milestone:** M8 — Complete endgame  
**Complexity:** undecided  
**Audit PR:** #152 candidate  
**Baseline:** `73ed5536cb994a78fe7cdd45a41e0240901d7fe1`  
**Runtime baseline:** schema v17 / save format v4

## Previous batch closure

`PVE-META-FOUNDATION-01` is complete:

```text
#147 Audit                         50835aeb2864b96e026a7202ad419368e934e47b
→ #148 PVE-REPUTATION-FOUNDATION  430265b061764145e4e3ea1470d545f2ef82d0fa
→ #149 ARENA-PVE-CHALLENGES       42c484426e850b84263d4eecab63ebbb3eaafb05
→ #150 PVE-META-OPERATIONS-UX     39b85fe057d2cbf1fcff6b949a14bc62c7dbde63
→ #151 BOT-PVE-META-GATE          73ed5536cb994a78fe7cdd45a41e0240901d7fe1
```

The exact final #151 validation evidence is recorded in:

```text
docs/handoffs/2026-08-02-post-pve-meta-handoff.md
```

## Candidate audit purpose

Investigate the smallest coherent implementation sequence for a complete deterministic local-campaign endgame, potentially including:

- alliances or explicit solo participation;
- Solar War;
- Obelisks and final Gates;
- final-object construction and destruction;
- deterministic victory and defeat;
- endgame bot parity;
- terminal-state UI, reports, save/load and offline behavior.

This list is an investigation scope, not accepted implementation scope.

## Current classification

### VERIFIED

- M6b is merged and validated on `main`.
- Runtime baseline is schema v17/save v4.
- M7 bot parity is substantially delivered except endgame parity.
- M8 is marked not audited in the canonical roadmap.
- No implementation is authorized by this draft.

### UNKNOWN

- whether any alliance, Solar War, Obelisk, Gate, victory or defeat mechanics already exist;
- whether related catalog IDs/assets are mechanical or presentation-only;
- whether M8 requires schema/save migration;
- whether campaign terminal state belongs in `GameState`, runtime metadata or both;
- whether alliance mechanics and final victory safely fit one batch;
- exact bot visibility and command rules;
- exact UI route ownership;
- endgame partition and performance cost.

### DECISION

No batch size, implementation count, stable work-item sequence or schema change is decided until the unknowns above are resolved from current code, tests, Graphify and authoritative contracts.

## Required audit work

1. reconcile exact `main`, PRs #147–#151 and status documents;
2. inspect authoritative endgame/product contracts;
3. search current code and Graphify for alliance, diplomacy, Solar War, Obelisk, Gate, victory, defeat and terminal-state surfaces;
4. map persistence, reducer, campaign-time, autosave and migration impact;
5. map player commands, bot consumers, UI routes and reports;
6. verify catalog and asset reuse opportunities;
7. define deterministic direct/chunk/save/offline closure requirements;
8. retain permanent progression and performance limits;
9. decide whether M8 is heavy, medium or split across multiple audits;
10. write exact implementation contracts only after evidence is complete.

## Audit documents

```text
docs/audits/contracts/complete-endgame-01.md
docs/audits/evidence/complete-endgame-01.md
docs/handoffs/2026-08-02-post-pve-meta-handoff.md
```

## Permanent boundaries during audit

- documentation and project-scoped analysis only;
- no gameplay implementation;
- no schema/save change;
- no new commands/events/state;
- no alliance, endgame or bot behavior changes;
- no unrelated balance/catalog expansion;
- no weakening CI, Browser E2E, Graphify, progression or performance gates.

## Acceptance gate

Audit #152 may merge only after:

- critical unknowns are resolved;
- exact file maps and dependency flows are recorded;
- stable work-item IDs and implementation count are chosen;
- migration and compatibility impact are explicit;
- unit, integration, audit and Browser gates are defined;
- final audit documentation head passes CI, Browser E2E and Graphify;
- review is clean and mergeability is confirmed.

Until the audit merges, no implementation PR is authorized.
