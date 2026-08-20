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

The Audit has two layers in this order:

1. **Stellar campaign truth:** prove or falsify organic Fresh Game → Terminal progression without direct state injection;
2. **Nemexia parity/reference:** classify useful reference mechanics only after current Stellar product truth is understood.

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

## Controller-priority checks

The Audit must explicitly verify, not merely repeat, these current priority hypotheses:

1. clean Fresh Game → Solar War → Gate → terminal victory/defeat without injecting buildings/resources/research/fleets/endgame state;
2. whether organic late-game bot production actually produces the ships and strength required for terminal play, including physical planet-destroyer availability where required;
3. whether catalog effects such as Scrapyard/Trade Center/Bank/Ecology have real runtime consumers or are ghost/misleading effects;
4. whether battle seed entropy uses full stable fleet identity and whether multiple defender fleets are reduced to the first fleet's doctrine;
5. whether build-queue UI implies capacity runtime does not have, and whether research requirement UI uses the same compatibility-adjusted definitions as runtime;
6. whether the existing Aegis/Synod/Veyra personalities and difficulty materially affect behavior before any expansion toward more archetypes;
7. only after gameplay truth: CI `npm ci`, visual regression, accessibility checks and proven dead-code cleanup.

The Audit must also record explicitly whether older recommendations are now obsolete, already solved or unjustified. Do not automatically schedule Svelte/Solid migration, event sourcing/replay, binary-heap queue replacement, broad market/logistics rewrites, hardcoded-player cleanup or a combat-engine redesign without new evidence.

## Required Audit deliverables

Before implementation can be authorized, the Audit PR must provide:

- exact starting `main` SHA;
- current affected Stellar source/test/doc surface;
- explicit Fresh Game → Terminal proof status and the exact point current automated progression stops;
- fixture/state-injection inventory for existing endgame acceptance tests;
- measured organic bot endgame readiness and blocker analysis;
- ghost-effect advertised-value → runtime-consumer matrix;
- combat correctness findings for deterministic seed and multi-fleet doctrine;
- UI/runtime truth findings for build queue and research requirements;
- bot personality/difficulty behavior matrix;
- Nemexia parity matrix with provenance/confidence;
- explicit unknowns and rejected/non-port/deprioritized items;
- schema/save and deterministic/performance/browser risk assessment;
- ranked backlog;
- exact first implementation batch proposal with stable work-item IDs and dependencies;
- 4 implementation PRs by default, or at most 6 only when the work is light, repetitive, independent and explicitly justified;
- validation/acceptance gates for every proposed PR.

## Controller gate

The worker must stop with the Audit PR open. It must not merge the Audit and must not begin implementation until the external controller has reviewed the PR and explicitly approved merge/continuation.

After an accepted Audit merges, the worker executes only the approved batch.

For dependent PRs, each PR is a controller checkpoint: complete it, return it for review, merge only after approval, then create the successor from the new fresh `main`.

Independent PRs may be prepared together only when the accepted Audit proves they are independent. A whole-batch report remains the final closeout gate before any next batch begins.

## Hard boundaries

The Audit must not implement product behavior. It must not directly port Playwright/Tkinter/DOM/CAPTCHA/raid automation, guess combat/economy/scoring formulas, silently add schema/save migrations, treat `USER_MEMORY`, `HEURISTIC` or `HYPOTHESIS` as verified game truth, or use prepared fixtures as proof that organic Fresh Game → Terminal progression works.
