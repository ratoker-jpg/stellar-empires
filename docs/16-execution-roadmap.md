# Execution Roadmap Stellar Empires — current entrypoint

**Status:** PR #132 merged; `LOCAL-CAMPAIGN-TIME-PACING-01` completed  
**Updated:** 2026-07-29  
**Last merged PR:** #132 · `df56566ce6d311ecef81103dddb924b5da0148c1`  
**Runtime baseline:** schema v15 / save format v3 / shared active-offline campaign clock  
**Release target:** 1.0 local PvE browser campaign

## Authoritative files

```text
docs/27-playable-game-roadmap-v5.md
docs/25a-local-campaign-world-speed-and-offline-progression.md
docs/audits/current-execution-state.md
docs/audits/current-batch-audit.md
docs/audits/completed/local-campaign-time-pacing-01.md
docs/changes/pr131-campaign-settings-persistence.md
docs/changes/pr132-campaign-clock-offline-gate.md
docs/project-status.json
docs/roadmap-pr-index.json
```

## Delivered merged state

- #101–#105: catalog runtime art;
- #106–#110: Universe navigation/action gate;
- #111–#115: coherent application shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121–#123: planet demolition, destruction and atomic recovery;
- #124: local campaign/world-speed/offline-progression product contract;
- #125–#129: player-centered navigation and measured usability closure;
- #130: accepted settings, persistence and chronological clock architecture;
- #131: schema-v15 campaign identity and save-format-v3 persistence foundation;
- #132: automatic active time, bounded resumable offline catch-up and durable return summary.

## Completed M4c outcome

Merged `main` contains:

- one chronological active/offline campaign-time orchestrator;
- fixed-point x1/x2/x5/x10 mapping with persistent fractional carry;
- scheduled-event, logistics, world-event and deterministic bot-decision boundaries;
- active open-session progression;
- bounded resumable offline catch-up with processed-cursor checkpoints;
- cooperative progress and retained retry presentation;
- durable integrity-protected redacted return summary until acknowledgement;
- checksum-safe JSON persistence after completed checkpoints;
- keyboard-safe modal actions isolated from background game controls;
- removal of normal player fast-forward controls;
- one-day/seven-day deterministic, performance and Chromium Browser E2E gates.

## Completed sequence

```text
#130 LOCAL-CAMPAIGN-TIME-PACING-01 — accepted audit
→ #131 CAMPAIGN-SETTINGS-PERSISTENCE — merged
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE — merged
→ CAMPAIGN-PROGRESSION-BALANCE-01 — next Audit PR only
```

## Final #132 evidence

1. final head `67cca4da2c401d2d9f5573e8c463dbbb570204d5`;
2. CI `30488370854` passed;
3. Chromium Browser E2E `30488370956` passed, 24/24;
4. Graphify `30488370908` passed;
5. no unresolved actionable P0/P1/P2 review thread;
6. squash merge `df56566ce6d311ecef81103dddb924b5da0148c1`.

## Next ordered audit

`CAMPAIGN-PROGRESSION-BALANCE-01` must measure complete campaign duration on the delivered clock foundation and decide exact level caps, costs, durations, unlock pacing, queue compression and rewards.

No numeric progression change is authorized before that audit is accepted.

Still later:

- multi-colony economy/logistics coherence;
- deeper PvE/meta and complete bot parity;
- alliances, Solar War, Obelisks, Gates and victory/defeat;
- release balance, onboarding, mobile and hardening.

## Non-negotiable rules

- campaign settings remain immutable deterministic state;
- wall-clock cursor/continuation remain outside `GameState` but integrity protected;
- checkpoint cursor represents processed time only;
- no elapsed time is silently skipped;
- pending summary survives until successful acknowledgement;
- player and bots use ordinary commands and visibility rules;
- no continuously running server is required for Release 1.0;
- the next repository PR is an Audit PR, not unaudited implementation;
- repository, Browser E2E, Graphify and automated review gates remain mandatory.
