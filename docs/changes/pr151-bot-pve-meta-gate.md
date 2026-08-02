# PR #151 — BOT-PVE-META-GATE

**Batch:** `PVE-META-FOUNDATION-01`  
**Baseline:** PR #150 squash `39b85fe057d2cbf1fcff6b949a14bc62c7dbde63`  
**Runtime baseline:** schema v17 / save format v4 unchanged  
**Code head before documentation closure:** `016065dce161309899e0893bfa27c85bb2ba2e1c`

## Delivered

- deterministic public-only bot Arena planning;
- routine unlock only at `planet-destruction` or `endgame-preparation`;
- owned idle stationed offensive fleets only;
- existing origin resources and the canonical Arena entry costs;
- mandatory 40% gas reserve protection;
- deterministic personality ordering for patrol, assault and elite challenges;
- ordinary PvE planning remains byte-identical and keeps priority over Arena;
- scheduler continues to execute the canonical `ENTER_ARENA_CHALLENGE` command and records acceptance or rejection;
- one planner call returns at most one Arena command;
- Aegis, Synod and Veyra legal-command evidence;
- pure planning and hidden-player-state independence;
- 48-hour direct, six-hour chunked, save/load and offline runtime equality for the complete GameState;
- bounded reputation, Arena, command and event histories.

## Architecture

```text
src/simulation/bots/arenaPlanner.ts
src/simulation/bots/pveOperationsPlanner.ts
src/simulation/bots/pveOperationsPlannerLegacy.ts
```

The previous ordinary PvE planner is retained unchanged in the legacy module. The canonical wrapper returns any ordinary PvE command first and only consults Arena when ordinary planning produces no command. Existing scheduler priority remains:

```text
recovery/threat
→ economy/research/production
→ colony/logistics
→ ordinary PvE
→ Arena fallback
```

## Validation

Code-head evidence:

```text
CI             30762140802 — success
Graphify       30762140796 — success
Browser E2E    30762140792 — code-head run; final documentation-head success required
1 campaign day     6.099 s < 15 s
7 campaign days   28.838 s < 30 s
```

The full suite includes `tests/audit/botPveMetaGate.test.ts`, which proved exact full-state equality after 48 campaign hours across direct, six-hour chunked, save-loaded and offline runtime partitions.

## Explicit exclusions

- no schema/save change;
- no separate PvE currency;
- no Admiral services;
- no multiplayer/PvP, matchmaking, rankings or seasons;
- no new mechanical catalogs;
- no global economy/progression rebalance;
- no alliances, Solar War, Obelisks, Gates or victory/defeat.

## Closure rule

PR #151 is the fourth and final authorized implementation PR in this batch. Its generated squash SHA cannot be embedded in its own commit; the immediately following Audit PR must synchronize the exact #151 squash SHA before authorizing another implementation batch.
