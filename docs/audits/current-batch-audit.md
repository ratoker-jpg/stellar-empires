# Current implementation batch audit

**Status:** accepted batch; PR #153 active  
**Updated:** 2026-08-02  
**Batch:** `COMPLETE-ENDGAME-01`  
**Roadmap milestone:** M8 — Complete endgame, stage 1 of 3  
**Complexity:** medium  
**Audit PR:** #152 · `d777a619109d4a9bfc8e5129bf4c525f3327b9b6`  
**Implementation order:** #153–#156  
**Current runtime in PR #153:** schema v18 / save format v5

## Accepted product contract

- alliance membership is optional;
- an empire without an alliance remains an explicit valid solo participant;
- no alliance is required for Solar War or later campaign completion;
- alliance membership is the only allied relation in this batch;
- all mutations use ordinary `GameCommand` validation;
- public alliance identity and roster are public information;
- no bot alliance planner or allied perception is authorized yet;
- no final Obelisk/Gate or terminal result mechanics enter this batch.

## Authorized implementation order

| PR | Stable work item | Player-visible result | Status |
|---:|---|---|---|
| #153 | `ALLIANCE-SOLO-FOUNDATION` | create/join/leave an open alliance or remain solo; migrate saves | active, implementation complete; final validation pending |
| #154 | `SOLAR-WAR-PARTICIPATION` | deterministic public Solar War entry and persistent result | blocked until #153 merges |
| #155 | `ENDGAME-OPERATIONS-UX` | participation and Solar War in Operations/Reports/HUD | planned |
| #156 | `ENDGAME-PARTICIPATION-GATE` | migration, partition, Browser, history and performance closure | planned |

No fifth implementation PR is authorized.

## PR #153 accepted implementation

### State and persistence

- `GameState.endgameParticipation` is required for schema-v18 saves;
- one participant record exists per empire in stable empire order;
- `soloEligible` remains true regardless of current alliance membership;
- public alliance records use stable `alliance-N` IDs;
- valid schema-v17/save-v4 campaigns migrate to schema v18/save v5 with no alliances and empty history;
- checksum and active/offline runtime metadata remain compatible;
- malformed references, duplicate participants and invalid histories fail parsing.

### Commands

```text
CREATE_ALLIANCE
JOIN_ALLIANCE
LEAVE_ALLIANCE
```

Names are NFKC-normalized, trimmed, whitespace-collapsed, bounded to 3–40 characters and rejected when they contain control characters. An empire can belong to at most one alliance. Empty alliances are removed deterministically.

### Boundedness

- alliance count and membership are bounded by `state.empires`;
- membership history retains the newest 64 entries;
- history and next-sequence counters are checksum-covered;
- existing command/event/history limits remain unchanged.

## Permanent gates

- valid v17/v4 → v18/v5 migration;
- deterministic save/load and checksum behavior;
- ordinary command legality for player, Aegis, Synod and Veyra empires;
- no mutation on rejected commands;
- permanent 15-case progression matrix;
- one campaign day `<15 s`;
- seven campaign days `<30 s`;
- CI, Browser E2E and Graphify on the final documentation head.

## Explicit non-goals

No Solar War in #153; no invitations, private alliances, ranks, chat, treaties, diplomacy reputation, multiplayer, Obelisks/Gates, victory/defeat, terminal state, bot alliance planning, allied perception, new catalogs/assets, global rebalance or M9 work.

## Next action

Finish PR #153 code+docs validation and merge it before creating #154 from fresh `main`.
