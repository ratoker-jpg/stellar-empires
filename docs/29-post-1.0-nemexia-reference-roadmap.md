# Post-1.0 Nemexia-reference roadmap

**Status:** planning/control-plane only; no post-1.0 implementation is authorized by this document  
**Updated:** 2026-08-20  
**Release baseline:** Release 1.0 closure PR #171 squash `1f7298a602062837ec6bb8e3778d408ada26051c`  
**Runtime baseline:** schema v19 / save format v6 unless a future accepted Audit proves a migration is required

## Purpose

Release 1.0 is closed. The next product phase is not an automatic continuation of M9 and not a direct port of `Nemexia_auto_v2`.

`ratoker-jpg/Nemexia_auto_v2` and the owner-supplied Nemexia research snapshot are research/reference sources for improving Stellar Empires after 1.0. They contain useful evidence about world topology, faction catalogs, fleet/economy UX, combat reports, scoring/progression, reconnaissance, debris and moving asteroids, but they also contain automation-specific code, heuristics, user memory and unresolved hypotheses.

Every post-1.0 mechanic must therefore pass a Stellar-vs-Nemexia parity/reference Audit before implementation.

The first Audit is **not primarily a feature-port audit**. Its highest priority is to prove that a real fresh Stellar campaign can organically reach its terminal state without prepared fixtures or direct state injection. Nemexia parity work comes after that product-truth gate.

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

It must start from the then-current fresh `main`, perform no runtime implementation, and produce both:

1. a **Fresh Game → Terminal truth audit** for the current Stellar campaign; and
2. a parity matrix for the current Stellar product against the Nemexia reference surface.

For every material candidate, the Audit must classify exactly one outcome:

```text
KEEP_STELLAR
ADAPT_FROM_NEMEXIA
RESEARCH
REJECT
```

The Audit must verify current source/tests/docs and must not infer a gap merely from the reference snapshot or from an older audit.

## Controller-prioritized verification order

These are **priority hypotheses to verify on fresh `main`**, not pre-authorized fixes. If current source disproves one, the Audit must record that and move on.

### P0 — Fresh Game → Terminal without state injection

Highest priority. Prove or falsify that a new ordinary campaign can progress through the real production/economy/research/fleet loop into:

```text
fresh game
→ ordinary expansion/progression
→ Solar War participation
→ Gate funding/construction/vulnerability
→ terminal victory or defeat
```

The proof must not directly inject buildings, resources, research completion, fleet composition, Solar War state, Gate state or terminal state.

The Audit must distinguish:

- acceptance tests that prove isolated endgame mechanics from prepared states;
- progression tests that stop before terminal play;
- a true organic campaign proof from clean initialization.

If no such proof exists, this gap outranks refactors and most Nemexia-derived feature work.

### P1 — Organic late-game bot production and endgame force readiness

Re-verify the controller-reported risk that current compressed bot production targets remain too small for organic Gate warfare, and that progression may treat a unit as "mastered" when it is producible rather than physically fielded.

Specifically inspect:

- late-game production targets for scouts/fighters/colonizers/frigates and heavier combat hulls;
- actual physical availability of a planet-destroyer when Gate attacks require one;
- Solar War fleet strength reached organically by each bot;
- whether endgame closure tests inject planet-destroyers or very large fleets that ordinary bot production has not demonstrated it can create;
- resource, population, shipyard, research and timing constraints that could prevent organic readiness.

Do not prescribe a fleet size before the Audit measures the real campaign. The target is **organic terminal capability**, not reproducing a fixture number.

### P2 — Advertised effects must have real runtime consumers

Audit every player-visible effect from catalog/tooltip through reducer/runtime consumption. Priority examples reported for verification:

- Scrapyard → `salvageEfficiencyPercent`;
- Trade Center → `marketEfficiencyPercent`;
- Bank → `bankCreditEfficiencyPercent`;
- Ecology → `ecologyCapacity`.

Classify each as implemented, partially wired, ghost/dead, misleading copy or intentionally unused.

Default remediation principle if a ghost effect is confirmed:

- wire it into an existing coherent system, **or**
- change/remove the advertised effect;
- do **not** invent a large new subsystem merely to justify one stale bonus. In particular, no new credit system for Bank by default.

### P3 — Combat correctness before combat redesign

Verify two reported correctness risks:

1. battle seed entropy may use `attackerFleet.id.length` instead of a deterministic hash of the full stable fleet identity;
2. a multi-fleet defender side may inherit doctrine/formation from only `defenderFleets[0]`.

If confirmed, treat them as bounded correctness fixes.

Do **not** bundle initiative, active abilities, a new combat engine or broad balance redesign into the same batch. Those are separate design work and require their own evidence/audit.

### P4 — UI must tell the same truth as runtime

Verify:

- whether construction is actually single-queue while UI renders several apparent queue slots/reservations;
- whether raw faction research catalogs are used by UI requirement checks while runtime uses compatibility-adjusted `getResearchDefinition()` requirements for technologies such as `improved-construction` and `critical-hit`.

Default principle:

- do not implement four real queues merely because four slots are drawn;
- prefer removing/clarifying misleading slots unless product value justifies a queue-system change;
- use one authoritative research-requirement resolution path for runtime and UI.

### P5 — Make the existing three bot personalities meaningfully different before adding more

Re-verify current personality/difficulty behavior before expanding archetype count.

Preferred direction if the gap is real:

- Aegis: stronger economy/defence bias;
- Synod: stronger scouting/research bias;
- Veyra: stronger fleet production/attack bias;
- difficulty changes risk evaluation, safety margins or planning quality rather than existing only as metadata;
- durable bot memory should use meaningful losses/wins/observations to alter later decisions.

Do not jump directly to eight personalities. Also verify current offensive behavior before claiming bots do not attack; the controller reports that known foreign planets can already be attacked when intelligence is current and own estimated strength clears the planner threshold.

### P6 — Cheap delivery/tooling hygiene after gameplay truth

Low-risk candidates to verify after P0–P5:

- replace CI `npm install` with `npm ci` where the committed lockfile and workflow make that correct;
- add visual regression snapshots where they provide stable value;
- add focused accessibility/axe coverage;
- remove proven dead code.

These must not displace campaign-truth work merely because they are easy.

## Explicitly deprioritized by default

Do not schedule these merely because an older audit proposed them:

- Svelte/Solid UI migration;
- event-sourcing/replay rewrite;
- binary-heap event queue while performance gates remain healthy;
- broad market/logistics rewrite without demonstrated player-facing failure;
- removal of hardcoded `'player'` solely for architectural purity while the product remains intentionally single-player;
- wholesale combat redesign when bounded correctness fixes are sufficient.

Any of these may return only if the new Audit produces concrete evidence and a separate justified scope.

### Required Audit coverage

At minimum inspect and classify:

1. fresh-game progression through actual terminal victory/defeat without state injection;
2. organic bot late-game production, Solar War strength and Gate-attack prerequisites;
3. catalog/tooltip effects versus real runtime consumers;
4. combat determinism and multi-fleet doctrine correctness;
5. construction/research UI truth versus reducer/runtime truth;
6. personality/difficulty behavior and durable bot memory;
7. galaxy topology, solar-system presentation and colonization;
8. ships, defence, commander ships, population/capacity and faction asymmetry;
9. fleet missions, slots, travel/ETA contracts and logistics;
10. economy/production overview and multi-planet QoL;
11. spying/reconnaissance and report surfaces;
12. combat model, battle reports, debris/recycling and known/unknown formulas;
13. Resource/Battle/Total/Achievement score layers and Admiral/commander progression;
14. achievements, ranking, profile and alliance surfaces;
15. moving asteroid/debris world mechanics;
16. saved-page/MHTML/catalog evidence that is useful for research but should not become runtime coupling;
17. current CI reproducibility, production/browser/Pages baseline after Release 1.0.

### Required Audit outputs

The Audit PR must contain:

- current exact `main` SHA and verified release/runtime baseline;
- affected Stellar files/modules/tests/docs, not just a feature wishlist;
- an explicit statement whether a clean ordinary campaign is proven to reach terminal victory/defeat;
- evidence showing where current progression/closure tests stop and where fixtures/state injection are used;
- measured organic bot endgame readiness findings;
- ghost-effect wiring matrix from advertised effect to actual runtime consumer;
- combat correctness findings for deterministic seed and multi-fleet doctrine handling;
- UI/runtime truth findings for build queue and research requirements;
- bot personality/difficulty behavior matrix;
- the Nemexia parity matrix with provenance and confidence for each Nemexia-derived fact;
- gaps, contradictions and research blockers;
- explicit rejected/non-port/deprioritized items;
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
4. Worker then executes only the approved implementation batch.
5. **Dependent PRs are sequential checkpoints:** complete one PR, return it to the controller, merge only after approval, then create the dependent successor from the new fresh `main`.
6. **Independent PRs may be prepared as one approved batch** when the Audit proves they do not depend on each other's changes; controller review still occurs before merge authorization.
7. After the accepted batch is closed, worker sends one whole-batch closeout report to the controller.
8. Controller decides whether the batch is closed, needs correction, or requires re-audit before any next batch begins.

No worker may silently broaden scope, self-authorize a new batch, or build a dependent successor from an unmerged predecessor branch.

## Batch sizing

Use the repository audit-first complexity model from `AGENTS.md`:

- heavy: 1–2 implementation PRs maximum;
- medium: **4 implementation PRs by default**;
- light: **6 implementation PRs maximum**, only when repetitive, independent and low risk.

For this post-1.0 program, prefer 4. A 6-PR batch requires explicit Audit justification and controller approval. Audit PRs do not count toward the implementation count.

Each implementation PR must be one coherent behavior change and cite the accepted Audit/work-item ID. Every dependent branch must be created from the latest merged `main`.

## Required batch report

After a worker closes an approved batch, report exactly:

| Field | Required content |
|---|---|
| Baseline | Audit PR, audit squash SHA, starting `main` SHA |
| PRs | number, work-item ID, title, branch, head SHA, state |
| Dependency checkpoints | controller decision and predecessor merge SHA for each dependent PR |
| Scope | what changed and intentional omissions per PR |
| Files | material changed files/modules |
| Validation | lint/typecheck/tests/build/browser/performance/Graphify as applicable |
| Risk | known risk, migration impact, deferred research |
| Merge state | open/merged; merge SHA only when controller authorized merge |
| Production evidence | Pages/production smoke where relevant; never invent missing evidence |
| Divergence | any departure from the accepted Audit |
| Next | proposed next Audit/batch, not automatically authorized |

The report must be sufficient for a controller to decide `CLOSE`, `FIX`, `STOP/RE-AUDIT` without rediscovering the whole batch. Dependent PRs receive their earlier per-PR controller checkpoints; the whole-batch report is the final closeout gate, not a substitute for those checkpoints.

## Candidate post-1.0 streams

These are research streams, not implementation authorization and not a fixed order.

### N1 — Campaign truth and organic endgame

- clean Fresh Game → Terminal proof;
- organic bot late-game production/readiness;
- no fixture success presented as proof of organic progression.

### N2 — Runtime truth / ghost-effect cleanup

- building/research effects must have real consumers or truthful copy;
- combat deterministic seed and multi-fleet doctrine correctness;
- UI requirement/queue truth must match runtime.

### N3 — Bot behavioral depth

- differentiate the existing three personalities first;
- make difficulty affect decision quality/risk;
- use durable observations/outcomes as meaningful memory.

### N4 — Reference/provenance foundation

- Stellar-vs-Nemexia parity matrix;
- provenance/confidence register;
- verified catalog evidence and explicit unknown-formula register.

### N5 — Solar-system and colonization fidelity

Investigate the observed Nemexia reference of 3 galaxies × 40 solar systems × 24 positions, discrete system positions, solar-system navigation and colonization UX. Stellar may keep its current topology where better; reference numbers are evidence, not mandatory targets.

### N6 — Faction military catalog depth

Compare ship/defence/commander catalogs, population weights, roles, counters and faction asymmetry. Do not import values blindly; preserve Stellar balance and campaign constraints unless an accepted Audit intentionally changes them.

### N7 — Combat evidence and battle reports

Use live battle-report evidence to improve report fidelity and research combat behavior. Exact armor, targeting, ability, Resource Point and Battle Point formulas remain research items unless proven or intentionally redefined for Stellar.

### N8 — Profile, scoring and progression

Investigate Resource Points, Battle Points, Total Points, Achievement Points, ranking/profile presentation and Admiral progression. Do not assume remembered `1 point / 1000 resources` or `Total = Resource + Battle` without evidence.

### N9 — Dynamic world / debris loop

Audit moving asteroids, debris, recycler/recovery missions and ETA-dependent target prediction as possible world-depth mechanics.

### N10 — Empire operations QoL

Audit multi-planet overview, fleet production planning, target fleet doctrine, dislocation/logistics, slot visibility and resource-transfer planning as player-facing QoL rather than automation.

### N11 — Reconnaissance, reports and intelligence

Audit spy-report data layers, report categories, target information disclosure and fleet intelligence against Stellar's information-security rules and bot parity.

### N12 — Social/meta surfaces

Research achievements, ranking, alliances, commander/admiral progression and profile identity only after their actual reference evidence and Stellar product value are clear.

### N13 — Deep reference extraction

MHTML/resource extraction, information-page catalog extraction and larger battle-report datasets are research tooling tasks. They should feed evidence, not become production dependencies.

## Initial priority hypothesis

The first Audit should rank by player value, architectural fit, evidence quality and migration risk. Current controller priority is:

1. **Fresh Game → Terminal proof without state injection**;
2. **organic late-game bot production / Solar War strength / planet-destroyer availability**;
3. **ghost effects and Ecology wiring**;
4. **combat seed + multi-fleet defender doctrine correctness**;
5. **research-requirement UI truth + misleading build-queue slots**;
6. **make the existing three bot personalities materially different**;
7. **`npm ci`, visual snapshots, accessibility checks and proven dead-code cleanup**;
8. only then promote larger Nemexia-derived feature streams according to evidence/value.

This order is a hypothesis, not a mandate to implement all items. The Audit may change it when fresh source/test/runtime evidence demonstrates a better path.

## Hard stop conditions

Stop and return to Audit instead of implementing when:

- a needed Nemexia fact is only memory/heuristic/hypothesis;
- current Stellar already has a stronger intentional mechanic and no clear adaptation benefit exists;
- a change requires an unplanned schema/save migration;
- combat/economy formulas would have to be guessed;
- scope mixes heavy architecture with a six-PR light batch;
- production/release baseline is not understood;
- implementation would copy automation infrastructure rather than a game-domain concept;
- a prepared fixture is being used to claim that organic Fresh Game → Terminal progression is proven.

## Immediate next action

```text
fresh main after this docs-only roadmap merge
→ POST-1.0-NEMEXIA-PARITY-AUDIT (docs only)
→ prove/falsify Fresh Game → Terminal first
→ verify organic bot endgame readiness and controller-priority correctness/UI/effect risks
→ complete Nemexia parity/provenance matrix
→ controller review
→ Audit merge only if approved
→ approved 4-PR implementation batch by default
   OR explicitly justified 6-PR light batch
→ dependent PR: controller checkpoint → merge → fresh main → successor
   independent PRs: may be prepared together when Audit proves independence
→ whole-batch closeout report to controller
→ controller CLOSE / FIX / STOP-RE-AUDIT decision
```

Until that Audit is accepted, **no post-1.0 product implementation is authorized**.
