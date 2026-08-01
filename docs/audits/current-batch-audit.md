# Current implementation batch audit — SUSTAINABLE-PVE-OPERATIONS-01

**Status:** Audit #142 active  
**Updated:** 2026-08-01  
**Roadmap milestone:** M6a — sustainable existing PvE operations  
**Baseline:** PR #141 · `0167ad689e299438c9d0550ee20ba53452c93d39`  
**Complexity:** medium  
**Authorized implementation count:** exactly 4 PRs  
**Implementation PRs:** #143–#146  
**Target state schema:** v16  
**Target save format:** v3

## Audit result

The next coherent batch is not Arena, Admiral services or endgame. The verified immediate product gap is that the already implemented PvE loops are finite and player-only:

- depleted space objects never replenish;
- pirate bases have finite zero-production reserves and no recovery/respawn path;
- `pirate-hunt` selects a target but has no targeted mechanical reward effect;
- bots do not perceive expedition positions, objects or world events;
- bots never issue expedition or object-operation commands;
- player UI has working separate modes but no shared canonical PvE opportunity model.

Audit #142 therefore authorizes:

```text
#143 PVE-TARGET-RECOVERY
→ #144 PVE-OPERATIONS-INTELLIGENCE-UX
→ #145 BOT-PVE-OPERATIONS
→ #146 PVE-SUSTAINABILITY-GATE
```

No fifth implementation PR is authorized.

## Authoritative audit files

Evidence:

```text
docs/audits/evidence/sustainable-pve-operations-01.md
```

Exact implementation contracts:

```text
docs/audits/contracts/sustainable-pve-operations-01.md
```

The contract file is authoritative for paths, dependency order, deterministic rules, acceptance gates and divergence handling.

## Accepted product decisions

### Compatibility

- retain schema v16 and save format v3;
- use the existing chronological campaign-time path;
- do not add persisted PvE telemetry, currency or reputation;
- player and bots use ordinary commands and validators;
- globally public PvE targets/events may enter bot perception; hidden player state may not.

### Recovery

```text
PVE_TARGET_RECOVERY_SECONDS = 21_600
SPACE_OBJECT_ACTIVE_COOLDOWN_SECONDS = 300
PIRATE_HUNT_REWARD_PERMILLE = 1_500
DEFAULT_PIRATE_BASE_COUNT = 3
```

- final object depletion recovers after six campaign hours;
- non-final extraction retains the five-minute cooldown;
- pirate resources/defenses recover after six campaign hours;
- destroyed pirate bases may respawn at their original free position after six campaign hours;
- at most one pirate recovery/respawn occurs per 30-minute world-event evaluation;
- pirate-hunt boosts only its targeted base reward; threat is unchanged;
- all recovery is deterministic across direct, chunked, offline and save-loaded processing.

### Bot behavior

Add auditable scheduler source:

```text
pve
```

Bots may issue at most one PvE command per decision through:

```text
CREATE_FLEET
START_EXPEDITION
START_SPACE_OBJECT_MISSION
SEND_FLEET
RECALL_FLEET
```

They may use only existing inventory, fuel, intelligence and public target state.

## Batch acceptance

The final PR must prove for Aegis, Synod and Veyra:

- object depletion, exact recovery and reuse;
- pirate raid recovery and destroyed-base respawn safety;
- targeted pirate-hunt reward behavior;
- accepted bot expedition, object and legal pirate-hunt operations;
- no duplicated target IDs or occupied coordinates;
- bounded state history and target counts;
- direct/chunked/save-loaded equality over 48 campaign hours;
- permanent progression matrix and catch-up performance remain green;
- Browser E2E and Graphify pass.

## Explicit non-goals

- Arena, ladder or seasonal service;
- Admiral services or temporary boosts;
- PvE reputation, currency or skill tree;
- new strategic resources;
- global balance/progression changes;
- server authority or multiplayer;
- alliances, Solar War, Obelisks, Gates or victory/defeat;
- schema/save-format change.

## Critical unknowns

None.

If implementation requires schema v17, save format v4, persisted PvE meta, a continuously running spawn service, a hidden-information exception or a fifth PR, stop and amend or replace Audit #142 before expanding.

## Exact next action

1. Complete Audit #142 documentation/status synchronization.
2. Run CI, Browser E2E and Graphify on the final audit head.
3. Resolve every review thread.
4. Squash merge Audit #142.
5. Create only PR #143 `PVE-TARGET-RECOVERY` from the resulting fresh `main`.
