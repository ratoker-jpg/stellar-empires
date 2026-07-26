# Current implementation batch audit

**Status:** awaiting dedicated Audit PR  
**Protocol:** `docs/28-audit-first-autonomous-delivery-protocol.md`  
**Baseline:** merged PR #99, `main` SHA `1868b5a7c1f540acb1882c0cc79d43ce185e216c`

## Batch identity

| Field | Value |
|---|---|
| Batch ID | `ASSET-RUNTIME-INTEGRATION-01` |
| Complexity | Medium |
| Planned implementation count | 4 |
| Audit PR | next PR after protocol merge |
| Implementation work items | `ASSET-BUILDINGS`, `ASSET-TECHNOLOGIES`, `ASSET-SHIPS`, `ASSET-DEFENSE-COMMANDERS` |
| Implementation PRs | assigned by the Audit PR |

## Current state

This file intentionally does **not** pretend that the implementation audit has already been completed.

The next PR must be a dedicated Audit PR that fully studies and replaces this placeholder with a verified implementation contract for:

1. 72 building assets and every building UI/runtime consumer;
2. 22 technology assets and research presentation;
3. 39 ordinary ship assets and fleet/shipyard/report consumers;
4. 27 defence assets plus 13 Commander Ships and final catalog asset coverage.

## Mandatory audit evidence

The Audit PR must inspect and record:

- `assets/manifests/source-asset-audit.json`;
- `assets/manifests/runtime-processing-plan.json`;
- `assets/manifests/runtime-atlas-plan.json`;
- `src/assets/completeMechanicalAssetManifest.ts`;
- current runtime asset registries and fallback resolvers;
- complete building, technology, ship, defence and Commander catalogs;
- planet-zone, research, shipyard, fleet, combat, report and Admiral UI consumers;
- bot production and fleet consumers;
- save-schema and deterministic replay implications;
- existing tests and missing acceptance coverage;
- Graphify paths and queries relevant to each family.

## Required output structure for every work item

```text
Work-item ID
Player-visible outcome
Verified baseline
Exact files and symbols
Data and dependency flow
Source → processed → runtime asset mapping
UI consumers
Bot consumers
Persistence impact
Tests and validation
Risks and non-goals
Implementation order
Acceptance gate
UNKNOWN items and verification method
```

## Implementation prohibition

No implementation PR from this batch starts until the dedicated Audit PR is merged and this file contains a complete verified contract.
