import type { EraId, GeographicMap, MapFeature } from '../shared/types/content';
import type { MapVisualLayer, MapVisualStyle, MapVisualStyleManifest, StyledMapFeature } from './mapVisualTypes';
import { assertValidMapVisualStyles } from './validateMapVisualStyles';

const LAYERS: MapVisualLayer[] = ['landuse', 'water', 'roads', 'footpaths', 'buildings'];

/** Stable per-feature variants; avoids non-deterministic Math.random(). */
function variantFor(feature: MapFeature, layer: MapVisualLayer, index: number, total: number): number {
  let hash = 2166136261;
  // Include geometry & source index: generated OSM IDs can repeat.
  const geometry = feature.points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(';');
  const key = `${layer}:${index}:${feature.id}:${geometry}`;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % total;
}

export class MapVisualStyleRegistry {
  private readonly byKind: Map<string, MapVisualStyle>;

  constructor(readonly manifest: MapVisualStyleManifest) {
    assertValidMapVisualStyles(manifest);
    this.byKind = new Map();
    for (const style of manifest.styles) {
      for (const kind of style.kinds) this.byKind.set(`${style.layer}:${kind}`, style);
    }
  }

  styleFor(layer: MapVisualLayer, kind: string, era: EraId): MapVisualStyle | undefined {
    const style = this.byKind.get(`${layer}:${kind}`);
    return style?.eras.includes(era) ? style : undefined;
  }

  /** Returns only real source features, never generates fictional footprints or roads. */
  resolve(map: GeographicMap, era: EraId): StyledMapFeature[] {
    if (map.mapId !== this.manifest.mapId) throw new Error('Visual styles mapId does not match geographic map');
    const out: StyledMapFeature[] = [];
    for (const layer of LAYERS) {
      map.layers[layer].forEach((feature, sourceIndex) => {
        const style = this.styleFor(layer, feature.kind, era);
        if (!style || feature.points.length < (style.paint === 'line' ? 2 : 3)) return;
        out.push({ feature, style, layer, sourceIndex, variant: variantFor(feature, layer, sourceIndex, style.variants) });
      });
    }
    return out;
  }
}
