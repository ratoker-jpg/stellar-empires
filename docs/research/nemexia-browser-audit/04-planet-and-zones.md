# 04 — Planet and zones

`CONFIRMED_UI`: Planet shows planet score categories, ozone capacity/current amount, population capacity/current amount, planet overview, and galaxy coordinate. Three top-level zones are Resource, Industry, and Military. On Horus, Industry also exposes links to Experimental Center, Shipyard, Spaceport, Recycling Plant, Resource Trader, Factory, Auction, Bank, and Technologies.

The accessible screens establish a hub → three-zone architecture. Building cards/requirements still need an authenticated read-only revisit; their named cost fields are preserved as `null` rather than inferred in `data/buildings.json`. Do not infer them from Stellar Empires’ implementation.
