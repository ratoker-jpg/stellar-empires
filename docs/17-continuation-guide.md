# AI Continuation Guide

**Status:** `LOCAL-CAMPAIGN-TIME-PACING-01` completed; no implementation PR is active  
**Updated:** 2026-07-29  
**Last merged PR:** #132 `CAMPAIGN-CLOCK-OFFLINE-GATE` · `df56566ce6d311ecef81103dddb924b5da0148c1`  
**Runtime baseline:** schema v15 / save format v3 / shared active-offline campaign clock  
**Last completed batch:** `LOCAL-CAMPAIGN-TIME-PACING-01`  
**Next authorized work:** Audit `CAMPAIGN-PROGRESSION-BALANCE-01`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

Current GitHub history and actual `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/completed/local-campaign-time-pacing-01.md`
6. `docs/changes/pr131-campaign-settings-persistence.md`
7. `docs/changes/pr132-campaign-clock-offline-gate.md`
8. `docs/25a-local-campaign-world-speed-and-offline-progression.md`
9. `docs/23-bot-simulation-time-contract.md`
10. this document
11. `docs/project-status.json`
12. `docs/roadmap-pr-index.json`
13. `docs/27-playable-game-roadmap-v5.md`
14. latest merged PRs and actual `main`

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

## Completed campaign-time foundation

Merged `main` now provides:

- immutable faction, topology and x1/x2/x5/x10 campaign settings;
- schema-v15 deterministic state and save-format-v3 integrity;
- one DOM-independent chronological orchestrator for active and offline time;
- scheduled-event, logistics, world-event and bot-decision boundaries;
- integer fixed-point speed mapping with persistent fractional carry;
- automatic open-session campaign progression;
- bounded resumable offline catch-up with processed-cursor checkpoints;
- cooperative progress and retry presentation;
- redacted durable return summary until successful acknowledgement;
- checksum-safe JSON save round trips;
- keyboard-safe modal acknowledgement isolated from background game controls;
- no normal player fast-forward controls.

## Final #132 validation

```text
head 67cca4da2c401d2d9f5573e8c463dbbb570204d5
CI 30488370854 — passed
Browser E2E 30488370956 — passed, 24/24 Chromium scenarios
Graphify 30488370908 — passed
review — no unresolved actionable P0/P1/P2 thread
squash merge df56566ce6d311ecef81103dddb924b5da0148c1
```

## Known limitations

- progression is not yet measured or compressed for the targeted one-active-day campaign;
- multi-colony economy and logistics coherence require a later audit;
- deeper PvE/meta systems and complete bot parity remain incomplete;
- alliances, Solar War, Obelisks, Gates and final victory/defeat are not implemented;
- full phone/mobile layout, onboarding and release hardening remain incomplete.

## Next authorized route

```text
fresh main after #132
→ create Audit PR CAMPAIGN-PROGRESSION-BALANCE-01
→ measure complete campaign duration with the delivered fake-clock/headless foundation
→ decide exact level caps, costs, durations, unlock pacing and rewards
→ merge the audit contract
→ only then begin its authorized implementation batch
```

No progression value may change before the new audit is accepted. The completed batch archive is `docs/audits/completed/local-campaign-time-pacing-01.md`.
