import type { EraId, LocationId, MapPoint } from '../shared/types/content';

/** Data-only scenery; geometry/collision and heritage locations remain authoritative elsewhere. */
export interface SceneDecoration {
  id: string;
  assetId: string;
  anchor: { type: 'heritage'; locationId: LocationId };
  offset: MapPoint;
  eras: EraId[];
  /** Visual-only extra depth relative to the foot-point Y. */
  depthOffset?: number;
  /** Cosmetic scale only; never used to modify collision geometry. */
  scale?: number;
}

export interface SceneDecorationManifest {
  schemaVersion: 1;
  mapId: 'tho_duc_geographic_v1';
  decorations: SceneDecoration[];
}

export interface ResolvedSceneDecoration extends SceneDecoration {
  world: Readonly<MapPoint>;
}
