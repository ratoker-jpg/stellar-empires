# POST-1.0-NEMEXIA-PARITY — archived audit batch

**Roadmap milestone:** post-1.0 Nemexia-reference parity  
**Complexity:** bounded-sequential / four implementation PRs  
**Audit PR:** #173  
**Audit squash:** `817a014ef958be4c54f2bd5b54a68890f358d53a`  
**Audit baseline:** `538a0f22ab77687b148916c9a50721fca32930b4` (PR #172 squash / fresh `main`)  
**Runtime:** schema v19 / save format v6 unchanged  
**Migration:** none  
**Release:** 1.0.0 remains closed  
**Closure PR:** #177 `POST-1.0-PR4-LOW-COST-QUALITY-GATES`  
**Closure squash:** pending controller review/merge; cannot be self-recorded before merge

## Accepted implementation chain

| PR | Work item | State |
|---|---|---|
| #174 | `POST-1.0-PR1-ORGANIC-LATE-GAME-CLOSURE` | merged → `200456244d3a7efcbb197f7734a97adf622fad76` |
| #175 | `POST-1.0-PR2-COMBAT-IDENTITY-DOCTRINE` | merged → `415a3aa814d759d1f76a986003ad7e9d06e0e8fa` |
| #176 | `POST-1.0-PR3-ADVERTISED-EFFECT-TRUTH` | merged → `c2012c76397c0a56bce85c470334850f7be4bd3e` |
| #177 | `POST-1.0-PR4-LOW-COST-QUALITY-GATES` | implementation complete; final closure/exact-head validation and controller review; merge SHA pending |

Exactly four implementation PRs were accepted. There is no PR5 in this batch.

## Delivered outcome

### Organic campaign closure

PR #174 converted the audited Fresh Game → Terminal gap into permanent ordinary-command evidence:

- compressed progression physically produces the canonical Planet Destroyer when required;
- ordinary Fresh Game progression continues through endgame preparation, positive Solar War qualification, Organic Obelisk storage/final-project progression and persisted terminal result;
- save/load and partition determinism remain exact through terminal closure;
- a bounded Aegis/Synod/Veyra matrix proves the accepted terminal path across all three factions;
- permanent CI gates cover Organic Fresh Game → terminal, Organic Obelisk evidence, bounded faction matrix, terminal save/load + partition determinism, compressed progression and campaign catch-up performance.

### Combat identity / doctrine truth

PR #175 hardened the existing combat engine without replacing it or importing unverified Nemexia formulas:

- stable fleet identity is preserved through attack resolution;
- stable primary-defender semantics are preserved through doctrine/commander paths;
- deterministic attack/doctrine behavior is regression-covered across the accepted combat surface.

### Advertised-effect truth

PR #176 applied the accepted **CONSUMER-OR-REMOVE** rule:

- Scrapyard salvage and Trade Center market-efficiency producer-only active effects were removed rather than given invented formulas;
- Ecology no longer advertises or aggregates an operational capacity bonus with no consumer;
- Bank `bankCreditEfficiencyPercent` remains explicitly `UNKNOWN-UNTOUCHED`; no credit/loan subsystem or speculative formula was created;
- debris, market, colonization, economy and other unrelated runtime calculations were not redesigned.

### Low-cost quality gates

PR #177 hardens delivery without changing gameplay/runtime:

- all lockfile-backed CI, Browser E2E and Pages install paths use `npm ci --no-audit --no-fund`;
- the pre-existing lockfile proved compatible with clean `npm ci`; no fallback/repair was needed for the reproducibility rollout;
- exact dev dependency `@axe-core/playwright@4.13.0` adds one bounded deterministic Empire Overview WCAG A/AA automated scan with zero violations and no targeted exceptions;
- exactly one deterministic Playwright visual snapshot is committed for the same Empire Overview route, using fixed `1366×768`, reduced motion, disabled animations, hidden caret and `maxDiffPixelRatio: 0.001`;
- the canonical `empire-overview-linux.png` baseline was produced on GitHub Actions Ubuntu/Chromium;
- no gameplay/runtime source and no dead code were changed/deleted by PR4.

## PR4 Graphify divergence

The accepted committed PNG visual baseline exposed a hidden compatibility problem in the existing Graphify runner. `scripts/graphify-audit.sh` previously copied the entire `tests` directory into the temporary code corpus. Graphify #1299 therefore saw:

```text
456 code
0 docs
0 papers
1 images
```

and failed because the image semantic-extraction path requires an LLM API key that the repository code-only graph contract does not use.

This was a bounded tooling divergence inside PR4, not a Graphify service outage and not a gameplay/product defect.

PR #177 changed the corpus builder by general code-file inclusion rather than snapshot-name exclusion:

- recursively include `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.mjs`, `*.cjs` and `*.css` from `src` and `tests` while preserving relative paths;
- retain the previously intentional root inputs `package.json` and `tsconfig.json`;
- exclude PNGs, screenshots, visual baselines, traces, test-result artifacts and other non-code assets from code mode.

Fresh Graphify #1300 on implementation head `207ded53b399b37a3e823caaac7de48ca2275ed0` succeeded with:

```text
456 code
0 docs
0 papers
0 images
456/456 code files extracted
graph.json: 3546 nodes / 12388 edges
exit-code=0
```

No Graphify secret, version change, workflow bypass, ignored exit code or `continue-on-error` was introduced.

## Implementation-head closure evidence

Before the final control-plane commit, exact implementation head `207ded53b399b37a3e823caaac7de48ca2275ed0` passed the combined accepted gates:

```text
CI #2161             SUCCESS
Graphify #1300       SUCCESS
Browser E2E #1391    SUCCESS — 36/36 in 5.6 min
axe quality gate      SUCCESS — 0 violations; 4.8 s in full run
visual snapshot       SUCCESS — 4.3 s in full run
production smoke      SUCCESS
```

CI #2161 includes asset audit, lint, typecheck, full tests, build, Organic Fresh Game → terminal, compressed progression, Organic Obelisk evidence, bounded terminal faction matrix, terminal save/load + partition determinism and campaign catch-up performance.

The closure/control-plane documents in #177 change the exact PR head after that implementation proof. A fresh exact-head CI / Graphify / Browser matrix is therefore required before #177 is marked Ready for controller review.

## Intentional omissions / remaining boundaries

- schema stays v19;
- save format stays v6;
- migration stays none;
- no gameplay/runtime change in PR4;
- no broad accessibility refactor or UI redesign;
- no dependency-modernization sweep;
- no dead-code cleanup;
- no new assets beyond the one accepted test baseline;
- no guessed Nemexia combat/economy/scoring formulas;
- Bank credit-efficiency consumer remains UNKNOWN and untouched;
- repository license remains owner-controlled.

## Closure boundary

Implementation for the accepted `POST-1.0-NEMEXIA-PARITY` batch is complete in #177, but actual batch merge closure remains a controller action. This archive intentionally records #177 by PR number and defers its generated squash SHA until after merge, consistent with the repository closure convention.

Do not create PR5 and do not begin new feature implementation from this archive.

After the controller reviews/merges #177, the next action is controller batch-closure / roadmap decision from fresh `main`. Any new coherent product implementation requires a new Audit accepted under `docs/28-audit-first-autonomous-delivery-protocol.md`.