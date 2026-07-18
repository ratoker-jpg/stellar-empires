# 12 — Combat

The Shipyard navigation exposes Battles and Simulator (`CONFIRMED_UI`). The Horus battle simulator landing screen is now confirmed (`screens/15-battle-simulator.png`): it provides attacker/defender race selectors, unit and population fields, science/upgrade modifier fields, commander selection, a 5/8/12 round selector, and local-looking save/load/delete preset controls.

The default selector labels show Confederation, Terteths, and Noxis in the simulator UI (`CONFIRMED_UI`); this confirms the three names as playable race choices but does not establish their mechanics. The Start button was deliberately not pressed, so outcome calculation, target selection, loot, repair, battle reports, and side effects remain `ACTION_REQUIRED` or `UNKNOWN`.

Horus Battles landing page also exposes separate Saved Reports and Last 10 Reports tables (`CONFIRMED_UI`). This account had no accessible rows, so report schema and result data remain `UNKNOWN`; no report, battle, or simulator execution was initiated.
