import type { FleetMissionKind } from '../simulation/fleets/types';
import type { GalaxyIntelVisibility } from '../simulation/galaxy/intelligenceView';

export const FLEET_MISSION_TARGET_EVENT = 'stellar:fleet-mission-target';

const PREPARED_TARGET_STORAGE_KEY = 'stellar-empires:prepared-fleet-target:v1';

export interface FleetMissionTargetRequest {
  readonly targetId: string;
  readonly label: string;
  readonly mission: FleetMissionKind;
  readonly source?: 'space-map' | 'galaxy-intel';
  readonly sourceRouteHash?: string;
  readonly sourcePlanetId?: string;
}

export interface PreparedFleetMissionTarget extends FleetMissionTargetRequest {
  readonly version: 1;
}

function browserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function normalizedPreparedTarget(
  detail: FleetMissionTargetRequest,
): PreparedFleetMissionTarget {
  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const selectedPlanet = typeof document === 'undefined'
    ? undefined
    : document.querySelector<HTMLSelectElement>('#hud-planet-selector')?.value;
  const sourcePlanetId = detail.sourcePlanetId ?? selectedPlanet;
  return {
    version: 1,
    targetId: detail.targetId,
    label: detail.label,
    mission: detail.mission,
    ...(detail.source === undefined ? {} : { source: detail.source }),
    sourceRouteHash: detail.sourceRouteHash ?? currentHash,
    ...(sourcePlanetId === undefined ? {} : { sourcePlanetId }),
  };
}

export function writePreparedFleetMissionTarget(
  detail: FleetMissionTargetRequest,
  storage: Storage | null = browserStorage(),
): PreparedFleetMissionTarget {
  const prepared = normalizedPreparedTarget(detail);
  storage?.setItem(PREPARED_TARGET_STORAGE_KEY, JSON.stringify(prepared));
  return prepared;
}

export function readPreparedFleetMissionTarget(
  storage: Storage | null = browserStorage(),
): PreparedFleetMissionTarget | null {
  const raw = storage?.getItem(PREPARED_TARGET_STORAGE_KEY);
  if (raw === null || raw === undefined) return null;
  try {
    const value = JSON.parse(raw) as Partial<PreparedFleetMissionTarget>;
    if (
      value.version !== 1 ||
      typeof value.targetId !== 'string' || value.targetId.length === 0 ||
      typeof value.label !== 'string' ||
      typeof value.mission !== 'string'
    ) {
      storage?.removeItem(PREPARED_TARGET_STORAGE_KEY);
      return null;
    }
    return value as PreparedFleetMissionTarget;
  } catch {
    storage?.removeItem(PREPARED_TARGET_STORAGE_KEY);
    return null;
  }
}

export function clearPreparedFleetMissionTarget(
  storage: Storage | null = browserStorage(),
): void {
  storage?.removeItem(PREPARED_TARGET_STORAGE_KEY);
}

export function inferMissionForGalaxyTarget(
  ownerEmpireId: string | null,
  visibility: GalaxyIntelVisibility,
): FleetMissionKind {
  if (visibility === 'unclaimed') return 'colonize';
  if (ownerEmpireId === 'player') return 'transport';
  return 'scout';
}

function missionLabel(mission: FleetMissionKind): string {
  switch (mission) {
    case 'deploy': return 'Размещение';
    case 'scout': return 'Разведка';
    case 'attack': return 'Атака';
    case 'recycle': return 'Переработка';
    case 'colonize': return 'Колонизация';
    case 'expedition': return 'Экспедиция';
    case 'space-object': return 'Стратегический объект';
    case 'transport': return 'Транспорт';
  }
}

function emitPreparedTarget(detail: PreparedFleetMissionTarget | null): void {
  window.dispatchEvent(
    new CustomEvent<PreparedFleetMissionTarget | null>(FLEET_MISSION_TARGET_EVENT, { detail }),
  );
}

export function dispatchFleetMissionTarget(detail: FleetMissionTargetRequest): void {
  const prepared = writePreparedFleetMissionTarget(detail);
  emitPreparedTarget(prepared);
}

function installPreparedTargetBridge(): void {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;
  let preparedNoticeWasVisible = false;
  let clearControl: HTMLButtonElement | null = null;

  const ensureClearControl = (): HTMLButtonElement | null => {
    if (clearControl?.isConnected === true) return clearControl;
    const tabs = document.querySelector<HTMLElement>('#fleet-route-tabs');
    if (tabs === null) return null;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'prepared-target-clear';
    button.dataset.clearPreparedTarget = 'true';
    button.textContent = 'Сбросить подготовленную цель';
    button.hidden = true;
    button.addEventListener('click', () => {
      clearPreparedFleetMissionTarget();
      preparedNoticeWasVisible = false;
      button.hidden = true;
      emitPreparedTarget(null);
    });
    tabs.insertAdjacentElement('afterend', button);
    clearControl = button;
    return button;
  };

  const renderInvalidWarning = (message: string): void => {
    queueMicrotask(() => {
      const host = document.querySelector<HTMLElement>('#fleet-workspace-host');
      if (host === null || host.querySelector('.mission-target-invalid') !== null) return;
      const warning = document.createElement('p');
      warning.className = 'mission-target-invalid';
      warning.setAttribute('role', 'status');
      warning.textContent = message;
      host.prepend(warning);
    });
  };

  const clearInvalidPreparation = (control: HTMLButtonElement | null, message: string): void => {
    clearPreparedFleetMissionTarget();
    preparedNoticeWasVisible = false;
    if (control !== null) control.hidden = true;
    emitPreparedTarget(null);
    renderInvalidWarning(message);
  };

  const hydrateComposer = (
    prepared: PreparedFleetMissionTarget,
    control: HTMLButtonElement | null,
  ): boolean => {
    const missionSelects = Array.from(
      document.querySelectorAll<HTMLSelectElement>('[data-testid^="mission-kind-"]'),
    );
    if (missionSelects.length === 0) return false;

    let targetMatched = false;
    for (const missionSelect of missionSelects) {
      if (!Array.from(missionSelect.options).some((option) => option.value === prepared.mission)) {
        continue;
      }
      missionSelect.value = prepared.mission;
      missionSelect.dispatchEvent(new Event('change', { bubbles: true }));

      const fleetId = missionSelect.dataset.testid?.replace(/^mission-kind-/, '');
      const targetSelect = Array.from(
        document.querySelectorAll<HTMLSelectElement>('[data-testid^="mission-target-"]'),
      ).find((select) => select.dataset.testid === `mission-target-${fleetId}`);
      if (
        targetSelect === undefined ||
        !Array.from(targetSelect.options).some((option) => option.value === prepared.targetId)
      ) {
        continue;
      }
      targetSelect.value = prepared.targetId;
      targetSelect.dispatchEvent(new Event('change', { bubbles: true }));
      targetMatched = true;
    }

    if (!targetMatched) {
      clearInvalidPreparation(
        control,
        'Подготовленная цель больше недоступна. Выбери новую цель.',
      );
      return false;
    }

    const host = document.querySelector<HTMLElement>('#fleet-workspace-host');
    const missionSection = Array.from(
      host?.querySelectorAll<HTMLElement>('.mission-fleet-list') ?? [],
    ).find((section) => section.querySelector('h2')?.textContent === 'Подготовить миссию');
    const heading = missionSection?.querySelector('h2');
    if (missionSection === undefined || heading === null || heading === undefined) return false;

    const notice = document.createElement('div');
    notice.className = 'mission-target-notice';
    notice.dataset.testid = 'mission-target-notice';
    notice.textContent = `Цель с карты: ${prepared.label} · ${missionLabel(prepared.mission)}`;
    heading.insertAdjacentElement('afterend', notice);
    preparedNoticeWasVisible = true;
    if (control !== null) control.hidden = false;
    return true;
  };

  const reconcile = (): void => {
    const control = ensureClearControl();
    if (document.documentElement.dataset.appReady !== 'true') {
      if (control !== null) control.hidden = true;
      return;
    }

    const route = document.documentElement.dataset.shellRoute ?? '';
    const prepared = readPreparedFleetMissionTarget();
    if (!route.startsWith('#/fleets/compose') || prepared === null) {
      if (control !== null) control.hidden = true;
      preparedNoticeWasVisible = false;
      return;
    }

    const notice = document.querySelector<HTMLElement>('[data-testid="mission-target-notice"]');
    if (notice === null) {
      if (preparedNoticeWasVisible) {
        clearPreparedFleetMissionTarget();
        preparedNoticeWasVisible = false;
        if (control !== null) control.hidden = true;
        emitPreparedTarget(null);
        return;
      }
      hydrateComposer(prepared, control);
      return;
    }

    preparedNoticeWasVisible = true;
    if (control !== null) control.hidden = false;
    const targetSelectors = Array.from(
      document.querySelectorAll<HTMLSelectElement>('[data-testid^="mission-target-"]'),
    );
    const targetExists = targetSelectors.some((select) =>
      Array.from(select.options).some((option) => option.value === prepared.targetId));
    if (targetSelectors.length > 0 && !targetExists) {
      clearInvalidPreparation(
        control,
        'Подготовленная цель больше недоступна. Выбери новую цель.',
      );
    }
  };

  const observer = new MutationObserver(reconcile);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-shell-route', 'data-app-ready'],
    childList: true,
    subtree: true,
  });
  queueMicrotask(reconcile);
}

installPreparedTargetBridge();
