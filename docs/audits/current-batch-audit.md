# Current implementation batch audit

**Status:** accepted batch; final PR #151 active  
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
→ #150 PVE-META-OPERATIONS-UX 39b85fe057d2cbf1fcff6b949a14bc62c7dbde63
→ #151 BOT-PVE-META-GATE — final active PR
```

Exactly four implementation PRs were authorized. No fifth implementation PR may be added.

## Delivered batch result

### #148 — reputation foundation

- schema v17/save v4 and deterministic v16/v3 migration;
- persisted reputation and derived tiers;
- deterministic ordinary-PvE awards;
- duplicate and zero-award protection.

### #149 — local Arena mechanics

- three public deterministic challenges every six hours;
- existing fleets, resources and combat;
- one active entry per empire;
- persistent losses/survivors and victory-only rewards;
- atomic idempotent resolution;
- save compatibility and bounded result history.

### #150 — Operations UX

- canonical `#/operations/arena` route;
- reputation, tier, progress and exact award rules;
- challenge cards, fleet eligibility, active entry and result history;
- responsive/mobile/reload/history/reduced-motion evidence.

### #151 — honest bot parity and closure

- public challenge data plus owned state only;
- planet-destruction capability gate;
- ordinary PvE and higher scheduler priorities remain ahead of Arena;
- owned idle stationed offensive fleets only;
- canonical Arena entry costs and ordinary command execution;
- mandatory 40% gas reserve;
- one Arena command maximum per decision;
- Aegis, Synod and Veyra legal-command evidence;
- pure planning and hidden-state independence;
- complete GameState equality after 48 hours across direct, six-hour chunked, save/load and offline partitions.

## Permanent gates

- schema v17/save v4 unchanged after #148;
- no separate PvE currency or Admiral services;
- local deterministic PvE Arena only;
- same commands, costs, fleets and timing for player and bots;
- public-only bot perception;
- bounded histories;
- 15-case progression matrix with zero violations;
- one-day `<15 s` and seven-day `<30 s` performance limits unchanged;
- CI, Browser E2E and Graphify on the final documentation head.

## Exact next action

1. finish #151 documentation and machine-index synchronization;
2. run final CI, Browser E2E and Graphify on the final head;
3. resolve review and confirm mergeability;
4. squash merge #151 only when green;
5. require the immediately following Audit PR to record exact #151 squash SHA;
6. authorize no further implementation until that audit is accepted.
