export const SPACE_OBJECT_TARGET_EVENT = 'stellar:space-object-target';

export interface SpaceObjectTargetRequest {
  readonly objectId: string;
  readonly label: string;
}

export function dispatchSpaceObjectTarget(detail: SpaceObjectTargetRequest): void {
  window.dispatchEvent(
    new CustomEvent<SpaceObjectTargetRequest>(SPACE_OBJECT_TARGET_EVENT, { detail }),
  );
}
