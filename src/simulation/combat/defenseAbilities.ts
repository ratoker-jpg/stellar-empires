import { getUnitDefinition } from '../units/catalog';

export interface DefenseAbilityBonusMaps {
  readonly weapon: Readonly<Record<string, number>>;
  readonly armor: Readonly<Record<string, number>>;
}

export type PlanetaryDefenseTargetPriority = 'balanced' | 'interceptors' | 'capitals';

function addBonus(target: Record<string, number>, unitId: string, value: number): void {
  if (value > 0) target[unitId] = (target[unitId] ?? 0) + value;
}

function scaledBonus(count: number, perUnitPermille: number, maximum: number): number {
  if (count <= 0 || perUnitPermille <= 0 || maximum <= 0) return 0;
  return Math.min(maximum, Math.max(1, Math.floor((count * perUnitPermille) / 10)));
}

export function getDefenseAbilityBonusMaps(
  units: Readonly<Record<string, number>>,
): DefenseAbilityBonusMaps {
  const weapon: Record<string, number> = {};
  const armor: Record<string, number> = {};
  const activeIds = Object.keys(units).filter((unitId) => (units[unitId] ?? 0) > 0).sort();
  const defenseIds = activeIds.filter((unitId) => getUnitDefinition(unitId)?.kind === 'defense');

  for (const unitId of defenseIds) {
    const definition = getUnitDefinition(unitId);
    const ability = definition?.defenseAbility;
    if (definition?.kind !== 'defense' || ability === undefined) continue;
    const bonus = scaledBonus(units[unitId] ?? 0, ability.valuePerUnitPermille, ability.maxPercent);

    if (ability.id === 'secondary-barrier' || ability.id === 'planetary-barrier') {
      const shared = ability.id === 'planetary-barrier' ? Math.max(10, bonus) : bonus;
      for (const friendlyId of activeIds) addBonus(armor, friendlyId, shared);
      continue;
    }

    const minimum = ability.id === 'interceptor-grid'
      ? 6
      : ability.id === 'laser-focus'
        ? 8
        : ability.id === 'ion-suppression'
          ? 10
          : ability.id === 'plasma-overload'
            ? 12
            : ability.id === 'laser-ion-link'
              ? 14
              : ability.id === 'plasma-laser-link'
                ? 18
                : 22;
    addBonus(weapon, unitId, Math.max(minimum, bonus));

    if (
      ability.id === 'ion-suppression' ||
      ability.id === 'laser-ion-link' ||
      ability.id === 'plasma-laser-link' ||
      ability.id === 'ion-plasma-link'
    ) {
      const support = Math.max(1, Math.ceil(bonus / (ability.id === 'ion-suppression' ? 4 : 2)));
      for (const friendlyId of defenseIds) addBonus(armor, friendlyId, support);
    }
  }

  return { weapon, armor };
}

export function getPlanetaryDefenseTargetPriority(
  defenses: Readonly<Record<string, number>>,
): PlanetaryDefenseTargetPriority {
  let interceptorScore = 0;
  let capitalScore = 0;
  for (const [unitId, quantity] of Object.entries(defenses)) {
    if (quantity <= 0) continue;
    const definition = getUnitDefinition(unitId);
    const weight = Math.max(1, definition?.defenseGridCost ?? 1) * quantity;
    switch (definition?.defenseClass) {
      case 'basic-turret':
      case 'laser-turret':
        interceptorScore += weight;
        break;
      case 'ion-turret':
      case 'plasma-turret':
      case 'laser-ion-battery':
      case 'plasma-laser-battery':
      case 'ion-plasma-battery':
        capitalScore += weight;
        break;
      default:
        break;
    }
  }
  if (interceptorScore === capitalScore) return 'balanced';
  return interceptorScore > capitalScore ? 'interceptors' : 'capitals';
}
