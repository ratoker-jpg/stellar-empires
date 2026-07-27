export type ShellScreenKind = 'route' | 'legacy';
export type ShellRouteFamily = 'planet' | 'fleets' | 'space' | 'research' | 'operations' | 'reports';

export interface ShellScreenDefinition {
  readonly id: string;
  readonly elementId: string;
  readonly label: string;
  readonly ariaLabel: string;
  readonly icon: string;
  readonly order: number;
  readonly utility: boolean;
  readonly kind: ShellScreenKind;
  readonly routeFamily?: ShellRouteFamily;
}

export const SHELL_SCREEN_REGISTRY: readonly ShellScreenDefinition[] = [
  {
    id: 'planet', elementId: 'nav-planet', label: 'Планета', ariaLabel: 'Планета', icon: '◉',
    order: 10, utility: false, kind: 'route', routeFamily: 'planet',
  },
  {
    id: 'fleets', elementId: 'nav-fleet', label: 'Флоты', ariaLabel: 'Флот', icon: '◆',
    order: 20, utility: false, kind: 'route', routeFamily: 'fleets',
  },
  {
    id: 'space', elementId: 'nav-galaxy', label: 'Галактика', ariaLabel: 'Галактика', icon: '✦',
    order: 30, utility: false, kind: 'route', routeFamily: 'space',
  },
  {
    id: 'research', elementId: 'nav-research', label: 'Наука', ariaLabel: 'Исследования', icon: '⌬',
    order: 40, utility: false, kind: 'route', routeFamily: 'research',
  },
  {
    id: 'command', elementId: 'nav-empire', label: 'Командование', ariaLabel: 'Командование', icon: '▦',
    order: 50, utility: false, kind: 'legacy',
  },
  {
    id: 'ranking', elementId: 'nav-rating', label: 'Рейтинг', ariaLabel: 'Рейтинг', icon: '△',
    order: 60, utility: false, kind: 'legacy',
  },
  {
    id: 'operations', elementId: 'nav-operations', label: 'Операции', ariaLabel: 'Операционный центр', icon: '◎',
    order: 70, utility: true, kind: 'route', routeFamily: 'operations',
  },
  {
    id: 'reports', elementId: 'nav-reports', label: 'Отчёты', ariaLabel: 'Отчёты', icon: '▤',
    order: 80, utility: true, kind: 'route', routeFamily: 'reports',
  },
  {
    id: 'system', elementId: 'nav-system', label: 'Система', ariaLabel: 'Настройки', icon: '⚙',
    order: 90, utility: true, kind: 'legacy',
  },
] as const;

export function validateScreenRegistry(
  registry: readonly ShellScreenDefinition[] = SHELL_SCREEN_REGISTRY,
): readonly string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const elementIds = new Set<string>();
  const orders = new Set<number>();
  for (const entry of registry) {
    if (ids.has(entry.id)) errors.push(`Duplicate screen id: ${entry.id}`);
    if (elementIds.has(entry.elementId)) errors.push(`Duplicate element id: ${entry.elementId}`);
    if (orders.has(entry.order)) errors.push(`Duplicate screen order: ${entry.order}`);
    if (entry.kind === 'route' && entry.routeFamily === undefined) {
      errors.push(`Route screen is missing routeFamily: ${entry.id}`);
    }
    ids.add(entry.id);
    elementIds.add(entry.elementId);
    orders.add(entry.order);
  }
  return errors;
}
