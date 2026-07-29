# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Audit PR #133 accepted; PR #134 next  
**Updated:** 2026-07-29  
**Last merged PR:** #133 · `989c2c0b8fc3d5cfe672af267a248b6b384331cc`  
**Runtime baseline:** schema v15 / save format v3 / shared active-offline campaign clock  
**Accepted target:** schema v16 / save format v3 / dual progression profiles

## Authoritative files

```text
docs/27-playable-game-roadmap-v5.md
docs/25a-local-campaign-world-speed-and-offline-progression.md
docs/audits/current-execution-state.md
docs/audits/current-batch-audit.md
docs/audits/contracts/campaign-progression-balance-01-profile.md
docs/audits/contracts/campaign-progression-balance-01-prs.md
docs/audits/evidence/campaign-progression-balance-01-baseline.md
docs/audits/evidence/campaign-progression-balance-01-candidate.md
docs/audits/evidence/campaign-progression-balance-01-source-map.md
docs/audits/evidence/campaign-progression-balance-01-graphify.md
docs/project-status.json
docs/roadmap-pr-index.json
```

## Delivered merged state

- #101–#105: catalog runtime art;
- #106–#110: Universe navigation/action gate;
- #111–#115: coherent application shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121–#123: planet demolition, destruction and recovery;
- #124: local campaign product contract;
- #125–#129: navigation/usability closure;
- #130–#132: immutable settings, save-v3 persistence and active/offline campaign clock;
- #133: measured and accepted dual-profile progression contract.

## Accepted M4d solution

```text
schema v16
progressionProfile = legacy-v1 | compressed-v1
schema-v15 and older saves/replays → legacy-v1
new campaigns → compressed-v1
save format v3 retained
complexity heavy
exactly 2 implementation PRs
```

Measured compressed critical paths at recommended x2:

```text
15.08 / 27.85 / 104.89 / 221.53 / 352.58 minutes
```

Accepted maxima are 16 / 30 / 120 / 360 / 720 minutes. Full deterministic endgame-ready progression targets 12 x2 hours and may not exceed 16 hours across accepted seeds.

## Ordered implementation

```text
#133 CAMPAIGN-PROGRESSION-BALANCE-01 — merged Audit
→ #134 PROGRESSION-PROFILE-FOUNDATION — next
→ #135 COMPRESSED-CAMPAIGN-PROGRESSION-GATE
```

PR #134 owns schema/profile identity, migration, central profile registry, profile-aware definition/formula consumers, UI identity and compatibility gates. PR #135 owns starting economy, reward multipliers, deterministic bot phases and full endgame-ready duration closure.

Actual alliances, Solar War, functional Gates and victory/defeat remain later audits.

## Non-negotiable rules

- progression profile is immutable deterministic campaign identity;
- legacy saves/replays retain exact legacy behavior;
- player and bots resolve one shared profile and use ordinary commands;
- existing queued items preserve paid values and completion timestamps;
- world speed continues to accelerate canonical time only;
- no hidden bot resources or requirement skips;
- no runtime speed/profile switching;
- #134 must not absorb #135 closure scope;
- CI, Browser E2E, Graphify and automated review remain mandatory;
- numeric divergence requires recorded failing seed, explicit contract amendment and full matrix rerun.
