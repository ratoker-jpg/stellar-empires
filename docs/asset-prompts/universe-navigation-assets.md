# Universe navigation assets — requirements and generation prompts

**Status:** future art-production specification  
**Current runtime plan:** deterministic procedural placeholders  
**Replacement rule:** final assets must replace placeholders through a manifest without changing IDs, coordinates, save data or mission logic.

This file is intended as a copy-paste task for Codex or another asset-production workflow.

---

## 1. Global technical rules

All isolated objects:

- PNG;
- RGBA with real alpha;
- no chroma-key background;
- no checkerboard baked into the image;
- no text, labels, numbers or UI frames;
- no floor, horizon or rectangular backdrop;
- no clipped glow or object edges;
- centered;
- consistent camera and lighting within each asset family;
- transparent RGB outside visible alpha should be cleaned;
- preserve filenames exactly.

Quality checks:

- dimensions match the table;
- corner alpha is `0`;
- no visible object touches the canvas edge;
- no accidental cyan, green or magenta fringe from background removal;
- create a dark-background contact sheet for review;
- create `manifest.json` containing filename, width, height, family and variant index.

Suggested source path:

```text
assets/source/New assets/universe-navigation/
```

Suggested future runtime path:

```text
public/assets/universe-navigation/
```

---

## 2. Required asset inventory

| Family | Count | Source size | Runtime display |
|---|---:|---:|---:|
| Universe galaxy nebulae | 20 | `256 x 256` | `200 x 200` container |
| Galaxy-view system stars | 12 | `128 x 128` | approximately `80-96 px` |
| Active suns | 8 | `512 x 512` | `250 x 250` |
| Protostar | 2 | `512 x 512` | `250 x 250` |
| Collapsed-system remnant | 2 | `512 x 512` | `250 x 250` |
| Planet variants | 24 | `256 x 256` | `120 x 120` |
| Asteroids | 8 | `256 x 256` | maximum about `100 x 92` |
| Debris fields | 6 | `256 x 256` | `80-120 px` |
| Renegade PvE objects | 6 | `256 x 256` | `60-120 px` |
| Sun attack/support marker | 2 | `128 x 128` | `32-48 px` |
| Optional starfield background | 2 | `2048 x 1024` | cover, cropped responsively |

Total isolated/generated files excluding manifests and previews:

```text
92
```

The optional starfield backgrounds may be omitted permanently if procedural starfields look better.

---

## 3. Filename contract

### Universe galaxies

```text
galaxy.nebula-01.png
...
galaxy.nebula-20.png
```

### Galaxy-view stars

```text
system-star.variant-01.png
...
system-star.variant-12.png
```

### Suns

```text
sun.active-01.png
...
sun.active-08.png
sun.protostar-01.png
sun.protostar-02.png
sun.collapsed-01.png
sun.collapsed-02.png
```

### Planets

```text
planet.variant-01.png
...
planet.variant-24.png
```

### Strategic objects

```text
asteroid.variant-01.png
...
asteroid.variant-08.png

debris-field.variant-01.png
...
debris-field.variant-06.png

renegade-object.variant-01.png
...
renegade-object.variant-06.png

marker.sun-attack.png
marker.sun-support.png
```

### Optional backgrounds

```text
background.universe-starfield-01.webp
background.universe-starfield-02.webp
```

---

## 4. Batch prompt — Universe galaxy nebulae

Generate **20 separate PNG assets**, one asset per file.

```text
Create an original stylized deep-space galaxy nebula sprite for a science-fiction strategy game map.

OUTPUT:
- one isolated galaxy/nebula object
- 256 x 256 PNG
- real transparent alpha background
- fully contained inside the canvas
- soft irregular outer alpha, no rectangular backdrop
- no text, number, icon, border or UI
- no connecting lines
- no floor or horizon
- no cropped glow

VISUAL ROLE:
This sprite is displayed inside a 200 x 200 map node on the Universe screen. It must remain readable at that size. The clickable area is separate and must not be drawn.

STYLE:
- dense luminous galactic core
- irregular spiral, cloud, ring or fragmented-nebula silhouette
- layered dust lanes and sparse stars
- high contrast against a dark starfield
- polished browser strategy game art
- painterly sci-fi, not photoreal NASA imagery
- avoid excessive micro-detail
- preserve transparent negative space around the object

VARIATION:
Every output must have a clearly different silhouette, rotation, core structure and palette.
Use palettes across blue, cyan, violet, magenta, red, amber, green and mixed spectral colors.
Do not create near-duplicates.

NEGATIVE:
text, numbers, logos, watermark, UI frame, square background, black rectangle, planet, spaceship, station, hard shadow, chroma-key background, clipped bloom.
```

Required assignment:

```text
output 01 -> galaxy.nebula-01.png
...
output 20 -> galaxy.nebula-20.png
```

---

## 5. Batch prompt — Galaxy-view system stars

Generate **12 separate PNG assets**.

```text
Create an original compact star-system node sprite for a science-fiction strategy game Galaxy screen.

OUTPUT:
- 128 x 128 PNG
- real transparent alpha
- one centered star
- fully visible corona
- no text, orbit labels, UI or rectangular background
- readable when displayed at 80-96 px

STYLE:
- clear luminous stellar disc
- controlled corona and small flare structure
- slightly stylized strategy-game rendering
- limited detail, strong silhouette
- transparent outer glow
- no planet large enough to compete with the star

VARIATION:
Create 12 distinct stellar temperatures and activity states:
red dwarf, orange dwarf, yellow star, white star, blue-white star, blue giant, unstable red, unstable yellow, binary-looking glow cluster, dim cool star, bright hot star and pale ancient star.

NEGATIVE:
text, numbers, frame, black square, galaxy cloud, giant planet, spaceship, cropped glow, lens flare crossing the whole canvas.
```

---

## 6. Batch prompt — Active suns

Generate **8 separate PNG assets**.

```text
Create an original large sun asset for the center of a solar-system map in a science-fiction browser strategy game.

OUTPUT:
- 512 x 512 PNG
- real transparent alpha
- centered spherical star
- complete corona contained inside the canvas
- designed for display at 250 x 250
- no background, text, UI, orbit lines or planets

STYLE:
- strong readable spherical form
- turbulent luminous surface
- broad soft corona
- high-quality stylized sci-fi strategy-game art
- dramatic but not photoreal
- surface detail remains visible after downscaling
- no hard square bloom

VARIATION:
Eight distinct active-star variants with different temperatures and surface patterns.
Include green as one rare exotic variant because the canonical solar-war presentation may use unusual Stellar Empires star types.

NEGATIVE:
black rectangle, space background, UI ring, planet, station, spaceship, text, watermark, cropped corona, chroma key.
```

---

## 7. Batch prompt — Protostars

Generate **2 separate PNG assets**.

```text
Create an original protostar asset for a recovering destroyed solar system.

OUTPUT:
- 512 x 512 PNG
- transparent alpha
- centered object
- displayed at 250 x 250
- no background, UI or text

STYLE:
- young forming star
- bright compact core
- turbulent uneven plasma shell
- incomplete translucent corona
- subtle accretion wisps contained inside canvas
- clearly weaker and less stable than a mature sun
- readable at 250 px

VARIANTS:
1. early dim protostar
2. later brighter protostar

NEGATIVE:
planet, galaxy, black square, rectangular fog, large accretion disk cut by the canvas, text, interface frame.
```

---

## 8. Batch prompt — Collapsed-system remnants

Generate **2 separate PNG assets**.

```text
Create an original collapsed-star-system remnant for a science-fiction strategy map.

OUTPUT:
- 512 x 512 PNG
- real transparent alpha
- centered
- display at 250 x 250
- no background, UI, labels or planets

STYLE:
- dark extinguished stellar remnant
- fractured plasma, fading particles and a small residual core
- visually communicates that the system is unavailable
- controlled silhouette, not an opaque black circle
- sparse glow and debris stay inside canvas
- readable on a dark background

VARIANTS:
1. recent violent collapse
2. cold late remnant

NEGATIVE:
black rectangle, event horizon copied from a black-hole photo, giant galaxy, text, frame, spaceship, cropped particles.
```

---

## 9. Batch prompt — Planets

Generate **24 separate PNG assets**.

```text
Create an original isolated planet sprite for a science-fiction strategy game's solar-system map.

OUTPUT:
- 256 x 256 PNG
- real transparent alpha
- one complete planet centered
- no background, stars, orbit line, text or UI
- designed for display at 120 x 120
- fully contained atmosphere and rings

STYLE:
- stylized high-detail browser strategy game art
- strong spherical lighting and readable terminator
- surface features remain clear after downscaling
- consistent three-quarter illumination
- no cast shadow outside the planet
- rings allowed only on selected variants and must remain inside the canvas

VARIATION:
Create 24 clearly distinct planets covering:
rocky desert, volcanic, oceanic, terrestrial, frozen, toxic, barren moon-like, red canyon, gas giant, banded gas giant, ringed giant, storm giant, crystal world, machine world, irradiated world, jungle world, ash world, metallic world, methane world, cloud world, cracked world, dark rogue world, pale ancient world and exotic bioluminescent world.

NEGATIVE:
text, number, UI badge, square space background, multiple planets, spaceship, city skyline extending outside the sphere, cropped ring, chroma key.
```

---

## 10. Batch prompt — Asteroids

Generate **8 separate PNG assets**.

```text
Create an original isolated asteroid sprite for a science-fiction strategy map.

OUTPUT:
- 256 x 256 PNG
- real transparent alpha
- centered irregular asteroid
- no background, stars, text or UI
- fully contained
- readable at approximately 100 x 92

STYLE:
- chunky irregular silhouette
- visible craters and mineral seams
- stylized game asset
- controlled highlights
- no ground shadow

VARIATION:
Eight unique shapes and material mixes: dark iron, pale stone, red mineral, icy, fractured, crystalline, porous and metallic.

NEGATIVE:
planet sphere, spaceship, rectangular background, asteroid field with dozens of tiny objects, text, clipped rock.
```

---

## 11. Batch prompt — Debris fields

Generate **6 separate PNG assets**.

```text
Create an original compact space debris field sprite for a science-fiction strategy map.

OUTPUT:
- 256 x 256 PNG
- transparent alpha
- clustered wreckage fully contained
- no background, text or UI
- readable between 80 and 120 px

STYLE:
- broken hull plates, beams, engine fragments and small particles
- one coherent compact cluster
- clear silhouette at small size
- no identifiable copyrighted ship
- no giant explosion
- minimal contained glow

VARIATION:
Six distinct wreckage compositions and material palettes.

NEGATIVE:
intact spaceship, rectangular space background, text, logo, fire filling the whole canvas, clipped fragments.
```

---

## 12. Batch prompt — Renegade PvE objects

Generate **6 separate PNG assets**.

```text
Create an original Renegade PvE strategic object for a science-fiction browser strategy map.

OUTPUT:
- 256 x 256 PNG
- transparent alpha
- isolated object
- fully contained
- no background, text, faction logo or UI
- readable at 60-120 px

STYLE:
- hostile improvised orbital structure
- asymmetrical scavenged construction
- exposed machinery, antennas and weapon modules
- neutral dark metal with restrained red/orange warning lights
- clear compact silhouette
- not a normal player planet and not a standard ship

VARIATION:
Six roles: raider outpost, salvage nest, gun platform, sensor station, command hulk and pirate refinery.

NEGATIVE:
planet, complete spaceship, floor, space rectangle, text, watermark, excessive bloom, cropped antennas.
```

---

## 13. Prompt — Sun Attack marker

```text
Create one original Sun Attack mission marker icon.

OUTPUT:
- marker.sun-attack.png
- 128 x 128 PNG
- transparent alpha
- readable at 32-48 px
- no text or frame

DESIGN:
A compact aggressive fleet/arrow symbol aimed toward a small stellar disc.
Strong silhouette, red-orange attack accent, minimal detail, strategy-game UI icon.

NEGATIVE:
letters, numbers, square background, detailed scene, copyrighted insignia.
```

---

## 14. Prompt — Sun Support marker

```text
Create one original Sun Support mission marker icon.

OUTPUT:
- marker.sun-support.png
- 128 x 128 PNG
- transparent alpha
- readable at 32-48 px
- no text or frame

DESIGN:
A compact shield/fleet symbol protecting a small stellar disc.
Strong silhouette, cyan-blue defence accent, minimal detail, strategy-game UI icon.

NEGATIVE:
letters, numbers, square background, detailed scene, copyrighted insignia.
```

---

## 15. Optional prompt — Starfield backgrounds

Generate **2 WebP backgrounds** only if the procedural starfield is rejected.

```text
Create an original deep-space starfield background for a science-fiction strategy game map.

OUTPUT:
- 2048 x 1024 WebP
- no alpha required
- seamless or edge-compatible for cover cropping
- no text, UI, planets, suns, ships or prominent galaxy objects

STYLE:
- dark navy-black base
- layered small stars
- restrained blue/cyan/violet dust
- low contrast behind map objects
- no single focal point
- no bright cloud that reduces label readability

VARIATION:
1. cooler blue-violet field
2. darker neutral field

NEGATIVE:
NASA photo replication, giant nebula core, lens flare, planets, text, UI.
```

---

## 16. Codex packaging task

```text
Prepare the generated Universe-navigation assets for Stellar Empires.

INPUT:
A folder containing all generated files listed in this specification.

TASK:
1. Verify exact filenames and expected counts.
2. Verify dimensions.
3. Convert every isolated image to PNG RGBA if necessary.
4. Ensure all four corners have alpha 0.
5. Remove transparent-pixel RGB contamination.
6. Detect any visible object touching the canvas edge.
7. Do not recolor or redesign accepted assets.
8. Create:
   - manifest.json
   - QA_REPORT.md
   - contact-sheet-dark.png
   - contact-sheet-checker.png
9. Package the validated result as:
   stellar-empires-universe-navigation-assets-v1.zip

MANIFEST FIELDS:
- id
- filename
- family
- variant
- width
- height
- alpha
- sha256
- qaStatus

FAIL CONDITIONS:
- missing file
- wrong filename
- wrong dimensions
- no alpha on isolated assets
- object clipped by canvas
- visible chroma fringe
- baked checkerboard or rectangular background
- duplicate or near-duplicate variant

Do not place these files into runtime automatically. The runtime integration must be a separate PR using the manifest and the fallback contract from docs/26-universe-galaxy-solar-system-navigation-contract.md.
```
