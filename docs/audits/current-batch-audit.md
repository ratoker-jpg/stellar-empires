# Current implementation batch audit

**Status:** accepted contract in Audit PR #152; merge pending  
**Updated:** 2026-08-02  
**Batch:** `COMPLETE-ENDGAME-01`  
**Roadmap milestone:** M8 — Complete endgame, stage 1 of 3  
**Complexity:** medium  
**Audit PR:** #152  
**Baseline:** `73ed5536cb994a78fe7cdd45a41e0240901d7fe1`  
**Runtime baseline:** schema v17 / save format v4  
**Target after first implementation:** schema v18 / save format v5

## Previous batch closure

```text
#147 Audit                         50835aeb2864b96e026a7202ad419368e934e47b
→ #148 PVE-REPUTATION-FOUNDATION  430265b061764145e4e3ea1470d545f2ef82d0fa
→ #149 ARENA-PVE-CHALLENGES       42c484426e850b84263d4eecab63ebbb3eaafb05
→ #150 PVE-META-OPERATIONS-UX     39b85fe057d2cbf1fcff6b949a14bc62c7dbde63
→ #151 BOT-PVE-META-GATE          73ed5536cb994a78fe7cdd45a41e0240901d7fe1
```

`PVE-META-FOUNDATION-01` is completed. Its history and exact #151 squash SHA remain preserved in `docs/audits/batch-history.md` and the machine indexes.

## Evidence-backed scope decision

### VERIFIED

- `GameState`, `GameCommand`, `GameEventPayload`, `createInitialGameState` and `executeCommand` contain no alliance, diplomacy, Solar War or terminal campaign state.
- complete Obelisk and Gate definitions/assets exist for Aegis, Synod and Veyra, but `QUEUE_BUILDING` rejects them through `BUILDING_FEATURE_LOCKED`.
- campaign advancement has no terminal stop and continues pending events, logistics, world events and bot decisions to its target time.
- active/offline runtime and autosave have no terminal-aware real-time cursor handling.
- bot perception has no allied visibility class and the scheduler has no endgame source.
- current UI has no alliance/Solar War modes or result route.

### DECISION

All of M8 must not enter one batch. Persistence/participation, terminal campaign closure and bot information parity are distinct high-risk surfaces.

Audit #152 authorizes only alliance/solo participation and a bounded local Solar War foundation. Final structures and terminal campaign state require Audit `COMPLETE-ENDGAME-02`. Bot endgame behavior requires Audit `COMPLETE-ENDGAME-03` after mechanics stabilize.

## Product contract for this batch

- alliance membership is optional;
- an empire with no alliance is an explicit valid solo participant;
- no alliance is required to enter Solar War or later finish the campaign;
- alliance membership defines the only new allied relation; no general diplomacy matrix, treaties or invitation workflow are added;
- every mutation uses ordinary `GameCommand` validation and owned resources/fleets;
- public alliance identity, roster and aggregate Solar War result are public information;
- own contribution details are owned information; allied individual contribution is not exposed until a later audit explicitly authorizes it;
- Solar War is a deterministic local 24-hour campaign-time cycle;
- one owned idle stationed combat fleet may enter per empire per cycle;
- entry holds the fleet until resolution and uses the existing combat resolver and existing faction catalogs;
- no new mechanical catalog or asset is required;
- Solar War history is bounded to 64 resolved entries;
- bots gain no planner in this batch, but the ordinary commands must accept any legal empire so later bot parity does not require privileged APIs.

## Authorized implementation order

| PR | Stable work item | Player-visible result |
|---:|---|---|
| #153 | `ALLIANCE-SOLO-FOUNDATION` | create/join/leave an open local alliance or remain explicitly solo; save/load migration |
| #154 | `SOLAR-WAR-PARTICIPATION` | enter a public deterministic Solar War cycle with an owned fleet and receive a persistent bounded result |
| #155 | `ENDGAME-OPERATIONS-UX` | manage participation and Solar War from Operations; see reports/HUD state and reload-safe routing |
| #156 | `ENDGAME-PARTICIPATION-GATE` | combined migration, partition, Browser, history and performance closure for all three factions |

No fifth implementation PR is authorized.

## Persistence and migration

`ALLIANCE-SOLO-FOUNDATION` adds a required persisted participation domain to `GameState`. Therefore:

- state schema becomes v18;
- save format becomes v5;
- valid schema-v17/save-v4 campaigns migrate deterministically with every empire independent/solo and no active Solar War entry;
- checksum, active/offline runtime metadata and campaign settings remain compatible;
- invalid alliance references, duplicate membership and invalid active entries fail parsing rather than being silently repaired;
- later Obelisk/Gate/terminal work must not be pre-added to the v18 state.

## Determinism and boundedness

- cycle identity derives only from campaign seed and integer campaign time;
- entries resolve in stable `empireId` order at an exact scheduled boundary;
- entry validation and resolution are atomic and idempotent;
- direct, chunked, save/load and offline partitions must produce exact full-state equality;
- `commandLog` and `eventLog` retain existing limits;
- alliance count and membership are bounded by `state.empires`;
- Solar War resolved-entry history limit is 64;
- one-day `<15 s` and seven-day `<30 s` limits remain unchanged.

## Explicit non-goals

- closed/private alliances, invitations, ranks, chat, treaties, diplomacy reputation or betrayal cooldowns;
- multiplayer, server authority or matchmaking;
- Obelisk/Gate construction, resource contribution, attacks or destruction;
- victory, defeat, terminal state or post-terminal command rejection;
- bot alliance/Solar War planning or allied perception;
- new catalogs/assets, global rebalance or M9 onboarding/release polish.

## Acceptance gate

The batch closes only when #156 proves:

- schema-v17/save-v4 → schema-v18/save-v5 migration;
- optional solo and alliance command legality;
- deterministic Solar War entry, hold, resolution, losses and bounded history;
- exact direct/chunk/save/offline equality for Aegis, Synod and Veyra;
- no hidden-state or privileged-command path;
- stable Operations/Reports/HUD routing and reload;
- permanent 15-case progression matrix;
- one-day `<15 s`, seven-day `<30 s`;
- CI, Browser E2E and Graphify;
- archived audit and synchronized status/history.
