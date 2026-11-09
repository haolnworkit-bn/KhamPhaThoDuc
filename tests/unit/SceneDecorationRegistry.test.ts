import { describe, expect, it } from 'vitest';
import { SceneDecorationRegistry } from '../../src/assets/SceneDecorationRegistry';
import { validateSceneDecorations } from '../../src/assets/validateSceneDecorations';
import type { AssetManifest } from '../../src/assets/types';
import type { GeographicMap } from '../../src/shared/types/content';
import assetJson from '../../public/data/asset-manifest.json';
import decorationJson from '../../public/data/scene-decorations.json';

const assets = assetJson as unknown as AssetManifest;
const createManifest = () => JSON.parse(JSON.stringify(decorationJson)) as typeof decorationJson;
const map = {
  mapId: 'tho_duc_geographic_v1',
  heritage: [{ id: 'dinh_tho_duc', world: { x: 519.09, y: 1015.61 } }],
  projection: { world: { width: 2052, height: 1832 } },
} as GeographicMap;

describe('SceneDecorationRegistry', () => {
  it('validates the checked-in scene decoration manifest', () => {
    expect(validateSceneDecorations(decorationJson, assets)).toEqual([]);
  });
  it('resolves eight modern decorations from the geographic landmark without mutating it', () => {
    const registry = new SceneDecorationRegistry(createManifest(), assets);
    const locationBefore = { ...map.heritage[0].world };
    const items = registry.resolve(map, 'present');
    expect(items).toHaveLength(8);
    expect(items[0].world.x).toBeCloseTo(369.09, 5);
    expect(items[0].world.y).toBeCloseTo(910.61, 5);
    expect(map.heritage[0].world).toEqual(locationBefore);
  });
  it('does not leak modern decorations into the interpretive 1077 view', () => {
    expect(new SceneDecorationRegistry(createManifest(), assets).resolve(map, 'ly_1077')).toEqual([]);
  });
  it('rejects duplicate ids and unavailable era assets', () => {
    const manifest = createManifest();
    manifest.decorations.push({ ...manifest.decorations[0] });
    manifest.decorations[0].eras = ['ly_1077'];
    const problems = validateSceneDecorations(manifest, assets);
    expect(problems.some(p => p.includes('Duplicate decoration id'))).toBe(true);
    expect(problems.some(p => p.includes('Invalid decoration eras'))).toBe(true);
  });
  it('rejects non-finite or extreme decoration offsets', () => {
    const manifest = createManifest();
    manifest.decorations[0].offset.x = Number.POSITIVE_INFINITY;
    expect(validateSceneDecorations(manifest, assets).some(p => p.includes('Invalid decoration offset'))).toBe(true);
  });
  it('omits resolved decoration points outside the world', () => {
    const movedMap = { ...map, heritage: [{ id: 'dinh_tho_duc', world: { x: 5, y: 5 } }] } as GeographicMap;
    const result = new SceneDecorationRegistry(createManifest(), assets).resolve(movedMap, 'present');
    expect(result.length).toBeLessThan(8);
  });
});
