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

export type ShellNavigationGroupId = 'gameplay' | 'development' | 'information' | 'utility';

export interface ShellNavigationGroupDefinition {
  readonly id: ShellNavigationGroupId;
  readonly label: string;
  readonly ariaLabel: string;
  readonly order: number;
  readonly compact: boolean;
}

export interface ShellScreenDefinition {
  readonly id: string;
  readonly elementId: string;
  readonly label: string;
  readonly ariaLabel: string;
  readonly icon: string;
  readonly order: number;
  readonly group: ShellNavigationGroupId;
  readonly kind: ShellScreenKind;
  readonly routeFamily: ShellRouteFamily;
  readonly badgeId?: string;
}

export const SHELL_NAVIGATION_GROUPS: readonly ShellNavigationGroupDefinition[] = [
  {
    id: 'gameplay',
    label: 'Игра',
    ariaLabel: 'Основные игровые разделы',
    order: 10,
    compact: false,
  },
  {
    id: 'development',
    label: 'Развитие',
    ariaLabel: 'Развитие империи',
    order: 20,
    compact: false,
  },
  {
    id: 'information',
    label: 'Данные',
    ariaLabel: 'Информация и история',
    order: 30,
    compact: true,
  },
  {
    id: 'utility',
    label: 'Система',
    ariaLabel: 'Сохранения и настройки',
    order: 40,
    compact: true,
  },
] as const;

export const SHELL_SCREEN_REGISTRY: readonly ShellScreenDefinition[] = [
  {
    id: 'planet', elementId: 'nav-planet', label: 'Планета', ariaLabel: 'Планета', icon: '◉',
    order: 10, group: 'gameplay', kind: 'route', routeFamily: 'planet', badgeId: 'nav-planet-badge',
  },
  {
    id: 'space', elementId: 'nav-galaxy', label: 'Вселенная', ariaLabel: 'Вселенная и галактики', icon: '✦',
    order: 20, group: 'gameplay', kind: 'route', routeFamily: 'space',
  },
  {
    id: 'fleets', elementId: 'nav-fleet', label: 'Флоты', ariaLabel: 'Флоты', icon: '◆',
    order: 30, group: 'gameplay', kind: 'route', routeFamily: 'fleets', badgeId: 'nav-fleet-badge',
  },
  {
    id: 'operations', elementId: 'nav-operations', label: 'Операции', ariaLabel: 'Операционный центр', icon: '◎',
    order: 40, group: 'gameplay', kind: 'route', routeFamily: 'operations', badgeId: 'nav-operations-badge',
  },
  {
    id: 'research', elementId: 'nav-research', label: 'Наука', ariaLabel: 'Исследования', icon: '⌬',
    order: 50, group: 'development', kind: 'route', routeFamily: 'research', badgeId: 'nav-research-badge',
  },
  {
    id: 'command', elementId: 'nav-empire', label: 'Командование', ariaLabel: 'Командование', icon: '▦',
    order: 60, group: 'development', kind: 'route', routeFamily: 'command',
  },
  {
    id: 'reports', elementId: 'nav-reports', label: 'Отчёты', ariaLabel: 'Отчёты', icon: '▤',
    order: 70, group: 'information', kind: 'route', routeFamily: 'reports', badgeId: 'nav-reports-badge',
  },
  {
    id: 'ranking', elementId: 'nav-rating', label: 'Рейтинг', ariaLabel: 'Рейтинг', icon: '△',
    order: 80, group: 'information', kind: 'route', routeFamily: 'ranking',
  },
  {
    id: 'system', elementId: 'nav-system', label: 'Настройки', ariaLabel: 'Настройки', icon: '⚙',
    order: 90, group: 'utility', kind: 'route', routeFamily: 'system', badgeId: 'nav-system-badge',
  },
] as const;

export function getShellNavigationGroup(
  id: ShellNavigationGroupId,
  groups: readonly ShellNavigationGroupDefinition[] = SHELL_NAVIGATION_GROUPS,
): ShellNavigationGroupDefinition | undefined {
  return groups.find((group) => group.id === id);
}

export function validateScreenRegistry(
  registry: readonly ShellScreenDefinition[] = SHELL_SCREEN_REGISTRY,
  groups: readonly ShellNavigationGroupDefinition[] = SHELL_NAVIGATION_GROUPS,
): readonly string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const elementIds = new Set<string>();
  const orders = new Set<number>();
  const routeFamilies = new Set<ShellRouteFamily>();
  const badgeIds = new Set<string>();
  const groupIds = new Set<ShellNavigationGroupId>();
  const groupOrders = new Set<number>();

  for (const group of groups) {
    if (groupIds.has(group.id)) errors.push(`Duplicate navigation group id: ${group.id}`);
    if (groupOrders.has(group.order)) errors.push(`Duplicate navigation group order: ${group.order}`);
    groupIds.add(group.id);
    groupOrders.add(group.order);
  }

  for (const entry of registry) {
    if (ids.has(entry.id)) errors.push(`Duplicate screen id: ${entry.id}`);
    if (elementIds.has(entry.elementId)) errors.push(`Duplicate element id: ${entry.elementId}`);
    if (orders.has(entry.order)) errors.push(`Duplicate screen order: ${entry.order}`);
    if (routeFamilies.has(entry.routeFamily)) errors.push(`Duplicate route family: ${entry.routeFamily}`);
    if (!groupIds.has(entry.group)) errors.push(`Unknown navigation group: ${entry.group}`);
    if (entry.badgeId !== undefined && badgeIds.has(entry.badgeId)) {
      errors.push(`Duplicate badge id: ${entry.badgeId}`);
    }
    ids.add(entry.id);
    elementIds.add(entry.elementId);
    orders.add(entry.order);
    routeFamilies.add(entry.routeFamily);
    if (entry.badgeId !== undefined) badgeIds.add(entry.badgeId);
  }

  for (const groupId of groupIds) {
    if (!registry.some((entry) => entry.group === groupId)) {
      errors.push(`Empty navigation group: ${groupId}`);
    }
  }

  return errors;
}
