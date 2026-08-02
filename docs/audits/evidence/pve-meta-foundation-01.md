# Audit evidence — PVE-META-FOUNDATION-01

**Audit PR:** #147  
**Baseline:** PR #146 squash `392abb2bf27267fef9777ff35eb96555941a42f3`  
**Evidence date:** 2026-08-02  
**Decision:** bounded reputation + local Arena; no Admiral services or separate PvE currency

## Baseline integrity

PR #146 completed M6a and passed on final head `54914d98c071b84c668af5e16b89cb851085f7ba`:

```text
CI             30752151413 — success
Browser E2E    30752151392 — success, 28 tests
Graphify       30752151378 — success
```

Final isolated performance evidence:

```text
1 campaign day   5.288 s < 15 s
7 campaign days 23.329 s < 30 s
```

The exact generated squash SHA is:

```text
392abb2bf27267fef9777ff35eb96555941a42f3
```

## Roadmap gap

The canonical roadmap marks:

- M6a sustainable existing PvE as the completed prerequisite;
- M6b PvE meta systems as not audited;
- M7 bot parity as partial;
- M8 alliances/endgame as not audited.

The release definition still requires complete PvE/meta interaction before alliances and final victory/defeat work. Therefore M6b is the next coherent product gap.

## Actual codebase evidence

Graphify run `30752151378` extracted:

```text
2,932 nodes
9,980 edges
132 communities
100% extracted
```

Core coupling confirms persistence and command changes are the main risk:

```text
GameState                 261 edges
createInitialGameState()  170 edges
executeCommand()          110 edges
GameCommand                73 edges
```

Exact Graphify node searches found no implemented domain nodes for:

```text
Arena
Admiral
reputation
currency
alliance
Obelisk
victory
defeat
```

`solar` matches only solar-system navigation/model terms, not Solar War.

This proves the batch is additive and must not be represented as a repair of an existing meta system.

## Architecture finding

Graphify reports an existing import cycle:

```text
src/simulation/pve/spaceObjects.ts
→ src/simulation/pve/worldEvents.ts
→ src/simulation/pve/targetRecovery.ts
→ src/simulation/pve/spaceObjects.ts
```

Adding reputation or Arena state inside that cycle would increase coupling and migration risk. The contract therefore requires a separate PvE-meta domain that consumes stable mission/combat resolution data.

## Product findings

### What is already sufficient

- sustainable expeditions, space objects, pirate bases and targeted world events;
- deterministic combat and ordinary fleet commands;
- canonical Operations and Reports workspaces;
- immutable campaign identity, offline catch-up and save/load partitioning;
- honest public-only bot PvE perception and ordinary-command participation;
- bounded histories and permanent progression/performance gates.

### What is missing

- a persistent reason to continue PvE after immediate resource rewards;
- a bounded repeatable combat challenge outside map-target recovery timing;
- visible PvE progression in Operations;
- bot parity for any future meta loop;
- migration and closure evidence for persisted PvE meta state.

### What is not justified

A separate PvE currency duplicates the existing resource economy and creates an additional inflation/migration surface. Admiral services would require a service catalogue before there is evidence of a player problem that services solve. Both are excluded.

## Risk assessment

| Risk | Severity | Audit response |
|---|---|---|
| schema/save migration loss | high | one controlled v17/v4 bump in #148; explicit v16/v3 migration matrix |
| duplicate rewards after save/load | high | atomic idempotent resolution and direct/chunk/save tests |
| combat divergence | high | reuse existing deterministic combat resolver |
| economy inflation | high | existing resources only; no currency; no global rebalance |
| bot privilege | high | public challenge data + owned state only; same command/cost/fleet rules |
| UI duplication | medium | extend Operations; no new primary route |
| PvE import-cycle growth | medium | separate meta domain boundary |
| CI performance regression | medium | preserve `<15 s` / `<30 s` gates without threshold changes |
| batch scope drift into endgame | high | explicit exclusions and exactly four implementation PRs |

## Sizing decision

The batch is **medium** with exactly four implementation PRs:

```text
#148 PVE-REPUTATION-FOUNDATION
#149 ARENA-PVE-CHALLENGES
#150 PVE-META-OPERATIONS-UX
#151 BOT-PVE-META-GATE
```

Why not heavy:

- existing combat, fleet, Operations, report, bot and campaign-time foundations are reusable;
- no new assets, server authority, multiplayer or new economy are required.

Why not light:

- persisted state requires schema/save migration;
- reward idempotency, bot parity and partition equality are mandatory.

## Audit conclusion

Proceed only after Audit PR #147 is accepted. The batch may add reputation and local deterministic Arena challenges. It may not add Admiral services, separate currency, multiplayer, alliances or endgame.
