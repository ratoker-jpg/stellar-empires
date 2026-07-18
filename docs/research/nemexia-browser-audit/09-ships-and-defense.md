# 09 — Ships and defense

## Historical Help cross-check

The Help says ships and defence require a Shipyard, resources, free Population, and sometimes science; weapons are Laser/Ion/Plasma and armor is Light/Medium/Heavy. It also publishes a **custom configuration for some universes only**. Its Terteth rows corroborate historical names and named cost/stat fields for Space Armada, Goliath, and Bomberbot, as well as a nine-unit Terteth defence catalogue. Those values are stored as `CONFIRMED_HELP`, never promoted to current Horus values or requirements.

`CONFIRMED_UI`: Shipyard has Ships, Defense, Commander Ships, Ships Technology, upgrades, battle-priority, Flights, Battles, and Simulator entry points. On the second server it is level 1 and lists Solar Satellite, Spy Bot, Cargo Bot, Large Cargo Bot, Colonizer Bot, Recycler, Fighter, Interceptor, Shield Bot, Star Armada, Goliath, BomberBot, and Titan.

Visible example gates: Spy Bot and Interceptor require Shipyard 3; Cargo Bot requires Shipyard 2; Large Cargo Bot, Colonizer Bot, and Recycler require Shipyard 4; Shield Bot requires Shipyard 5; Fighter requires Astronomy 3; Titan requires Shipyard 14. Per-unit cost triplets and construction times are retained in `data/ships.json` only as capture-time UI values. Selecting the Defense tab did not produce distinct defense cards in the semantic view, so defenses remain `UNKNOWN`.
