import { describe, expect, it } from 'vitest';
import type { GeographicMap } from '../../src/shared/types/content';
import type { MapVisualStyleManifest } from '../../src/assets/mapVisualTypes';
import { MapVisualStyleRegistry } from '../../src/assets/MapVisualStyleRegistry';
import { validateMapVisualStyles } from '../../src/assets/validateMapVisualStyles';
import manifestJson from '../../public/data/map-visual-styles.json';
import geographicMapJson from '../../public/data/geographic-map.json';

const manifest = manifestJson as unknown as MapVisualStyleManifest;
const map = {
  mapId: 'tho_duc_geographic_v1',
  layers: {
    roads: [
      { id: 'duplicate-osm-id', kind: 'residential', name: null, points: [{ x: 2, y: 2 }, { x: 4, y: 5 }] },
      { id: 'duplicate-osm-id', kind: 'secondary', name: null, points: [{ x: 7, y: 2 }, { x: 9, y: 5 }] },
    ],
    footpaths: [{ id: 'foot', kind: 'track', name: null, points: [{ x: 3, y: 2 }, { x: 4, y: 3 }] }],
    water: [{ id: 'river', kind: 'river', name: 'Sông Cầu', points: [{ x: 0, y: 0 }, { x: 20, y: 0 }] }],
    landuse: [{ id: 'land', kind: 'residential', name: null, points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }] }],
    buildings: [{ id: 'building', kind: 'yes', name: null, points: [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 3 }] }],
  },
} as GeographicMap;

describe('MapVisualStyleRegistry', () => {
  it('accepts checked-in styles', () => {
    expect(validateMapVisualStyles(manifestJson)).toEqual([]);
  });
  it('resolves source features consistently despite duplicate source IDs', () => {
    const registry = new MapVisualStyleRegistry(manifest);
    const once = registry.resolve(map, 'present');
    expect(once).toHaveLength(6);
    expect(registry.resolve(map, 'present')).toEqual(once);
    expect(once.filter(x => x.layer === 'roads').map(x => x.sourceIndex)).toEqual([0, 1]);
    expect(map.layers.roads).toHaveLength(2);
  });
  it('shows only water as a labelled present-day reference in 1077', () => {
    const registry = new MapVisualStyleRegistry(manifest);
    const historical = registry.resolve(map, 'ly_1077');
    expect(historical).toHaveLength(1);
    expect(historical[0].layer).toBe('water');
    expect(historical[0].style.interpretation).toBe('contemporary-reference');
  });
  it('rejects style overlaps and modern roads in 1077', () => {
    const copy = JSON.parse(JSON.stringify(manifestJson));
    copy.styles[0].eras.push('ly_1077');
    copy.styles.push({ ...copy.styles[0], id: 'other-road-style' });
    const errors = validateMapVisualStyles(copy);
    expect(errors.some((x: string) => x.includes('1077 may display'))).toBe(true);
    expect(errors.some((x: string) => x.includes('Duplicate layer/kind'))).toBe(true);
  });
  it('rejects a different map', () => {
    const registry = new MapVisualStyleRegistry(manifest);
    expect(() => registry.resolve({ ...map, mapId: 'another-map' } as unknown as GeographicMap, 'present')).toThrow('mapId');
  });
  it('resolves every checked-in OSM feature exactly once in the present era', () => {
    const registry = new MapVisualStyleRegistry(manifest);
    const actualMap = geographicMapJson as unknown as GeographicMap;
    const resolved = registry.resolve(actualMap, 'present');
    const expectedCounts = { roads: 125, footpaths: 5, water: 2, landuse: 3, buildings: 4 };
    expect(Object.fromEntries(Object.keys(expectedCounts).map((layer) => [layer, resolved.filter((item) => item.layer === layer).length]))).toEqual(expectedCounts);
    expect(new Set(resolved.map((item) => `${item.layer}:${item.sourceIndex}`)).size).toBe(resolved.length);
    expect(resolved.every((item) => item.feature.points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y)))).toBe(true);
  });
  it('resolves only the two checked-in water references for 1077', () => {
    const registry = new MapVisualStyleRegistry(manifest);
    const historical = registry.resolve(geographicMapJson as unknown as GeographicMap, 'ly_1077');
    expect(historical).toHaveLength(2);
    expect(historical.every((item) => item.layer === 'water' && item.style.interpretation === 'contemporary-reference')).toBe(true);
  });
});
