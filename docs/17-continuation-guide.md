# AI Continuation Guide

**Status:** Audit PR #133 accepted; implementation PR #134 is next  
**Updated:** 2026-07-29  
**Last merged PR:** #133 `CAMPAIGN-PROGRESSION-BALANCE-01` · `989c2c0b8fc3d5cfe672af267a248b6b384331cc`  
**Runtime baseline:** schema v15 / save format v3 / shared active-offline campaign clock  
**Accepted target:** schema v16 / `legacy-v1 | compressed-v1` progression profiles  
**Next branch:** `agent/progression-profile-foundation`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

Current GitHub history and actual `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/campaign-progression-balance-01-profile.md`
6. `docs/audits/contracts/campaign-progression-balance-01-prs.md`
7. `docs/audits/evidence/campaign-progression-balance-01-baseline.md`
8. `docs/audits/evidence/campaign-progression-balance-01-candidate.md`
9. `docs/audits/evidence/campaign-progression-balance-01-source-map.md`
10. `docs/audits/evidence/campaign-progression-balance-01-graphify.md`
11. `docs/audits/completed/local-campaign-time-pacing-01.md`
12. `docs/changes/pr132-campaign-clock-offline-gate.md`
13. `docs/25a-local-campaign-world-speed-and-offline-progression.md`
14. this document
15. `docs/project-status.json`
16. `docs/roadmap-pr-index.json`
17. latest merged PRs and actual `main`

## Delivered through merged `main`

- #101–#105: complete catalog runtime art;
- #106–#110: Universe navigation/action gate;
- #111–#115: routed application shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121–#123: demolition, whole-planet destruction and recovery;
- #124: local campaign product contract;
- #125–#129: navigation/usability repair;
- #130–#132: immutable settings, persistence and shared active/offline campaign time;
- #133: accepted measured progression-profile and two-PR implementation contract.

## Accepted progression contract

```text
schema v16
CampaignSettings.progressionProfile = legacy-v1 | compressed-v1
schema-v15 and older saves/replays → legacy-v1
new normal campaigns → compressed-v1
save format v3 retained
complexity heavy
exactly 2 implementation PRs
```

Measured candidate at recommended x2:

```text
first combat ship        15.08 min · accepted max 16
first scout              27.85 min · accepted max 30
first colonizer         104.89 min · accepted max 120
first planet destroyer  221.53 min · accepted max 360
endgame-ready path      352.58 min · accepted max 720
```

Full deterministic endgame-ready progression targets 12 x2 real hours and has a 16-hour hard maximum. Actual alliances, Solar War, functional Gates and victory/defeat remain outside this batch.

## Ordered implementation

```text
#134 PROGRESSION-PROFILE-FOUNDATION
→ #135 COMPRESSED-CAMPAIGN-PROGRESSION-GATE
```

PR #134 must deliver only:

- schema-v16 immutable profile identity;
- legacy migration and new-campaign default;
- explicit replay/checksum identity;
- central typed profile registry;
- profile-aware building/research/unit/defence/repair/upgrade resolution;
- profile identity in New Game, System and Saves;
- old queued-item compatibility;
- formula, migration and three-faction parity gates.

Economy/reward multipliers, deterministic bot phases and full 12/16-hour campaign closure belong to #135.

## Recovery

Start #134 from fresh synchronized `main`. Do not alter accepted constants silently. Any required numeric divergence needs a recorded deterministic failure, explicit contract amendment and full matrix rerun.
