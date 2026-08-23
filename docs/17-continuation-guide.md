# Continuation guide

## Current handoff

Release 1.0 remains closed. Runtime baseline remains schema v19 / save format v6 / migration none.

Current batch:

`POST-1.0-BOT-STRATEGY-DIFFERENTIATION`

Accepted Audit #178 is merged:

`4b96d457fad1577a0663210864381a0d3a33cb77`

Implementation chain:

```text
#179 POST-1.0-PR1-COMPRESSED-PERSONALITY-STRATEGY → merged 7620975e1cd604c8bcdce0bac748e32e276061db
#180 POST-1.0-PR2-PERSONALITY-TACTICAL-RISK       → merged f0cfcb7d2944b8380cf8b3157ae1570bbbbb17cd
#181 POST-1.0-PR3-BOT-OUTCOME-ADAPTATION-GATE    → final implementation / closure PR awaiting controller merge
```

There is no PR4 in this batch.

## Current authority

Read in this order before continuation:

1. `AGENTS.md`;
2. `docs/28-audit-first-autonomous-delivery-protocol.md`;
3. `docs/audits/current-execution-state.md`;
4. `docs/audits/current-batch-audit.md`;
5. `docs/audits/completed/post-1.0-bot-strategy-differentiation.md`;
6. `docs/project-status.json`;
7. `docs/roadmap-pr-index.json`;
8. `docs/16-execution-roadmap.md`;
9. actual GitHub `main`, PR #181, review threads and exact workflow state.

Actual GitHub state wins over stale prose.

## Delivered batch contract

The three implementation PRs deliver one bounded strategy-differentiation outcome:

- compressed personality differentiation without a scheduler fork or persisted AI memory;
- shared tactical risk limits of Industrial/Aegis `700`, Explorer/Synod `800`, Aggressive/Veyra `900`;
- current/full level-3 intel, mission availability and reducer authority preserved;
- recent own PvP outcome recovery derived from the latest three canonical battle reports;
- canonical ordering: `event.executeAt` → `event.sequence` → `report.id`;
- optional legacy `BattleReport.mode` uses the established effective-mode rule: explicit mode authoritative; omitted + pirate participant = PvE; omitted + non-pirate participants = PvP;
- `loss-dominant` iff losses > wins; draws neutral; wins do not add aggression;
- loss recovery is only a stable fallback after critical/economic recovery, fleet/high-threat recovery, ordinary fleet and ordinary research actions;
- ordinary commands and reducer validation remain authoritative;
- schema v19 / save v6 / migration none.

The accepted Audit is permanently archived at:

`docs/audits/completed/post-1.0-bot-strategy-differentiation.md`

## Current #181 state

#181 is the final implementation and closure PR for the batch.

While it remains open:

- its merge SHA is unknown and must not be invented;
- the batch closure is staged but not GitHub-complete;
- no further implementation is authorized;
- the only valid action is final review/validation and controller merge decision.

## After #181 merge

After controller-approved merge:

- `POST-1.0-BOT-STRATEGY-DIFFERENTIATION` is complete;
- active implementation = none;
- there is no PR4;
- no further implementation is authorized;
- the next valid action is a **fresh docs-only Audit PR from the new `main`**;
- that Audit, not backlog guesswork, must decide whether another implementation batch exists.

Do not start that Audit now.

## Stop rule

For the current PR:

1. fix and resolve only validated #181 review findings;
2. require fresh exact-head CI, Graphify, Browser E2E and production Pages smoke after the final commit;
3. verify unresolved review threads = 0, `mergeable=true`, `draft=false` and `main` unchanged unless explicitly reconciled;
4. STOP for controller review.

Do not merge #181. Do not create a new PR, branch, Audit or implementation work item.
