import { describe, expect, it } from 'vitest';
import { AssetRegistry } from '../../src/assets/AssetRegistry';
import { SceneDecorationRegistry } from '../../src/assets/SceneDecorationRegistry';
import { NavigationService } from '../../src/services/NavigationService';
import { obstacleBlocksCircle, resolveWorldObstacles } from '../../src/services/WorldObstacleService';
import type { GeographicMap } from '../../src/shared/types/content';
import type { SceneDecorationManifest } from '../../src/assets/sceneDecorationTypes';
import type { AssetManifest, HeritageVisual } from '../../src/assets/types';
import mapJson from '../../public/data/geographic-map.json';
import decorationsJson from '../../public/data/scene-decorations.json';
import assetsJson from '../../public/data/asset-manifest.json';
import heritageJson from '../../public/data/heritage-visuals.json';

const map = mapJson as GeographicMap;
const manifest = assetsJson as AssetManifest;
const decorations = new SceneDecorationRegistry(decorationsJson as SceneDecorationManifest, manifest);
const assets = new AssetRegistry(manifest, heritageJson as HeritageVisual[]);
const obstacles = resolveWorldObstacles(map, 'present', decorations, assets);
const navigation = new NavigationService(map, obstacles);

describe('Sprint 03D.1 world collision', () => {
  it('uses the existing scene decoration anchors for five trunks and three houses', () => {
    expect(obstacles.filter((obstacle) => obstacle.kind === 'circle')).toHaveLength(5);
    expect(obstacles.filter((obstacle) => obstacle.kind === 'rect')).toHaveLength(4);
    const tree = decorations.resolve(map, 'present').find((item) => item.id === 'dinh-tree-01')!;
    const blocker = obstacles.find((item) => item.id === tree.id)!;
    expect(blocker.x).toBe(tree.world.x);
    expect(blocker.y).toBe(tree.world.y - 9);
  });

  it('blocks solid building walls but keeps the lower courtyard open', () => {
    const dinh = map.heritage.find((item) => item.id === 'dinh_tho_duc')!.world;
    expect(obstacleBlocksCircle({ x: dinh.x, y: dinh.y - 125 }, 12, obstacles.find((item) => item.id === 'dinh-tho-duc-walls')!)).toBe(true);
    expect(obstacleBlocksCircle({ x: dinh.x, y: dinh.y + 40 }, 12, obstacles.find((item) => item.id === 'dinh-tho-duc-walls')!)).toBe(false);
  });

  it('blocks walking through a tree trunk or house footprint, including a long movement step', () => {
    const tree = obstacles.find((item) => item.kind === 'circle')!;
    expect(navigation.isBlocked({ x: tree.x, y: tree.y }, 'present')).toBe(true);
    expect(navigation.canMove({ x: tree.x - 80, y: tree.y }, { x: tree.x + 80, y: tree.y }, 'present')).toBe(false);
    const house = obstacles.find((item) => item.id === 'dinh-house-06')!;
    expect(obstacleBlocksCircle({ x: house.x, y: house.y }, 12, house)).toBe(true);
  });

  it('retains playable starting position and keeps future-era abstract visuals free of modern object colliders', () => {
    expect(navigation.isBlocked(map.interaction.spawn, 'present')).toBe(false);
    expect(resolveWorldObstacles(map, 'ly_1077', decorations, assets)).toEqual([]);
    const tree = obstacles.find((item) => item.kind === 'circle')!;
    expect(obstacleBlocksCircle({ x: tree.x, y: tree.y }, 12, tree)).toBe(true);
    expect(new NavigationService(map, obstacles).isBlocked({ x: tree.x, y: tree.y }, 'ly_1077'))
      .toBe(new NavigationService(map).isBlocked({ x: tree.x, y: tree.y }, 'ly_1077'));
  });

  it('has no fake decoration colliders when scene decorations fail to load', () => {
    const fallback = resolveWorldObstacles(map, 'present', null, assets);
    expect(fallback.map((o) => o.id)).toEqual(['dinh-tho-duc-walls']);
  });
});
