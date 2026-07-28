# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Audit PR #130 active; implementation PR #131 is blocked until audit acceptance  
**Updated:** 2026-07-28  
**Last merged PR:** #129 · `a586224aa85eb3bc4676c3f4cd98a0ff7625aafa`  
**Verified baseline:** `45bd3297d402fd96691a26c60e47bd39a420f174`  
**Release target:** 1.0 local PvE browser campaign

## Authoritative files

```text
docs/27-playable-game-roadmap-v5.md
docs/25a-local-campaign-world-speed-and-offline-progression.md
docs/audits/current-execution-state.md
docs/audits/current-batch-audit.md
docs/audits/evidence/local-campaign-time-pacing-01-code-and-flow.md
docs/audits/contracts/local-campaign-time-pacing-01-clock-catchup.md
docs/audits/contracts/local-campaign-time-pacing-01-prs.md
docs/project-status.json
docs/roadmap-pr-index.json
```

## Delivered state

- #101–#105: catalog runtime art;
- #106–#110: schema-v14 Universe navigation/action gate;
- #111–#115: coherent application shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121–#123: planet demolition, destruction and atomic recovery;
- #124: local campaign/world-speed/offline-progression product contract;
- #125–#129: player-centered navigation, typed context, reversible flows and measured usability closure.

## Current gap

The game has canonical simulation time but not a canonical campaign clock:

- no immutable world speed;
- no campaign setup beyond faction;
- no open-session real-time progression;
- no offline catch-up;
- no protected runtime cursor;
- bot overdue decisions are not chronologically interleaved;
- manual player fast-forward controls remain;
- no catch-up progress or return summary.

## Audit #130 decision

`LOCAL-CAMPAIGN-TIME-PACING-01` is a heavy two-PR batch:

```text
#130 Audit only
→ #131 CAMPAIGN-SETTINGS-PERSISTENCE
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE
```

### #131

- schema v15 campaign settings;
- save format v3 runtime metadata;
- faction/scenario/speed campaign setup;
- legacy x1 migration;
- replay and save/recovery integrity;
- no active clock yet.

### #132

- shared chronological active/offline orchestrator;
- bot decision boundaries;
- bounded resumable catch-up;
- active runtime clock;
- return summary;
- removal of normal fast-forward controls;
- complete deterministic/browser/performance gate.

## Deferred ordered work

After #132, a separate `CAMPAIGN-PROGRESSION-BALANCE-01` audit determines exact progression compression and one-day campaign balance. It must use measured headless runs from the delivered clock foundation.

Still later:

- multi-colony economy/logistics coherence;
- deeper PvE/meta and complete bot parity;
- alliances, solar war, Obelisks, Gates and victory/defeat;
- release balance, onboarding, mobile and hardening.

## Non-negotiable rules

- fresh current `main` is the only valid baseline;
- no implementation before Audit #130 merges;
- no numeric progression rebalance in #131–#132;
- campaign settings are immutable deterministic state;
- wall-clock cursor remains outside GameState;
- no elapsed time is silently skipped;
- player and bots use ordinary commands and visibility rules;
- no continuously running server is required for Release 1.0;
- all repository, Browser E2E, Graphify and automated review gates remain mandatory.
