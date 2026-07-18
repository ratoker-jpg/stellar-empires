# 08 — Research

## Historical Help cross-check

`CONFIRMED_HELP`: research is global across a player's planets but uses one shared queue. Help divides it into Basic, Advanced, Master, and Additional categories, and documents bonuses/unlocks plus an exclusive Additional-science choice. The Help's English labels are not assumed to map one-to-one to the current localized UI (`Radar systems` vs. `Computer Systems`, for example). `data/technologies.json` records only direct name matches as historical enrichment and keeps unmatched UI labels un-mapped.

The second server exposed a level-1 Experimental Center with Basic, High-technology, Expert, and Additional science groups (`CONFIRMED_UI`). Its technology list exposes Building, Ship, Research, Defense, and Commander-ship categories plus named sciences: Physics, Chemistry, Mathematics, Astronomy, Espionage, Computer Systems, Ship Armor, Fuel Cells, Jet Engines, Laser, Ion, Plasma, Ecology, Hyperspace, Parallel Universes, Improved Construction, Piercing Attack, Maneuver Defense, Critical Hit, Light/Medium/Heavy Armor.

Physics’ information card identifies Basic sciences as its location and shows a visible requirement value of 1 (`CONFIRMED_UI`). Its description says it enables greater energy collection; the exact effect formula is `UNKNOWN`. The dependency ledger contains only explicitly visible location/navigation/requirement relations.
