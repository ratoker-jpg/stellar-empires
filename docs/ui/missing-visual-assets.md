# Missing Visual Assets Ledger

**Batch:** `STRICT-REFERENCE-VISUAL-PARITY-V3`  
**Rule:** missing final art never blocks layout implementation; use a procedural fallback and record the exact final need here.

## Status

- `MISSING` — final approved asset does not exist;
- `PROCEDURAL_FALLBACK` — runtime currently uses CSS/SVG/canvas/generated substitute;
- `READY_FOR_PRODUCTION` — dimensions/content are defined and final art can be produced;
- `RESOLVED` — approved owned asset exists and runtime binding is recorded.

## Asset inventory

| ID | Surface | Theme | Asset | Needed size | Format | Current fallback | Priority | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VIS-001 | Planet overview | Shared | hero planet render | 900×900 | WebP/PNG | procedural sphere + existing planet texture | CRITICAL | PROCEDURAL_FALLBACK | dominant center hero |
| VIS-002 | Planet overview | Shared | orbit/radar ring set | 1200×1200 | SVG/WebP | SVG/CSS rings | HIGH | PROCEDURAL_FALLBACK | transparent background |
| VIS-003 | Planet left rail | Shared | circular planet monitor art | 320×320 | WebP/PNG | procedural circular monitor | HIGH | PROCEDURAL_FALLBACK | reference left-rail visual anchor |
| VIS-004 | Construction queue | Shared | queue slot icon family | 64×64 each | SVG | line-icon fallback | MEDIUM | MISSING | active/free/locked variants |
| VIS-005 | Planet/resource zone | Shared | resource-zone environment/hero | 960×640 | WebP/PNG | procedural grid/lighting | HIGH | MISSING | may be split into smaller building art later |
| VIS-006 | Planet/industry zone | Shared | industrial-zone environment/hero | 960×640 | WebP/PNG | procedural industrial field | HIGH | MISSING | |
| VIS-007 | Planet/military zone | Shared | military-zone environment/hero | 960×640 | WebP/PNG | procedural military field | HIGH | MISSING | |
| VIS-008 | Universe | Shared | deep-space/map texture | 1920×1080 | WebP | procedural stars/grid | HIGH | PROCEDURAL_FALLBACK | must not reduce map legibility |
| VIS-009 | Universe | Shared | scan/orbit technical ornaments | 512×512 set | SVG | CSS/SVG lines | MEDIUM | PROCEDURAL_FALLBACK | |
| VIS-010 | Fleets | Shared | compose/catalog ship-stage backdrop | 1200×720 | WebP/PNG | procedural hangar/space lighting | MEDIUM | MISSING | local Fleet surface only; not top HUD |
| VIS-011 | Fleets | Shared | fleet sidebar icon family | 64×64 each | SVG | line icons | MEDIUM | MISSING | |
| VIS-012 | Solar War | Shared | Solar War hero/background | 1200×700 | WebP | procedural star/war background | HIGH | MISSING | |
| VIS-013 | Events | Shared | event hero/background family | 1200×700 | WebP | procedural event background | MEDIUM | MISSING | |
| VIS-014 | Arena | Shared | arena hero/background | 1200×700 | WebP | procedural arena field | MEDIUM | MISSING | |
| VIS-015 | Science | Shared | 6 category icon set | 64×64 each | SVG | glyph/CSS fallback | MEDIUM | PROCEDURAL_FALLBACK | |
| VIS-016 | Reports | Shared | report-type icon set | 48×48 each | SVG | glyph fallback | LOW | MISSING | |
| VIS-017 | Settings | Shared | settings category icon set | 48×48 each | SVG | glyph fallback | LOW | MISSING | |
| VIS-018 | Ranking | Shared | ranking/profile icon set | 48×48 each | SVG | glyph fallback | LOW | MISSING | |
| VIS-019 | Ship upgrades | Shared | upgrade class icon set | 64×64 each | SVG | glyph fallback | MEDIUM | MISSING | |
| VIS-020 | Shared shell | Aegis | panel frame kit | scalable / 9-slice | SVG/WebP | CSS borders/glow | HIGH | MISSING | cool armored-tech language |
| VIS-021 | Shared shell | Synod | panel frame kit | scalable / 9-slice | SVG/WebP | CSS borders/glow | HIGH | MISSING | precision/science language |
| VIS-022 | Shared shell | Veyra | panel frame kit | scalable / 9-slice | SVG/WebP | CSS borders/glow | HIGH | MISSING | aggressive/energy language |
| VIS-023 | Shared shell | Aegis | active top-nav ornament | 320×96 | SVG/WebP | CSS highlight | MEDIUM | MISSING | |
| VIS-024 | Shared shell | Synod | active top-nav ornament | 320×96 | SVG/WebP | CSS highlight | MEDIUM | MISSING | |
| VIS-025 | Shared shell | Veyra | active top-nav ornament | 320×96 | SVG/WebP | CSS highlight | MEDIUM | MISSING | |
| VIS-026 | Shared shell | Aegis | background texture layer | 1920×1080 | WebP | procedural gradient/noise | MEDIUM | PROCEDURAL_FALLBACK | |
| VIS-027 | Shared shell | Synod | background texture layer | 1920×1080 | WebP | procedural gradient/noise | MEDIUM | PROCEDURAL_FALLBACK | |
| VIS-028 | Shared shell | Veyra | background texture layer | 1920×1080 | WebP | procedural gradient/noise | MEDIUM | PROCEDURAL_FALLBACK | |
| VIS-029 | Planet overview | Aegis | faction planet-frame ornament | 1100×1100 | SVG/WebP | procedural rings | HIGH | MISSING | theme-specific overlay |
| VIS-030 | Planet overview | Synod | faction planet-frame ornament | 1100×1100 | SVG/WebP | procedural rings | HIGH | MISSING | theme-specific overlay |
| VIS-031 | Planet overview | Veyra | faction planet-frame ornament | 1100×1100 | SVG/WebP | procedural rings | HIGH | MISSING | theme-specific overlay |

## Explicit UI correction

The default top resource strip must **not** contain a Hangar card.

Population remains visible in the top resource strip.

Hangar/ship capacity information belongs in the relevant local Fleet/Shipyard/production surface.

## Adding rows

Use:

```text
| VIS-### | surface | Aegis/Synod/Veyra/Shared | exact visual | WxH | SVG/WebP/PNG | current procedural fallback | priority | status | runtime binding/replacement criteria |
```

No implementation PR may merge with an undocumented missing final-art dependency.
