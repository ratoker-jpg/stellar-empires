# AI Continuation Guide

**Status:** PR #135 active and blocked; recovery documentation PR #136 records the exact continuation chain  
**Updated:** 2026-07-31  
**Last merged runtime PR:** #134 `PROGRESSION-PROFILE-FOUNDATION` · `aa87e764ef40444660039dc8d6a96d7f5514cc23`  
**Verified main:** `1a9ea165f96c8e46aae668a962ea7e1048252812`  
**Active implementation:** #135 `COMPRESSED-CAMPAIGN-PROGRESSION-GATE`  
**Verified #135 head:** `69e5cf7a505be3b71363453751fc7463ef3c28b9`  
**Recovery handoff:** `docs/handoffs/2026-07-31-pr135-recovery-and-delivery-chain.md`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

Current GitHub history and actual `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/handoffs/2026-07-31-pr135-recovery-and-delivery-chain.md`
6. `docs/audits/contracts/campaign-progression-balance-01-profile.md`
7. `docs/audits/contracts/campaign-progression-balance-01-prs.md`
8. `docs/audits/evidence/campaign-progression-balance-01-baseline.md`
9. `docs/audits/evidence/campaign-progression-balance-01-candidate.md`
10. `docs/audits/evidence/campaign-progression-balance-01-source-map.md`
11. `docs/audits/evidence/campaign-progression-balance-01-graphify.md`
12. `docs/audits/completed/local-campaign-time-pacing-01.md`
13. `docs/changes/pr132-campaign-clock-offline-gate.md`
14. `docs/25a-local-campaign-world-speed-and-offline-progression.md`
15. this document
16. `docs/project-status.json`
17. `docs/roadmap-pr-index.json`
18. `docs/27-playable-game-roadmap-v5.md`
19. latest merged PRs, open PRs and actual `main`

## Delivered through merged runtime `main`

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

## Current accepted batch

```text
schema v16
CampaignSettings.progressionProfile = legacy-v1 | compressed-v1
schema-v15 and older saves/replays → legacy-v1
new normal campaigns → compressed-v1
save format v3 retained
complexity heavy
exactly 2 implementation PRs
```

Ordered implementation:

```text
#134 PROGRESSION-PROFILE-FOUNDATION — merged
→ #135 COMPRESSED-CAMPAIGN-PROGRESSION-GATE — active final implementation
```

PR #135 remains the only authorized implementation branch. Do not create a third progression implementation PR.

## Current PR #135 status

Verified state:

```text
branch            agent/compressed-campaign-progression-gate
head              69e5cf7a505be3b71363453751fc7463ef3c28b9
state             open, draft, mergeable
Graphify          30629427690 — success
Browser E2E       30629427762 — success
CI                30629427716 — failure
```

The latest scenario completes in 13 h 42 min, but phase timings fail:

```text
player colonization 284 min
Aegis colonization  376 min
Synod colonization  300 min
Veyra colonization  296 min
required maximum    180 min
```

Heavy-fleet and endgame-preparation gates also fail for some or all empires. The seven-day catch-up takes about 72.95 seconds against the approved sub-30-second budget.

The accepted starting bank remains exactly:

```text
15,000 metal
12,000 crystal
 6,000 gas
```

Larger speculative banks were reverted. Do not restore them or weaken tests without an explicit contract amendment.

## Exact recovery action

1. Fetch actual PR #135 head and workflow runs; this snapshot may be stale.
2. Continue the existing branch only.
3. Fix seven-day catch-up performance without truncation or lost deterministic work.
4. Improve phase timing only through ordinary mechanics and ordinary commands.
5. Parallel one-scout expedition fleets are a candidate, not an accepted result; isolate and measure them.
6. Do not use hidden bot resources, requirement skips, privileged commands or hidden outcome selection.
7. Rerun focused gates, then full CI, Browser E2E and Graphify.
8. Synchronize #135 with latest `main` before final documentation changes.
9. Archive the batch and merge only after every required check is green.

Detailed measurements and file-level guidance are in `docs/handoffs/2026-07-31-pr135-recovery-and-delivery-chain.md`.

## Delivery chain after #135

Documentation continuity PR #136 is outside implementation counts. It shifts the next audit number:

```text
#135 finish and merge
→ #137 Audit from fresh main
→ #138–#141 only if #137 authorizes a medium four-PR batch
→ #142 Audit from fresh main
→ #143–#148 only if #142 authorizes a light six-PR batch
→ #149 Audit
→ execute only the implementation batch authorized by #149
```

The likely subject for #137 is M5 multi-colony economy/logistics coherence, but no implementation scope is authorized until #137 itself audits the current code and merges.

## Hard stop rules

- Do not open #137 while #135 remains unmerged.
- Do not open #138 before #137 merges.
- Do not treat documentation PR #136 as one of the 2/4/6 implementation PRs.
- Do not continue from an abandoned branch when GitHub shows a newer active branch.
- Do not rely on private chat history when repository evidence is available.
