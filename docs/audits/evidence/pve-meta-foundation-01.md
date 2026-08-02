# Audit evidence — PVE-META-FOUNDATION-01

**Audit PR:** #147 · `50835aeb2864b96e026a7202ad419368e934e47b`  
**Baseline:** PR #146 squash `392abb2bf27267fef9777ff35eb96555941a42f3`  
**Evidence date:** 2026-08-02  
**Decision:** bounded reputation + local Arena; no Admiral services or separate PvE currency

## Baseline integrity

PR #146 completed M6a with final success:

```text
CI             30752151413
Browser E2E    30752151392
Graphify       30752151378
1 day              5.288 s
7 days            23.329 s
```

The exact #146 squash SHA is `392abb2bf27267fef9777ff35eb96555941a42f3`.

Graphify extracted 2,932 nodes, 9,980 edges and 132 communities. It also exposed the existing `spaceObjects → worldEvents → targetRecovery → spaceObjects` cycle, so the accepted contract required a separate `pveMeta` domain rather than increasing the old PvE cycle.

## Accepted sizing and sequence

The batch was medium and exactly four implementation PRs were authorized:

```text
#148 PVE-REPUTATION-FOUNDATION
#149 ARENA-PVE-CHALLENGES
#150 PVE-META-OPERATIONS-UX
#151 BOT-PVE-META-GATE
```

No fifth implementation PR was authorized.

## Delivered implementation evidence

### #148 — persisted reputation

Squash: `430265b061764145e4e3ea1470d545f2ef82d0fa`

- schema v16 → v17 and save v3 → v4;
- deterministic migration with zero initial reputation;
- Recruit/Ranger/Vanguard/Warden tiers;
- deterministic ordinary-PvE awards;
- duplicate and zero-award protection;
- future-version rejection and legacy checksum compatibility.

### #149 — deterministic local Arena

Squash: `42c484426e850b84263d4eecab63ebbb3eaafb05`

- three public challenges per six-hour cycle;
- patrol, assault and elite slots;
- existing faction units, resources and deterministic combat;
- one active entry per empire;
- fleet held until resolution or withdrawal;
- persistent losses, survivors and victory-only rewards;
- atomic idempotent scheduled resolution;
- save-v4 active-entry persistence and newest-64 result history.

### #150 — routed Operations UX

Squash: `39b85fe057d2cbf1fcff6b949a14bc62c7dbde63`

- `#/operations/arena` inside the existing Operations family;
- reputation, tier and next-tier progress;
- exact award rules and recent reputation ledger;
- current challenge cards, enemy summaries, costs, timing and rewards;
- eligible owned idle fleets and deterministic validation messages;
- active entry, withdrawal and completed result history;
- responsive, reload, browser-history and reduced-motion Browser evidence.

### #151 — honest bot parity and closure

Validated code head: `016065dce161309899e0893bfa27c85bb2ba2e1c`

- public challenge data and owned state only;
- routine unlock only at planet-destruction capability;
- ordinary PvE planner preserved and prioritized before Arena;
- owned idle stationed offensive fleet and existing origin resources;
- 40% gas reserve;
- canonical `ENTER_ARENA_CHALLENGE` execution;
- one Arena command maximum per decision;
- legal Aegis, Synod and Veyra participation;
- pure deterministic planning and hidden-player-state independence;
- 48-hour exact full-state equality for direct, six-hour chunked, save/load and offline runtime partitions.

Code-head gates:

```text
CI             30762140802 — success
Graphify       30762140796 — success
Browser E2E    30762140792 — code-head run; final documentation-head success required
1 campaign day     6.099 s < 15 s
7 campaign days   28.838 s < 30 s
```

## Risk closure

| Risk | Closure evidence |
|---|---|
| schema/save migration loss | one controlled v17/v4 migration in #148; later PRs retained it |
| duplicate rewards | atomic resolution and partition tests |
| combat divergence | existing deterministic resolver reused |
| economy inflation | existing resources only; no currency or rebalance |
| bot privilege | public challenges + owned state; hidden-state independence test |
| UI duplication | existing Operations route family |
| performance regression | unchanged `<15 s` / `<30 s` limits |
| batch drift | exactly four implementation PRs; exclusions retained |

## Final conclusion

The accepted M6b batch is implementation-complete pending the generated squash merge of PR #151. No Admiral services, separate PvE currency, multiplayer, rankings, new catalogs, alliances or endgame were added.

Because a commit cannot contain its own generated squash SHA, the immediately following Audit PR must synchronize the exact #151 squash SHA before authorizing another implementation batch.
