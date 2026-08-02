# AI Continuation Guide

**Status:** PR #146 `PVE-SUSTAINABILITY-GATE` closing M6a  
**Updated:** 2026-08-02  
**Last merged PR:** #145 `BOT-PVE-OPERATIONS`  
**Verified main:** `62aae31e2ad5e4ad04385a5cd94f77a70579d72f`  
**Active branch:** `agent/pve-sustainability-gate`  
**Next authorized PR after merge:** #147 Audit only

## Repository

`ratoker-jpg/stellar-empires` · default branch `main`.

Actual `main` and merged GitHub history override stale prose, abandoned branches and chat memory.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/completed/sustainable-pve-operations-01.md`
6. `docs/changes/pr146-pve-sustainability-gate.md`
7. `docs/project-status.json`
8. `docs/roadmap-pr-index.json`
9. `docs/27-playable-game-roadmap-v5.md`
10. latest merged PRs, open PRs and actual `main`

## Closing M6a history

```text
#142 Sustainable PvE Audit         81f1959b0bdbdd72d05dc21a2dce0a9e1470f010
#143 PVE-TARGET-RECOVERY            e3d2c28385abd9772a18257eeb313bd8d45e581e
#144 PVE-OPERATIONS-INTELLIGENCE-UX dbc5bdf0bce439efa5f0c61c8846bbd9960ba43a
#145 BOT-PVE-OPERATIONS             62aae31e2ad5e4ad04385a5cd94f77a70579d72f
#146 PVE-SUSTAINABILITY-GATE — closure active
```

No fifth M6a implementation PR is authorized.

## PR #146 closure result

The closure gate adds no gameplay domain. It proves across Aegis, Synod and Veyra:

- 48-hour direct, six-hour chunked and 24-hour save-loaded equality;
- exact six-hour object recovery and ordinary reuse;
- pirate recovery, free respawn and occupied-slot blocking;
- target-only pirate-hunt reward;
- world-event chain preservation;
- stable target counts, unique occupied coordinates and bounded histories;
- ordinary validated bot expedition, object and legal pirate-hunt commands;
- deterministic, non-mutating and hidden-state-isolated bot plans.

Validated code head:

```text
a2e466bfffa3494ae9a08e2c4250e6fc78c89290
```

```text
CI             30747647153 — success
Graphify       30747647145 — success
Browser E2E    final documentation-head success required before merge
```

CI includes 106 test files / 557 tests, 15 progression cases with zero violations, one-day catch-up in 6.22 seconds and seven-day catch-up in 29.56 seconds.

## Exact recovery action

While #146 is open:

1. continue only `agent/pve-sustainability-gate`;
2. keep changes inside closure tests, archive and status synchronization;
3. do not add gameplay, meta systems or another implementation domain;
4. run CI, Browser E2E and Graphify on the final documentation head;
5. resolve every review finding;
6. squash merge only when all gates are green.

After #146 merges:

1. fetch its exact generated squash SHA and fresh `main`;
2. create Audit PR #147 only;
3. synchronize the exact #146 SHA into archive/history;
4. re-audit actual code and the canonical roadmap;
5. authorize implementation only through a new accepted contract.

## Hard stops

- no implementation after #146 without Audit #147;
- no schema v17/save format v4 without a new audit;
- no persisted PvE currency, reputation or telemetry;
- no hidden-information exception or fabricated bot assets;
- no Arena, Admiral services, alliances or endgame;
- no weakening of progression, determinism, performance or Browser gates.
