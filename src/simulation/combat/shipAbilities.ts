import { getUnitDefinition } from '../units/catalog';

export interface ShipAbilityBonusMaps {
  readonly weapon: Readonly<Record<string, number>>;
  readonly armor: Readonly<Record<string, number>>;
}

function addBonus(target: Record<string, number>, unitId: string, value: number): void {
  if (value === 0) return;
  target[unitId] = (target[unitId] ?? 0) + value;
}

function scaledFleetBonus(count: number, valuePerUnitPermille: number, maxPercent: number): number {
  if (count <= 0 || valuePerUnitPermille <= 0 || maxPercent <= 0) return 0;
  return Math.min(maxPercent, Math.max(1, Math.floor((count * valuePerUnitPermille) / 10)));
}

export function getShipAbilityBonusMaps(
  units: Readonly<Record<string, number>>,
): ShipAbilityBonusMaps {
  const weapon: Record<string, number> = {};
  const armor: Record<string, number> = {};
  const activeIds = Object.keys(units).filter((unitId) => (units[unitId] ?? 0) > 0).sort();

  for (const unitId of activeIds) {
    const definition = getUnitDefinition(unitId);
    if (definition?.kind !== 'ship' || definition.ability === undefined) continue;
    const count = units[unitId] ?? 0;
    const fleetBonus = scaledFleetBonus(
      count,
      definition.ability.valuePerUnitPermille,
      definition.ability.maxPercent,
    );

    switch (definition.ability.id) {
      case 'armor-pierce':
        addBonus(weapon, unitId, Math.max(8, fleetBonus));
        break;
      case 'crushing-strike':
        addBonus(weapon, unitId, Math.max(12, fleetBonus));
        break;
      case 'fleet-vitality':
      case 'fleet-armor':
      case 'combat-recovery':
        for (const friendlyId of activeIds) addBonus(armor, friendlyId, fleetBonus);
        break;
      case 'overdrive':
        for (const friendlyId of activeIds) addBonus(weapon, friendlyId, fleetBonus);
        break;
      case 'freezing-strike':
        addBonus(weapon, unitId, Math.max(10, fleetBonus));
        for (const friendlyId of activeIds) addBonus(armor, friendlyId, Math.ceil(fleetBonus / 2));
        break;
      case 'artillery':
        addBonus(weapon, unitId, Math.max(20, fleetBonus));
        break;
      case 'planet-breaker':
        addBonus(weapon, unitId, Math.max(15, fleetBonus));
        break;
      default:
        break;
    }
  }

  return { weapon, armor };
}
