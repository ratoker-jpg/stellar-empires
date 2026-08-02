# Current implementation batch audit

**Status:** accepted batch; PR #148 active  
**Updated:** 2026-08-02  
**Batch:** `PVE-META-FOUNDATION-01`  
**Roadmap milestone:** M6b — bounded PvE meta foundation  
**Complexity:** medium  
**Audit PR:** #147 · `50835aeb2864b96e026a7202ad419368e934e47b`  
**Implementation order:** #148–#151  
**Target schema/save:** v17 / v4 through #148 only

## Accepted implementation sequence

```text
#147 PVE-META-FOUNDATION-01 Audit 50835aeb2864b96e026a7202ad419368e934e47b
→ #148 PVE-REPUTATION-FOUNDATION — active
→ #149 ARENA-PVE-CHALLENGES
→ #150 PVE-META-OPERATIONS-UX
→ #151 BOT-PVE-META-GATE
```

Exactly four implementation PRs are authorized. No fifth implementation PR may be added.

## Active PR #148 result

#148 establishes the only persistence migration in the batch:

- schema v16 → v17;
- save format v3 → v4;
- zero-reputation deterministic migration preserving existing campaign state;
- one reputation record per empire and an empty Arena-entry container;
- derived tiers Recruit 0, Ranger 100, Vanguard 300 and Warden 700;
- expedition +10, positive-yield object mission +15, pirate destruction +30 and active target bonus +20;
- existing mission/combat resolution remains the source of truth;
- duplicate, failed, empty, recalled and passive paths award zero;
- v1/v2 state-checksum and v3 envelope-checksum imports remain supported;
- future schema/save versions remain rejected.

Dedicated domain:

```text
src/simulation/pveMeta/reputation.ts
```

The new domain consumes stable mission/combat results and does not extend the existing PvE import cycle.

## Explicit exclusions for #148

- Arena challenges, commands, entry lifecycle and battle resolution;
- reputation/Arena Operations UX;
- bot Arena participation;
- separate PvE currency;
- Admiral services;
- new catalog entries;
- global economy or progression rebalance;
- alliances, Solar War, Obelisks, Gates, victory or defeat.

## Permanent gates

- valid v16/v3 migration without state loss;
- v17/v4 reputation round trip;
- deterministic award and zero-award paths;
- duplicate prevention;
- ordinary mission/intelligence/save gates retained;
- 15-case progression matrix with zero violations;
- one-day `<15 s` and seven-day `<30 s` performance limits unchanged;
- CI, Browser E2E and Graphify on final documentation head.

## Exact next action

1. finish final code+docs gates for #148;
2. resolve review and confirm mergeability;
3. squash merge #148 only when green;
4. fetch exact #148 squash SHA and fresh `main`;
5. create only #149 `ARENA-PVE-CHALLENGES`.

No Arena implementation may begin before #148 merges.
