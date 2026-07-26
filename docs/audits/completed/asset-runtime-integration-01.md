# Current implementation batch audit — ASSET-RUNTIME-INTEGRATION-01

**Status:** completed by implementation PRs #102–#105; final merge SHA `PR105_MERGE_SHA_PENDING`  
**Protocol:** `docs/28-audit-first-autonomous-delivery-protocol.md`  
**Verified baseline:** `main` after PR #100, SHA `5ca58493ab4eb1abd46e16e1307a9402efa636fa`  
**Complexity:** medium  
**Authorized implementation batch:** four PRs, #102–#105  
**Implementation started:** no

## 1. Executive decision

The batch integrates the complete approved catalog art before Universe work. It does not change gameplay mechanics. The four implementation PRs are:

| PR | Work item | Catalog coverage | Main outcome |
|---:|---|---:|---|
| #102 | `ASSET-BUILDINGS` | 72 buildings | every planet building uses its own processed runtime image |
| #103 | `ASSET-TECHNOLOGIES` | 66 faction mechanical IDs → 22 shared images | every research card uses the approved technology concept |
| #104 | `ASSET-SHIPS` | 39 ordinary ships | shipyard, missions and upgrade UI stop collapsing ships into six role images |
| #105 | `ASSET-DEFENSE-COMMANDERS` | 27 defences + 13 Commander Ships | defence cards and Admiral roster use final art; batch-wide fallback gate closes |

No implementation PR may combine Universe navigation, balance changes, save-schema changes, mechanics changes or unrelated UI redesign with this batch.

## 2. Evidence and confidence

### VERIFIED

- PR #99 created a deterministic Sharp pipeline, but both `runtime-processing-plan.json` and `runtime-atlas-plan.json` are empty.
- The generated runtime root is `public/assets/generated`; the committed runtime manifest is produced by `scripts/assets/process.mjs`.
- The audit contains 174 files under `assets/source/New assets`: exactly 72 canonical buildings, 22 technology concepts, 39 ordinary ships, 27 defences and 13 Commander Ships, plus one technology QA contact sheet not used as runtime art.
- Catalog targets are 24 buildings, 22 technologies, 13 ships and 9 defences per faction, plus 13 shared Commander Ships.
- Complete building cards already call `resolveCompleteMechanicalAsset`, but the resolver returns compatibility art because complete building runtime bindings do not exist.
- Research and production screens bypass the complete resolver and read the old faction atlas directly.
- `developmentPresentation.ts` applies a second post-render art layer using source sheets, so building, ship and defence cards currently have two competing presentation paths.
- Ordinary ship presentation collapses 13 ship classes into six images per faction; defence presentation collapses nine classes into three images per faction; every Commander currently falls back to the Aegis frigate.
- Graphify code-only analysis of the PR #100 baseline indexed 245 source/test files into 1,660 nodes, 5,507 directed relationships and 68 communities. The relevant hubs are the complete manifest, planet UI, research UI, production UI, fleet mission UI, command doctrine UI and bot catalog consumers.
- Bots consume mechanical catalogs and commands, not image files. Catalog IDs and simulation definitions therefore remain unchanged.

### DECISIONS

1. Use **individual WebP files**, not atlases, for this batch. `runtime-atlas-plan.json` remains empty.
2. Produce one primary derivative per approved asset:
   - building: 384×384, WebP quality 88;
   - technology: 256×256, WebP quality 88;
   - ship: 512×512, WebP quality 90;
   - defence: 384×384, WebP quality 90;
   - Commander: 512×512, WebP quality 91.
3. The batch creates 173 runtime textures. Estimated decoded RGBA residency if every texture were loaded simultaneously is 118,685,696 bytes (about 113.2 MiB), below the 192 MiB hard pipeline limit. Actual transfer size is not guessed; the 48 MiB gate must pass after generation.
4. Runtime image IDs are presentation data only. Mechanical IDs remain canonical and are never migrated or written differently to saves.
5. Technologies deliberately share one visual concept across factions: `technology.<faction>.<slug>` maps to `technology.shared.<slug>`.
6. The browser receives a generated synchronous TypeScript lookup module in addition to the JSON runtime manifest. UI code must not fetch a manifest asynchronously and must not import files from `public/` as source modules.
7. Card art is rendered by the owning screen. MutationObserver/name-based post-render replacement is removed for each migrated family.
8. `import.meta.env.BASE_URL` is used to construct public asset URLs so GitHub Pages subpath deployment remains valid.

### UNKNOWN

No critical unknown remains. Transfer size and visual edge quality are measurements produced during implementation, not design assumptions; either failing gate blocks the relevant PR.

## 3. Shared runtime architecture to establish in PR #102

### New machine-readable binding contract

Add `assets/manifests/mechanical-runtime-bindings.json` with schema version 1. Each entry contains:

```text
mechanicalId
category
sourceSemanticId
sourcePath
runtimeSemanticId
outputPath
width
height
```

Rules:

- one mechanical binding per complete catalog ID;
- one generated asset per `runtimeSemanticId`;
- multiple technology mechanical IDs may reference the same shared runtime semantic ID;
- source paths remain provenance only;
- output paths are restricted to `public/assets/generated/catalog/**`;
- entries are sorted by mechanical ID;
- no wall-clock timestamps.

### Generated browser module

Extend the processing pipeline to deterministically generate:

```text
public/assets/generated/runtime-asset-manifest.json
src/assets/generated/runtimeAssetManifest.generated.ts
```

The TypeScript module contains metadata and public-relative paths only. `src/assets/runtimeMechanicalAssets.ts` converts those entries into a normalized synchronous asset:

```text
id
runtimeSemanticId
url
width
height
source: generated | legacy-atlas
optional legacy frame
```

`resolveCompleteMechanicalAsset()` remains the compatibility entrypoint during the batch, but complete catalog bindings resolve through the generated lookup before any legacy fallback.

### Pipeline hardening in PR #102

`assets:check` must additionally fail on:

- stale runtime JSON or generated TypeScript module;
- a binding whose source path is absent from the source audit;
- a binding whose generated semantic ID is absent from the runtime manifest;
- duplicate mechanical IDs or generated output paths;
- orphan files under `public/assets/generated/catalog`;
- an output checksum/dimension mismatch;
- generated transfer, decoded-memory, texture-count or single-texture budget overflow;
- any complete-catalog ID still resolving through a family fallback after that family has migrated.

`assets:process` must clean only the managed `public/assets/generated/catalog` subtree before rebuilding the full committed processing plan. It must not delete unrelated runtime assets.

## 4. Linked authoritative contract files

The following files are part of this current audit and must be read before implementation:

- `docs/audits/contracts/asset-runtime-integration-01-mappings.md` — exact building aliases, shared technology mapping, ship/defence identity slugs and Commander filename exceptions;
- `docs/audits/contracts/asset-runtime-integration-01-prs.md` — exact implementation surface, ordered steps and acceptance gate for PRs #102–#105;
- `docs/audits/evidence/asset-runtime-integration-01-graphify.md` — Graphify queries, consumers, coupling assessment and limitations.

These linked files are not optional background. Together with this file they form the accepted implementation contract.

## 9. Cross-PR invariants

- Start every PR from fresh merged `main`; do not stack unmerged branches.
- Only the active family may add runtime derivatives in that PR.
- Run `npm run assets:process`, `npm run assets:audit`, then `npm run check`.
- Generated files, manifests and the TypeScript lookup must be committed together.
- No `Math.random()`, clock use or simulation state change.
- No catalog ID rename.
- No save migration.
- No mechanics, balance, cost, timing, requirement or bot-policy change.
- No Universe navigation work.
- Project-specific Obelisk/Gate mechanics remain authoritative; this batch changes only their building images.
- Source art remains provenance; production code references only generated runtime paths.
- Visual QA is performed on both dark and light backgrounds for every family.

## 10. Stop/re-audit conditions

Stop the implementation batch and open a replacement Audit PR when any of these occurs:

- the 173-texture plan cannot meet transfer or decoded-memory budgets without changing the agreed dimensions;
- a canonical source file is missing or visually unusable;
- synchronous runtime lookup would require save/state changes;
- implementation requires changing a mechanical ID;
- a screen outside the recorded consumer set owns canonical art state;
- the family cannot be separated from Universe work without architectural redesign.

Ordinary lint, type, test, build, mapping or CSS defects are implementation defects and must be fixed inside the current PR rather than triggering re-audit.

## 11. Authorized next action

After Audit PR #101 merges, create PR #102 from fresh `main` and implement only `ASSET-BUILDINGS`. Do not begin #103–#105 until each preceding PR is merged and its execution state is updated.


## 13. Batch completion record

- Audit PR #101: `2eb5d4996bb24cb7fa48305bb010e48a1263c465`;
- PR #102 buildings: `43471d9ab2a6527e3337f1e73e507d85e2d8e094`;
- PR #103 technologies: `b47ec8df9abc58d1ce455e3bf6ee1279d2e0d9d0`;
- PR #104 ships: `ba207dac57d3f6bf66559d074cf38abf54cdc12c`;
- PR #105 defences, Commanders and closure: `PR105_MERGE_SHA_PENDING`;
- final coverage: 217 mechanical IDs resolving through 173 generated runtime images;
- no save migration, mechanic change, balance change or bot-policy change;
- next implementation batch is prohibited until a fresh Audit PR is accepted.
