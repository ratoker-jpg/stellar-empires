import type { FleetMissionKind } from '../simulation/fleets/types';
import type { GalaxyIntelVisibility } from '../simulation/galaxy/intelligenceView';

export const FLEET_MISSION_TARGET_EVENT = 'stellar:fleet-mission-target';

const PREPARED_TARGET_STORAGE_KEY = 'stellar-empires:prepared-fleet-target:v1';
const RESTORE_RETRY_DELAY_MS = 50;
const RESTORE_RETRY_LIMIT = 40;

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
  let deliveredTargetId: string | null = null;
  let preparedNoticeWasVisible = false;
  let restoreAttempts = 0;
  let restoreTimer: number | null = null;
  let clearControl: HTMLButtonElement | null = null;

  const cancelRestoreTimer = (): void => {
    if (restoreTimer === null) return;
    window.clearTimeout(restoreTimer);
    restoreTimer = null;
  };

  const resetDelivery = (): void => {
    cancelRestoreTimer();
    deliveredTargetId = null;
    preparedNoticeWasVisible = false;
    restoreAttempts = 0;
  };

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
      button.hidden = true;
      resetDelivery();
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

  const reconcile = (): void => {
    restoreTimer = null;
    const control = ensureClearControl();
    if (document.documentElement.dataset.appReady !== 'true') {
      if (control !== null) control.hidden = true;
      return;
    }

    const route = document.documentElement.dataset.shellRoute ?? '';
    const prepared = readPreparedFleetMissionTarget();
    if (!route.startsWith('#/fleets/compose') || prepared === null) {
      if (control !== null) control.hidden = true;
      resetDelivery();
      return;
    }

    if (deliveredTargetId !== prepared.targetId) {
      cancelRestoreTimer();
      deliveredTargetId = prepared.targetId;
      preparedNoticeWasVisible = false;
      restoreAttempts = 0;
    }

    const notice = document.querySelector<HTMLElement>('[data-testid="mission-target-notice"]');
    if (notice === null) {
      if (preparedNoticeWasVisible) {
        clearPreparedFleetMissionTarget();
        if (control !== null) control.hidden = true;
        resetDelivery();
        emitPreparedTarget(null);
        return;
      }

      if (restoreAttempts < RESTORE_RETRY_LIMIT) {
        restoreAttempts += 1;
        emitPreparedTarget(prepared);
        if (restoreTimer === null) {
          restoreTimer = window.setTimeout(reconcile, RESTORE_RETRY_DELAY_MS);
        }
        return;
      }

      clearPreparedFleetMissionTarget();
      if (control !== null) control.hidden = true;
      resetDelivery();
      emitPreparedTarget(null);
      renderInvalidWarning('Подготовленную цель не удалось восстановить. Выбери цель заново.');
      return;
    }

    cancelRestoreTimer();
    preparedNoticeWasVisible = true;
    restoreAttempts = 0;
    if (control !== null) control.hidden = false;

    const targetSelectors = Array.from(
      document.querySelectorAll<HTMLSelectElement>('[data-testid^="mission-target-"]'),
    );
    const targetExists = targetSelectors.some((select) =>
      Array.from(select.options).some((option) => option.value === prepared.targetId));
    if (targetSelectors.length === 0 || targetExists) return;

    clearPreparedFleetMissionTarget();
    if (control !== null) control.hidden = true;
    resetDelivery();
    emitPreparedTarget(null);
    renderInvalidWarning('Подготовленная цель больше недоступна. Выбери новую цель.');
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
