# Draft contract — COMPLETE-ENDGAME-01

**Status:** audit scaffold; not accepted  
**Audit PR:** #152 candidate  
**Baseline:** `73ed5536cb994a78fe7cdd45a41e0240901d7fe1`  
**Roadmap milestone:** M8 — Complete endgame  
**Runtime baseline:** schema v17 / save format v4  
**Implementation authorized:** no

## Purpose

Determine the smallest coherent and safe implementation sequence that can take the current deterministic local PvE campaign from completed bounded PvE/meta systems to a real endgame with alliances or explicit solo play, Solar War participation, final strategic structures and deterministic victory/defeat.

This document is intentionally incomplete until direct source, Graphify, tests, catalogs, assets, UI and save semantics have been reconciled.

## Required audit classification

Every finding added during Audit #152 must be marked as one of:

```text
VERIFIED
INFERRED
UNKNOWN
DECISION
```

Critical `UNKNOWN` items must be resolved before the audit merges.

## Current verified baseline

- PR #151 is merged as `73ed5536cb994a78fe7cdd45a41e0240901d7fe1`.
- Runtime schema is v17 and save format is v4.
- M6b reputation, local Arena, Operations UX and honest bot participation are delivered.
- The canonical roadmap marks M8 as not audited.
- No implementation PR is authorized by this scaffold.

## Audit questions that must be answered

### Domain and persistence

- Does any alliance, diplomacy, Solar War, Obelisk, Gate, victory or defeat runtime domain already exist?
- Which existing catalog IDs, assets or documentation references are mechanical versus decorative?
- Can endgame be introduced without a schema/save bump?
- What state is required for membership, war participation, final structures and campaign terminal status?
- What migration and checksum rules apply if persistence changes?

### Commands and simulation

- Which ordinary commands can be reused?
- Which new commands/events are unavoidable?
- How are construction, contribution, attack, destruction and completion made atomic and idempotent?
- How does campaign time behave after victory or defeat?
- What happens to queued commands, fleets, offline catch-up and autosave at terminal state?

### Player and bot parity

- What information is public, owned, allied or hidden?
- Can bots join or avoid alliances using the same command and visibility rules?
- How do bots choose Solar War participation and final objectives without privileged state?
- Is endgame bot parity part of the same batch or a separate closure PR?

### UI and reporting

- Which existing route family should host alliance and endgame controls?
- What must appear in Operations, Reports, HUD and campaign return summaries?
- How are victory, defeat and post-campaign state represented on reload and browser history?
- What onboarding changes are required, and which belong to M9 instead?

### Determinism and performance

- What direct/chunk/save/offline equality window is required?
- What final-state idempotency tests are required?
- Can the unchanged one-day `<15 s` and seven-day `<30 s` budgets remain?
- What history limits are required?

## Required repository map before acceptance

The completed audit must name exact paths for:

- simulation state and types;
- reducer and scheduled events;
- save format and migration;
- catalogs and asset resolvers;
- bot perception, planner and scheduler;
- Operations, Reports, HUD and routing;
- unit/integration/audit/browser tests;
- current status, roadmap and archive documents.

## Batch-sizing decision

Not decided.

The audit must choose one of:

- **Heavy, 1–2 implementation PRs** if persistence and campaign termination are tightly coupled;
- **Medium, 4 implementation PRs** if alliance/endgame domains can be separated into independently reviewable foundations, UX, bot parity and closure;
- multiple sequential audits if alliances and final victory systems are not one coherent risk surface.

The audit must not force all of M8 into one batch merely because the roadmap groups it under one milestone.

## Permanent non-goals unless evidence changes

- multiplayer or required server authority;
- real-time external matchmaking;
- paid services or external secrets;
- replacement of existing combat, campaign-time or save architecture;
- weakening progression, performance, Browser or Graphify gates;
- unrelated catalog expansion or global rebalance;
- M9 release-candidate polish inside the M8 mechanics batch.

## Acceptance gate for Audit #152

Before this contract may become accepted:

1. exact main and #151 merge SHA are synchronized in status/history/machine indexes;
2. direct source and Graphify evidence identify existing and missing endgame surfaces;
3. all critical unknowns are resolved;
4. stable work-item IDs and ordered implementation PR count are chosen;
5. exact file maps, persistence impact and test gates are recorded;
6. CI, Browser E2E and Graphify pass on the final audit documentation head;
7. review threads are resolved and mergeability is clean.

Until then, no endgame implementation is authorized.
