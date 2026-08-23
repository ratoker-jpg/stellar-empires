# Continuation guide

## Current handoff

Release 1.0 remains closed. Runtime baseline is schema v19 / save format v6 / migration none.

Current exact `main`:

`a1249615d55e9ffebc60889c3ab4d5ff72d8933d`

That is merged PR #181. The previous batch is complete:

```text
POST-1.0-BOT-STRATEGY-DIFFERENTIATION
Audit #178 → 4b96d457fad1577a0663210864381a0d3a33cb77
#179 → 7620975e1cd604c8bcdce0bac748e32e276061db
#180 → f0cfcb7d2944b8380cf8b3157ae1570bbbbb17cd
#181 → a1249615d55e9ffebc60889c3ab4d5ff72d8933d
```

There is no PR4 in that batch.

## Only active work

```text
POST-1.0-NEXT-PRODUCT-2
branch audit/post-1.0-next-product-2
starting main a1249615d55e9ffebc60889c3ab4d5ff72d8933d
kind docs-only Audit
implementationAuthorized = false
```

The Audit PR number is pending GitHub assignment until the first docs commit is opened as a draft PR. It must be synchronized into the control plane before final Ready.

## Current authority

Read in this order before continuation:

1. `AGENTS.md`;
2. `docs/28-audit-first-autonomous-delivery-protocol.md`;
3. `docs/audits/current-batch-audit.md`;
4. `docs/audits/current-execution-state.md`;
5. `docs/audits/batch-history.md`;
6. `docs/audits/completed/post-1.0-bot-strategy-differentiation.md`;
7. `docs/project-status.json`;
8. `docs/roadmap-pr-index.json`;
9. `docs/16-execution-roadmap.md`;
10. `docs/29-post-1.0-nemexia-reference-roadmap.md`;
11. actual GitHub `main`, active Audit PR, review threads and exact workflow state.

Actual GitHub state wins over stale prose.

## Fresh Audit result

The strongest verified current gaps are not Organic Terminal, generic bot competence or another broad parity sweep. They are concentrated in strategic combat feedback truth:

1. Arena still uses length-only fleet identity entropy at resolution when no persisted seed snapshot exists;
2. Arena history is excluded from `createUnifiedMissionReports()`;
3. combat doctrine/Admiral/flagship/formation/priority choices affect real combat but are not preserved/displayed as immutable historical tactical context;
4. ranking `Победы` counts generic successful operations and misses Arena victories.

The proposed medium batch is:

`POST-1.0-STRATEGIC-FEEDBACK-TRUTH`

Ordered work items, **not authorized until controller-approved Audit merge**:

1. `POST-1.0-PR1-ARENA-COMBAT-IDENTITY-TRUTH`;
2. `POST-1.0-PR2-UNIFIED-COMBAT-FEEDBACK`;
3. `POST-1.0-PR3-COMBAT-RANKING-TRUTH`.

No PR4 exists in the proposal.

The detailed implementation contract, exact expected files, tests, persistence rules, risks and acceptance gates are only in:

`docs/audits/current-batch-audit.md`

## Important fresh classifications

### VERIFIED / KEEP_STELLAR

- Organic Fresh Game → Terminal and Obelisk evidence;
- terminal save/load/partition determinism and faction matrix;
- normal combat full fleet identity + stable primary defender doctrine;
- intelligence level-3/current-state semantics;
- logistics, colonization, market and planet specialization consumers;
- bounded bot personality strategy, tactical risk 700/800/900 and latest-three outcome recovery;
- Admiral/command doctrine/flagship system;
- dynamic world events and static harvestable/control space objects.

### DISPROVED stale gaps

- terminal campaign blocked;
- Obelisk requires injected state;
- normal attack still hashes only fleet ID length;
- research UI/runtime definition mismatch;
- UI presents several functional building queues;
- bots cannot do legal PvP;
- personalities have no runtime effect;
- world gameplay is entirely static.

### RESEARCH / not current batch

- achievements / extra scoring layers;
- moving-object trajectories;
- Bank/credit subsystem semantics;
- more bot differentiation.

Direct Nemexia port is not authorized for any of them.

## Persistence decisions

The proposed batch remains:

- state schema v19;
- save format v6;
- migration none.

PR1 compatibility rule:

- new Arena entries snapshot an optional full-identity resolution seed;
- legacy active entries without it use the exact previous length-based seed path.

PR2 historical truth rule:

- tactical doctrine/Admiral/flagship context is snapshotted at resolution;
- never derive old report context from current mutable command state;
- old reports without snapshot remain valid and visibly partial.

## Stop rule for current Audit

1. finish docs-only control plane;
2. create/open only the Audit PR;
3. synchronize its assigned PR number;
4. require fresh exact-head CI + pinned Graphify + Browser E2E/production smoke if triggered;
5. verify unresolved review threads = 0, `mergeable=true`, `draft=false` and live `main` unchanged unless explicitly reconciled;
6. mark Ready;
7. STOP for controller review.

**Do not merge the Audit. Do not create PR1. Do not implement any proposed runtime change.**