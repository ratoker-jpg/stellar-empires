# Current implementation batch audit — SUSTAINABLE-PVE-OPERATIONS-01

**Status:** PR #143 `PVE-TARGET-RECOVERY` active  
**Updated:** 2026-08-02  
**Roadmap milestone:** M6a — sustainable existing PvE operations  
**Audit:** #142 · `81f1959b0bdbdd72d05dc21a2dce0a9e1470f010`  
**Baseline:** PR #142 · `81f1959b0bdbdd72d05dc21a2dce0a9e1470f010`  
**Complexity:** medium  
**Authorized implementation count:** exactly 4 PRs  
**Implementation PRs:** #143–#146  
**Target state schema:** v16  
**Target save format:** v3

## Audit result

The accepted batch makes the existing PvE loops sustainable and honestly usable before any Arena, Admiral service, reputation or endgame expansion:

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

## PR #143 delivered scope

### Object recovery

```text
PVE_TARGET_RECOVERY_SECONDS = 21_600
SPACE_OBJECT_ACTIVE_COOLDOWN_SECONDS = 300
```

- non-final extraction retains the existing five-minute cooldown;
- final depletion becomes eligible six campaign hours after ordinary mission resolution;
- the first eligible 1,800-second world-event evaluation restores `remainingYield = initialYield`;
- temporary controller and control expiry are cleared;
- stable object identity, coordinate, kind, hazard and baseline yield are retained;
- all simultaneously eligible objects recover once in stable ID order.

The verified baseline mission, reward, fleet-loss, return and rehome resolver remains unchanged. A narrow return wrapper adjusts only the post-resolution cooldown.

### Pirate recovery

- initial creation and recovery use one deterministic pirate baseline constructor;
- the latest completed PvE battle report controls eligibility;
- surviving bases restore deterministic resources and active defenses after six hours;
- destroyed bases respawn only at their original unoccupied position;
- player, bot, neutral and recolonized positions are never overwritten;
- at most one pirate recovery/respawn occurs per evaluation;
- deterministic order is eligibility, galaxy coordinate, report ID and base ID;
- prior reports, debris and rewards remain intact;
- reports executed earlier in the same long `ADVANCE_TIME` are visible at the recovery boundary.

### Pirate-hunt

```text
PIRATE_HUNT_REWARD_PERMILLE = 1_500
```

Only the active targeted base combines this multiplier with the existing anti-repeat reward multiplier. Threat scaling, combat outcomes and non-targeted bases are unchanged.

## Validation state

Code head `ad23459708d6b7dab57c29c898e5772ba96e8917` passed:

```text
CI             30741354763 — success
Graphify       30741354825 — success
Browser E2E    30741354743 — final result checked before merge
```

The final documentation head must rerun all required workflows and resolve every review finding.

## Remaining ordered batch

After #143 merges:

```text
#144 PVE-OPERATIONS-INTELLIGENCE-UX
→ #145 BOT-PVE-OPERATIONS
→ #146 PVE-SUSTAINABILITY-GATE
```

#144 must consume the recovery truth delivered here; it must not reimplement target lifecycle rules.

## Shared compatibility boundary

- schema v16/save format v3 retained;
- existing chronological active/offline campaign-time path retained;
- no persisted PvE telemetry, currency or reputation;
- player and bots use ordinary commands and validators;
- no hidden-information exception;
- no global progression/economy rebalance;
- no Arena, Admiral services, alliances or endgame;
- permanent progression, determinism, performance, Browser E2E and Graphify gates remain mandatory.

## Critical unknowns

None.

If later work requires schema v17, save format v4, persisted PvE meta, a continuously running spawn service, a hidden-information exception or a fifth PR, stop and amend or replace Audit #142 before expanding.

## Exact next action

1. Validate the final PR #143 documentation head.
2. Resolve every review thread.
3. Squash merge #143 only with green CI, Browser E2E and Graphify.
4. Fetch fresh `main` and exact #143 merge SHA.
5. Create only #144 `PVE-OPERATIONS-INTELLIGENCE-UX`.
