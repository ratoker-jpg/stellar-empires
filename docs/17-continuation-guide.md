# AI Continuation Guide

**Status:** Audit PR #133 `CAMPAIGN-PROGRESSION-BALANCE-01` active; no implementation authorized yet  
**Updated:** 2026-07-29  
**Last merged PR:** #132 `CAMPAIGN-CLOCK-OFFLINE-GATE` · `df56566ce6d311ecef81103dddb924b5da0148c1`  
**Runtime baseline:** schema v15 / save format v3 / shared active-offline campaign clock  
**Active branch:** `agent/campaign-progression-balance-audit`  
**Proposed next sequence after Audit merge:** #134–#135

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
8. `docs/audits/evidence/campaign-progression-balance-01-source-map.md`
9. `docs/audits/evidence/campaign-progression-balance-01-graphify.md`
10. `docs/audits/completed/local-campaign-time-pacing-01.md`
11. `docs/changes/pr132-campaign-clock-offline-gate.md`
12. `docs/25a-local-campaign-world-speed-and-offline-progression.md`
13. this document
14. `docs/project-status.json`
15. `docs/roadmap-pr-index.json`
16. latest merged PRs and actual `main`

## Delivered through merged `main`

- #101–#105: complete catalog runtime art;
- #106–#110: Universe navigation/action gate;
- #111–#115: routed application shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121–#123: demolition, whole-planet destruction and recovery;
- #124: local campaign product contract;
- #125–#129: navigation/usability repair;
- #130: accepted local campaign time/persistence architecture;
- #131: immutable campaign settings and cursor-safe persistence foundation;
- #132: shared chronological active/offline clock, resumable catch-up and durable return summary.

## Audit #133 verified baseline

Source-importing CI measurement proves at recommended x2:

```text
first combat ship       0.44 h
first scout             0.89 h
first colonizer         4.22 h before resource waiting
first planet destroyer 22.42 h before resource waiting
Supreme Gates path    223.36 h before resource waiting
```

Raw all-level catalogs require 731.30 h for buildings and 118.94 h for research at x2. Existing schema-v15 saves/replays do not record a progression-profile identity, so global unversioned tuning is rejected.

## Proposed contract in #133

```text
schema v16
CampaignSettings.progressionProfile = legacy-v1 | compressed-v1
legacy saves → legacy-v1
new campaigns → compressed-v1
save format v3 retained
complexity heavy
exactly 2 implementation PRs
```

Accepted only after #133 merges:

```text
#134 PROGRESSION-PROFILE-FOUNDATION
→ #135 COMPRESSED-CAMPAIGN-PROGRESSION-GATE
```

The compressed profile targets an endgame-ready state within 12 real hours at recommended x2, with 16 hours as the accepted hard maximum. Actual alliances, Solar War, functional Gates and victory/defeat remain outside this batch.

## Current rules

- PR #133 may change only audit evidence, measurement tests and canonical planning/status documents;
- do not alter gameplay values in the Audit PR;
- do not open #134 before #133 is green, reviewed and merged;
- preserve schema-v15/save-v3/runtime behavior on `main` until implementation begins;
- after #133 merge, use exact accepted profile constants and the two-PR sequence only;
- any numeric divergence must be documented with a failing deterministic seed and full matrix rerun.

## Recovery

If the Audit chat/session is interrupted, resume PR #133 from its current head, re-check CI, Browser E2E, Graphify and review threads, then finish/merge the audit. Do not skip directly to balance implementation.
