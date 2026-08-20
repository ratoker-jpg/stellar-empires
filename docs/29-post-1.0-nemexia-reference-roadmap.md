# Post-1.0 Nemexia-reference roadmap

**Status:** planning/control-plane only; no post-1.0 implementation is authorized by this document  
**Updated:** 2026-08-20  
**Release baseline:** Release 1.0 closure PR #171 squash `1f7298a602062837ec6bb8e3778d408ada26051c`  
**Runtime baseline:** schema v19 / save format v6 unless a future accepted Audit proves a migration is required

## Purpose

Release 1.0 is closed. The next product phase is not an automatic continuation of M9 and not a direct port of `Nemexia_auto_v2`.

`ratoker-jpg/Nemexia_auto_v2` and the owner-supplied Nemexia research snapshot are research/reference sources for improving Stellar Empires after 1.0. They contain useful evidence about world topology, faction catalogs, fleet/economy UX, combat reports, scoring/progression, reconnaissance, debris and moving asteroids, but they also contain automation-specific code, heuristics, user memory and unresolved hypotheses.

Every post-1.0 mechanic must therefore pass a Stellar-vs-Nemexia parity/reference Audit before implementation.

## Non-negotiable provenance rule

Every imported claim or candidate mechanic must retain one of these provenance classes:

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

No `USER_MEMORY`, `HEURISTIC` or `HYPOTHESIS` item may become a Stellar contract merely because it exists in the reference project. Unknown original formulas must stay unknown until evidence resolves them or Stellar intentionally defines its own formula.

## Explicit non-port boundary

Do not port the Nemexia automation stack itself:

- Playwright/browser-driving architecture;
- Tkinter UI;
- Nemexia DOM selectors or page globals as runtime dependencies;
- CAPTCHA/bot-check handling;
- raid/farm automation;
- SQLite/browser snapshot plumbing as a Stellar gameplay architecture;
- heuristic combat formulas presented as original-game truth.

Only verified domain facts, research evidence and product concepts may be considered, and any adopted feature must be implemented in Stellar-native architecture.

## Mandatory first step — Audit only

The next PR after this roadmap must be a dedicated docs-only Audit PR with work item:

`POST-1.0-NEMEXIA-PARITY-AUDIT`

It must start from the then-current fresh `main`, perform no runtime implementation, and produce a parity matrix for the current Stellar product against the Nemexia reference surface.

For every material candidate, the Audit must classify exactly one outcome:

```text
KEEP_STELLAR
ADAPT_FROM_NEMEXIA
RESEARCH
REJECT
```

The Audit must verify current source/tests/docs and must not infer a gap merely from the reference snapshot.

### Required Audit coverage

At minimum inspect and classify:

1. galaxy topology, solar-system presentation and colonization;
2. ships, defence, commander ships, population/capacity and faction asymmetry;
3. fleet missions, slots, travel/ETA contracts and logistics;
4. economy/production overview and multi-planet QoL;
5. spying/reconnaissance and report surfaces;
6. combat model, battle reports, debris/recycling and known/unknown formulas;
7. Resource/Battle/Total/Achievement score layers and Admiral/commander progression;
8. achievements, ranking, profile and alliance surfaces;
9. moving asteroid/debris world mechanics;
10. saved-page/MHTML/catalog evidence that is useful for research but should not become runtime coupling;
11. current production/browser/Pages baseline after Release 1.0.

### Required Audit outputs

The Audit PR must contain:

- current exact `main` SHA and verified release/runtime baseline;
- affected Stellar files/modules/tests/docs, not just a feature wishlist;
- the parity matrix with provenance and confidence for each Nemexia-derived fact;
- gaps, contradictions and research blockers;
- explicit rejected/non-port items;
- schema/save-format impact assessment;
- deterministic/performance/browser-risk assessment;
- ranked post-1.0 backlog;
- an exact first implementation batch proposal with stable work-item IDs, dependencies and acceptance gates;
- a clear statement that implementation remains unauthorized until controller review and Audit merge.

## Controller delivery model

This roadmap uses an external controller/auditor workflow.

1. Worker creates the Audit PR and stops before merge.
2. Controller reviews the PR, diff, evidence and proposed batch.
3. Only after controller approval may the worker merge the Audit PR.
4. Worker then executes the approved implementation batch.
5. Worker reports the whole batch back to the controller.
6. Controller decides whether PRs may merge, need correction, or the plan must change.
7. The next batch is not started until the controller closes the previous review cycle.

No worker may silently broaden scope or self-authorize a new batch.

## Batch sizing

Use the repository audit-first complexity model from `AGENTS.md`:

- heavy: 1–2 implementation PRs maximum;
- medium: **4 implementation PRs by default**;
- light: **6 implementation PRs maximum**, only when repetitive, independent and low risk.

For this post-1.0 program, prefer 4. A 6-PR batch requires explicit Audit justification and controller approval. Audit PRs do not count toward the implementation count.

Each implementation PR must be one coherent behavior change and cite the accepted Audit/work-item ID.

## Required batch report

After a worker completes an approved batch, report exactly:

| Field | Required content |
|---|---|
| Baseline | Audit PR, audit squash SHA, starting `main` SHA |
| PRs | number, work-item ID, title, branch, head SHA, state |
| Scope | what changed and intentional omissions per PR |
| Files | material changed files/modules |
| Validation | lint/typecheck/tests/build/browser/performance/Graphify as applicable |
| Risk | known risk, migration impact, deferred research |
| Merge state | open/merged; merge SHA only when controller authorized merge |
| Production evidence | Pages/production smoke where relevant; never invent missing evidence |
| Divergence | any departure from the accepted Audit |
| Next | proposed next Audit/batch, not automatically authorized |

The report must be sufficient for a controller to decide `MERGE`, `FIX`, `STOP/RE-AUDIT` without rediscovering the whole batch.

## Candidate post-1.0 streams

These are research streams, not implementation authorization and not a fixed order.

### N1 — Reference/provenance foundation

- Stellar-vs-Nemexia parity matrix;
- provenance/confidence register;
- verified catalog evidence and explicit unknown-formula register.

### N2 — Solar-system and colonization fidelity

Investigate the observed Nemexia reference of 3 galaxies × 40 solar systems × 24 positions, discrete system positions, solar-system navigation and colonization UX. Stellar may keep its current topology where better; reference numbers are evidence, not mandatory targets.

### N3 — Faction military catalog depth

Compare ship/defence/commander catalogs, population weights, roles, counters and faction asymmetry. Do not import values blindly; preserve Stellar balance and campaign constraints unless an accepted Audit intentionally changes them.

### N4 — Combat evidence and battle reports

Use live battle-report evidence to improve report fidelity and research combat behavior. Exact armor, targeting, ability, Resource Point and Battle Point formulas remain research items unless proven or intentionally redefined for Stellar.

### N5 — Profile, scoring and progression

Investigate Resource Points, Battle Points, Total Points, Achievement Points, ranking/profile presentation and Admiral progression. Do not assume remembered `1 point / 1000 resources` or `Total = Resource + Battle` without evidence.

### N6 — Dynamic world / debris loop

Audit moving asteroids, debris, recycler/recovery missions and ETA-dependent target prediction as possible world-depth mechanics.

### N7 — Empire operations QoL

Audit multi-planet overview, fleet production planning, target fleet doctrine, dislocation/logistics, slot visibility and resource-transfer planning as player-facing QoL rather than automation.

### N8 — Reconnaissance, reports and intelligence

Audit spy-report data layers, report categories, target information disclosure and fleet intelligence against Stellar's information-security rules and bot parity.

### N9 — Social/meta surfaces

Research achievements, ranking, alliances, commander/admiral progression and profile identity only after their actual reference evidence and Stellar product value are clear.

### N10 — Deep reference extraction

MHTML/resource extraction, information-page catalog extraction and larger battle-report datasets are research tooling tasks. They should feed evidence, not become production dependencies.

## Initial priority hypothesis

The first Audit should rank by player value, architectural fit, evidence quality and migration risk. A reasonable starting hypothesis is:

1. parity/provenance foundation;
2. visible Solar System / empire overview QoL gaps;
3. catalog/report fidelity that uses verified data without schema churn;
4. scoring/combat formula research before scoring/combat redesign;
5. larger meta systems and dynamic-world mechanics only after evidence and save impact are understood.

The Audit may change this order when current Stellar source demonstrates a better path.

## Hard stop conditions

Stop and return to Audit instead of implementing when:

- a needed Nemexia fact is only memory/heuristic/hypothesis;
- current Stellar already has a stronger intentional mechanic and no clear adaptation benefit exists;
- a change requires an unplanned schema/save migration;
- combat/economy formulas would have to be guessed;
- scope mixes heavy architecture with a six-PR light batch;
- production/release baseline is not understood;
- implementation would copy automation infrastructure rather than a game-domain concept.

## Immediate next action

```text
fresh main after this docs-only roadmap merge
→ POST-1.0-NEMEXIA-PARITY-AUDIT (docs only)
→ controller review
→ Audit merge only if approved
→ approved 4-PR implementation batch by default
   OR explicitly justified 6-PR light batch
→ batch report to controller
→ controller MERGE / FIX / STOP-RE-AUDIT decision
```

Until that Audit is accepted, **no post-1.0 product implementation is authorized**.
