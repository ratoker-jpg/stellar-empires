# Current implementation batch audit — SUSTAINABLE-PVE-OPERATIONS-01

**Status:** PR #144 `PVE-OPERATIONS-INTELLIGENCE-UX` active  
**Updated:** 2026-08-02  
**Roadmap milestone:** M6a — sustainable existing PvE operations  
**Audit:** #142 · `81f1959b0bdbdd72d05dc21a2dce0a9e1470f010`  
**Current baseline:** PR #143 · `e3d2c28385abd9772a18257eeb313bd8d45e581e`  
**Complexity:** medium  
**Authorized implementation count:** exactly 4 PRs  
**Implementation PRs:** #143–#146  
**Target state schema:** v16  
**Target save format:** v3

## Ordered batch

```text
#143 PVE-TARGET-RECOVERY — merged
→ #144 PVE-OPERATIONS-INTELLIGENCE-UX — active
→ #145 BOT-PVE-OPERATIONS
→ #146 PVE-SUSTAINABILITY-GATE
```

No fifth implementation PR is authorized.

## Authoritative audit files

```text
docs/audits/evidence/sustainable-pve-operations-01.md
docs/audits/contracts/sustainable-pve-operations-01.md
```

## Merged PR #143 foundation

PR #143 merged as `e3d2c28385abd9772a18257eeb313bd8d45e581e` and delivered:

- 300-second non-final object cooldown;
- 21,600-second final depletion/recovery eligibility;
- deterministic object and pirate recovery on the 1,800-second world-event boundary;
- occupied-position protection and one pirate recovery per evaluation;
- chronological same-call offline battle/recovery visibility;
- targeted 1,500-permille pirate-hunt reward before anti-repeat combination;
- 48-hour direct/chunked/save-loaded equality.

## Active PR #144 delivered scope

### Canonical opportunity selector

One pure selector covers expeditions, space objects, pirate bases and active world-event targets. It exposes stable status and availability codes plus role/fleet, duration/fuel, yield/hazard/control, recovery, event expiry and reward/threat dimensions.

Deterministic order:

```text
active event
→ available
→ active operation
→ recovering/cooling down
→ unavailable
→ coordinate
→ kind
→ ID
```

The model consumes #143 lifecycle truth and does not predict future combat or expedition outcomes.

### Routed player UX

Existing Operations routes consume the shared model:

- overview: prioritized opportunity cards;
- expeditions: exact scout, fleet, target, cycle and fuel truth;
- objects: specialist, yield, hazard, control, cooldown and recovery truth;
- events: active effects and pirate target/recovery truth.

No new route family or parallel command path was added. Ordinary commands and confirmation remain unchanged. Market/logistics are unchanged.

### Reports and viewport gates

World-event reports use catalog titles, readable target labels and real mechanical effects. Passive recovery creates no fake report/reward row.

Code head `09e6dec9817437d31110862738a6c91c005a9399` passed:

```text
CI             30742965874 — success
Browser E2E    30742965877 — success
Graphify       30742965865 — success
```

Browser covers routed modes, accessible labels, presentation-only target handoff and no horizontal overflow at 1440×900, 1920×1080 and 390×844.

## Remaining ordered batch

After #144 merges:

```text
#145 BOT-PVE-OPERATIONS
→ #146 PVE-SUSTAINABILITY-GATE
```

#145 must consume the same selector/ordinary commands under bot perception rules. It must not duplicate #143 recovery or #144 presentation logic.

## Shared compatibility boundary

- schema v16/save format v3 retained;
- existing chronological campaign-time path retained;
- no persisted PvE telemetry, currency or reputation;
- player and bots use ordinary commands and validators;
- no hidden-information exception;
- no global progression/economy rebalance;
- no Arena, Admiral services, alliances or endgame;
- progression, determinism, performance, Browser E2E and Graphify remain mandatory.

## Critical unknowns

None.

If later work requires schema v17, save format v4, persisted PvE meta, a continuously running spawn service, hidden-information exception or fifth PR, stop and replace/amend Audit #142 first.

## Exact next action

1. Validate final PR #144 documentation head.
2. Resolve every review thread.
3. Squash merge #144 only with green CI, Browser E2E and Graphify.
4. Fetch fresh `main` and exact #144 merge SHA.
5. Create only #145 `BOT-PVE-OPERATIONS`.
