import type { ResourceCost } from '../economy/types';
import type { FleetState } from '../fleets/types';
import { getCargoAmount } from '../fleets/fleetCalculations';
import type { PlanetState } from '../planet/types';
import { getUnitDefinition } from '../units/catalog';

export interface DebrisField {
  readonly id: string;
  readonly planetId: string;
  readonly metal: number;
  readonly crystal: number;
  readonly createdAt: number;
}

export interface DebrisAmount {
  readonly metal: number;
  readonly crystal: number;
}

function countDestroyed(
  initial: Readonly<Record<string, number>>,
  remaining: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  return Object.fromEntries(
    Object.entries(initial)
      .map(([unitId, count]) => [unitId, Math.max(0, count - (remaining[unitId] ?? 0))] as const)
      .filter(([, count]) => count > 0),
  );
}

export function calculateDebrisFromLosses(
  attackerInitial: Readonly<Record<string, number>>,
  attackerRemaining: Readonly<Record<string, number>>,
  defenderInitial: Readonly<Record<string, number>>,
  defenderRemaining: Readonly<Record<string, number>>,
): DebrisAmount {
  const destroyed = {
    ...countDestroyed(attackerInitial, attackerRemaining),
  } as Record<string, number>;
  for (const [unitId, count] of Object.entries(
    countDestroyed(defenderInitial, defenderRemaining),
  )) {
    destroyed[unitId] = (destroyed[unitId] ?? 0) + count;
  }

  let metal = 0;
  let crystal = 0;
  for (const [unitId, count] of Object.entries(destroyed)) {
    const definition = getUnitDefinition(unitId);
    if (definition === undefined) continue;
    metal += Math.floor(definition.baseCost.metal * count * 0.3);
    crystal += Math.floor(definition.baseCost.crystal * count * 0.3);
  }
  return { metal, crystal };
}

export function addDebrisField(
  fields: readonly DebrisField[],
  planetId: string,
  amount: DebrisAmount,
  createdAt: number,
): readonly DebrisField[] {
  if (amount.metal <= 0 && amount.crystal <= 0) return fields;
  const existing = fields.find((field) => field.planetId === planetId);
  if (existing === undefined) {
    return [
      ...fields,
      {
        id: `debris-${planetId}`,
        planetId,
        metal: amount.metal,
        crystal: amount.crystal,
        createdAt,
      },
    ];
  }
  return fields.map((field) =>
    field.id === existing.id
      ? {
          ...field,
          metal: field.metal + amount.metal,
          crystal: field.crystal + amount.crystal,
          createdAt,
        }
      : field,
  );
}

export interface PlunderResolution {
  readonly planet: PlanetState;
  readonly fleet: FleetState;
  readonly plundered: ResourceCost;
}

export function plunderPlanet(
  planet: PlanetState,
  fleet: FleetState,
): PlunderResolution {
  let freeCapacity = Math.max(0, fleet.cargoCapacity - getCargoAmount(fleet.cargo));
  const cargo = { ...fleet.cargo };
  const resources = { ...planet.economy.resources };
  const plundered = { metal: 0, crystal: 0, gas: 0 };

  for (const resourceId of ['metal', 'crystal', 'gas'] as const) {
    if (freeCapacity <= 0) break;
    const stock = resources[resourceId];
    const availableLoot = Math.floor(stock.amount * 0.1);
    const taken = Math.min(freeCapacity, availableLoot);
    resources[resourceId] = { ...stock, amount: stock.amount - taken };
    cargo[resourceId] += taken;
    plundered[resourceId] = taken;
    freeCapacity -= taken;
  }

  return {
    planet: {
      ...planet,
      economy: { ...planet.economy, resources },
    },
    fleet: { ...fleet, cargo },
    plundered,
  };
}

export interface RecycleResolution {
  readonly fleet: FleetState;
  readonly fields: readonly DebrisField[];
  readonly collected: DebrisAmount;
}

export function collectDebris(
  fields: readonly DebrisField[],
  planetId: string,
  fleet: FleetState,
): RecycleResolution {
  const field = fields.find((candidate) => candidate.planetId === planetId);
  if (field === undefined) {
    return { fleet, fields, collected: { metal: 0, crystal: 0 } };
  }

  let freeCapacity = Math.max(0, fleet.cargoCapacity - getCargoAmount(fleet.cargo));
  const metal = Math.min(field.metal, freeCapacity);
  freeCapacity -= metal;
  const crystal = Math.min(field.crystal, freeCapacity);
  const cargo = {
    ...fleet.cargo,
    metal: fleet.cargo.metal + metal,
    crystal: fleet.cargo.crystal + crystal,
  };
  const remainingMetal = field.metal - metal;
  const remainingCrystal = field.crystal - crystal;
  const nextFields =
    remainingMetal === 0 && remainingCrystal === 0
      ? fields.filter((candidate) => candidate.id !== field.id)
      : fields.map((candidate) =>
          candidate.id === field.id
            ? {
                ...candidate,
                metal: remainingMetal,
                crystal: remainingCrystal,
              }
            : candidate,
        );

  return {
    fleet: { ...fleet, cargo },
    fields: nextFields,
    collected: { metal, crystal },
  };
}
