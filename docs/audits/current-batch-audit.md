# STRICT-REFERENCE-VISUAL-PARITY-V3 — current batch audit

**State:** docs-only Audit PR #203 open; implementation blocked until merge  
**Updated:** 2026-08-31  
**Baseline:** `main` at `466ec55f1751d36fd4a30175f7669f89ebe9a6a6`  
**Audit PR:** #203 `docs: audit strict reference visual parity v3`  
**Detailed Audit:** `docs/audits/strict-reference-visual-parity-v3.md`  
**Visual contract:** `docs/ui/reference-visual-parity-spec.md`  
**Asset ledger:** `docs/ui/missing-visual-assets.md`  
**Race theme spec:** `docs/ui/race-theme-token-spec.md`

## Controller correction

The previous navigation/reference batch is structurally complete but visually insufficient against the owner-supplied reference screens. This batch supersedes the previously proposed NEM-02 priority: strict visual parity is the active product priority before deferred simulation work.

## Locked requirements

- target as close to 1:1 as practical per exact reference screenshot;
- Planet refs `01/14/15/16` first;
- default top strip: remove Hangar, keep Population;
- procedural visuals allowed for missing final art;
- every missing image recorded with dimensions/format/theme;
- three distinct runtime faction themes: Aegis / Synod / Veyra;
- no gameplay/simulation/schema/save changes.

## Proposed batch after Audit merge

1. `VISUAL-V3-01-PLANET-STRICT-PARITY`
2. `VISUAL-V3-02-ALL-ROUTES-STRICT-PARITY`

Strictly sequential from fresh `main`. PR2 is blocked until PR1 is merged and visually accepted against the Planet references.
