# Continuation guide

## Current handoff

Release 1.0 remains closed at schema v19 / save format v6 with no migration in the current post-1.0 batch.

The accepted `POST-1.0-NEMEXIA-PARITY` Audit is PR #173, merged at:

`817a014ef958be4c54f2bd5b54a68890f358d53a`

The accepted implementation sequence is exactly four PRs:

```text
#174 POST-1.0-PR1-ORGANIC-LATE-GAME-CLOSURE
→ 200456244d3a7efcbb197f7734a97adf622fad76

#175 POST-1.0-PR2-COMBAT-IDENTITY-DOCTRINE
→ 415a3aa814d759d1f76a986003ad7e9d06e0e8fa

#176 POST-1.0-PR3-ADVERTISED-EFFECT-TRUTH
→ c2012c76397c0a56bce85c470334850f7be4bd3e

#177 POST-1.0-PR4-LOW-COST-QUALITY-GATES
→ active final implementation / batch-closure PR; merge SHA not generated yet
```

PR #177 started from exact fresh `main`:

`c2012c76397c0a56bce85c470334850f7be4bd3e`

It must not be merged by the implementation worker. It may be marked Ready only after the exact final closure head passes CI, Graphify and Browser E2E including production smoke, with zero unresolved review threads and `mergeable=true`.

The permanent batch record is:

`docs/audits/completed/post-1.0-nemexia-parity.md`

## Delivered post-1.0 parity outcome

### PR1 — organic late-game closure

- compressed-v1 ordinary-command progression now physically produces the Planet Destroyer when required;
- Fresh Game → Terminal is organically proven through ordinary campaign commands;
- Organic Obelisk storage/final-project progression, positive Solar War qualification, terminal result, save/load determinism and partition determinism are permanent gates;
- bounded Aegis/Synod/Veyra terminal matrix is permanent CI evidence.

### PR2 — combat identity / doctrine

- attack resolution preserves stable fleet identity and stable primary-defender semantics through doctrine/commander paths;
- deterministic combat identity/doctrine behavior is regression-covered without replacing the combat engine or guessing Nemexia formulas.

### PR3 — advertised-effect truth

- producer-only Scrapyard salvage and Trade Center market efficiency active effects were removed rather than inventing consumers;
- Ecology no longer advertises/aggregates a gameplay capacity bonus that has no operational consumer;
- Bank credit efficiency remains explicitly `UNKNOWN-UNTOUCHED`; no credit/loan system or speculative formula was added.

### PR4 — low-cost quality gates

- lockfile-backed CI / Browser / Pages installs use clean `npm ci --no-audit --no-fund`;
- exact `@axe-core/playwright@4.13.0` adds one bounded deterministic WCAG A/AA automated scan with zero violations and no targeted exceptions;
- one deterministic Empire Overview Playwright visual snapshot is committed with fixed `1366×768` viewport, reduced motion, disabled animations, hidden caret and `maxDiffPixelRatio: 0.001`;
- canonical snapshot provenance is GitHub Actions Ubuntu/Chromium;
- the accepted snapshot exposed a pre-existing Graphify corpus-builder incompatibility; `scripts/graphify-audit.sh` now copies only supported code/text extensions from `src`/`tests` while retaining root `package.json`/`tsconfig.json`, so binary snapshots/traces/artifacts do not enter code-only analysis;
- PR4 changes no gameplay/runtime source and deletes no dead code.

## Last green implementation-head proof

Head `207ded53b399b37a3e823caaac7de48ca2275ed0` passed:

- CI #2161 — all jobs success;
- Graphify #1300 — `456 code, 0 docs, 0 papers, 0 images`, 456/456 extracted, real graph with 3,546 nodes / 12,388 edges;
- Browser E2E #1391 — 36/36 passed in 5.6 min;
- bounded axe test — 0 violations, 4.8 s in the full run;
- visual snapshot comparison — success, 4.3 s in the full run;
- production Pages smoke — success.

Closure documents change the exact PR head after this evidence. Therefore use actual GitHub state and the fresh exact-head runs, not this implementation-head SHA alone, for the final Ready decision.

## Read before any continuation

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/17-continuation-guide.md`
6. `docs/project-status.json`
7. `docs/16-execution-roadmap.md`
8. `docs/roadmap-pr-index.json`
9. `docs/29-post-1.0-nemexia-reference-roadmap.md`
10. `docs/audits/completed/post-1.0-nemexia-parity.md`
11. actual GitHub `main`, PR #177 and exact workflow/production state

Actual GitHub state overrides older prose when they differ.

## Known boundary

- Repository license selection remains owner-controlled.
- Several original Nemexia combat/economy/scoring formulas remain unverified and must not be guessed.
- Bank `bankCreditEfficiencyPercent` consumer remains UNKNOWN and intentionally untouched.
- No PR5 or post-PR4 feature implementation is authorized by Audit #173.

## After controller merge of #177

Do not immediately start implementation.

The next action is **controller batch-closure / roadmap decision**. Resolve the fresh `main` produced by #177, reconcile the generated merge SHA into project records when appropriate, and decide whether there is a coherent next product area worth auditing.

Any next coherent product implementation requires a new Audit from fresh `main`, accepted under `docs/28-audit-first-autonomous-delivery-protocol.md`. A future Audit may propose a complexity-sized batch, but this guide does not pre-authorize one.