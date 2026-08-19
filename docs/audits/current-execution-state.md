# Current execution state

**Updated:** 2026-08-19  
**Safe to continue:** yes  
**Batch:** `M9-RELEASE-CANDIDATE`  
**Runtime:** schema v19 / save format v6 unchanged  
**Release target:** 1.0.0

| Field | Current value |
|---|---|
| Fresh `main` | `bd6f0302ef55f0d8f68c6fa619ecd1e07540aa9a` |
| Last merged PR | #168 `RELEASE-ONBOARDING-TRUTH` |
| Accepted Audit | #167 · `f7e14fda42a135f70c0ad95ada7d3080d472176b` |
| Active work item | #169 `RELEASE-PRODUCTION-BROWSER` |
| Active branch | `agent/release-production-browser` |
| Exact base | `bd6f0302ef55f0d8f68c6fa619ecd1e07540aa9a` |
| Planned implementation count | 4 |
| Completed M9 implementation PRs | 1 |
| Target state schema | 19 |
| Target save format | 6 |
| Critical unknowns | 0 |
| Implementation authorized now | yes — only accepted sequence |

## Accepted sequence

```text
#168 RELEASE-ONBOARDING-TRUTH      merged
→ #169 RELEASE-PRODUCTION-BROWSER active
→ #170 RELEASE-PACKAGING-METADATA
→ #171 RELEASE-1.0-CLOSURE
```

No fifth M9 implementation PR is authorized.

## #169 scope

Production-path QA only:

- keep the existing broad dev-server Browser suite;
- add a dedicated Playwright smoke against the normal production build served under `/stellar-empires/`;
- use the real new-game dialog with no `VITE_E2E` state injection;
- prove production assets load, app reaches ready state and the production base survives primary navigation;
- prove a real manual save can be loaded into autosave and survive reload;
- retain a separate success/failure Playwright artifact for this production smoke.

No GameState, save format, balance, bot or gameplay mechanic change is permitted in #169.

## Exact next action

Freeze one exact #169 head and require full CI, existing Browser E2E, the new production Pages smoke, Graphify, compressed progression/performance, reviews/threads and mergeability. On green, squash-merge with expected-head protection, verify generated fresh `main`, then create only `RELEASE-PACKAGING-METADATA` from that fresh main.

## Stop conditions

Stop rather than opening the next implementation PR if the production smoke reveals a release blocker outside the accepted M9 contract, the current head has unresolved failures, an external workflow is genuinely stuck across three checks, or `main` moves unexpectedly.
