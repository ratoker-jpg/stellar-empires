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
**Closure squash:** `53cf207f30f1a51f864d77f61969937e0d1ad59c`

## Accepted implementation chain

| PR | Work item | State |
|---|---|---|
| #174 | `POST-1.0-PR1-ORGANIC-LATE-GAME-CLOSURE` | merged → `200456244d3a7efcbb197f7734a97adf622fad76` |
| #175 | `POST-1.0-PR2-COMBAT-IDENTITY-DOCTRINE` | merged → `415a3aa814d759d1f76a986003ad7e9d06e0e8fa` |
| #176 | `POST-1.0-PR3-ADVERTISED-EFFECT-TRUTH` | merged → `c2012c76397c0a56bce85c470334850f7be4bd3e` |
| #177 | `POST-1.0-PR4-LOW-COST-QUALITY-GATES` | merged → `53cf207f30f1a51f864d77f61969937e0d1ad59c` |

Exactly four implementation PRs were accepted and merged. There is no PR5 in this batch.

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

PR #177 hardened delivery without changing gameplay/runtime:

- lockfile-backed CI, Browser E2E and Pages install paths use reproducible `npm ci --no-audit --no-fund`;
- focused axe and one deterministic Empire Overview visual snapshot became permanent browser gates;
- production base-path Browser smoke became permanent;
- Graphify code mode was corrected to include code files rather than binary snapshots/assets;
- no gameplay/runtime source and no dead code were changed/deleted by PR4.

## PR4 Graphify divergence and resolution

The committed PNG visual baseline exposed a hidden compatibility problem in the previous Graphify corpus builder. It copied the entire `tests` directory, so Graphify #1299 encountered an image and attempted a semantic image path that requires an LLM API key.

PR #177 fixed the repository-owned code corpus generically by including code extensions from `src` and `tests`, retaining `package.json`/`tsconfig.json`, and excluding screenshots/baselines/traces/non-code assets from code mode.

Fresh Graphify evidence after the fix:

```text
456 code
0 docs
0 papers
0 images
456/456 code files extracted
graph.json: 3546 nodes / 12388 edges
exit-code=0
```

No secret, Graphify version bypass, ignored exit code or `continue-on-error` was introduced.

## Final #177 exact-head closure evidence

The final #177 PR head passed the required matrix before controller merge:

```text
CI #2162             SUCCESS
Graphify #1301       SUCCESS
Browser E2E #1392    SUCCESS — 36/36
axe quality gate      SUCCESS
visual snapshot       SUCCESS
production smoke      SUCCESS
unresolved threads    0
mergeable              true
```

The controller then squash-merged #177, producing current/historical runtime baseline:

`53cf207f30f1a51f864d77f61969937e0d1ad59c`

## Intentional omissions / remaining boundaries

- schema stays v19;
- save format stays v6;
- migration stays none;
- no gameplay/runtime change in PR4;
- no broad accessibility refactor or UI redesign;
- no dependency-modernization sweep;
- no dead-code cleanup;
- no guessed Nemexia combat/economy/scoring formulas;
- Bank credit-efficiency consumer remains UNKNOWN and untouched;
- repository license remains owner-controlled.

## Closure boundary

`POST-1.0-NEMEXIA-PARITY` is **COMPLETE** at #177 squash `53cf207f30f1a51f864d77f61969937e0d1ad59c`.

Do not create PR5 from this archive. Completion of this batch does not authorize another feature batch. The next valid product work is a new fresh-main Audit under `docs/28-audit-first-autonomous-delivery-protocol.md`; Audit #178 performs that role with implementation authorization still false.
