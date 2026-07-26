import type {
  AegisAssetCategory,
  AegisVerticalSliceAsset,
} from './aegisVerticalSliceAssets';
import { RUNTIME_ASSET_MANIFEST } from './generated/runtimeAssetManifest.generated';

export type RuntimeMechanicalAssetCategory =
  | 'building'
  | 'technology'
  | 'ship'
  | 'defense'
  | 'commander';

function runtimeUrl(outputPath: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${outputPath.replace(/^public\//, '')}`;
}

function presentationCategory(category: RuntimeMechanicalAssetCategory): AegisAssetCategory {
  return category === 'commander' ? 'commander' : category;
}

export function getRuntimeMechanicalAsset(
  mechanicalId: string,
  runtimeSemanticId: string,
  category: RuntimeMechanicalAssetCategory,
): AegisVerticalSliceAsset | undefined {
  const manifest = RUNTIME_ASSET_MANIFEST as Readonly<Record<string, { readonly outputPath: string; readonly width: number; readonly height: number }>>;
  const generated = manifest[runtimeSemanticId];
  if (generated === undefined) return undefined;
  return {
    id: mechanicalId,
    name: mechanicalId,
    category: presentationCategory(category),
    atlasUrl: runtimeUrl(generated.outputPath),
    frame: {
      x: 0,
      y: 0,
      width: generated.width,
      height: generated.height,
    },
    role: 'generated-runtime',
    stage: 'P1',
    layout: 'image',
  };
}

export function applyMechanicalAssetArtwork(
  element: HTMLElement,
  asset: AegisVerticalSliceAsset,
  overlay = 'linear-gradient(180deg, transparent, rgba(2, 8, 14, 0.58))',
): void {
  if (asset.layout === 'image') {
    element.style.backgroundImage = `${overlay}, url("${asset.atlasUrl}")`;
    element.style.backgroundSize = '100% 100%, contain';
    element.style.backgroundPosition = 'center';
    element.style.backgroundRepeat = 'no-repeat';
    return;
  }

  const column = asset.frame.x / asset.frame.width;
  const row = asset.frame.y / asset.frame.height;
  element.style.backgroundImage = `url("${asset.atlasUrl}")`;
  element.style.backgroundSize = '400% 200%';
  element.style.backgroundPosition =
    `${column === 0 ? 0 : (column / 3) * 100}% ${row === 0 ? 0 : 100}%`;
  element.style.backgroundRepeat = 'no-repeat';
}
