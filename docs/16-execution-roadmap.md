# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Audit PR #133 `CAMPAIGN-PROGRESSION-BALANCE-01` active  
**Updated:** 2026-07-29  
**Last merged PR:** #132 · `df56566ce6d311ecef81103dddb924b5da0148c1`  
**Runtime baseline:** schema v15 / save format v3 / shared active-offline campaign clock  
**Proposed target after accepted audit:** schema v16 / save format v3 / dual progression profiles

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
- #130–#132: immutable campaign settings, save-format-v3 persistence and active/offline campaign clock.

## Audit #133 measured problem

At recommended x2, current source requires:

```text
first combat ship       0.44 h
first scout             0.89 h
first colonizer         4.22 h before resource waiting
first planet destroyer 22.42 h before resource waiting
Supreme Gates path    223.36 h before resource waiting
```

Raw all-level buildings require 731.30 x2 hours and research 118.94 hours. World speed alone cannot satisfy the canonical roughly-one-day active campaign target.

## Proposed accepted solution

```text
schema v16
progressionProfile = legacy-v1 | compressed-v1
old saves/replays → legacy-v1
new campaigns → compressed-v1
save format v3 retained
complexity heavy
exactly 2 implementation PRs
```

The measured compressed candidate reaches player critical paths in:

```text
15.08 / 27.85 / 104.89 / 221.53 / 352.58 minutes at x2
```

Accepted maxima are 16 / 30 / 120 / 360 / 720 minutes. Full endgame-ready progression targets 12 x2 hours and may not exceed 16 hours across accepted seeds.

## Ordered sequence

```text
#133 CAMPAIGN-PROGRESSION-BALANCE-01 — active Audit
→ #134 PROGRESSION-PROFILE-FOUNDATION
→ #135 COMPRESSED-CAMPAIGN-PROGRESSION-GATE
```

#134 and #135 are authorized only after #133 merges. Actual alliances, Solar War, functional Gates and victory/defeat remain later audits.

## Non-negotiable rules

- Audit #133 changes no gameplay value;
- progression profile is immutable deterministic campaign identity;
- legacy saves/replays retain exact legacy behavior;
- player and bots resolve one shared profile and use ordinary commands;
- world speed continues to accelerate canonical time only;
- no hidden bot resources or requirement skips;
- no runtime speed/profile switching;
- CI, Browser E2E, Graphify and automated review remain mandatory;
- numeric divergence requires recorded failing seed, explicit contract amendment and full matrix rerun.
