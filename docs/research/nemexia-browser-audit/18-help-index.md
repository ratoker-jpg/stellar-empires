# 18 — Official Help inventory

Source: `https://help.nemexia.com/en_EN/nemexia-new.html`, accessed 2026-07-18.  The site footer is © 2019 2Axion, therefore every entry below is `CONFIRMED_HELP`: it verifies that the historical Help describes the concept, **not** that the current Horus UI retains the same values, labels, or behaviour.  Where current UI was observed, `CONFIRMED_UI` continues to win.

## Traversed categories

| Requested category | Resolved article(s) | Compact, confirmed Help content |
| --- | --- | --- |
| Races | [Confederation](https://help.nemexia.com/en_EN/nemexia-new-2373-2393.html), [Terteths](https://help.nemexia.com/en_EN/nemexia-new-2373-2394.html), [Noxis](https://help.nemexia.com/en_EN/nemexia-new-2373-2395.html) | Three factions; the Help assigns faction-specific traits, which are historical rather than balance requirements. |
| Game Goal | [Crystals](https://help.nemexia.com/en_EN/nemexia-new-2374-2397.html), [Obelisks](https://help.nemexia.com/en_EN/nemexia-new-2374-2398.html), [SSG](https://help.nemexia.com/en_EN/nemexia-new-2374-2399.html) | Alliance/team-planet endgame: crystals → three obelisks → Supreme Starway Gate. |
| Galaxy | [Galaxy Overview](https://help.nemexia.com/en_EN/nemexia-new-2375-2372.html) | Historical topology is galaxies, systems, suns, and planet fields; limits must not be copied into the prototype. |
| Planet | [Planet Overview](https://help.nemexia.com/en_EN/nemexia-new-2376-2403.html) | Planet is the local process hub; Help documents Resource, Industrial, and Military zones and separate queues. |
| Resources | [Resources Overview](https://help.nemexia.com/en_EN/nemexia-new-2377-2407.html) | Metal, Minerals, Gas; plus Energy, Ozone, Scrap and Population/hangar capacity. |
| Buildings | [Buildings Overview](https://help.nemexia.com/en_EN/nemexia-new-2378-2417.html) | Buildings level up, have caps/prerequisites, consume economic resources and Energy; destruction/refund is documented. |
| Science | [Science Overview](https://help.nemexia.com/en_EN/nemexia-new-2379-2424.html) | Global research with one shared queue, four categories, and unlock/bonus dependencies. |
| Ships | [Ships Overview](https://help.nemexia.com/en_EN/nemexia-new-2380-2415.html) | Shipyard/science/population gates, categories, weapon/armor types, upgrades and historical timing formula. |
| Commander Ships | [Commander Ships Overview](https://help.nemexia.com/en_EN/nemexia-new-2381-2432.html) | One-off repairable commander units; one leading ability applies in battle; Admiral levels gate types. |
| Defence | [Defence Overview](https://help.nemexia.com/en_EN/nemexia-new-2382-2434.html) | Planet-bound combat units with shipyard/science/population gates and weapon/armor types. |
| Admiral | [Admiral Overview](https://help.nemexia.com/en_EN/nemexia-new-2383-2435.html) | Battle-point progression, commander eligibility, power, stats and skills. |
| Renegades | [Renegades Overview](https://help.nemexia.com/en_EN/nemexia-new-2384-2438.html) | NPC encounters, tiers, time-limited presence and upgrade-point rewards. |
| Flights | [Flights Overview](https://help.nemexia.com/en_EN/nemexia-new-2385-2440.html) | Twelve regular-planet mission types plus team-planet-specific missions; each requires ships. |
| Alliance | [Alliance Overview](https://help.nemexia.com/en_EN/nemexia-new-2387-2456.html) | Membership, leadership, policies, a historical member cap, and team-planet support. |
| Battles | [Battles overview](https://help.nemexia.com/en_EN/nemexia-new-2386-2400.html) | 1–12 rounds, 5/8/12 selected cap, grouped target priorities, loot/win/loss/draw outcomes. |
| Profile | [Profile Overview](https://help.nemexia.com/en_EN/nemexia-new-2388-2460.html) | Progress presentation and editable social profile settings; no profile action was taken. |
| Rankings | [Rankings Overview](https://help.nemexia.com/en_EN/nemexia-new-2389-2463.html) | Player/alliance/hall-of-fame/achievement rankings and point categories. |
| Achievements | [Achievements](https://help.nemexia.com/en_EN/nemexia-new-2390.html) | Goal categories, requirements, points, and historical reward forms. |
| Services | [Services Overview](https://help.nemexia.com/en_EN/nemexia-new-2391-2465.html) | Optional premium service/currency concepts; not exercised. |
| Galaxy Arena and Tournaments | [Arena Overview](https://help.nemexia.com/en_EN/nemexia-new-2478-2661.html), [Arena Battles](https://help.nemexia.com/en_EN/nemexia-new-2478-2663.html), [Arena Tournaments](https://help.nemexia.com/en_EN/nemexia-new-2478-2664.html) | Cross-universe opt-in battle/tournament system; no signup or report was opened. |
| New Units Statistics | [New units statistics](https://help.nemexia.com/en_EN/nemexia-new-2479.html) | Explicitly a custom configuration only for some universes; the Terteth unit rows are retained as historical data, not a Horus assertion. |

`data/help-articles.json` is the machine-readable ledger. It records the exact titles, URLs, evidence status, entities, dependencies, and limits.  It deliberately avoids copying article prose and flags historical/current divergence where material.
