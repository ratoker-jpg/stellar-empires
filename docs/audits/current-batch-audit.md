# Current audit boundary

**State:** no active post-1.0 implementation batch  
**Updated:** 2026-08-20  
**Release 1.0 main / #171 squash:** `1f7298a602062837ec6bb8e3778d408ada26051c`  
**Runtime baseline:** schema v19 / save format v6  
**Implementation authorized:** no  
**Next authorized work:** `POST-1.0-NEMEXIA-PARITY-AUDIT` — docs only

## Binding authority

Current authority is:

- `AGENTS.md`;
- `docs/28-audit-first-autonomous-delivery-protocol.md`;
- `docs/29-post-1.0-nemexia-reference-roadmap.md`;
- `docs/audits/current-execution-state.md`;
- actual GitHub `main`, PR and workflow state when newer than prose.

The completed M9 Release 1.0 Audit remains archived at:

`docs/audits/completed/m9-release-candidate.md`

## Closed Release 1.0 batch

```text
Audit #167 M9-RELEASE-CANDIDATE
→ #168 RELEASE-ONBOARDING-TRUTH       merged
→ #169 RELEASE-PRODUCTION-BROWSER  merged
→ #170 RELEASE-PACKAGING-METADATA  merged
→ #171 RELEASE-1.0-CLOSURE          merged → 1f7298a602062837ec6bb8e3778d408ada26051c
```

No fifth M9 implementation PR is authorized.

## Next Audit contract

The next worker may create only a docs-only Audit PR for `POST-1.0-NEMEXIA-PARITY-AUDIT`.

The Audit must inspect the current Stellar implementation and tests before declaring gaps. It must use `ratoker-jpg/Nemexia_auto_v2` and the owner-supplied research snapshot as reference evidence, not as an implementation contract.

Every Nemexia-derived claim must keep provenance such as:

```text
LIVE_HTML
LIVE_BATTLE_REPORT
LIVE_DOM_GLOBAL
SUPPLIED_INFO_PAGE
AUTOMATION_OBSERVATION
USER_MEMORY
HEURISTIC
HYPOTHESIS
```

Every candidate must be classified:

```text
KEEP_STELLAR
ADAPT_FROM_NEMEXIA
RESEARCH
REJECT
```

The Audit must cover world/colonization, faction catalogs, fleet/logistics, economy overview, spying/reports, combat/battle reports, scoring/progression, asteroids/debris, achievements/ranking/profile/alliances, research-only saved-page/MHTML sources and the current production/browser baseline.

## Required Audit deliverables

Before implementation can be authorized, the Audit PR must provide:

- exact starting `main` SHA;
- current affected Stellar source/test/doc surface;
- parity matrix with provenance/confidence;
- explicit unknowns and rejected/non-port items;
- schema/save and deterministic/performance/browser risk assessment;
- ranked backlog;
- exact first implementation batch proposal with stable work-item IDs and dependencies;
- 4 implementation PRs by default, or at most 6 only when the work is light, repetitive, independent and explicitly justified;
- validation/acceptance gates for every proposed PR.

## Controller gate

The worker must stop with the Audit PR open. It must not merge the Audit and must not begin implementation until the external controller has reviewed the PR and explicitly approved merge/continuation.

After an accepted Audit merges, the worker executes only the approved batch and returns the required batch report to the controller before the next batch begins.

## Hard boundaries

The Audit must not implement product behavior. It must not directly port Playwright/Tkinter/DOM/CAPTCHA/raid automation, guess combat/economy/scoring formulas, silently add schema/save migrations, or treat `USER_MEMORY`, `HEURISTIC` or `HYPOTHESIS` as verified game truth.
