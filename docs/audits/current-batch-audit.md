# REFERENCE-NAVIGATION-REDESIGN-V2 — closure pointer

**State:** final implementation/closure PR #202 open  
**Updated:** 2026-08-31  
**Accepted Audit:** PR #199 → `87e6bf87dd9617ffe81ca00680a3c9f39bd536da`  
**Accepted contract archive:** `docs/audits/completed/reference-navigation-redesign-v2.md`  
**PR1:** `NAV-V2-01-CANONICAL-SHELL-PRIMARY-NAV` / #201 → `256a7fff09cac19ad0ad11f3558e29c63c75071b`  
**PR2:** `NAV-V2-02-REFERENCE-ROUTE-COMPOSITION-QA` / #202 → active  
**Schema/save:** v20 / v6, unchanged by this batch

## Authority

The exact accepted Audit #199 contract is archived verbatim at:

`docs/audits/completed/reference-navigation-redesign-v2.md`

Use that archive for the complete path envelope, ordered implementation plan, 20-screen mapping, acceptance gates, non-goals and persistence/determinism rules.

Actual GitHub state is authoritative over stale historical wording.

## Delivered batch

### NAV-V2-01 — merged

PR #201 delivered the canonical nine-item top navigation, contextual planet/task rails, Settings as the System landing, viewport-owned desktop shell, and route/history/checksum continuity.

### NAV-V2-02 — active closure

PR #202 applies the accepted reference composition across the mapped route states:

- Science category → catalog → selected technology detail/requirements/queue;
- Fleet compose staged visually as composition then target/mission, without new gameplay state;
- Reports journal/master-detail hierarchy over existing report data;
- Settings local categories Graphics / Sound / Interface / Controls / Notifications / Campaign & Saves without inventing GameState settings;
- shared Planet / Universe / Operations / Ranking / production / ship-upgrade presentation language;
- required 1672×941 reference baseline plus release viewport coverage;
- batch archive/status/history/continuation closeout.

No simulation formula, gameplay command, route family, bot behavior, GameState field, schema, save format or migration change is authorized or introduced.

## Merge gate for #202

Before squash-merge require on the exact final head:

- assets audit green;
- lint green;
- typecheck green;
- unit suite green;
- build green;
- Graphify green;
- Browser E2E green;
- production Pages smoke green;
- reference/responsive/accessibility/visual gates green;
- zero unresolved review threads;
- mergeable=true;
- no live-main drift.

Ordinary CI or review failures are fixed inside #202.

## Next action after #202

Do **not** start another implementation batch automatically.

The deferred program candidate is `NEM-02-BOT-SCHEDULER-BATCHING-PERF` from `docs/audits/deferred/nemexia-proto-sim-scaling.md`. Its accepted contract predates later merged work. After #202 merges, start a fresh docs-only Audit from the resulting `main` to revalidate current 100-bot scheduler, catch-up, save-size and performance truth before any NEM-02 implementation.

The generated #202 squash SHA is recorded by that next Audit or by an explicitly permitted tiny docs-only closure record, because #202 cannot self-reference its future merge commit.
