# Current implementation batch audit

**Status:** accepted batch; PR #154 active  
**Updated:** 2026-08-03  
**Batch:** `COMPLETE-ENDGAME-01`  
**Roadmap milestone:** M8 — Complete endgame, stage 1 of 3  
**Complexity:** medium  
**Audit PR:** #152 · `d777a619109d4a9bfc8e5129bf4c525f3327b9b6`  
**Implementation order:** #153–#156  
**Current runtime:** schema v18 / save format v5

## Accepted product contract

- alliance membership is optional;
- independent empires remain explicit valid solo participants;
- no alliance is required for Solar War or later completion;
- alliance membership is the only allied relation in this batch;
- all mutations use ordinary `GameCommand` validation;
- public alliance identity, roster, Solar War cycle and redacted results are public information;
- owner fleet losses and survivor details remain owner-visible;
- no bot endgame planner or allied perception is authorized yet;
- no final Obelisk/Gate or terminal result mechanics enter this batch.

## Authorized implementation order

| PR | Stable work item | Player-visible result | Status |
|---:|---|---|---|
| #153 | `ALLIANCE-SOLO-FOUNDATION` | optional open alliance or solo participation; save migration | merged · `c567675c506d55a14a73757afa80c704fb079fc7` |
| #154 | `SOLAR-WAR-PARTICIPATION` | deterministic public Solar War entry and persistent result | active; runtime complete, final validation pending |
| #155 | `ENDGAME-OPERATIONS-UX` | participation and Solar War in Operations/Reports/HUD | blocked until #154 merges |
| #156 | `ENDGAME-PARTICIPATION-GATE` | partition, Browser, history and performance closure | planned |

No fifth implementation PR is authorized.

## PR #154 accepted implementation

### Cycle and opposing force

- cycles align to integer 86,400-second campaign windows;
- cycle identity, faction, opposing fleet and combat seed derive from campaign seed, cycle and empire only;
- no hidden campaign state or unrelated event sequence affects the public challenge or result;
- existing faction ship definitions are reused; no new catalog is added.

### Entry and fleet lifecycle

- `ENTER_SOLAR_WAR` is ordinary and empire-generic;
- one active entry per empire;
- one owned idle stationed combat fleet is required;
- a shared reserved `SOLAR_WAR_RESOLVE` event resolves all cycle entries once in stable empire order;
- fleets are held until the exact boundary;
- survivors return to the original owned planet and destroyed fleets are removed;
- solo/alliance participation is snapshotted at entry.

### Result and persistence

- battle losses, survivors and complete battle report are persisted inside schema v18/save v5;
- public selectors expose redacted outcome/score only;
- owner selectors expose fleet detail;
- alliance score is the deterministic sum of member results; solo score belongs to the empire;
- unified mission reports include Solar War results without implementing #155 UI routes or filters;
- history retains the newest 64 results;
- old v18/v5 saves without Solar War state migrate to an empty state;
- malformed present Solar War state fails parsing.

### Determinism gates

- direct and chunked resolution equality;
- active-save round trip and post-load equality;
- resumable offline catch-up equality across the exact cycle boundary;
- idempotent resolution;
- stable multi-empire order;
- no per-tick scan beyond the existing event queue.

## Permanent gates

- schema v18/save v5 remains unchanged;
- permanent 15-case progression matrix;
- one campaign day `<15 s`;
- seven campaign days `<30 s`;
- asset audit, lint, strict TypeScript, full tests and build;
- Browser E2E and Graphify on the final documentation head;
- zero unresolved review threads and clean mergeability.

## Explicit non-goals

No Operations/HUD UI, bot Solar War planner, allied perception, invitations/private alliance features, Obelisks/Gates, victory/defeat, terminal state, multiplayer, seasons, new currency, new catalogs/assets, global rebalance or M9 work.

## Next action

Finish PR #154 code+docs validation and merge it before creating only PR #155 from fresh `main`.
