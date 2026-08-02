# AI Continuation Guide

**Status:** PR #144 `PVE-OPERATIONS-INTELLIGENCE-UX` active  
**Updated:** 2026-08-02  
**Last merged PR:** #143 `PVE-TARGET-RECOVERY`  
**Verified main:** `e3d2c28385abd9772a18257eeb313bd8d45e581e`  
**Active branch:** `agent/pve-operations-intelligence-ux`  
**Next authorized PR after merge:** #145 `BOT-PVE-OPERATIONS`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

Actual `main` and merged GitHub history override stale prose, abandoned branches and private chat memory.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/sustainable-pve-operations-01.md`
6. `docs/audits/evidence/sustainable-pve-operations-01.md`
7. `docs/changes/pr144-pve-operations-intelligence-ux.md`
8. `docs/project-status.json`
9. `docs/roadmap-pr-index.json`
10. `docs/27-playable-game-roadmap-v5.md`
11. latest merged PRs, open PRs and actual `main`

## M6a history and order

```text
#142 Sustainable PvE Audit        81f1959b0bdbdd72d05dc21a2dce0a9e1470f010
#143 PVE-TARGET-RECOVERY           e3d2c28385abd9772a18257eeb313bd8d45e581e
#144 PVE-OPERATIONS-INTELLIGENCE-UX — active
→ #145 BOT-PVE-OPERATIONS
→ #146 PVE-SUSTAINABILITY-GATE
```

Exactly four implementation PRs are authorized. No fifth PR is allowed.

## PR #144 contract result

Delivered shared model:

- expedition positions;
- space objects;
- deterministic pirate-base baselines and current occupants;
- active world-event targets;
- stable availability/status/reason and coordinate ordering;
- role/fleet, duration/fuel, yield/hazard/control, recovery, expiry and multiplier dimensions.

Delivered presentation:

- Operations overview prioritizes actionable opportunities;
- expedition/object/event routes consume the same selector;
- controls have explicit labels;
- ordinary commands and confirmation remain unchanged;
- event reports use catalog names, human targets and mechanical effects;
- passive recovery produces no fake reports or rewards;
- Browser gates cover desktop/release/mobile viewports without horizontal overflow.

Code head `09e6dec9817437d31110862738a6c91c005a9399` passed CI `30742965874`, Browser `30742965877` and Graphify `30742965865`.

## Exact recovery action

While #144 is open:

1. continue only `agent/pve-operations-intelligence-ux`;
2. keep changes inside #144 selector, player UX, reports, tests and status docs;
3. do not absorb #145 bot planning or #146 closure;
4. run CI, Browser E2E and Graphify on the final head;
5. resolve all review findings;
6. squash merge #144 only when all gates are green.

After #144 merges:

1. fetch exact squash SHA and fresh `main`;
2. create only #145 `BOT-PVE-OPERATIONS`;
3. make bots consume ordinary perception/commands and shared PvE truth;
4. do not start #146 early.

## Hard stops

- no fifth M6a implementation PR;
- no schema v17/save format v4 without a replacement audit;
- no persisted PvE currency, reputation or telemetry;
- no hidden-information exception for bots;
- no Arena, Admiral services, alliances or endgame;
- no weakening of progression, determinism, performance or Browser gates.
