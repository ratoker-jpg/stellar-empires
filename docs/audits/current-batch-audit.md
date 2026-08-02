# Current implementation batch audit

**Status:** accepted batch; PR #150 active  
**Updated:** 2026-08-02  
**Batch:** `PVE-META-FOUNDATION-01`  
**Roadmap milestone:** M6b — bounded PvE meta foundation  
**Complexity:** medium  
**Audit PR:** #147 · `50835aeb2864b96e026a7202ad419368e934e47b`  
**Implementation order:** #148–#151  
**Runtime baseline:** schema v17 / save format v4

## Accepted implementation sequence

```text
#147 PVE-META-FOUNDATION-01 Audit 50835aeb2864b96e026a7202ad419368e934e47b
→ #148 PVE-REPUTATION-FOUNDATION 430265b061764145e4e3ea1470d545f2ef82d0fa
→ #149 ARENA-PVE-CHALLENGES 42c484426e850b84263d4eecab63ebbb3eaafb05
→ #150 PVE-META-OPERATIONS-UX — active
→ #151 BOT-PVE-META-GATE
```

Exactly four implementation PRs are authorized. No fifth implementation PR may be added.

## Completed foundations

### #148

- schema v17/save v4 and deterministic v16/v3 migration;
- persisted reputation and derived tiers;
- deterministic ordinary-PvE awards;
- duplicate and zero-award protection.

### #149

- three public deterministic Arena challenges every six hours;
- existing fleets, resources and combat;
- one active entry per empire;
- persistent losses/survivors and victory-only rewards;
- atomic idempotent resolution;
- save-v4 active-entry compatibility and bounded result history.

## Active PR #150 result

#150 exposes the accepted model through the existing Operations family:

- canonical `#/operations/arena` route;
- current reputation, tier and next-tier progress;
- exact award explanations;
- recent reputation ledger derived from existing histories;
- three challenge cards with cycle timing, public enemy summary, cost, duration and reward;
- eligible owned idle stationed fleets only;
- exact validation through the Arena entry contract;
- active entry, withdrawal and completed results;
- responsive/mobile/reduced-motion presentation;
- browser reload/history equivalence;
- unchanged prior Operations workspace for overview, missions, events, market and logistics.

Dedicated UI domain:

```text
src/ui/arenaOperationsPanel.ts
src/styles/arenaOperations.css
```

## Explicit exclusions for #150

- bot Arena planning and final closure gate;
- schema/save changes;
- separate PvE currency;
- Admiral services;
- multiplayer/PvP, matchmaking, rankings or seasons;
- new mechanical catalog entries;
- global economy or progression rebalance;
- alliances, Solar War, Obelisks, Gates, victory or defeat.

## Permanent gates

- schema v17/save v4 unchanged;
- public-only challenge presentation and pure validation;
- player commands remain ordinary Arena commands;
- desktop/mobile/keyboard/history/reload/reduced-motion equivalence;
- 15-case progression matrix with zero violations;
- one-day `<15 s` and seven-day `<30 s` performance limits unchanged;
- CI, Browser E2E and Graphify on the final documentation head.

## Exact next action

1. finish #150 documentation and machine-index synchronization;
2. run final CI, Browser E2E and Graphify on the final head;
3. resolve review and confirm mergeability;
4. squash merge #150 only when green;
5. fetch the exact #150 squash SHA and fresh `main`;
6. create only #151 `BOT-PVE-META-GATE`.

No #151 implementation may begin before #150 merges.
