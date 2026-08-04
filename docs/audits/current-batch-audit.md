# Current implementation batch audit

**Status:** accepted batch; PR #155 active  
**Updated:** 2026-08-04  
**Batch:** `COMPLETE-ENDGAME-01`  
**Roadmap milestone:** M8 — Complete endgame, stage 1 of 3  
**Complexity:** medium  
**Audit PR:** #152 · `d777a619109d4a9bfc8e5129bf4c525f3327b9b6`  
**Implementation order:** #153–#156  
**Current runtime:** schema v18 / save format v5

## Accepted product contract

- alliance membership is optional and solo participation remains valid;
- all mutations use ordinary `GameCommand` validation;
- public alliance identity/roster and redacted Solar War result are public information;
- exact owned fleet losses, survivors and detailed battle report remain owner-visible;
- stage 1 adds participation, Solar War and presentation only;
- no bot endgame planner, final objects or terminal campaign state enter this batch.

## Authorized implementation order

| PR | Stable work item | Player-visible result | Status |
|---:|---|---|---|
| #153 | `ALLIANCE-SOLO-FOUNDATION` | optional open alliance or solo participation; save migration | merged · `c567675c506d55a14a73757afa80c704fb079fc7` |
| #154 | `SOLAR-WAR-PARTICIPATION` | deterministic public Solar War entry and persistent result | merged · `b62d8b739c27cf1616b33302886e565d88c04a42` |
| #155 | `ENDGAME-OPERATIONS-UX` | participation and Solar War in Operations/Reports/HUD | active; implementation complete, final docs validation pending |
| #156 | `ENDGAME-PARTICIPATION-GATE` | partition, Browser, history and performance closure | blocked until #155 merges |

No fifth implementation PR is authorized.

## PR #155 accepted implementation

### Operations

- modes `alliances` and `solar-war` extend the existing Operations route family;
- solo eligibility, current membership and public roster are visible;
- create/join/leave actions call ordinary domain commands;
- cycle identity, timing, opposing fleet and legal owned fleet choices are shown;
- `ENTER_SOLAR_WAR` uses the ordinary command path;
- active held-fleet state and validation failures are explicit;
- public scoreboard/results are redacted; owner result detail remains private.

### Reports and HUD

- canonical `#/reports/endgame` filter exposes only player-owned Solar War reports;
- existing intelligence privacy and keyboard endpoint order remain intact;
- the HUD shows a compact Solar War cycle/entry indicator and avoids release-viewport overflow;
- Operations navigation badge includes an active Solar War entry.

### Browser and accessibility

- canonical URLs survive reload and browser back/forward;
- release and mobile viewports have no horizontal overflow;
- reduced-motion presentation remains equivalent;
- actions use labelled controls and route tabs preserve keyboard order.

### Persistence

No schema/save migration and no persisted UI state. PR #155 only consumes merged schema-v18/save-v5 participation data.

## Validation evidence on code head

- CI `30937397081` — success;
- Browser E2E `30937396760` — success, 32 tests;
- Graphify `30937396789` — success;
- asset audit, lint, strict TypeScript, all 609 tests and build — success;
- permanent compressed progression scenario — success;
- one day `4.693 s < 15 s`;
- seven days `23.236 s < 30 s`.

## Permanent gates

- schema v18/save v5 remains unchanged;
- permanent 15-case progression matrix;
- one campaign day `<15 s`, seven campaign days `<30 s`;
- asset audit, lint, strict TypeScript, full tests and build;
- Browser E2E and Graphify on the final documentation head;
- zero unresolved review threads and clean mergeability.

## Explicit non-goals

No bot Solar War planner, allied perception, invitations/private alliance features, Obelisks/Gates, victory/defeat, terminal state, multiplayer, seasons, new currency, new catalogs/assets, global rebalance or M9 work.

## Next action

Finish PR #155 final code+docs validation and squash merge it before creating only draft PR #156 from fresh `main`.
