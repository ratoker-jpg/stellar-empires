# PR #156 — ENDGAME-PARTICIPATION-GATE

**Status:** draft closure scaffold; gate implementation not started  
**Updated:** 2026-08-04  
**Authorized by Audit PR:** #152 `COMPLETE-ENDGAME-01`  
**Audit squash SHA:** `d777a619109d4a9bfc8e5129bf4c525f3327b9b6`  
**PR #155 squash / exact branch baseline:** `a5c72562200c2a6dfdc49f1e4f07e8a869a6558d`  
**Branch:** `agent/endgame-participation-gate`  
**Runtime baseline:** schema v18 / save format v5

## Purpose

Close `COMPLETE-ENDGAME-01` with exact migration, deterministic partition, bounded-history, Browser and performance evidence for optional alliance/solo participation, Solar War mechanics and the merged Operations/Reports/HUD presentation.

This is a closure PR. It may add tests, evidence and documentation, and may correct only defects exposed by the accepted gates. It must not add a new product mechanic.

## Required closure matrix

For player factions Aegis, Synod and Veyra, prove:

- valid schema-v17/save-v4 migration to schema v18/save v5;
- explicit solo eligibility after migration;
- legal solo Solar War entry;
- legal alliance-member Solar War entry;
- direct 48-hour advance;
- deterministic six-hour chunk partition;
- save/load continuation across Solar War resolution;
- resumable offline runtime continuation;
- exact complete-state equality across direct, chunked, save/load and offline paths;
- at most one active Solar War entry per empire;
- alliance membership history bounded to 64 entries;
- Solar War result history bounded to 64 entries;
- strict malformed current-state rejection;
- canonical Operations alliance/Solar War routes and Reports `endgame` visibility;
- responsive Browser flow, reload, back/forward, keyboard and reduced-motion behavior.

## Permanent regression gates

- permanent five-seed × three-faction progression matrix;
- one campaign day `<15 s`;
- seven campaign days `<30 s`;
- asset pipeline validation;
- lint and strict TypeScript;
- complete unit/integration/runtime test suite;
- production build;
- Browser E2E;
- Graphify audit;
- zero unresolved review threads and clean mergeability.

## Expected paths

Create:

```text
tests/audit/endgameParticipationGate.test.ts
tests/e2e/endgameParticipation.spec.ts
docs/audits/completed/complete-endgame-01.md
```

Modify only as required by closure evidence or defects:

```text
tests/audit/campaignProgressionBaseline.test.ts
tests/audit/compressedProgressionPartition.test.ts
tests/simulation/campaignTimePerformance.test.ts
docs/audits/current-batch-audit.md
docs/audits/current-execution-state.md
docs/audits/batch-history.md
docs/project-status.json
docs/roadmap-pr-index.json
docs/16-execution-roadmap.md
docs/17-continuation-guide.md
docs/27-playable-game-roadmap-v5.md
```

## Exact delivered baseline to close

```text
#153 ALLIANCE-SOLO-FOUNDATION
c567675c506d55a14a73757afa80c704fb079fc7

#154 SOLAR-WAR-PARTICIPATION
b62d8b739c27cf1616b33302886e565d88c04a42

#155 ENDGAME-OPERATIONS-UX
a5c72562200c2a6dfdc49f1e4f07e8a869a6558d
```

## Explicit non-goals

No new alliance features, bot Solar War planner, allied perception, Obelisks/Gates, final-object ownership or combat, victory/defeat, terminal campaign state, multiplayer, seasons, new currency, new mechanical catalogs/assets, global rebalance, onboarding, release polish or M9 work.

## Acceptance gate

All required matrix rows and permanent gates pass on the exact final code+docs head, `COMPLETE-ENDGAME-01` is archived with exact PR squash SHAs and divergence, and the next authorized work is a new Audit PR `COMPLETE-ENDGAME-02` only.

## Ordered work

1. inspect merged #153–#155 contracts and permanent gate helpers;
2. build the three-faction migration/solo/alliance partition matrix;
3. add the dedicated Browser closure flow;
4. correct only defects exposed by those gates;
5. archive `COMPLETE-ENDGAME-01` and synchronize status/index documents;
6. run exact-head CI, Browser E2E, Graphify, performance, review and mergeability gates;
7. squash merge #156 and stop implementation work until `COMPLETE-ENDGAME-02` is separately audited and accepted.
