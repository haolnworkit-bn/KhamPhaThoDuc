import type { EraId, LocationId, VerificationStatus } from '../shared/types/content';

export type AssetCategory = 'character' | 'environment' | 'heritage' | 'ui';
export type AssetKind = 'procedural' | 'image' | 'spritesheet';
export type Facing = 'up' | 'down' | 'left' | 'right';

export interface VisualAsset {
  id: string;
  category: AssetCategory;
  kind: AssetKind;
  /** Path relative to Vite public root; required for image/spritesheet only. */
  path?: string;
  frameWidth?: number;
  frameHeight?: number;
  frames?: number;
  anchor: { x: number; y: number };
  depthOffset: number;
  eras: EraId[];
  attribution: string;
  license: string;
}

export interface VisualAnimation {
  id: string;
  assetId: string;
  direction: Facing;
  state: 'idle' | 'walk';
  frameStart: number;
  frameEnd: number;
  frameRate: number;
  repeat: number;
}

export interface AssetManifest {
  schemaVersion: 1;
  assets: VisualAsset[];
  animations: VisualAnimation[];
}

export interface HeritageVisual {
  locationId: LocationId;
  assetId: string;
  label: string;
  representation: 'illustration' | 'reference-based';
  verificationStatus: VerificationStatus;
  note: string;
  /** Visual-only offset from the location world coordinate, in world pixels. */
  offset: { x: number; y: number };
  eras: EraId[];
}
