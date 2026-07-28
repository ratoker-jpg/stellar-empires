# PR #130 — Audit local campaign time and offline progression

## Scope

Documentation-only Audit PR for `LOCAL-CAMPAIGN-TIME-PACING-01` from exact baseline `45bd3297d402fd96691a26c60e47bd39a420f174`.

## Verified findings

- the normal game has manual fast-forward but no real-time ticker;
- campaign creation selects only faction;
- schema v14 has no immutable campaign settings;
- save format v2 has no protected runtime activity cursor;
- ordinary non-bot time domains already advance chronologically through `ADVANCE_TIME`;
- persisted bot cursors are bounded, but overdue planners currently see the final post-jump state;
- bounded histories cannot alone produce a complete long-offline summary;
- v14 `clock.startedAt` is a fixed simulation epoch, not a real creation timestamp.

## Decision

Heavy two-PR implementation batch:

```text
#131 CAMPAIGN-SETTINGS-PERSISTENCE
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE
```

#131 owns schema v15 settings, save format v3 runtime metadata, protected pending catch-up/summary shapes, setup, migrations and replay inputs. #132 owns the shared chronological active/offline orchestrator, bot boundary integration, processed-cursor checkpoints, durable return summary and closure gate.

Numeric progression compression is explicitly deferred to a separate audit after #132.

## Persistence review decisions

- legacy real creation/cursor time comes from validated envelope `savedAt`, never the fixed v14 simulation epoch;
- a partial checkpoint advances `lastActiveAtReal` only by real duration already represented in state;
- remaining target, fractional carry and accumulated summary are integrity protected;
- completion persists `pendingReturnSummary` until explicit acknowledgement;
- reload cannot lose unprocessed offline duration or the completed return summary.

## Graphify evidence

Fresh Graphify run `30388085969` on audit head `0ccefbd3d9b852111bf67a8c4ad9e5daafbd49df` produced:

- 334 code files;
- 2,372 nodes;
- 7,703 edges;
- 109 communities.

It confirms `GameState` (215 edges), `createInitialGameState()` and `executeCommand()` as the highest-impact audited abstractions and supports the two-PR split. Detailed findings and static-analysis limitations are recorded in `docs/audits/evidence/local-campaign-time-pacing-01-graphify.md`.

## Runtime boundary

This PR changes no TypeScript runtime, schema, save format, formula, world time, bot policy, UI behavior or balance.

## Validation

- repository CI validates JSON/docs and unchanged runtime;
- full Browser E2E protects the existing player flow;
- Graphify evidence is recorded in-repository;
- automated review must have no unresolved P0/P1 before merge.
