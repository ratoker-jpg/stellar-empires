# 04 — Planet and zones

## Historical Help cross-check

`CONFIRMED_HELP` (2019 Help, not a current-Horus balance claim): the Planet Overview explicitly names **Resource**, **Industrial**, and **Military** zones. It describes separate progress categories for those three zones, research, ship construction, and ship upgrades. The same article says a planet's system position affects satellite Energy; no position formula has been applied to this audit's UI sample.

`CONFIRMED_UI`: Planet shows planet score categories, ozone capacity/current amount, population capacity/current amount, planet overview, and galaxy coordinate. Three top-level zones are Resource, Industry, and Military. On Horus, Industry also exposes links to Experimental Center, Shipyard, Spaceport, Recycling Plant, Resource Trader, Factory, Auction, Bank, and Technologies.

The accessible screens establish a hub → three-zone architecture. Building cards/requirements still need an authenticated read-only revisit; their named cost fields are preserved as `null` rather than inferred in `data/buildings.json`. Do not infer them from Stellar Empires’ implementation.
