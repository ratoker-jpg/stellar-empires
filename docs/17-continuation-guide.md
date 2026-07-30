# AI Continuation Guide

**Status:** PR #134 merged; final implementation PR #135 is next  
**Updated:** 2026-07-30  
**Last merged PR:** #134 `PROGRESSION-PROFILE-FOUNDATION` · `aa87e764ef40444660039dc8d6a96d7f5514cc23`  
**Runtime baseline:** schema v16 / save format v3 / `legacy-v1 | compressed-v1` progression profiles  
**Accepted target:** compressed economy, rewards, bot phases and measured campaign closure  
**Next branch:** `agent/compressed-campaign-progression-gate`

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
- #133: accepted measured progression-profile and two-PR implementation contract;
- #134: schema-v16 dual-profile foundation, legacy migration, deterministic profile consumers and profile identity UI.

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
#134 PROGRESSION-PROFILE-FOUNDATION — merged as aa87e764ef40444660039dc8d6a96d7f5514cc23
→ #135 COMPRESSED-CAMPAIGN-PROGRESSION-GATE — next
```

PR #134 delivered:

- schema-v16 immutable profile identity;
- legacy migration and compressed new-campaign default;
- explicit replay/checksum identity;
- central typed profile registry;
- profile-aware building/research/unit/defence/repair/upgrade resolution;
- profile identity in New Game, System and Saves;
- old queued-item compatibility;
- formula, migration and three-faction parity gates.

PR #135 must deliver only:

- compressed starting stocks, capacity and population;
- accepted production, storage and reward multipliers;
- consistent mission, expedition and space-object rewards;
- deterministic bot progression phases using ordinary commands;
- milestone runner and accepted seed/faction matrix;
- x1/x2/x5/x10 exact scaling equivalence;
- active/offline/save-load partition equivalence;
- 12-hour target and 16-hour hard-maximum closure;
- release-viewport Browser E2E, final change record and batch archive.

## Recovery

Start #135 from fresh synchronized `main`. Do not alter accepted profile identity or constants silently. Any required numeric divergence needs a recorded deterministic failure, explicit contract amendment and full matrix rerun.
