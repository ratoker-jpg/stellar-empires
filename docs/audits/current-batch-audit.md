# POST-1.0-NEMEXIA-PARITY-AUDIT

**State:** in progress — docs-only Audit  
**Audit baseline:** `538a0f22ab77687b148916c9a50721fca32930b4`  
**Runtime baseline:** schema v19 / save format v6  
**Implementation authorized:** no  
**Audit branch:** `audit/post-1.0-nemexia-parity`

## Controller gate

This PR is an Audit artifact only. It must remain open for controller review. Do not merge this Audit and do not begin implementation until the controller explicitly approves the Audit and its proposed batch.

## Verdict status

The Audit separates findings into:

- **CONFIRMED** — supported by current executable source/tests/runtime evidence;
- **DISPROVED** — a prior hypothesis contradicted by current executable evidence;
- **UNKNOWN** — evidence is insufficient or secondary follow-up is required.

## Audit scope

### P0 — Fresh Game → Terminal

Establish what is actually proven for:

```text
Fresh Game
→ organic progression
→ real Planet Destroyer production
→ Solar War qualification
→ Gate
→ terminal victory/defeat
```

Inventory prepared fixtures/state injection separately from organic progression evidence and record the exact proof stop point.

### P1 — Organic late-game bots

Verify production targets and executable production paths for `compressed-v1` and `legacy-v1`, including canonical `roles.dreadnought` → real `planetDestroyer`, Solar War readiness, Gate prerequisites/resources/building and actual fleet strength.

### P2 — Advertised-effect consumers

Trace:

- `salvageEfficiencyPercent`;
- `marketEfficiencyPercent`;
- `bankCreditEfficiencyPercent`;
- `ecologyCapacity`.

### P3 — Combat correctness

Verify battle-seed entropy and pooled multi-fleet defender doctrine handling.

### P4 — UI/runtime truth

Verify construction queue semantics and authoritative research-requirement resolution.

### P5 — Existing bot differentiation

Audit Aegis, Synod, Veyra, `BotDifficulty`, durable memory and offensive planning before proposing new archetypes.

### P6 — Low-cost tooling

Audit `npm ci`, visual snapshots, axe/accessibility coverage and proven dead code after gameplay truth.

## Already carried-forward hypotheses requiring executable confirmation

- Fresh Game → Terminal organic proof appears absent.
- Existing `compressed-v1` organic progression reaches formal `endgame-preparation`, which is not itself terminal proof.
- `roles.dreadnought` maps to the real `planetDestroyer`; the prior wrong-mapping hypothesis is expected to be **DISPROVED**.
- Suspected real compressed-path gap: capability/prerequisites are prepared, while compressed production targets may omit physical Planet Destroyer production; `legacy-v1` appears different.
- Ghost-effect gaps appear present for salvage, market and ecology; Bank remains to classify.
- Battle seed and pooled defender doctrine require exact executable confirmation.
- Prior claims that four building queue slots really work, research resolver is mismatched, bots never attack, or `BotDifficulty` is unused are expected to be **DISPROVED** if current evidence holds.

## Required evidence tables

The completed Audit will contain:

1. studied source/test/doc surfaces;
2. Fresh Game → Terminal proof chain;
3. fixture/state-injection inventory;
4. organic bot late-game readiness and Planet Destroyer production analysis;
5. Solar War/Gate readiness;
6. ghost-effect consumer matrix;
7. combat correctness findings;
8. UI/runtime truth findings;
9. bot personality/difficulty/memory matrix;
10. Nemexia reference/provenance matrix;
11. ranked backlog;
12. proposed implementation batch with dependencies, acceptance criteria, tests and schema/save impact.

## Nemexia provenance rule

Reference-derived facts must retain provenance such as `LIVE_HTML`, `LIVE_BATTLE_REPORT`, `LIVE_DOM_GLOBAL`, `SUPPLIED_INFO_PAGE`, `AUTOMATION_OBSERVATION`, `USER_MEMORY`, `HEURISTIC` or `HYPOTHESIS`, and be classified `KEEP_STELLAR`, `ADAPT_FROM_NEMEXIA`, `RESEARCH` or `REJECT`.

`USER_MEMORY`, `HEURISTIC` and `HYPOTHESIS` are not implementation contracts.

## Preliminary implementation candidate — not authorized

Expected first blocking work item, subject to this Audit:

`POST-1.0-PR1-ORGANIC-LATE-GAME-CLOSURE`

The completed Audit will determine whether the bounded batch needs 1–3 additional PRs and will record dependency checkpoints. No implementation branch may start from this Audit branch.

## Current UNKNOWNs

- exact organic stop point beyond formal `endgame-preparation`;
- whether any alternate compressed planner/scheduler path physically produces `planetDestroyer`;
- measured organic Solar War/Gate strength/readiness;
- Bank effect consumer status;
- final Nemexia parity classifications for secondary streams;
- final implementation batch size/dependencies.

## Next Audit action

Continue recon against the exact baseline, update this document with evidence and final classifications, update `docs/audits/current-execution-state.md`, then mark the PR ready only if the Audit is complete enough for controller review.
