import type { EraId, GeographicMap, MapPoint } from '../shared/types/content';
import type { SceneDecorationRegistry } from '../assets/SceneDecorationRegistry';
import type { AssetRegistry } from '../assets/AssetRegistry';

export type WorldObstacle =
  | { id: string; kind: 'circle'; x: number; y: number; radius: number }
  | { id: string; kind: 'rect'; x: number; y: number; halfWidth: number; halfHeight: number };

/**
 * Physical footprint for the illustrative art, not a surveyed building footprint.
 * Uses the exact scene anchors and era restrictions used by VillageArtRenderer.
 * Only the solid structures/trunks block; roofs, tree canopies and the courtyard
 * remain visual layers. Does not modify authoritative OSM map geometry.
 */
export function resolveWorldObstacles(
  map: GeographicMap,
  era: EraId,
  decorations: SceneDecorationRegistry | null,
  assets: AssetRegistry,
): WorldObstacle[] {
  if (era !== 'present') return [];
  const result: WorldObstacle[] = [];
  const dinh = map.heritage.find((item) => item.id === 'dinh_tho_duc');
  const visual = assets.getHeritage('dinh_tho_duc', era);
  if (dinh && visual) {
    // Roof is decorative; walls are solid. The lower stairway remains accessible.
    result.push({
      id: 'dinh-tho-duc-walls',
      kind: 'rect',
      x: dinh.world.x + visual.offset.x,
      y: dinh.world.y + visual.offset.y - 50,
      halfWidth: 105,
      halfHeight: 40,
    });
  }

  for (const object of decorations?.resolve(map, era) ?? []) {
    const scale = object.scale ?? 1;
    if (object.assetId === 'tree-procedural') {
      result.push({
        id: object.id,
        kind: 'circle',
        x: object.world.x,
        y: object.world.y - 9 * scale,
        radius: 13 * scale,
      });
    } else if (object.assetId === 'house-procedural') {
      result.push({
        id: object.id,
        kind: 'rect',
        x: object.world.x,
        y: object.world.y - 19 * scale,
        halfWidth: 33 * scale,
        halfHeight: 23 * scale,
      });
    }
  }
  return result;
}

export function obstacleBlocksCircle(point: MapPoint, radius: number, obstacle: WorldObstacle): boolean {
  if (obstacle.kind === 'circle') {
    return Math.hypot(point.x - obstacle.x, point.y - obstacle.y) < radius + obstacle.radius;
  }
  const dx = Math.max(Math.abs(point.x - obstacle.x) - obstacle.halfWidth, 0);
  const dy = Math.max(Math.abs(point.y - obstacle.y) - obstacle.halfHeight, 0);
  return dx * dx + dy * dy < radius * radius;
}
