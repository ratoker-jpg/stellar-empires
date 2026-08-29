import type { PlanetShellMode } from './appShellRoute';

export interface PlanetZoneTarget {
  readonly mode: PlanetShellMode;
  readonly label: string;
  readonly description: string;
  readonly kicker: string;
}

export const PLANET_ZONE_TARGETS: readonly PlanetZoneTarget[] = [
  {
    mode: 'overview',
    label: 'Обзор',
    description: 'Паспорт колонии, метрики снабжения и быстрые переходы к зонам.',
    kicker: 'Командный центр колонии',
  },
  {
    mode: 'resource',
    label: 'Ресурсная',
    description: 'Добывающие комплексы, энергетика и устойчивость ресурсного контура.',
    kicker: 'Добывающий сектор',
  },
  {
    mode: 'industry',
    label: 'Промышленная',
    description: 'Командование, исследования, производство кораблей и логистика колонии.',
    kicker: 'Производственный сектор',
  },
  {
    mode: 'military',
    label: 'Военная',
    description: 'Сенсоры, оборонительная сеть, ремонт и готовность планетарного гарнизона.',
    kicker: 'Оборонительный сектор',
  },
];

export function getPlanetZoneTarget(mode: PlanetShellMode): PlanetZoneTarget {
  const target = PLANET_ZONE_TARGETS.find((candidate) => candidate.mode === mode);
  if (target === undefined) {
    throw new Error(`Unknown planet workspace mode: ${mode}`);
  }
  return target;
}
