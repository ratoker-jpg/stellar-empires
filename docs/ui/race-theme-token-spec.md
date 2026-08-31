# Race Theme Token Specification

**Batch:** `STRICT-REFERENCE-VISUAL-PARITY-V3`  
**Runtime factions:** `Aegis`, `Synod`, `Veyra`  
**Scope:** visual theming only; no gameplay bonuses, formula changes or route differences.

## Shared theme API

Every race theme must provide the same semantic token set so screens keep one layout contract:

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
--race-frame-shape
```

Theme selection comes from the active player faction already present in runtime state. It must not create a second source of faction truth.

## Aegis

Visual identity: defensive, engineered, disciplined, armored high-tech.

- base: deep navy / graphite;
- primary accent: electric cyan-blue;
- secondary: cool silver;
- positive: mint/cyan-green;
- frames: angular but stable, reinforced corners;
- glow: controlled cyan, low bloom;
- icon language: shield/structure/precision geometry;
- planet frame: concentric defensive/radar rings;
- active nav: cyan lower edge + cool internal highlight;
- queue cards: sturdy segmented armor-panel treatment;
- background: technical grid + sparse blue star field.

Procedural target until final frame kit exists:

```css
--race-bg-0: #020912;
--race-bg-1: #061521;
--race-panel: rgb(5 24 36 / 92%);
--race-border: rgb(72 203 245 / 42%);
--race-border-strong: rgb(104 226 255 / 78%);
--race-accent: #24c8ff;
--race-accent-strong: #8ce8ff;
--race-secondary: #a9bdca;
--race-positive: #46f0bd;
--race-glow: 0 0 22px rgb(36 200 255 / 24%);
```

## Synod

Visual identity: analytical, scientific, ordered, high-precision technology.

- base: near-black blue/indigo;
- primary accent: violet-blue;
- secondary: pale cyan/white;
- positive: teal;
- frames: thinner, sharper, more mathematical than Aegis;
- glow: narrow violet/cyan edge light;
- icon language: crystal/research/signal motifs;
- planet frame: precise segmented arcs and measurement ticks;
- active nav: violet-blue focus with thin white/cyan datum line;
- queue cards: modular instrument-panel treatment;
- background: sparse constellation/grid/schematic pattern.

Procedural target:

```css
--race-bg-0: #030612;
--race-bg-1: #0a0d20;
--race-panel: rgb(9 16 37 / 92%);
--race-border: rgb(120 118 255 / 40%);
--race-border-strong: rgb(157 151 255 / 76%);
--race-accent: #756fff;
--race-accent-strong: #b9b6ff;
--race-secondary: #c5eaff;
--race-positive: #50e5cf;
--race-glow: 0 0 22px rgb(117 111 255 / 22%);
```

## Veyra

Visual identity: aggressive, energetic, fast, high-output military/energy technology.

- base: very dark burgundy/indigo-black;
- primary accent: hot magenta-red;
- secondary: amber/pale violet;
- positive: lime-teal where semantic positive is required;
- frames: sharper asymmetry, forward/aggressive cuts;
- glow: hotter edge light, still restrained around text;
- icon language: spear/energy/weapon vectors;
- planet frame: broken arcs, pulse nodes and directional markers;
- active nav: magenta edge + narrow amber core accent;
- queue cards: angular high-energy chassis treatment;
- background: dark nebula/energy streak field.

Procedural target:

```css
--race-bg-0: #0b030b;
--race-bg-1: #180815;
--race-panel: rgb(31 9 25 / 91%);
--race-border: rgb(255 82 164 / 38%);
--race-border-strong: rgb(255 111 185 / 76%);
--race-accent: #ff4f9d;
--race-accent-strong: #ff9bc8;
--race-secondary: #ffc36d;
--race-positive: #5cf0bd;
--race-glow: 0 0 22px rgb(255 79 157 / 22%);
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

The following must remain semantic/shared rather than faction-colored:

- destructive/error state;
- warning state;
- disabled state;
- readable body text;
- focus-visible outline contrast;
- gameplay resource identities where existing colors are semantically meaningful.

## Accessibility

Race themes must meet the same readability/focus contract. A race color may never be the sole indicator of active/selected/error state.

Reduced-motion disables non-essential pulse/orbit animation in all themes.

## Asset bindings

Final race-specific art requirements and dimensions are tracked in `docs/ui/missing-visual-assets.md`.
