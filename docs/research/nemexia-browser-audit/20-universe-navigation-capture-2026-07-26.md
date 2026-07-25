# Universe navigation capture audit — 2026-07-26

**Status:** research-only source analysis  
**Purpose:** preserve the measurable presentation and interaction details of the user-supplied Universe/Galaxy/Solar-system capture before implementing an original Stellar Empires version.

> This document is evidence, not permission to ship captured source-game binaries or copy the surrounding UI. The canonical adaptation contract is `docs/26-universe-galaxy-solar-system-navigation-contract.md`.

---

## 1. Source package

User-supplied archive:

```text
page_2026-07-26_00-49-35_files.zip
```

SHA-256:

```text
c54d6c56fd368151ef41520ce8857ee7c930d9e2750d75da9090423ec59e5c8b
```

Archive facts:

- 337 files;
- 7 saved HTML documents including one nested saved resource;
- repeated local support files from several page captures;
- relevant `layout.css` and `galaxy.js`;
- screenshots supplied separately by the user identifying the root screen as **Universe**.

The user explicitly corrected the terminology:

```text
the shown root map is Universe, not Galaxy
```

---

## 2. Relevant locally captured images

| File role | Captured size | Mode |
|---|---:|---|
| Asteroid | `100 x 92` | RGBA |
| Repeating background tile | `16 x 16` | RGBA |
| Planet variants | `120 x 120` | RGBA |
| Small planet marker | `30 x 30` | RGBA |
| Renegade object | `57 x 53` | RGBA |
| Sun | `250 x 250` | RGBA |

The archive contains only a subset of planet variants visible in the screenshots.

The files `galaxy_1.png` through `galaxy_20.png` are referenced by CSS but are not present in the supplied ZIP. Their appearance is visible only in the screenshots.

---

## 3. Root Universe view

Recovered CSS:

```text
#universeView: height 468 px
galaxy node: 200 x 200 px
hit area: 80 x 80 px at left/top 60 px
```

The screenshot contains 15 populated galaxies. CSS defines 20 possible positions.

Exact recovered positions:

| Slot | Left | Top |
|---:|---:|---:|
| 1 | 463 | 95 |
| 2 | 286 | 104 |
| 3 | 611 | 134 |
| 4 | 384 | 247 |
| 5 | 407 | -23 |
| 6 | 606 | 20 |
| 7 | 530 | 328 |
| 8 | 240 | -12 |
| 9 | 196 | 177 |
| 10 | 248 | 289 |
| 11 | 680 | 258 |
| 12 | 131 | 83 |
| 13 | 51 | 161 |
| 14 | 101 | 312 |
| 15 | 790 | 139 |
| 16 | 69 | -24 |
| 17 | -24 | 248 |
| 18 | 783 | 11 |
| 19 | 802 | 307 |
| 20 | -33 | 42 |

Recovered behavior:

- galaxy number in a small white rounded label;
- player count hidden until hover;
- white rounded outline on hover;
- the current galaxy remains outlined;
- no graph edges are drawn;
- negative coordinates intentionally crop some nebulae.

---

## 4. Galaxy list view

Recovered geometry:

```text
viewport: 970 x 530
list width: 8748
column width: 108
systems per page: 9
page step: 972
maximum represented systems: 81
```

Recovered vertical node offsets:

```text
30, 50, 110, 160, 190, 260, 290, 310, 390
```

Recovered slide duration in `galaxy.js`:

```text
1500 ms
```

The list is a horizontally translated strip, not a responsive card grid.

---

## 5. Solar-system view

Recovered stage:

```text
#galaxyPlanets
height: 400
presentation margin: 70 px vertical
```

Sun:

```text
250 x 250
left: 368
top: 70
```

Planet/empty position:

```text
120 x 120
interactive child: 118 x 118
```

There are exactly 24 predefined positions. Their coordinates are preserved in the canonical contract.

Recovered presentation and behavior:

- occupied planets show number and owner/name strip;
- empty slots hide the number until hover;
- empty hover uses a dashed outline;
- owner-state strip colors distinguish own, hostile, neutral, inactive, vacation, blocked, protected and command planets;
- planet extras support asteroid and recycle/debris indicators;
- tooltip information is requested by galaxy/system/position coordinate and cached;
- empty-position click enters colonization flow;
- normal planet click enters player/planet information flow;
- sun hover displays day/energy information in the captured version.

---

## 6. Navigation

Recovered breadcrumb pattern:

```text
Universe
Universe -> Galaxy N
Universe -> Galaxy N -> Solar system N
```

Recovered coordinate controls:

- galaxy coordinate;
- solar-system coordinate;
- increment/decrement arrows;
- search action;
- Enter navigation.

The source used AJAX and fade/slide transitions rather than full-page reloads.

---

## 7. Adaptation decisions confirmed by the project owner

- reproduce the central map and its behavior;
- do not reproduce the old top and side panels;
- integrate the map into the current Stellar Empires shell;
- use procedural replacements first;
- replace procedural visuals with original generated assets later;
- document exact future asset requirements and generation prompts.

---

## 8. Evidence limitations

Not fully recoverable from the supplied package:

- original `galaxy_1..20` sprite files;
- every planet visual variant;
- all system-node thumbnails used by the Galaxy list;
- server-side tooltip payload rules;
- inaccessible original endpoints;
- exact source-side world generation.

These gaps must be filled by original Stellar Empires design, deterministic procedural rendering and later original asset generation.
