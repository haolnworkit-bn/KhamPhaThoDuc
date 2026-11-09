import type { EraId, LocationId } from '../shared/types/content';
import { assertValidAssets } from './AssetValidator';
import type { AssetManifest, HeritageVisual, VisualAnimation, VisualAsset } from './types';

/** Pure data registry; does not import Phaser or modify game/session state. */
export class AssetRegistry {
  private readonly byId: Map<string, VisualAsset>;
  private readonly heritage: Map<LocationId, HeritageVisual>;

  constructor(readonly manifest: AssetManifest, heritageVisuals: HeritageVisual[]) {
    assertValidAssets(manifest, heritageVisuals);
    this.byId = new Map(manifest.assets.map((asset) => [asset.id, asset]));
    this.heritage = new Map(heritageVisuals.map((entry) => [entry.locationId, entry]));
  }

  get(id: string): VisualAsset | undefined { return this.byId.get(id); }
  available(era: EraId): VisualAsset[] { return this.manifest.assets.filter((asset) => asset.eras.includes(era)); }
  animations(assetId: string): VisualAnimation[] { return this.manifest.animations.filter((animation) => animation.assetId === assetId); }
  getHeritage(locationId: LocationId, era: EraId): HeritageVisual | undefined {
    const visual = this.heritage.get(locationId);
    return visual?.eras.includes(era) ? visual : undefined;
  }
  /** Prefix with Vite base, e.g. /KhamPhaThoDuc/; procedural assets have no URL. */
  static assetUrl(asset: VisualAsset, baseUrl: string): string | undefined {
    if (!asset.path) return undefined;
    return `${baseUrl.replace(/\/+$/, '')}/${asset.path.replace(/^\/+/, '')}`;
  }
}
