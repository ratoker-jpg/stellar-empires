# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Release 1.0 closed; docs-only corrective visual Audit PR #203 active  
**Updated:** 2026-08-31  
**Verified merged main:** `466ec55f1751d36fd4a30175f7669f89ebe9a6a6` (PR #202 squash)  
**Active PR:** #203 `docs: audit strict reference visual parity v3`  
**Active work-item:** `STRICT-REFERENCE-VISUAL-PARITY-V3`  
**Runtime boundary:** schema v20 / save format v6 / no migration in this visual program

## Current goal

Correct the post-#202 visual mismatch against the owner-supplied reference screens. The new acceptance target is strict screenshot-level parity, not merely matching route structure or information architecture.

Durable contracts:

- `docs/audits/strict-reference-visual-parity-v3.md`;
- `docs/ui/reference-visual-parity-spec.md`;
- `docs/ui/race-theme-token-spec.md`;
- `docs/ui/missing-visual-assets.md`;
- `docs/ui/reference-visual-parity-checklist.md`.

## Controller correction

The previous `REFERENCE-NAVIGATION-REDESIGN-V2` batch is complete:

```text
Audit #199 → 87e6bf87dd9617ffe81ca00680a3c9f39bd536da
NAV-V2-01 / #201 → 256a7fff09cac19ad0ad11f3558e29c63c75071b
NAV-V2-02 / #202 → 466ec55f1751d36fd4a30175f7669f89ebe9a6a6
```

Its routing/shell work is foundation only. Controller comparison shows the Planet result is still visually too far from the supplied reference, so visual parity is again the active priority ahead of deferred NEM-02 simulation work.

## Audit #203 locked requirements

- target as close to 1:1 as practical against exact named reference screens;
- first implementation target: Planet refs `01/14/15/16`;
- remove Hangar from the default top resource strip;
- keep Population visible;
- use deterministic procedural CSS/SVG/canvas/generated visuals when final art is missing;
- record every missing final image with dimensions/format/theme;
- support three distinct visual themes for existing factions Aegis / Synod / Veyra;
- use existing `html[data-faction]` / faction identity as theme authority;
- no simulation/formula/bot/schema/save/route-semantic change.

## Proposed implementation after Audit merge

### 1. VISUAL-V3-01-PLANET-STRICT-PARITY

Planet overview + Resource / Industry / Military zones. This PR defines the accepted shared shell/race-theme visual language.

Merge gate includes controller screenshot comparison against refs `01/14/15/16` at 1672×941 in addition to normal Browser/accessibility checks.

### 2. VISUAL-V3-02-ALL-ROUTES-STRICT-PARITY

After PR1 merges and is visually accepted, propagate the accepted language to Universe, Fleets, Operations/Market/Solar War/Events/Arena, Science, Command, Reports, Ranking, Settings and Ship Upgrades using the exact dependency/path/test map in the Audit.

## Deferred work

`NEM-02-BOT-SCHEDULER-BATCHING-PERF` remains deferred. Do not start it while `STRICT-REFERENCE-VISUAL-PARITY-V3` is active.

## Current delivery sequence

```text
main 466ec55f...
→ docs-only Audit #203
→ squash-merge after exact-head green/review-clean
→ fresh main
→ VISUAL-V3-01 Planet strict parity
→ controller visual acceptance + merge
→ fresh main
→ VISUAL-V3-02 remaining strict parity
→ batch closeout
```

## Current stop rule

Do not implement from the Audit branch. Finish and merge #203 first. After merge start only `VISUAL-V3-01-PLANET-STRICT-PARITY` from fresh `main`.
