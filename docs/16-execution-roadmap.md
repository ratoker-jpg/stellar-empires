# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Audit #121 accepted; implementation #122 is next  
**Updated:** 2026-07-28  
**Last merged PR:** #121 · `2000a68216c7681fcbea0d69d1ed7e58e0c0c7f9`  
**Runtime baseline:** PR #120 · `c59a2dd7afdc31fc250d2ec21364f655d6a4e665`  
**Release target:** 1.0

## Authoritative files

```text
docs/27-playable-game-roadmap-v5.md
docs/audits/current-batch-audit.md
docs/audits/current-execution-state.md
docs/audits/contracts/planet-demolition-destruction-01-prs.md
docs/audits/contracts/planet-demolition-destruction-01-rules.md
docs/roadmap-pr-index.json
```

## Delivered state

- #101–#105: catalog runtime art;
- #106–#110: schema-v14 Universe navigation/action gate;
- #111–#115: coherent application shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121: accepted heavy planet demolition/destruction audit.

## Accepted sequence

```text
#122 PLANET-DEMOLITION-CONTRACT
→ #123 PLANET-DESTRUCTION-RECOVERY-GATE
```

### #122 scope

- faction-specific siege profiles and weapon-level scaling;
- deterministic demolition points, thresholds, selection and rolls;
- Annihilator building-roll bonus instead of generic combat damage;
- one-level building reduction, zone reconciliation and no-refund affected upgrade cancellation;
- battle report and routed presentation;
- no planet removal/reference cleanup.

### #123 scope

- whole-planet chance/reductions/cap/final-colony guard;
- atomic cleanup/rehome of all live references;
- ordinary and pending expedition/space-object returns;
- immutable historical origin plus additive live return destination;
- debris/recolonization, reports, bots, save/load and closure gate.

## Deferred

- multi-colony economy/logistics redesign;
- solar/system destruction;
- alliances, crystals, Obelisks, Gates and victory;
- final-colony destruction;
- broad balance/mobile/framework work.

## Non-negotiable rules

- #122 starts from fresh current `main`;
- existing ordinary `attack` only;
- schema v14 retained;
- reducer/combat authoritative;
- deterministic results and no hidden bot/UI target data;
- no refunds or extra destruction loot;
- #123 starts only after #122 merges;
- all repository, Browser E2E and Graphify gates mandatory.
