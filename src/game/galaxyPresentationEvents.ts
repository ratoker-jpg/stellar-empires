export const GALAXY_SYSTEM_SELECTED_EVENT = 'stellar:galaxy-system-selected';

export interface GalaxySystemSelectionDetail {
  readonly systemId: string;
  readonly systemName: string;
  readonly x: number;
  readonly y: number;
}

export function dispatchGalaxySystemSelection(
  detail: GalaxySystemSelectionDetail,
): void {
  window.dispatchEvent(
    new CustomEvent<GalaxySystemSelectionDetail>(GALAXY_SYSTEM_SELECTED_EVENT, {
      detail,
    }),
  );
}
