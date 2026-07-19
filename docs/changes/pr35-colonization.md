# PR #35 — Colonization technology and mission

The Aegis research tree now includes Colonization Protocols. Each level raises the empire colony limit by one above the home planet. Colonization missions require the technology and a colony ship, target an unoccupied galaxy planet and reserve one-way fuel before departure.

Arrival revalidates ownership and the colony limit to handle competing expeditions safely. A successful mission updates the galaxy owner, creates a complete PlanetState with starter command, extraction and power infrastructure, unloads cargo, consumes one colony ship and stations any escorts at the new colony. If the target becomes unavailable, the fleet returns without creating duplicate colony state.
