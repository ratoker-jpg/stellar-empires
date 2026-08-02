# PR #145 — BOT-PVE-OPERATIONS

**Status:** implementation complete; final documentation-head validation pending  
**Baseline:** PR #144 · `dbc5bdf0bce439efa5f0c61c8846bbd9960ba43a`  
**Code head:** `2b772475f79db3998932a4cf0322a5dfe757ac0e`  
**Schema/save:** v16 / v3 unchanged

## Delivered

- bot perception now exposes only globally public PvE data: free expedition positions, public space-object fields, active event targets and pirate contacts;
- `planBotPveOperations` consumes the canonical PvE opportunity model with explorer, industrial and aggressive priority policies;
- bots use ordinary `CREATE_FLEET`, `START_EXPEDITION`, `START_SPACE_OBJECT_MISSION`, targeted `SEND_FLEET` and invalid-operation `RECALL_FLEET` commands;
- fleet creation consumes only ready owned inventory and never fabricates hulls, fuel or resources;
- expedition/object missions preserve a 40% colony gas reserve;
- pirate-hunt attacks require an active target event, current level-3 intelligence, the ordinary 120% safety threshold and the normal attack validator;
- real recovery/high-threat actions remain ahead of PvE, while ordinary fleet development stays after PvE;
- scheduler source `pve` emits at most one command per empire decision and records auditable blocked reasons;
- inherited colony-role and route maintenance remain deterministic;
- routine PvE planning is bounded to six campaign hours; active `pirate-hunt` and `mineral-bloom` opportunities retain hourly reaction;
- hidden player resources, fleets, defenses and unpublished outcomes do not affect bot PvE plans.

## Validation

Code-head evidence:

```text
CI             30745970162 — full suite/build and performance green; progression conclusion checked before docs closure
Browser E2E    30745970161 — final code-head conclusion checked before docs closure
Graphify       30745970168 — success
```

Measured catch-up:

```text
1 campaign day  8.94 s < 15 s budget
7 campaign days 21.81 s < 30 s budget
```

Focused gates cover:

- expedition and space-object ordinary command execution;
- specialist fleet creation from ready inventory;
- legal aggressive pirate-hunt attack;
- at most one accepted `pve` command per scheduler decision;
- public perception redaction;
- hidden-player-state invariance;
- inherited multi-colony logistics and campaign partition gates.

## Exclusions

- no schema/save-format change;
- no new production authority or hidden-information exception;
- no target lifecycle or player UX reimplementation;
- no persisted PvE telemetry, currency or reputation;
- no Arena, Admiral services, alliances or endgame;
- no #146 batch-closure work.

## Next authorized action

Validate the final documentation head, resolve review and squash merge #145. Then create only #146 `PVE-SUSTAINABILITY-GATE` from fresh `main`.
