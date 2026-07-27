# Stellar Empires — master runtime asset backlog and generation prompt

**Status:** living canonical asset replacement register  
**Created:** 2026-07-26  
**Baseline:** merged PR #97  
**Purpose:** track every source asset, procedural placeholder, CSS/SVG temporary visual and future generation request until it becomes a validated runtime asset.

---

## 1. Mandatory rule

Whenever an implementation PR introduces a procedural, CSS-generated, generic or semantically incorrect fallback visual, that same PR must add or update an entry in this document.

No undocumented placeholder is allowed.

Replacing art must never change simulation state or save schemas. Components resolve a stable semantic asset ID through a manifest.

---

## 2. Status vocabulary

| Status | Meaning |
|---|---|
| `NEEDED` | no satisfactory source asset exists |
| `PROMPT_READY` | generation brief is complete |
| `GENERATED` | candidate output exists but has not passed QA |
| `SOURCE_READY` | approved transparent source master exists |
| `PROCESSING_REQUIRED` | source exists but needs resize/crop/cleanup/optimization |
| `RUNTIME_READY` | processed derivative is registered and tested |
| `PROCEDURAL_ACTIVE` | runtime currently renders a deterministic placeholder |
| `CSS_ACTIVE` | runtime currently uses a CSS/SVG primitive intentionally |
| `REJECTED` | candidate failed QA and must not enter runtime |
| `NOT_REQUIRED` | procedural/CSS solution is final by design |

---

## 3. Required fields for every entry

```text
assetId
family
status
sourcePath or candidatePath
runtimeDestination
usage
masterCanvas
runtimeSizes
alphaRequirement
safeArea
camera/view
lighting
palette/style
negativePrompt
qaChecklist
introducedByPr
replacementTargetPr
notes
```

---

## 4. Runtime asset principles

- Source masters live under `assets/source/` or another explicit provenance location.
- Runtime derivatives live under `public/assets/generated/` or a versioned atlas location.
- Large source PNGs are never loaded directly by gameplay screens.
- Prefer WebP for opaque/alpha raster derivatives when quality is acceptable; retain PNG where exact alpha or tooling requires it.
- Use atlases only where they reduce requests without creating oversized always-resident textures.
- Use multiple resolution variants for large map art.
- All transparent assets are checked on black, white and faction-background surfaces.
- Outer alpha must be genuinely transparent, not a painted checkerboard or chroma background.
- No baked text unless the asset is explicitly a localized decorative label.
- No baked selection/status markers inside object art.
- No ground shadow for isolated ships/buildings unless the target UI contract explicitly requires it.
- Stable IDs are semantic; filenames may change behind the manifest.

---

## 5. Existing source inventory

### 5.1. Core catalogs

| Family | Expected | Current state |
|---|---:|---|
| Faction buildings | 72 | source masters committed; processing/runtime replacement incomplete |
| Ordinary ships | 39 | source masters committed; runtime still uses compatibility fallbacks in places |
| Planetary defences | 27 | source masters committed; processing/runtime replacement incomplete |
| Commander Ships | 13 | source masters committed; processing/runtime replacement incomplete |
| Technologies | 22-role functional catalog per faction namespace | source material committed; exact runtime coverage requires audit |

### 5.2. Universe set from PR #97

| Family | Count | Current status | Contract target |
|---|---:|---|---|
| Galaxy nebulae | 20 | `RUNTIME_INTEGRATED` in PR #107 | 256×256 runtime masters/variants |
| System stars | 12 | `RUNTIME_INTEGRATED` in PR #107 | 128×128 |
| Active suns | 8 | `RUNTIME_INTEGRATED` in PR #107 | 512×512 master + smaller derivatives |
| Protostars | 2 | `RUNTIME_INTEGRATED` in PR #107 | 512×512 master + smaller derivatives |
| Stellar remnants | 2 | `RUNTIME_INTEGRATED` in PR #107 | 512×512 master + smaller derivatives |
| Planets | 24 | `RUNTIME_INTEGRATED` in PR #107 | 256×256 |
| Asteroids | 8 | `RUNTIME_INTEGRATED` in PR #107 | documented strategic-object size |
| Debris fields | 6 | `RUNTIME_INTEGRATED` in PR #107 | documented strategic-object size |
| Renegade objects | 6 | `RUNTIME_INTEGRATED` in PR #107 | documented strategic-object size |
| Generic markers | 2 | `RUNTIME_INTEGRATED` in PR #107; insufficient semantic coverage | replace/supplement with semantic marker family |

PR #107 resolution:

- all 90 masters are preserved under `assets/source/universe-navigation/**`;
- 102 optimized WebP derivatives are generated under `public/assets/generated/universe/**`;
- typed lazy groups prevent eager startup loading and enforce per-view budgets;
- semantic aliases resolve historical filename differences;
- the two supplied markers are bound to sun attack/support; remaining overlays stay in section 8.

---

## 6. Core catalog processing backlog

### BUILDING.ALL.CANONICAL

```text
assetId: building.<faction>.<slug>
family: building
status: SOURCE_READY / PROCESSING_REQUIRED
usage: planet zone, building card, queue, tooltip, information panel
masterCanvas: preserve approved source master
runtimeSizes: 256, 384 and optional 512 long-side derivatives
alphaRequirement: clean transparent outer background
safeArea: full object visible; 8% margin minimum
camera/view: consistent game-card three-quarter/isometric presentation
negativePrompt: environment, terrain, text, logo, frame, duplicate building, cut-off object, chroma residue, checkerboard
qaChecklist: correct faction; unique ID; no halo; dark-background edge test; readable at card size
replacementTargetPr: #100
```

### TECHNOLOGY.ALL.CANONICAL

```text
assetId: technology.<faction>.<slug>
family: technology
status: SOURCE_READY or NEEDED after audit
usage: research cards, dependency tree, completion reports
masterCanvas: 512×512 preferred
runtimeSizes: 128, 192, 256
alphaRequirement: transparent or intentionally bounded card art
safeArea: central symbol readable at 64px
camera/view: iconographic scientific device/concept
negativePrompt: text, numbers, UI frame, unrelated faction, clutter, illegible micro-detail
replacementTargetPr: #101
```

### SHIP.ALL.CANONICAL

```text
assetId: ship.<faction>.<slug>
family: ordinary ship
status: SOURCE_READY / PROCESSING_REQUIRED
usage: shipyard, fleet selection, map fleet, reports, combat
masterCanvas: preserve source master
runtimeSizes: 128 thumbnail, 256 card, 512 report/hero where needed
alphaRequirement: true alpha; no floor/space background; no shadow
safeArea: entire hull and appendages visible; 8% margin
camera/view: consistent faction three-quarter view
negativePrompt: environment, starfield, platform, text, cut-off wings, motion blur, extra ships, chroma residue
replacementTargetPr: #102
```

### DEFENCE.ALL.CANONICAL

```text
assetId: defense.<faction>.<slug>
family: planetary defence
status: SOURCE_READY / PROCESSING_REQUIRED
usage: defence production, planet defence, repair, battle report
runtimeSizes: 128, 256, optional 384
alphaRequirement: true alpha; no ground plane
safeArea: weapon silhouette readable
negativePrompt: terrain, wall section, city, text, extra turrets, cut-off barrels, baked shield status
replacementTargetPr: #103
```

### COMMANDER.ALL.CANONICAL

```text
assetId: commander.shared.<slug>
family: Commander Ship
status: SOURCE_READY / PROCESSING_REQUIRED
usage: Admiral roster, flagship selection, fleet card, report, ability panel
runtimeSizes: 160, 256, 512
alphaRequirement: true alpha
safeArea: complete flagship silhouette
negativePrompt: environment, multiple ships, text, insignia labels, cut-off hull
replacementTargetPr: #103
```

---

## 7. Universe physical object backlog

All PR #97 objects must retain their visual content but be processed behind stable semantic IDs.

### UNIVERSE.GALAXY.NEBULA.01-20

```text
assetId: universe.galaxy.nebula.<01-20>
status: RUNTIME_INTEGRATED
sourcePath: public/assets/universe/galaxies/galaxy.nebula-XX.png
runtimeDestination: public/assets/generated/universe/galaxies/galaxy.nebula-XX.webp
usage: Universe 200×200 galaxy node
masterCanvas: 256×256
alphaRequirement: transparent outer edge
safeArea: luminous structure inside central 80%; no cropped arms
negativePrompt: rectangular background, hard border, text, labels, giant stars, opaque black corners
deliveredPr: #107
```

### UNIVERSE.SYSTEM.STAR.01-12

```text
assetId: universe.system.star.<01-12>
status: RUNTIME_INTEGRATED
usage: Galaxy view system node
masterCanvas: 128×128
alphaRequirement: transparent outside corona
safeArea: corona within 90%
negativePrompt: planet, lens frame, text, square background
deliveredPr: #107
```

### UNIVERSE.SUN.ACTIVE.01-08

```text
assetId: universe.sun.active.<01-08>
status: RUNTIME_INTEGRATED
masterCanvas: 512×512
runtimeSizes: 128, 256, 512
usage: Solar-system center and sun panels
alphaRequirement: transparent outside corona
negativePrompt: planet surface, black square, labels, artificial ring, cropped corona
deliveredPr: #107
```

### UNIVERSE.SUN.PROTOSTAR.01-02

```text
assetId: universe.sun.protostar.<01-02>
status: RUNTIME_INTEGRATED
masterCanvas: 512×512
usage: recovering system state
visual requirement: visibly forming, unstable and distinct from active star
deliveredPr: #107
```

### UNIVERSE.SUN.COLLAPSED.01-02

```text
assetId: universe.sun.collapsed.<01-02>
status: RUNTIME_INTEGRATED
masterCanvas: 512×512
usage: collapsed/destroyed system state
visual requirement: dark stellar remnant, readable without implying the whole galaxy is destroyed
deliveredPr: #107
```

### UNIVERSE.PLANET.01-24

```text
assetId: universe.planet.<01-24>
status: RUNTIME_INTEGRATED
masterCanvas: 256×256
runtimeSizes: 96, 120, 256
usage: Solar-system fixed slots and planet switcher thumbnails
alphaRequirement: true alpha
safeArea: atmosphere/rings inside canvas
negativePrompt: starfield, UI ring, text, rectangular background, cropped rings
deliveredPr: #107
```

### UNIVERSE.ASTEROID.01-08

```text
assetId: universe.object.asteroid.<01-08>
status: RUNTIME_INTEGRATED
usage: asteroid/gas/extraction strategic object
alphaRequirement: true alpha
negativePrompt: ground, large planet, ship, text
deliveredPr: #107
```

### UNIVERSE.DEBRIS.01-06

```text
assetId: universe.object.debris.<01-06>
status: RUNTIME_INTEGRATED
usage: debris field
visual requirement: sparse readable fragments; no full intact ship
alphaRequirement: true alpha with no bright rectangle
deliveredPr: #107
```

### UNIVERSE.RENEGADE.01-06

```text
assetId: universe.object.renegade.<01-06>
status: RUNTIME_INTEGRATED
usage: Renegade PvE object
visual requirement: clearly non-planetary and hostile; readable at 120px
deliveredPr: #107
```

---

## 8. Missing Universe overlays and markers

These are not sufficiently covered by the 90 PR #97 files.

### MAP.SELECTION.RING

```text
assetId: ui.map.selection-ring
status: CSS_ACTIVE or NEEDED
usage: selected galaxy/system/planet
masterCanvas: 256×256 scalable
style: thin original sci-fi targeting ring; faction-neutral; animated rotation optional
negativePrompt: text, faction logo, thick opaque disc
replacementTargetPr: #106-#109
```

### MAP.FOCUS.RING

```text
assetId: ui.map.focus-ring
status: CSS_ACTIVE / NOT_REQUIRED if CSS remains final
usage: keyboard focus
requirement: WCAG-visible independent of selection colour
replacementTargetPr: #106
```

### PLANET RELATION BADGES

Required stable IDs:

```text
ui.map.relation.own
ui.map.relation.allied
ui.map.relation.hostile
ui.map.relation.neutral
ui.map.state.protected
ui.map.state.inactive
ui.map.state.blocked
ui.map.state.vacation
ui.map.state.command-planet
```

Prompt block:

```text
Nine compact sci-fi status badges for a space-strategy map, consistent geometric family, transparent background, no letters, no numbers, strong silhouette at 20–28 px, each state differentiated by shape as well as colour, original Stellar Empires design, clean vector-like rendering.
Negative: text, detailed illustration, gradients that disappear at small size, copied game icons, rectangular background.
```

Status: `NEEDED` unless final CSS/SVG primitives are intentionally accepted.  
Replacement target: #109.

### EMPTY COLONIZABLE SLOT

```text
assetId: ui.map.empty-colonizable-slot
status: CSS_ACTIVE or NEEDED
usage: hover/focus on empty solar-system position
requirement: dashed orbit/slot geometry, position number external to art
replacementTargetPr: #108
```

### MISSION MARKER FAMILY

Required IDs:

```text
ui.mission.transport
ui.mission.espionage
ui.mission.attack
ui.mission.deploy
ui.mission.colonize
ui.mission.recycle
ui.mission.pirate
ui.mission.asteroid
ui.mission.expedition
ui.mission.renegade-espionage
ui.mission.renegade-attack
ui.mission.sun-support
ui.mission.sun-attack
```

Master prompt:

```text
A coherent set of thirteen compact mission icons for an original browser sci-fi strategy game. Transparent background, crisp vector-like silhouette, readable at 24 and 32 pixels, shared line weight and framing language, no text, no numbers, no outer square. Themes: cargo transfer, sensor probe, hostile attack, station/deploy, colony beacon, debris recycling, pirate raid, asteroid extraction, deep-space expedition, scan hostile anomaly, attack hostile anomaly, defend/support a star, assault a star. Neutral steel base with restrained semantic accents.
Negative: copied icons, photorealistic scene, tiny detail, labels, words, gradients outside alpha, inconsistent perspective.
```

Status: `NEEDED`.  
Replacement target: #110.

### FLEET ROUTE FAMILY

Required IDs:

```text
ui.route.line
ui.route.arrowhead
ui.route.origin
ui.route.destination
ui.route.fleet-own
ui.route.fleet-hostile
ui.route.fleet-allied
ui.route.inbound
ui.route.outbound
```

Prefer CSS/SVG for scalable lines and generated raster only for fleet tokens.  
Replacement target: #110.

### FOG AND INTELLIGENCE

```text
ui.map.fog.unknown
ui.map.intel.low
ui.map.intel.medium
ui.map.intel.high
ui.map.intel.stale
```

Status: `CSS_ACTIVE` initially. If CSS remains clear and performant, mark `NOT_REQUIRED`; otherwise generate overlays.  
Replacement target: #109.

### SUN DAMAGE / RECOVERY OVERLAYS

Required IDs:

```text
ui.sun.brightness.100
ui.sun.brightness.75
ui.sun.brightness.50
ui.sun.brightness.25
ui.sun.brightness.0
ui.sun.recovering
ui.sun.supported
ui.sun.under-attack
```

Use shader/CSS exposure where practical; only generate overlays when procedural treatment cannot communicate state.  
Replacement target: #145-#146.

---

## 9. Endgame asset backlog

Base faction Obelisk/Gate source art may already exist in the building catalog, but state presentation needs separate assets or overlays.

### SOLAR CRYSTAL

```text
assetId: endgame.solar-crystal
status: NEEDED
masterCanvas: 512×512
runtimeSizes: 48, 96, 256
usage: alliance inventory, global event, stolen-crystal counter
prompt: A singular high-value stellar crystal relic for an original sci-fi strategy game, faceted energy core containing a miniature solar flare, transparent background, centered, readable as a small icon, no text, no pedestal, no environment.
negativePrompt: generic diamond, currency symbol, UI frame, hands, landscape, watermark
replacementTargetPr: #147
```

### OBELISK CHARGE STATES

```text
assetId: endgame.obelisk.<faction>.charge-0..4
status: NEEDED or overlay-driven
usage: alliance endgame building
requirement: preserve base building art; represent crystal sockets/energy without creating five unrelated buildings
replacementTargetPr: #147
```

### GATE CONSTRUCTION STATES

```text
assetId: endgame.gate.<faction>.progress-0
assetId: endgame.gate.<faction>.progress-25
assetId: endgame.gate.<faction>.progress-50
assetId: endgame.gate.<faction>.progress-75
assetId: endgame.gate.<faction>.progress-90
assetId: endgame.gate.<faction>.progress-100
assetId: endgame.gate.<faction>.damaged
```

Status: `NEEDED` unless built through layered procedural construction masks.  
Replacement target: #147.

Master prompt template:

```text
Create a consistent construction progression for the same faction-specific intergalactic gate. Six isolated transparent game assets showing 0%, 25%, 50%, 75%, 90% and 100% completion, plus one damaged state. Preserve identical camera, scale, silhouette anchor points and lighting across every frame. Original Stellar Empires faction language, no environment, no ground, no text, no percentage labels, no shadow, true alpha.
Negative: changing camera, changing gate design between stages, extra ships, planets, workers, UI frame, chroma background, cropped structure.
```

---

## 10. UI shell asset backlog

### PRIMARY NAVIGATION ICONS

Required IDs:

```text
ui.nav.planet
ui.nav.flights
ui.nav.universe
ui.nav.alliance
ui.nav.personal
ui.nav.ranking
ui.nav.commander
```

Status: audit existing design-system assets; `NEEDED` where current icon is generic.  
Target: 256×256 master, readable at 28–40px.  
Replacement target: #113.

### ZONE ICONS

```text
ui.zone.overview
ui.zone.resource
ui.zone.industry
ui.zone.military
ui.zone.galactic
```

Target: 192×192 masters, shared geometry, faction-neutral.  
Replacement target: #113-#114.

### RESOURCE/STATUS ICONS

```text
ui.resource.metal
ui.resource.mineral
ui.resource.gas
ui.resource.energy
ui.resource.hangar
ui.resource.scrap
ui.resource.ozone-or-stability
ui.status.storage-warning
ui.status.energy-warning
ui.status.queue
ui.status.time
ui.status.locked
ui.status.completed
```

Audit current CSS/SVG icons before generating. Small icons should remain vector/CSS when practical.  
Replacement target: #112.

### PANEL AND TOOLTIP ORNAMENTS

Prefer nine-slice/CSS primitives. Generate only if current faction skins cannot meet the final design system.

Potential IDs:

```text
ui.frame.panel.aegis
ui.frame.panel.synod
ui.frame.panel.veyra
ui.frame.tooltip
ui.frame.modal
ui.frame.queue-slot.<faction>
```

Status: `CSS_ACTIVE`, audit in #121.

---

## 11. Combat and effect backlog

Physical unit art is ready; readable combat/status effects remain incomplete.

Required effect IDs include:

```text
fx.weapon.laser
fx.weapon.ion
fx.weapon.plasma
fx.ability.ignore-armor
fx.ability.crushing
fx.ability.bonus-life
fx.ability.armor-boost
fx.ability.revival
fx.ability.mega-force
fx.ability.freeze
fx.ability.artillery
fx.commander.critical
fx.commander.paralysis
fx.commander.reflect
fx.commander.repair
fx.commander.demolition
fx.planet.detonation
fx.planet.destroyed
fx.defense.shield-hit
fx.defense.shield-break
```

Initial status: `PROCEDURAL_ACTIVE` or `CSS_ACTIVE` after audit.  
Prompt/processing target: #129-#132 and #152.

General effect prompt:

```text
Isolated transparent sci-fi combat effect sprite for an original browser strategy game, centered, no ship or environment, high-contrast readable silhouette, restrained glow, clean alpha, designed for compositing over dark space and UI cards, no text, no rectangular background.
```

---

## 12. Procedural placeholder registration template

Copy this block in every PR that introduces a placeholder:

```md
### <ASSET ID>

- **Family:**
- **Status:** PROCEDURAL_ACTIVE | CSS_ACTIVE
- **Introduced by PR:**
- **Used in:**
- **Stable manifest ID:**
- **Current placeholder implementation:**
- **Why final art is deferred:**
- **Master canvas:**
- **Runtime sizes:**
- **Alpha requirement:**
- **Safe area:**
- **Prompt:**
- **Negative prompt:**
- **QA checklist:**
- **Target replacement PR:**
- **Notes:**
```

---

## 13. Universal generation prompt wrapper

Use this wrapper around category-specific prompts:

```text
Original production asset for Stellar Empires, an offline browser sci-fi strategy game. Match the established faction art bible and the supplied approved reference assets. Single isolated subject, centered, fully visible, consistent camera and scale for its asset family, clean readable silhouette at the specified runtime size, controlled studio lighting, high-quality game asset rendering, true transparent alpha background.

No environment, no ground plane, no platform, no sky, no starfield unless the asset category explicitly requires it, no text, no letters, no numbers, no logo, no watermark, no UI frame, no checkerboard, no chroma background, no cast shadow outside the object, no cropped appendages, no duplicate subjects, no unrelated faction motifs.
```

Faction suffixes:

### Aegis

```text
navy and gunmetal armour, angular engineered structure, cyan signal lights, restrained amber accents, durable and precise military-industrial construction, clean surfaces without random scratches or excessive greebling.
```

### Synod

```text
ivory ceramic and dark emerald structure, teal-green energy, thin gold structural accents, elegant geometric technology, smooth controlled surfaces, no dirty industrial wear.
```

### Veyra

```text
crimson-black chitin, organic armour plates, internal red bioluminescence, coherent living structure, restrained asymmetry, readable silhouette, no gore and no chaotic tentacle clutter.
```

---

## 14. QA checklist

Every candidate must pass:

- correct filename and stable asset ID;
- correct faction/category;
- exact target canvas;
- true alpha at corners and outer background;
- no chroma spill or bright halo;
- no hidden painted background inside holes;
- complete subject inside safe area;
- no unintended floor shadow;
- no text/logo/watermark;
- readable at smallest runtime size;
- dark and light backing preview;
- no near-duplicate of another required variant;
- compressed output inside budget;
- runtime manifest registration;
- visual regression/contact sheet approval.

---

## 15. Definition of backlog closure

This document is complete only when:

- every core mechanical ID resolves to `RUNTIME_READY` art;
- every Universe physical object resolves to optimized runtime art;
- every procedural placeholder is either accepted as final (`NOT_REQUIRED`) or replaced;
- all mission/status/endgame semantics remain readable without relying only on colour;
- CI enforces dimensions, alpha, checksums and asset budgets;
- no semantically incorrect compatibility fallback remains.


## Universe navigation package — completed in #107–#110

- 102 Universe runtime textures are bound and budget-gated.
- Universe, Galaxy and Solar-system views use lazy texture groups.
- Route/fleet/mission overlays use CSS/SVG and stable semantic IDs; no extra raster assets are required.
- Supplied Sun Attack and Sun Support markers are registered, but both actions remain disabled until the future solar-war batch.
