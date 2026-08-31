# Race Theme Token Specification

**Batch:** `STRICT-REFERENCE-VISUAL-PARITY-V3`  
**Runtime factions:** `Aegis`, `Synod`, `Veyra`  
**Scope:** visual theming only; no gameplay bonuses, formula changes or route differences.

## Existing authority

Theme selection already comes from `html[data-faction]`, populated from the active player faction by `applyFactionShellIdentity()`. Existing canonical faction colors in `src/styles/factionTheme.css` remain authoritative:

- Aegis — blue/cyan;
- Synod — emerald/green;
- Veyra — red/orange.

Strict visual parity extends those identities into a complete theme system instead of inventing a second faction-color source.

## Shared theme API

Every race theme must provide the same semantic token set:

```text
--race-bg-0
--race-bg-1
--race-panel
--race-panel-elevated
--race-border-subtle
--race-border
--race-border-strong
--race-accent
--race-accent-strong
--race-accent-soft
--race-secondary
--race-warning
--race-positive
--race-glow
--race-grid-line
--race-nav-active
```

## Aegis

Visual identity: defensive, engineered, disciplined, armored high-tech.

- base: deep navy / graphite;
- primary accent: electric cyan-blue;
- secondary: cool silver;
- frames: angular, stable, reinforced corners;
- glow: controlled cyan, low bloom;
- icon language: shield / structure / precision geometry;
- planet frame: concentric defensive/radar rings;
- active nav: cyan lower edge + cool internal highlight;
- queue cards: segmented armored-tech treatment;
- background: technical grid + sparse blue star field.

Procedural target:

```css
--race-bg-0: #020912;
--race-bg-1: #061521;
--race-panel: rgb(5 24 36 / 92%);
--race-border: rgb(78 167 255 / 42%);
--race-border-strong: rgb(104 210 255 / 78%);
--race-accent: #4ea7ff;
--race-accent-strong: #a9d9ff;
--race-secondary: #a9bdca;
--race-positive: #46f0bd;
--race-glow: 0 0 22px rgb(78 167 255 / 24%);
```

## Synod

Visual identity: synthetic, analytical, energy-efficient, high-precision machine technology.

- base: near-black teal/green-black;
- primary accent: emerald green;
- secondary: pale mint / cold silver;
- frames: thinner and more mathematical than Aegis;
- glow: narrow emerald edge light;
- icon language: circuit / node / signal / crystal geometry;
- planet frame: segmented arcs, measurement ticks and machine-node points;
- active nav: emerald focus with thin pale datum line;
- queue cards: modular instrument-panel treatment;
- background: sparse schematic grid + green energy nodes.

Procedural target:

```css
--race-bg-0: #020a08;
--race-bg-1: #071810;
--race-panel: rgb(5 28 20 / 92%);
--race-border: rgb(85 233 133 / 40%);
--race-border-strong: rgb(132 248 169 / 76%);
--race-accent: #55e985;
--race-accent-strong: #b8ffd0;
--race-secondary: #b9d7ca;
--race-positive: #83f4a7;
--race-glow: 0 0 22px rgb(85 233 133 / 22%);
```

## Veyra

Visual identity: organic swarm, aggressive growth, adaptive bio-technology.

- base: dark burgundy / blood-red black;
- primary accent: vivid red;
- secondary: hot orange / pale flesh-silver;
- frames: asymmetric, organic/angular hybrid cuts;
- glow: red edge light with restrained orange highlights;
- icon language: claw / spine / growth / bio-energy motifs;
- planet frame: broken arcs, pulse nodes and organic directional marks;
- active nav: red edge + narrow orange core accent;
- queue cards: high-energy organic chassis treatment;
- background: dark nebula + subtle red growth/energy streaks.

Procedural target:

```css
--race-bg-0: #0b0304;
--race-bg-1: #1a0809;
--race-panel: rgb(34 9 12 / 91%);
--race-border: rgb(255 90 100 / 40%);
--race-border-strong: rgb(255 130 137 / 76%);
--race-accent: #ff5a64;
--race-accent-strong: #ffc0c4;
--race-secondary: #ff9c72;
--race-positive: #76e7a8;
--race-glow: 0 0 22px rgb(255 90 100 / 22%);
```

## Component-level theme ownership

The following must visibly respond to race theme:

- top navigation active/hover treatment;
- global panel borders/backgrounds;
- planet hero frame/rings;
- left contextual rail accents;
- construction queue frame and active slot;
- local tabs/category controls;
- primary/secondary action styling;
- decorative space/grid background layer;
- faction emblem treatment.

The following remain semantic/shared:

- destructive/error state;
- warning state;
- disabled state;
- readable body text;
- focus-visible outline contrast;
- resource identities where existing colors carry gameplay meaning.

## Accessibility

Race themes must meet the same readability/focus contract. Race color may never be the sole active/selected/error indicator.

Reduced-motion disables non-essential pulse/orbit animation in all themes.

## Asset bindings

Final race-specific art requirements and dimensions are tracked in `docs/ui/missing-visual-assets.md`.
