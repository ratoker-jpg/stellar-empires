# PR #99 handoff — asset processing foundation

**Next PR:** #100 — full building art integration  
**Required base:** fresh `main` after PR #99 merge

## Delivered boundary

- `sharp`-based deterministic asset inspection and processing;
- source/runtime boundary and generated runtime root;
- committed audit manifest and generated audit report;
- processing and atlas plans;
- semantic IDs for all committed Universe intake files;
- CI freshness, count, leakage and budget checks.

## PR #100 startup

1. Read the canonical roadmap and asset backlog.
2. Use all 72 files under `assets/source/New assets/buildings`.
3. Add an explicit mapping from each canonical `building.<faction>.<runtime-slug>` ID to its approved source filename because source and simulation slugs differ.
4. Generate optimized runtime derivatives through `runtime-processing-plan.json`; never import source paths.
5. Bind every building to its own derivative in the complete mechanical asset manifest.
6. Integrate those bindings everywhere that already consumes `resolveCompleteMechanicalAsset`.
7. Add contact sheets and dark/light alpha QA for the three factions.
8. Update the master asset backlog and make building fallback resolution fail focused coverage tests.

## Do not include

- technology processing;
- ship, defence or Commander processing;
- Universe UI;
- unrelated gameplay changes.
