export const SPACE_MAP_SELECTION_EVENT = 'stellar:space-map-selection';

export type SpaceMapSelectionDetail =
  | {
      readonly kind: 'sun';
      readonly galaxy: number;
      readonly solarSystem: number;
      readonly label: string;
    }
  | {
      readonly kind: 'position';
      readonly galaxy: number;
      readonly solarSystem: number;
      readonly position: number;
      readonly label: string;
      readonly objectKind: 'empty' | 'planet' | 'asteroid' | 'debris' | 'renegade';
    };

export function dispatchSpaceMapSelection(detail: SpaceMapSelectionDetail): void {
  window.dispatchEvent(
    new CustomEvent<SpaceMapSelectionDetail>(SPACE_MAP_SELECTION_EVENT, { detail }),
  );
}
