# PR #38 — Fleet logistics planner

Fleet creation is now tied to the selected origin colony. Changing the origin rebuilds the available ship list from that colony's inventory and validates selected quantities, resource cargo and cargo capacity before the command is submitted.

Stationed fleets now show a route preview for each mission target: distance, travel time, one-way fuel and total reserved fuel. Mission target lists are filtered by mission type, and dispatch is blocked in the interface when the route has no valid target or the origin lacks fuel.
