import type { EraId, MapFeature } from '../shared/types/content';

export type MapVisualLayer = 'roads' | 'footpaths' | 'water' | 'landuse' | 'buildings';
export type MapVisualPaint = 'line' | 'polygon';

export interface MapVisualStyle {
  id: string;
  layer: MapVisualLayer;
  kinds: string[];
  paint: MapVisualPaint;
  color: string;
  outlineColor?: string;
  width?: number;
  alpha: number;
  /** For small deterministic per-feature shade choices; this does not affect layout. */
  variants: number;
  eras: EraId[];
  interpretation: 'contemporary-osm' | 'contemporary-reference';
}

export interface MapVisualStyleManifest {
  schemaVersion: 1;
  mapId: 'tho_duc_geographic_v1';
  styles: MapVisualStyle[];
}

export interface StyledMapFeature {
  feature: MapFeature;
  style: MapVisualStyle;
  variant: number;
  layer: MapVisualLayer;
  /** Original order in the map layer; OSM IDs alone are not unique in generated data. */
  sourceIndex: number;
}
