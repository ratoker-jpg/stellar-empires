# Execution Roadmap Stellar Empires — current entrypoint

**Status:** PR #132 is the active final implementation of the accepted campaign-time batch  
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
docs/changes/pr132-campaign-clock-offline-gate.md
docs/audits/completed/local-campaign-time-pacing-01.md
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

## Active PR #132 outcome

The active branch now contains:

- one chronological active/offline campaign-time orchestrator;
- fixed-point x1/x2/x5/x10 mapping with persistent fractional carry;
- scheduled-event, logistics, world-event and deterministic bot-decision boundaries;
- active open-session progression;
- bounded resumable offline catch-up with processed-cursor checkpoints;
- cooperative progress presentation;
- durable integrity-protected return summary until acknowledgement;
- removal of normal player fast-forward controls;
- one-day/seven-day deterministic, performance and Chromium Browser E2E gates;
- change documentation and batch archive.

## Active sequence

```text
#131 CAMPAIGN-SETTINGS-PERSISTENCE — merged
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE — final validation and merge
→ CAMPAIGN-PROGRESSION-BALANCE-01 — next audit only after #132 merges
```

## Final #132 closure route

1. pass final asset/lint/typecheck/test/build CI;
2. pass Chromium Browser E2E;
3. pass Graphify;
4. obtain clean automated review with no unresolved P0/P1/P2 findings;
5. update PR description with exact final head and run IDs;
6. squash merge #132;
7. synchronize the exact merge SHA and close the batch on `main`.

## Deferred ordered work

After #132, a separate `CAMPAIGN-PROGRESSION-BALANCE-01` audit must measure complete campaign duration on the delivered clock foundation and decide exact level caps, costs, durations, unlock pacing and rewards.

Still later:

- multi-colony economy/logistics coherence;
- deeper PvE/meta and complete bot parity;
- alliances, solar war, Obelisks, Gates and victory/defeat;
- release balance, onboarding, mobile and hardening.

## Non-negotiable rules

- no numeric progression rebalance in #132;
- campaign settings remain immutable deterministic state;
- wall-clock cursor/continuation remain outside `GameState` but integrity protected;
- checkpoint cursor represents processed time only;
- no elapsed time is silently skipped;
- pending summary survives until acknowledgement;
- player and bots use ordinary commands and visibility rules;
- no continuously running server is required for Release 1.0;
- no implementation after #132 is authorized before the next audit;
- all repository, Browser E2E, Graphify and automated review gates remain mandatory.
