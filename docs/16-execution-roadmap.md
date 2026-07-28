# Execution Roadmap Stellar Empires — current entrypoint

**Status:** PR #123 closure gate complete; Audit PR #124 is next  
**Updated:** 2026-07-28  
**Last merged PR:** #123 · `aa1dc67ed874c75aa69af30ce9ced58169793c30`  
**Runtime baseline:** PR #123 `PLANET-DESTRUCTION-RECOVERY-GATE` · `aa1dc67ed874c75aa69af30ce9ced58169793c30`  
**Release target:** 1.0

## Authoritative files

```text
docs/27-playable-game-roadmap-v5.md
docs/audits/current-execution-state.md
docs/audits/completed/planet-demolition-destruction-01.md
docs/changes/pr123-planet-destruction-recovery-gate.md
docs/project-status.json
docs/roadmap-pr-index.json
```

## Delivered state

- #101–#105: catalog runtime art;
- #106–#110: schema-v14 Universe navigation/action gate;
- #111–#115: coherent application shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121: accepted heavy planet demolition/destruction audit;
- #122: deterministic building demolition contract;
- #123: whole-planet destruction and atomic recovery closure gate.

## Completed sequence

```text
#122 PLANET-DEMOLITION-CONTRACT
→ #123 PLANET-DESTRUCTION-RECOVERY-GATE
→ batch archived
```

### Delivered demolition

- faction-specific siege profiles and weapon-level scaling;
- deterministic demolition points, thresholds, selection and rolls;
- Annihilator building-roll bonus instead of generic combat damage;
- one-level building reduction, zone reconciliation and no-refund affected upgrade cancellation;
- battle report and routed presentation.

### Delivered destruction and recovery

- whole-planet chance, reductions, 30% cap and final-colony guard;
- atomic cleanup/rehome of all live references;
- ordinary and repeated pending expedition/space-object returns;
- immutable historical origin plus additive live return destination;
- elapsed/remaining travel-time preservation during rebuilt returns;
- assigned defending flagship Polias protection;
- debris recycling before and after recolonization;
- fresh colony identity and outbound recycler retargeting;
- reports, save/load and Browser E2E closure.

## Next authorized route

Create a fresh **Audit PR #124** from exact current `main`. The audit must select and bound the next roadmap batch, record the baseline SHA, define implementation PR count/contracts and establish CI, Browser E2E, Graphify and review gates before any new implementation starts.

## Deferred until audited

- multi-colony economy/logistics redesign;
- deeper PvE/meta and bot parity;
- solar/system destruction;
- alliances, crystals, Obelisks, Gates and victory;
- final-colony destruction and empire elimination;
- broad balance/mobile/framework/release work.

## Non-negotiable rules

- fresh current `main` is the only valid baseline;
- no implementation PR before an accepted Audit #124;
- schema v14 retained unless an audit proves a migration is required;
- reducer/combat remains authoritative;
- deterministic results and no hidden bot/UI target data;
- no refunds or extra destruction loot;
- all repository, Browser E2E, Graphify and automated review gates remain mandatory.