import type { AssetManifest, HeritageVisual, VisualAsset } from './types';

const ERA_IDS = new Set(['present', 'ly_1077', 'le', 'nguyen_1845', 'twentieth_century']);
const LOCATION_IDS = new Set(['dinh_tho_duc', 'den_can_vang', 'chua_thap_linh']);
const ASSET_IDS = /^[a-z][a-z0-9_-]*$/;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export function validateAssetManifest(manifest: AssetManifest): string[] {
  const errors: string[] = [];
  if (manifest.schemaVersion !== 1) errors.push('Unsupported asset manifest schema');
  if (!Array.isArray(manifest.assets) || !Array.isArray(manifest.animations)) return [...errors, 'assets and animations must be arrays'];
  const seen = new Set<string>();
  for (const asset of manifest.assets) {
    if (!ASSET_IDS.test(asset.id)) errors.push(`Invalid asset id: ${asset.id}`);
    if (seen.has(asset.id)) errors.push(`Duplicate asset: ${asset.id}`);
    seen.add(asset.id);
    if (!['procedural', 'image', 'spritesheet'].includes(asset.kind)) errors.push(`Invalid kind: ${asset.id}`);
    if (asset.kind !== 'procedural' && (!asset.path || asset.path.startsWith('/') || asset.path.includes('..') || /^https?:/i.test(asset.path))) errors.push(`Invalid local asset path: ${asset.id}`);
    if (!finite(asset.anchor?.x) || !finite(asset.anchor?.y) || asset.anchor.x < 0 || asset.anchor.x > 1 || asset.anchor.y < 0 || asset.anchor.y > 1) errors.push(`Invalid anchor: ${asset.id}`);
    if (!finite(asset.depthOffset)) errors.push(`Invalid depthOffset: ${asset.id}`);
    if (!Array.isArray(asset.eras) || asset.eras.length === 0 || asset.eras.some((era) => !ERA_IDS.has(era))) errors.push(`Invalid eras: ${asset.id}`);
    if (!asset.attribution.trim() || !asset.license.trim()) errors.push(`Missing provenance: ${asset.id}`);
    if (asset.kind === 'spritesheet' && (![asset.frameWidth, asset.frameHeight, asset.frames].every((n) => finite(n) && Number.isInteger(n) && n > 0))) errors.push(`Invalid spritesheet dimensions: ${asset.id}`);
  }
  const animationIds = new Set<string>();
  for (const animation of manifest.animations) {
    if (animationIds.has(animation.id)) errors.push(`Duplicate animation: ${animation.id}`);
    animationIds.add(animation.id);
    const asset = manifest.assets.find((item) => item.id === animation.assetId);
    if (!asset || asset.kind !== 'spritesheet') errors.push(`Animation requires spritesheet: ${animation.id}`);
    if (!finite(animation.frameStart) || !finite(animation.frameEnd) || !Number.isInteger(animation.frameStart) || !Number.isInteger(animation.frameEnd) || animation.frameStart < 0 || animation.frameEnd < animation.frameStart || (asset?.frames !== undefined && animation.frameEnd >= asset.frames)) errors.push(`Invalid frame range: ${animation.id}`);
    if (!finite(animation.frameRate) || animation.frameRate <= 0 || !Number.isInteger(animation.repeat) || animation.repeat < -1) errors.push(`Invalid animation timing: ${animation.id}`);
  }
  return errors;
}

export function validateHeritageVisuals(visuals: HeritageVisual[], assets: readonly VisualAsset[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const visual of visuals) {
    if (!LOCATION_IDS.has(visual.locationId) || seen.has(visual.locationId)) errors.push(`Invalid/duplicate heritage location: ${visual.locationId}`);
    seen.add(visual.locationId);
    const asset = assets.find((item) => item.id === visual.assetId);
    if (!asset || asset.category !== 'heritage') errors.push(`Missing heritage asset: ${visual.assetId}`);
    if (!finite(visual.offset?.x) || !finite(visual.offset?.y)) errors.push(`Invalid visual offset: ${visual.locationId}`);
    if (visual.representation !== 'illustration' && visual.representation !== 'reference-based') errors.push(`Invalid representation: ${visual.locationId}`);
    if (!visual.note.trim()) errors.push(`Missing heritage note: ${visual.locationId}`);
    if (!Array.isArray(visual.eras) || visual.eras.some((era) => !ERA_IDS.has(era) || !asset?.eras.includes(era))) errors.push(`Invalid heritage eras: ${visual.locationId}`);
    if (visual.representation === 'illustration' && visual.verificationStatus === 'verified') errors.push(`Illustration cannot be verified: ${visual.locationId}`);
  }
  return errors;
}

export function assertValidAssets(manifest: AssetManifest, visuals: HeritageVisual[]): void {
  const errors = [...validateAssetManifest(manifest), ...validateHeritageVisuals(visuals, manifest.assets)];
  if (errors.length) throw new Error(`Invalid visual assets:\n${errors.join('\n')}`);
}
