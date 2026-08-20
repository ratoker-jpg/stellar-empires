# Continuation guide

## Current handoff

Release 1.0 is closed. PR #171 `RELEASE-1.0-CLOSURE` squash-merged and generated fresh `main`:

`1f7298a602062837ec6bb8e3778d408ada26051c`

Runtime remains schema v19 / save format v6. There is no active implementation batch and no fifth M9 implementation PR.

The next product phase is governed by:

`docs/29-post-1.0-nemexia-reference-roadmap.md`

## Read before continuation

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/17-continuation-guide.md`
6. `docs/project-status.json`
7. `docs/16-execution-roadmap.md`
8. `docs/roadmap-pr-index.json`
9. `docs/29-post-1.0-nemexia-reference-roadmap.md`
10. `docs/audits/completed/m9-release-candidate.md`
11. actual GitHub `main`, latest PRs and workflow/production state

Actual GitHub state overrides older prose when they differ.

## Completed Release 1.0 baseline

M1–M9 are complete for the local browser campaign, including:

- deterministic multi-colony economy/logistics and research/production/fleets;
- combat, destruction/recovery, PvE and meta systems;
- three mechanical factions and autonomous bot empires;
- optional alliances and solo endgame participation;
- Solar War/Gates, persisted terminal victory/defeat and exact terminal freeze;
- bot endgame perception/participation/final-project parity;
- save/load/offline/direct/chunk deterministic closure;
- release onboarding truth;
- production-build Browser proof under `/stellar-empires/`;
- package-authoritative `1.0.0`, Node 24 automation baseline and release metadata.

Historical M9 Audit: #167. Closed implementation chain: #168 → #169 → #170 → #171.

## Post-1.0 reference program

The owner has supplied `ratoker-jpg/Nemexia_auto_v2` plus a structured Nemexia research snapshot. Treat these as research/reference evidence only.

Do not assume that old Nemexia automation architecture, heuristics, remembered formulas or historical values belong in Stellar. Preserve provenance and compare against what Stellar already implements.

The next authorized work item is exactly:

`POST-1.0-NEMEXIA-PARITY-AUDIT`

It is docs-only.

## Audit handoff requirements

The Audit must:

- start from the then-current fresh `main`;
- inspect current Stellar source/tests/docs and current production/browser state;
- produce a Stellar-vs-Nemexia parity matrix;
- classify candidates `KEEP_STELLAR`, `ADAPT_FROM_NEMEXIA`, `RESEARCH` or `REJECT`;
- preserve Nemexia evidence provenance/confidence;
- identify unknown formulas and reject direct automation-stack ports;
- assess schema/save, deterministic, performance and Browser impact;
- propose an exact first implementation batch with stable work-item IDs and gates;
- prefer 4 implementation PRs; propose at most 6 only for explicitly justified light/independent work;
- stop with the Audit PR open for controller review.

The worker must not merge the Audit or begin implementation before controller approval.

## After Audit approval

Once the controller approves and the Audit is merged, execute only the accepted batch. After the batch, report PRs, heads/merge SHAs, material files, validation, risks, production evidence, divergence and proposed next work. Do not begin the next batch until the controller closes the review cycle.

## Known boundary

Repository license selection remains owner-controlled. Any guessed combat/economy/scoring formula, unplanned schema/save migration or direct port of Playwright/Tkinter/DOM/CAPTCHA/raid automation requires stop/re-audit rather than implementation.
