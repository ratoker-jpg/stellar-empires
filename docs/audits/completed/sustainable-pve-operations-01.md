# Completed batch — SUSTAINABLE-PVE-OPERATIONS-01

**Status:** completed by PR #146 after final gates  
**Roadmap milestone:** M6a — sustainable existing PvE operations  
**Complexity:** medium  
**Audit PR:** #142  
**Implementation PRs:** #143–#146  
**Schema/save:** v16 / v3 retained  
**Divergence:** none

## Accepted sequence

```text
#142 Audit                          81f1959b0bdbdd72d05dc21a2dce0a9e1470f010
→ #143 PVE-TARGET-RECOVERY         e3d2c28385abd9772a18257eeb313bd8d45e581e
→ #144 PVE-OPERATIONS-INTELLIGENCE dbc5bdf0bce439efa5f0c61c8846bbd9960ba43a
→ #145 BOT-PVE-OPERATIONS          62aae31e2ad5e4ad04385a5cd94f77a70579d72f
→ #146 PVE-SUSTAINABILITY-GATE     code head a2e466bfffa3494ae9a08e2c4250e6fc78c89290
```

The exact #146 squash merge SHA does not exist until GitHub performs the merge. The next Audit PR must synchronize that generated SHA before selecting another implementation batch. No fifth M6a implementation PR is authorized.

## Delivered outcome

### Sustainable targets

- non-final object extraction keeps the five-minute active cooldown;
- final depletion recovers after exactly 21,600 campaign seconds;
- object identity, coordinate, kind, hazard and baseline yield remain stable;
- surviving pirate bases recover deterministic resources and defenses;
- destroyed pirate bases respawn only at their free original position;
- occupied original positions are never overwritten;
- long active/offline advances preserve chronological report/recovery visibility;
- targeted `pirate-hunt` applies 1,500 permille only to its active target.

### Canonical player intelligence and UX

- one pure PvE opportunity model covers expeditions, objects, pirate bases and active events;
- Operations exposes availability, exact recovery, roles/fleets, duration/fuel, yield/hazard/control and multipliers;
- routed forms retain ordinary commands and explicit labels;
- world-event reports use readable targets and mechanical effects;
- passive recovery creates no fake reward/report rows;
- release and mobile viewports remain horizontally stable.

### Honest bot participation

- bot perception exposes only globally public PvE data plus owned state/stored intelligence;
- explorer, industrial and aggressive planners consume the canonical opportunity model;
- bots use ordinary fleet creation, expedition, object, targeted attack and recall commands;
- no hull, fuel or resource fabrication is possible;
- object/expedition plans protect a 40% gas reserve;
- pirate-hunt requires active event, current level-3 intelligence, 120% known-power safety and normal validation;
- real recovery/high-threat work remains ahead of PvE;
- routine scheduler PvE unlocks after heavy-fleet, preserving compressed progression;
- one `pve` command maximum is emitted per decision;
- hidden player state does not change the plan.

## Final sustainability evidence

The combined closure audit covers all three player factions:

```text
Aegis
Synod
Veyra
```

It proves:

- 48-hour direct, six-hour chunked and 24-hour save-loaded equality;
- exact object recovery and ordinary reuse;
- pirate recovery, free respawn and occupied-position blocking;
- target-only pirate-hunt rewards;
- world-event chain preservation;
- stable target counts and unique occupied coordinates;
- bounded command/event/world-event histories;
- legal ordinary bot expedition, object and pirate-hunt commands;
- deterministic, non-mutating and hidden-state-isolated bot plans.

Code-head gates:

```text
CI             30747647153 — success
Browser E2E    30747647147 — final code-head conclusion checked before docs closure
Graphify       30747647145 — success
```

Measured evidence:

```text
106 test files / 557 tests passed
13 new closure tests passed
15 progression cases / zero phase violations
1 campaign day  6.22 s < 15 s
7 campaign days 29.56 s < 30 s
```

## Explicit exclusions retained

- no schema v17/save format v4;
- no persisted PvE currency, reputation or telemetry;
- no Arena or Admiral service/meta systems;
- no continuously running target server;
- no hidden-information exception for bots;
- no global progression/start-bank rebalance;
- no physical logistics/convoy combat;
- no alliances, Solar War, functional Gates or endgame.

## Post-closure rule

M6a implementation is closed. The next repository change may only be a new Audit PR that:

1. synchronizes the exact #146 squash merge SHA;
2. re-reads actual `main` and the canonical roadmap;
3. selects and sizes the next batch;
4. authorizes implementation only through a new accepted contract.
