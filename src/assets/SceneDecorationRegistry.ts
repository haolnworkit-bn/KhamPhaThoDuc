import type { EraId, GeographicMap } from '../shared/types/content';
import type { AssetManifest } from './types';
import type { ResolvedSceneDecoration, SceneDecorationManifest } from './sceneDecorationTypes';
import { assertValidSceneDecorations } from './validateSceneDecorations';

/** Pure-data renderer input. No Phaser dependency or changes to navigation/collision. */
export class SceneDecorationRegistry {
  constructor(readonly manifest: SceneDecorationManifest, assets: AssetManifest) {
    assertValidSceneDecorations(manifest, assets);
  }

  /** Resolve using authoritative, existing heritage world points; skip out-of-bounds visuals. */
  resolve(map: GeographicMap, era: EraId): ResolvedSceneDecoration[] {
    if (map.mapId !== this.manifest.mapId) throw new Error('Decoration manifest mapId does not match game map');
    const heritage = new Map(map.heritage.map(h => [h.id, h.world]));
    const { width, height } = map.projection.world;
    const resolved: ResolvedSceneDecoration[] = [];
    for (const decoration of this.manifest.decorations) {
      if (!decoration.eras.includes(era)) continue;
      const point = heritage.get(decoration.anchor.locationId);
      if (!point) continue;
      const world = { x: point.x + decoration.offset.x, y: point.y + decoration.offset.y };
      if (world.x < 0 || world.x > width || world.y < 0 || world.y > height) continue;
      resolved.push({ ...decoration, world });
    }
    return resolved;
  }
}
