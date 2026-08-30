# Reference navigation — missing/fallback asset ledger

**Batch:** `REFERENCE-NAVIGATION-REDESIGN-V2`  
**Purpose:** non-blocking inventory of visuals without approved final Stellar art

## Rule

Missing decorative art must not block navigation/layout implementation.

Before an implementation PR merges, every unresolved final-art gap it introduces or discovers must be recorded here. Runtime may temporarily use an original procedural CSS/SVG/canvas substitute.

A procedural fallback is acceptable only when it:

- uses no copied third-party/reference pixels;
- does not change gameplay data/state;
- respects reduced motion;
- is stable enough for Browser visual baselines;
- has a concrete ledger row when final replacement art is still wanted.

## Status values

- `NOT_NEEDED` — keep CSS/SVG/canvas or an existing owned asset.
- `PROCEDURAL_OK` — procedural final form is acceptable.
- `MISSING_FINAL_ART` — procedural fallback ships temporarily; final owned art is still wanted.
- `RESOLVED` — approved final asset + provenance/runtime binding exist.

## Initial audit

The supplied HTML reference contains **60+ distinct existing Stellar repository asset paths** and heavy procedural gradient/canvas/CSS rendering. No decorative image gap blocks this Audit.

| ID | Surface | Visual need | Status | Temporary fallback | Final replacement criteria |
| --- | --- | --- | --- | --- | --- |
| NAV-ASSET-001 | Primary navigation | route icons / active-tab ornament | `NOT_NEEDED` | CSS/SVG | Keep vector/CSS unless one coherent owned icon set materially improves readability. |
| NAV-ASSET-002 | Planet overview | glow/orbit/atmosphere | `PROCEDURAL_OK` | CSS/canvas + existing planet assets | Replace only if owned hero art materially improves fidelity without reducing legibility. |
| NAV-ASSET-003 | Universe | orbit lines/scanners/route overlays | `NOT_NEEDED` | canvas/SVG/CSS | These are map/UI primitives, not raster requirements. |
| NAV-ASSET-004 | Events / Solar War / Arena | decorative event/league/background art | `PROCEDURAL_OK` | gradients + existing runtime art | Promote to `MISSING_FINAL_ART` only when implementation proves a specific panel needs final art. |
| NAV-ASSET-005 | Market / Reports | charts/status/data marks | `NOT_NEEDED` | DOM/SVG/canvas | Keep data-driven; do not replace with static images. |
| NAV-ASSET-006 | Settings / Campaign | emblem / section icons | `PROCEDURAL_OK` | existing faction emblem + CSS/SVG | Final art optional; must remain Stellar-owned branding. |

## Row template during implementation

```text
| NAV-ASSET-### | route/surface | exact missing visual | MISSING_FINAL_ART | procedural technique used now | dimensions/content/provenance needed |
```

For a resolved row, record the repository path and runtime binding in the final-replacement column.

## Explicitly not tracked here

- catalog assets that already have runtime bindings;
- data-driven charts/graphs;
- CSS/SVG control icons;
- reference screenshots themselves;
- copied Nemexia/third-party imagery.
