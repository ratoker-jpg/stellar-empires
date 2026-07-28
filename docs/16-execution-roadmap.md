# Execution Roadmap Stellar Empires — current entrypoint

**Status:** PR #131 active; #132 blocked until merge  
**Updated:** 2026-07-29  
**Last merged PR:** #130 · `2379fa7a30974381349433e4f0e0ba43d15f1511`  
**Active implementation baseline:** `1503c7d37fafc623bee4654ed460c92aa55a7b2f`  
**Release target:** 1.0 local PvE browser campaign

## Authoritative files

```text
docs/27-playable-game-roadmap-v5.md
docs/25a-local-campaign-world-speed-and-offline-progression.md
docs/audits/current-execution-state.md
docs/audits/current-batch-audit.md
docs/audits/contracts/local-campaign-time-pacing-01-clock-catchup.md
docs/audits/contracts/local-campaign-time-pacing-01-prs.md
docs/changes/pr131-campaign-settings-persistence.md
docs/project-status.json
docs/roadmap-pr-index.json
```

## Delivered merged state

- #101–#105: catalog runtime art;
- #106–#110: schema-v14 Universe navigation/action gate;
- #111–#115: coherent application shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121–#123: planet demolition, destruction and atomic recovery;
- #124: local campaign/world-speed/offline-progression product contract;
- #125–#129: player-centered navigation and measured usability closure;
- #130: accepted settings, persistence and chronological clock architecture.

## Active #131 delivery

The active branch now provides:

- schema v15 immutable checksummed campaign settings;
- faction/scenario/x1-x2-x5-x10 setup before state creation;
- save format v3 protected runtime metadata;
- pending catch-up and pending return-summary persistence shapes;
- v1–v14 state and v1/v2 envelope migration to x1 using validated envelope time;
- explicit replay initial configuration;
- autosave/manual/import/export/snapshot/recovery cursor integrity;
- immutable campaign identity in System / Saves;
- no active clock or offline processing yet.

## Remaining campaign-time gap

Until #132 merges:

- world speed does not yet drive elapsed time;
- open-session progression still uses manual controls;
- offline elapsed time is not processed;
- bot decisions are not chronologically interleaved with other time boundaries;
- no catch-up progress or return-summary presentation runs;
- manual fast-forward controls remain.

## Accepted sequence

```text
#131 CAMPAIGN-SETTINGS-PERSISTENCE — active
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE — blocked until #131 merges
```

### #132 reserved scope

- shared chronological active/offline orchestrator;
- event/logistics/world-event/bot decision boundaries;
- fixed-point speed mapping and fractional carry;
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
- finish #131 before starting #132;
- no numeric progression rebalance in #131–#132;
- campaign settings are immutable deterministic state;
- wall-clock cursor/continuation remain outside `GameState` but integrity protected;
- checkpoint cursor represents processed time only;
- no elapsed time is silently skipped;
- pending summary survives until acknowledgement;
- player and bots use ordinary commands and visibility rules;
- no continuously running server is required for Release 1.0;
- all repository, Browser E2E, Graphify and automated review gates remain mandatory.
