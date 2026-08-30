# Reference navigation — missing/fallback asset ledger

**Batch:** `REFERENCE-NAVIGATION-REDESIGN-V2`  
**Purpose:** non-blocking inventory of visuals that do not yet have an approved final Stellar asset

## Rule

A missing decorative image must not block navigation/layout implementation.

Before an implementation PR merges, every unresolved final-art gap it introduces or discovers must be recorded in the table below. The runtime may temporarily use an original procedural CSS/canvas/SVG substitute.

A procedural fallback is acceptable only when it:

- uses no copied third-party/reference pixels;
- does not change gameplay data or state;
- remains readable with reduced motion;
- has a stable visual result suitable for Browser baselines;
- is labelled in this ledger with a concrete final-art need.

## Status values

- `NOT_NEEDED` — the visual should remain CSS/SVG/canvas or already has a suitable owned asset.
- `PROCEDURAL_OK` — final raster/vector art is optional; current procedural visual is acceptable.
- `MISSING_FINAL_ART` — layout may ship with procedural fallback, but final owned art is still wanted.
- `RESOLVED` — a final asset with provenance/runtime binding exists.

## Initial audit

The supplied HTML reference contains 61 explicit Stellar repository asset paths and makes heavy use of procedural gradients/canvas/CSS. No missing decorative image blocks the Audit itself.

| ID | Surface | Visual need | Current audit status | Temporary fallback | Final replacement criteria |
| --- | --- | --- | --- | --- | --- |
| NAV-ASSET-001 | Primary navigation | route icons / active-tab ornament | `NOT_NEEDED` | CSS/SVG | Keep native vector/CSS unless a coherent owned icon set materially improves readability. |
| NAV-ASSET-002 | Planet overview | planet glow/orbit/surface atmosphere | `PROCEDURAL_OK` | CSS/canvas + existing planet assets | Replace only if a final owned planet hero materially improves fidelity without reducing legibility. |
| NAV-ASSET-003 | Universe | orbit lines, scanners, route overlays | `NOT_NEEDED` | canvas/SVG/CSS | These are UI/map primitives, not raster-art requirements. |
| NAV-ASSET-004 | Events / Solar War / Arena | decorative event/league/background art | `PROCEDURAL_OK` | gradients + existing runtime art where available | Promote to `MISSING_FINAL_ART` only when implementation identifies a specific panel whose procedural art is visibly insufficient. |
| NAV-ASSET-005 | Market / reports | charts, status diagrams, data marks | `NOT_NEEDED` | DOM/SVG/canvas | Keep generated from live data; do not replace with static images. |
| NAV-ASSET-006 | Settings / campaign | campaign emblem / section icons | `PROCEDURAL_OK` | existing faction emblem + CSS/SVG | Final art optional; must remain original Stellar branding. |

## Rows to add during implementation

Use this template:

```text
| NAV-ASSET-### | route/surface | exact missing visual | MISSING_FINAL_ART | procedural technique used now | dimensions/content/provenance needed |
```

For a resolved row, record the repository path and runtime binding in the final-replacement column.

## Explicitly not tracked here

- gameplay catalog assets that already have runtime bindings;
- data-driven charts/graphs that should stay rendered from data;
- control icons that should remain CSS/SVG;
- reference screenshots themselves;
- copied Nemexia or other third-party imagery.
