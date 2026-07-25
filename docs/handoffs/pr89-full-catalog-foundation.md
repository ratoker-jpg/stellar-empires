# PR #89 — Full catalog integration foundation

**Status:** implementation contract for the PR branch  
**Base:** fresh `main` after merged PR #88  
**Runtime required:** yes

## Objective

Prepare the current three-faction runtime for the complete captured gameplay catalogs without yet adding all final content in one unreviewable change.

Target catalog shape per the canonical research documentation:

- 24 buildings per faction;
- 22 shared technologies;
- 13 ordinary ships per faction;
- 9 planetary defences per faction;
- 13 shared Commander Ships.

This PR is the architecture, migration, registry, validation and asset-binding foundation. PR #90–#94 will fill the categories sequentially.

## Required implementation

1. Extend the mechanical-catalog architecture so the target counts and stable IDs are first-class and validated.
2. Preserve the stable ID policy:
   - `building.<faction>.<slug>`;
   - `technology.shared.<slug>`;
   - `ship.<faction>.<slug>`;
   - `defense.<faction>.<slug>`;
   - `commander.shared.<slug>` or an equally explicit shared namespace used consistently across runtime and saves.
3. Add explicit role registries for buildings, technologies, ordinary ships, defences and Commander Ships. Domain code must resolve capabilities by registry/role rather than hard-coded Aegis IDs.
4. Add complete-catalog target manifests and validators for:
   - duplicate IDs;
   - namespace/faction mismatch;
   - broken prerequisites;
   - unresolved producer/research dependencies;
   - invalid combat profiles;
   - invalid asset IDs;
   - target-count drift.
5. Add a manifest-driven binding layer for the source assets delivered by PR #86. Source assets must not be imported directly from gameplay components. Keep procedural/current runtime fallback until a specific target asset exists and passes validation.
6. Add deterministic additive save migration for all new catalog metadata needed by PR #90–#94. Do not invent unlocked content or silently replace player progress. Old saves must load with the same existing levels, queues, fleets and combat state.
7. Provide compatibility adapters so current 12/10/10/5 catalogs continue to run while the target manifests are incrementally populated.
8. Update bot planners, UI catalog providers and tests only as needed to consume the new registry contracts without changing current balance in this foundation PR.
9. Update `docs/project-status.json`, `docs/16-execution-roadmap.md` and required startup reading to establish PR #89–#94 as the active full-gameplay batch.
10. Keep the obsolete placeholder PR #84 closed without merge.

## Explicit exclusions

- Do not add the remaining buildings in this PR.
- Do not add the remaining technologies in this PR.
- Do not add the remaining ordinary ships in this PR.
- Do not add the remaining defences in this PR.
- Do not implement Commander Ship gameplay in this PR.
- Do not implement Universe navigation, alliances, Sun Attack, Solar Crystals or Supreme Galactic Gates.
- Do not copy source-game HTML, CSS, prose, formulas or binary assets into runtime.

## Acceptance criteria

- Existing three-faction gameplay still works.
- Existing saves migrate deterministically.
- Registry APIs can represent the complete target catalogs.
- Target manifests declare 24/22/13/9/13 without requiring placeholder gameplay definitions to be usable.
- Current catalogs pass all new validators.
- No direct faction-hard-coded catalog lookups remain in shared runtime paths unless explicitly documented and tested.
- Lint, TypeScript typecheck, full test suite and production build pass.
