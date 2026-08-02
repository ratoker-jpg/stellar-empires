# Current implementation batch audit

**Status:** accepted batch; PR #149 active  
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
→ #149 ARENA-PVE-CHALLENGES — active
→ #150 PVE-META-OPERATIONS-UX
→ #151 BOT-PVE-META-GATE
```

Exactly four implementation PRs are authorized. No fifth implementation PR may be added.

## Completed PR #148

#148 delivered the only schema/save migration in this batch:

- schema v16 → v17 and save format v3 → v4;
- deterministic migration with zero reputation and no active Arena entry;
- one persisted reputation score per empire;
- Recruit/Ranger/Vanguard/Warden tiers at 0/100/300/700;
- deterministic ordinary-PvE awards and zero-award/idempotency protection;
- compatibility with v1/v2 state checksums and v3 envelope checksums;
- future-version rejection.

## Active PR #149 result

#149 adds the local deterministic Arena mechanics only:

- exactly three public challenges per six-hour campaign cycle;
- deterministic challenge identity and enemy composition from public campaign inputs;
- `patrol`, `assault` and `elite` difficulties;
- existing faction unit definitions and existing deterministic combat resolver;
- one owned idle stationed fleet and one active entry per empire;
- existing-resource entry costs and victory rewards;
- held fleet until resolution or withdrawal;
- persistent losses and survivors;
- victory reputation of +10/+20/+35;
- zero reward for defeat, draw and withdrawal;
- atomic idempotent completion through reserved `ARENA_RESOLVE` events;
- save-v4 active-entry persistence and #148-v4 backward compatibility;
- bounded newest-64 Arena result history;
- no mutation of galaxy targets, pirate bases, world events or occupied coordinates during challenge generation.

Dedicated Arena domain:

```text
src/simulation/pveMeta/arena.ts
```

## Explicit exclusions for #149

- reputation/Arena Operations UI;
- new primary navigation family;
- bot Arena planning;
- separate PvE currency;
- Admiral services;
- multiplayer/PvP, matchmaking, rankings or seasons;
- new mechanical catalog entries;
- global economy or progression rebalance;
- alliances, Solar War, Obelisks, Gates, victory or defeat.

## Permanent gates

- schema v17/save v4 remains unchanged after #148;
- #148 v4 saves without `arenaHistory` continue to load;
- deterministic challenge identity and immutable entry snapshots;
- owned fleet/resource enforcement and one-entry limit;
- atomic rewards, losses and duplicate prevention;
- direct and save-loaded time continuation equivalence;
- bounded histories;
- 15-case progression matrix with zero violations;
- one-day `<15 s` and seven-day `<30 s` performance limits unchanged;
- CI, Browser E2E and Graphify on the final documentation head.

## Exact next action

1. finish #149 documentation and machine-index synchronization;
2. run final CI, Browser E2E and Graphify on the final head;
3. resolve review and confirm mergeability;
4. squash merge #149 only when green;
5. fetch the exact #149 squash SHA and fresh `main`;
6. create only #150 `PVE-META-OPERATIONS-UX`.

No #150 implementation may begin before #149 merges.
