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
- bounded histories cannot alone produce a complete long-offline summary.

## Decision

Heavy two-PR implementation batch:

```text
#131 CAMPAIGN-SETTINGS-PERSISTENCE
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE
```

#131 owns schema v15 settings, save format v3 runtime metadata, setup, migrations and replay inputs. #132 owns the shared chronological active/offline orchestrator, bot boundary integration, bounded checkpoints, return summary and closure gate.

Numeric progression compression is explicitly deferred to a separate audit after #132.

## Runtime boundary

This PR changes no TypeScript runtime, schema, save format, formula, world time, bot policy, UI behavior or balance.

## Validation

- repository CI validates JSON/docs and unchanged runtime;
- Graphify supplies current architecture evidence;
- automated review must have no unresolved P0/P1 before merge.
