# ASSET-RUNTIME-INTEGRATION-01 — canonical source mappings

**Part of:** `docs/audits/current-batch-audit.md`  
**Status:** authoritative for PRs #102–#105

## 4. Canonical source mapping

### 4.1 Buildings — repeated for Aegis, Synod and Veyra

For each faction `F`, mechanical `building.F.<mechanical suffix>` maps to source `assets/source/New assets/buildings/F/building.F.<source suffix>.png`.

| Role | Mechanical suffix | Approved source suffix |
|---|---|---|
| metal-primary | metal-bot-1 | metal-production-1 |
| metal-secondary | metal-bot-2 | metal-production-2 |
| metal-tertiary | metal-bot-3 | metal-production-3 |
| crystal-primary | mineral-bot-1 | mineral-production-1 |
| crystal-secondary | mineral-bot-2 | mineral-production-2 |
| gas-primary | gas-probe-1 | gas-production-1 |
| gas-secondary | gas-probe-2 | gas-production-2 |
| solar-power | infrared-bot | basic-energy |
| independent-power | uranium-bot | advanced-energy |
| hangar | bunker | hangar |
| construction-complex | construction | construction |
| advanced-factory | teret-factory | advanced-factory |
| metal-storage | metal-vault | metal-storage |
| crystal-storage | mineral-treasury | mineral-storage |
| gas-storage | gas-chamber | gas-storage |
| recycler | scrapyard | recycling |
| trade-center | trade-center | trade-center |
| shipyard | shipyard | shipyard |
| research-center | experimental-center | research |
| spaceport | spaceport | spaceport |
| government | control-chamber | planetary-government |
| bank | bank | bank |
| galactic-obelisk | aksum-obelisk | galactic-obelisk |
| supreme-galactic-gates | supreme-galactic-gates | supreme-galactic-gates |

The table produces exactly 24 bindings per faction and 72 total. This explicitly resolves the filename mismatch; source semantic IDs do not replace mechanical IDs.

### 4.2 Technologies

For every faction `F` and every slug below:

```text
technology.F.<slug> → technology.shared.<slug>
source: assets/source/New assets/technologies/technology.shared.<slug>.png
output: public/assets/generated/catalog/technologies/shared/<slug>.webp
```

`physics`, `chemistry`, `mathematics`, `astronomy`, `espionage`, `computer-systems`, `ship-armor`, `fuel-cells`, `jet-engines`, `laser-science`, `ion-science`, `plasma-science`, `ecology`, `hyperspace`, `parallel-universes`, `improved-construction`, `piercing-attack`, `maneuver-defense`, `critical-hit`, `light-armor`, `medium-armor`, `heavy-armor`.

`qa-edges-dark-light.png` is a QA reference, not a runtime technology. The result is 66 mechanical bindings and 22 generated images.

### 4.3 Ordinary ships

For each row, the mechanical class resolves to `ship.<faction>.<approved slug>`; the source path is `assets/source/New assets/ship/<faction>/<mechanical ID>.png`. The catalog identity slug is already the approved source slug.

| Ship class | Aegis slug | Synod slug | Veyra slug |
|---|---|---|---|
| small-transport | transporter | cargo-bot | transporter |
| large-transport | mega-transporter | large-cargo-bot | mega-transporter |
| light-fighter | scout | fighter | nox-dart |
| interceptor | cruiser | interceptor | nemesis |
| support-ship | defender | shield-bot | absorber |
| line-battleship | battleship | star-armada | ghost |
| heavy-assault | destroyer | goliath | hornet |
| bomber | bomber | bomberbot | bomber |
| planet-destroyer | death-star | titan | nox-queen |
| colonizer | colonizer | colonizer-bot | settler |
| recycler | recycler | recycler | recycler-drone |
| spy-probe | spy-probe | spy-bot | nox-mind |
| energy-satellite | solar-satellite | solar-satellite | organic-satellite |

This produces 39 unique mechanical/runtime semantic IDs. No ship is allowed to reuse another class image after PR #104.

### 4.4 Defences

The source path is `assets/source/New assets/defenses/<faction>/<mechanical ID>.png`.

| Defence class | Aegis slug | Synod slug | Veyra slug |
|---|---|---|---|
| basic-turret | ballistic-turret | defense-matrix | nox-archer |
| laser-turret | laser-turret | laser-matrix | laser-matter |
| ion-turret | ion-turret | ion-matrix | ion-weave |
| plasma-turret | plasma-turret | plasma-matrix | plasma-weave |
| secondary-shield | tower-shield | matrix-shield | chitin-shield |
| planetary-shield | planetary-shield | planetary-matrix | surface-shield |
| laser-ion-battery | laser-ion-battery | laser-ion-matrix | laser-ion-turret |
| plasma-laser-battery | plasma-laser-battery | plasma-laser-matrix | plasma-laser-turret |
| ion-plasma-battery | ion-plasma-battery | ion-plasma-matrix | ion-plasma-turret |

This produces 27 unique mechanical/runtime semantic IDs. Kinetic/missile/shield role fallback sheets are not accepted for complete defence IDs after PR #105.

### 4.5 Commander Ships

Mechanical IDs are shared and source filenames retain historical spelling differences:

| Mechanical suffix | Approved source filename |
|---|---|
| annihilator | commander-ship.annihilator.png |
| corsair | commander-ship.corsair.png |
| regenerator | commander-ship.reanimator.png |
| viper | commander-ship.viper.png |
| scorpion | commander-ship.scorpion.png |
| phantom | commander-ship.phantom.png |
| hunter | commander-ship.hunter.png |
| typhoon | commander-ship.typhoon.png |
| executor | commander-ship.executioner.png |
| juggernaut | commander-ship.juggernaut.png |
| argo | commander-ship.argo.png |
| judge | commander-ship.judge.png |
| polias | commander-ship.polias.png |

The source root is `assets/source/New assets/comander_ship/` (repository spelling preserved). Outputs use `public/assets/generated/catalog/commanders/shared/<mechanical suffix>.webp`.
