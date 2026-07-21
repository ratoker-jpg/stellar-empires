# Long-session history retention

**Status:** Delivered by PR #83  
**Date:** 2026-07-21

## Purpose

Several diagnostic and report collections previously grew for the entire lifetime of a save. PR #83 defines deterministic retained windows so long-running browser sessions and autosaves remain bounded without deleting pending gameplay state.

## Retention budgets

| Collection | Retained entries | Rule |
|---|---:|---|
| command log | 512 | newest commands; command indices remain monotonic |
| executed-event log | 512 | newest executed events |
| market trades | 50 | newest trades |
| completed world events | 128 | newest completed/recovered instances |
| intelligence observations | 64 per empire | newest observations |
| intelligence alerts | 128 per empire | newest alerts |

Pending events, active world events, production/research/build queues, fleets, routes, active missions and other future-resolution state are never compacted.

## Determinism and replay

Retention uses stable tail slicing only. Command indices are derived from the last retained index rather than current array length, so they remain monotonic after the window fills. `replayCommands` still replays an explicit external command stream; the in-state command log is a bounded diagnostic window, not a complete event-sourcing archive.

Bot Worker stale-response checks now compare the full state checksum instead of command-log length. This remains correct after command-log length reaches its fixed ceiling.

## Save migration

Schema-v13 saves that predate retention budgets are accepted, migrated and compacted before final validation. The newest entries are preserved. The migration does not alter pending or active gameplay state.

## Verification

Coverage includes monotonic command indices, executed-event retention, deterministic multi-day simulation, all documented collection budgets, pending-state preservation and migration of oversized schema-v13 saves.
