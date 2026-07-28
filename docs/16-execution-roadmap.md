# Execution Roadmap Stellar Empires — current entrypoint

**Status:** PR #131 merged; PR #132 is next  
**Updated:** 2026-07-29  
**Last merged PR:** #131 · `257e3effaab4e34285d00db64b6676fda364fcfd`  
**Runtime baseline:** schema v15 / save format v3  
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
- #106–#110: Universe navigation/action gate;
- #111–#115: coherent application shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121–#123: planet demolition, destruction and atomic recovery;
- #124: local campaign/world-speed/offline-progression product contract;
- #125–#129: player-centered navigation and measured usability closure;
- #130: accepted settings, persistence and chronological clock architecture;
- #131: schema-v15 campaign identity and save-format-v3 persistence foundation.

## Current runtime foundation

- immutable checksummed campaign settings;
- faction/scenario/x1-x2-x5-x10 setup before state creation;
- protected runtime cursor, continuation and pending-summary metadata;
- state v1–v14 and envelope v1/v2 migration to x1 using validated envelope time;
- explicit replay initial configuration;
- autosave/manual/import/export/snapshot/recovery cursor integrity;
- ordinary saves preserve processed time;
- pending target/remainder pairs require exact cursor consistency;
- immutable campaign identity in System / Saves.

## Remaining campaign-time gap

Until #132 merges:

- world speed does not drive real elapsed time;
- open-session progression still uses manual controls;
- offline elapsed time is not processed;
- bot decisions are not chronologically interleaved with other time boundaries;
- catch-up progress and return-summary presentation do not run;
- manual fast-forward controls remain.

## Accepted sequence

```text
#131 CAMPAIGN-SETTINGS-PERSISTENCE — merged
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE — next
```

### #132 exact scope

- shared chronological active/offline orchestrator;
- event/logistics/world-event/bot decision boundaries;
- fixed-point speed mapping and fractional carry;
- processed-cursor checkpoints;
- bounded resumable catch-up;
- active runtime clock;
- durable return summary until acknowledgement;
- removal of normal fast-forward controls;
- deterministic/browser/performance closure gate;
- batch archive and closure.

## Deferred ordered work

After #132, a separate `CAMPAIGN-PROGRESSION-BALANCE-01` audit determines exact progression compression and measured one-day campaign balance using the delivered clock/headless foundation.

Still later:

- multi-colony economy/logistics coherence;
- deeper PvE/meta and complete bot parity;
- alliances, solar war, Obelisks, Gates and victory/defeat;
- release balance, onboarding, mobile and hardening.

## Non-negotiable rules

- fresh current `main` is the only valid baseline;
- create only #132 next;
- no numeric progression rebalance in #132;
- campaign settings remain immutable deterministic state;
- wall-clock cursor/continuation remain outside `GameState` but integrity protected;
- checkpoint cursor represents processed time only;
- no elapsed time is silently skipped;
- pending summary survives until acknowledgement;
- player and bots use ordinary commands and visibility rules;
- no continuously running server is required for Release 1.0;
- all repository, Browser E2E, Graphify and automated review gates remain mandatory.
