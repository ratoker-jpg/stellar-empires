export type ShellScreenKind = 'route';
export type ShellRouteFamily =
  | 'planet'
  | 'fleets'
  | 'space'
  | 'research'
  | 'command'
  | 'ranking'
  | 'operations'
  | 'reports'
  | 'system';

export interface ShellScreenDefinition {
  readonly id: string;
  readonly elementId: string;
  readonly label: string;
  readonly ariaLabel: string;
  readonly icon: string;
  readonly order: number;
  readonly utility: boolean;
  readonly kind: ShellScreenKind;
  readonly routeFamily: ShellRouteFamily;
  readonly badgeId?: string;
}

export const SHELL_SCREEN_REGISTRY: readonly ShellScreenDefinition[] = [
  {
    id: 'planet', elementId: 'nav-planet', label: 'Планета', ariaLabel: 'Планета', icon: '◉',
    order: 10, utility: false, kind: 'route', routeFamily: 'planet', badgeId: 'nav-planet-badge',
  },
  {
    id: 'fleets', elementId: 'nav-fleet', label: 'Флоты', ariaLabel: 'Флот', icon: '◆',
    order: 20, utility: false, kind: 'route', routeFamily: 'fleets', badgeId: 'nav-fleet-badge',
  },
  {
    id: 'space', elementId: 'nav-galaxy', label: 'Галактика', ariaLabel: 'Галактика', icon: '✦',
    order: 30, utility: false, kind: 'route', routeFamily: 'space',
  },
  {
    id: 'research', elementId: 'nav-research', label: 'Наука', ariaLabel: 'Исследования', icon: '⌬',
    order: 40, utility: false, kind: 'route', routeFamily: 'research', badgeId: 'nav-research-badge',
  },
  {
    id: 'command', elementId: 'nav-empire', label: 'Командование', ariaLabel: 'Командование', icon: '▦',
    order: 50, utility: false, kind: 'route', routeFamily: 'command',
  },
  {
    id: 'ranking', elementId: 'nav-rating', label: 'Рейтинг', ariaLabel: 'Рейтинг', icon: '△',
    order: 60, utility: false, kind: 'route', routeFamily: 'ranking',
  },
  {
    id: 'operations', elementId: 'nav-operations', label: 'Операции', ariaLabel: 'Операционный центр', icon: '◎',
    order: 70, utility: true, kind: 'route', routeFamily: 'operations', badgeId: 'nav-operations-badge',
  },
  {
    id: 'reports', elementId: 'nav-reports', label: 'Отчёты', ariaLabel: 'Отчёты', icon: '▤',
    order: 80, utility: true, kind: 'route', routeFamily: 'reports', badgeId: 'nav-reports-badge',
  },
  {
    id: 'system', elementId: 'nav-system', label: 'Система', ariaLabel: 'Настройки', icon: '⚙',
    order: 90, utility: true, kind: 'route', routeFamily: 'system', badgeId: 'nav-system-badge',
  },
] as const;

export function validateScreenRegistry(
  registry: readonly ShellScreenDefinition[] = SHELL_SCREEN_REGISTRY,
): readonly string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const elementIds = new Set<string>();
  const orders = new Set<number>();
  const routeFamilies = new Set<ShellRouteFamily>();
  const badgeIds = new Set<string>();
  for (const entry of registry) {
    if (ids.has(entry.id)) errors.push(`Duplicate screen id: ${entry.id}`);
    if (elementIds.has(entry.elementId)) errors.push(`Duplicate element id: ${entry.elementId}`);
    if (orders.has(entry.order)) errors.push(`Duplicate screen order: ${entry.order}`);
    if (routeFamilies.has(entry.routeFamily)) errors.push(`Duplicate route family: ${entry.routeFamily}`);
    if (entry.badgeId !== undefined && badgeIds.has(entry.badgeId)) {
      errors.push(`Duplicate badge id: ${entry.badgeId}`);
    }
    ids.add(entry.id);
    elementIds.add(entry.elementId);
    orders.add(entry.order);
    routeFamilies.add(entry.routeFamily);
    if (entry.badgeId !== undefined) badgeIds.add(entry.badgeId);
  }
  return errors;
}
