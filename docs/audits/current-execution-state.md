# Current execution state

**Updated:** 2026-08-20  
**Safe to continue:** yes  
**Batch:** `M9-RELEASE-CANDIDATE`  
**Runtime:** schema v19 / save format v6 unchanged  
**Release target:** 1.0.0

| Field | Current value |
|---|---|
| Fresh `main` | `6b37ffc7d439889f3bdf21f7f1c6abaca6f4ec3f` |
| Last merged PR | #169 `RELEASE-PRODUCTION-BROWSER` |
| Accepted Audit | #167 · `f7e14fda42a135f70c0ad95ada7d3080d472176b` |
| Active work item | #170 `RELEASE-PACKAGING-METADATA` |
| Active branch | `agent/release-packaging-metadata` |
| Exact base | `6b37ffc7d439889f3bdf21f7f1c6abaca6f4ec3f` |
| Planned implementation count | 4 |
| Completed M9 implementation PRs | 2 |
| Target state schema | 19 |
| Target save format | 6 |
| Critical unknowns | 0 |
| Implementation authorized now | yes — only accepted sequence |

## Accepted sequence

```text
#168 RELEASE-ONBOARDING-TRUTH       merged
→ #169 RELEASE-PRODUCTION-BROWSER  merged
→ #170 RELEASE-PACKAGING-METADATA  active
→ #171 RELEASE-1.0-CLOSURE
```

No fifth M9 implementation PR is authorized.

## #170 scope

Release packaging and truth only:

- make `package.json` the authoritative product version source;
- set the candidate version to `1.0.0-rc.1` and prove the production build badge derives from it;
- synchronize root lockfile metadata with package metadata without changing dependency versions;
- run CI, Browser and Pages build workflows on Node 24;
- replace stale README claims with the current schema/save, three-faction, bot/endgame and production Pages state;
- remove the conflicting static `v0.1.0` badge fallback.

No GameState, save format, balance, bot or gameplay mechanic change is permitted in #170.

## Exact next action

Freeze one exact #170 head and require full CI, existing Browser E2E, production Pages smoke, Graphify, compressed progression/performance, reviews/threads and mergeability. On green, squash-merge with expected-head protection, verify generated fresh `main`, then create only `RELEASE-1.0-CLOSURE` from that fresh main.

## Stop conditions

Stop rather than opening #171 if packaging/version metadata is internally inconsistent, Node 24 exposes a real toolchain failure, either Browser gate is red, the current head has unresolved failures, or `main` moves unexpectedly.
