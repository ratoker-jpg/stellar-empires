# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Audit #130 accepted; PR #131 is the only next implementation  
**Updated:** 2026-07-28  
**Last merged PR:** #130 · `2379fa7a30974381349433e4f0e0ba43d15f1511`  
**Runtime baseline:** #129 · `a586224aa85eb3bc4676c3f4cd98a0ff7625aafa`  
**Release target:** 1.0 local PvE browser campaign

## Authoritative files

```text
docs/27-playable-game-roadmap-v5.md
docs/25a-local-campaign-world-speed-and-offline-progression.md
docs/audits/current-execution-state.md
docs/audits/current-batch-audit.md
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
- #125–#129: player-centered navigation, typed context, reversible flows and measured usability closure;
- #130: accepted campaign settings, persistence and chronological clock architecture.

## Current runtime gap

The game still has canonical simulation time but not a playable campaign clock:

- no immutable campaign settings;
- no campaign setup beyond faction;
- schema remains v14;
- save format remains v2;
- no protected runtime cursor/continuation;
- no open-session real-time progression;
- no offline catch-up;
- overdue bot decisions are not chronologically interleaved;
- manual player fast-forward controls remain;
- no catch-up progress or durable return summary.

## Accepted batch

```text
#131 CAMPAIGN-SETTINGS-PERSISTENCE — next
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE — blocked until #131 merges
```

### #131

- schema v15 immutable campaign settings;
- faction/scenario/x1-x2-x5-x10 setup;
- save format v3 protected runtime metadata;
- pending catch-up and pending summary persistence shapes;
- legacy x1 migration using validated envelope time;
- explicit replay initial configuration;
- import/export/snapshot/recovery integrity;
- no active clock yet.

### #132

- shared chronological active/offline orchestrator;
- bot decision boundaries;
- processed-cursor checkpoints;
- bounded resumable catch-up;
- active runtime clock;
- durable return summary until acknowledgement;
- removal of normal fast-forward controls;
- deterministic/browser/performance closure gate.

## Deferred ordered work

After #132, a separate `CAMPAIGN-PROGRESSION-BALANCE-01` audit determines exact progression compression and measured one-day campaign balance using the delivered clock/headless foundation.

Still later:

- multi-colony economy/logistics coherence;
- deeper PvE/meta and complete bot parity;
- alliances, solar war, Obelisks, Gates and victory/defeat;
- release balance, onboarding, mobile and hardening.

## Non-negotiable rules

- fresh current `main` is the only valid baseline;
- #131 only is authorized now;
- #132 cannot start before #131 merges;
- no numeric progression rebalance in #131–#132;
- campaign settings are immutable deterministic state;
- wall-clock cursor/continuation remain outside `GameState` but integrity protected;
- checkpoint cursor represents processed time only;
- no elapsed time is silently skipped;
- pending summary survives until acknowledgement;
- player and bots use ordinary commands and visibility rules;
- no continuously running server is required for Release 1.0;
- all repository, Browser E2E, Graphify and automated review gates remain mandatory.
