import type { AssetManifest } from './types';
import type { SceneDecorationManifest } from './sceneDecorationTypes';

const ERA_IDS = new Set(['present', 'ly_1077', 'le', 'nguyen_1845', 'twentieth_century']);
const HERITAGE_IDS = new Set(['dinh_tho_duc', 'den_can_vang', 'chua_thap_linh']);
const ID_PATTERN = /^[a-z][a-z0-9_-]*$/;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** Validate untrusted JSON at the boundary; never modify geographic data. */
export function validateSceneDecorations(input: unknown, assets: AssetManifest): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['Decoration manifest must be an object'];
  const value = input as Record<string, unknown>;
  if (value.schemaVersion !== 1) errors.push('Unsupported decoration schemaVersion');
  if (value.mapId !== 'tho_duc_geographic_v1') errors.push('Unsupported decoration mapId');
  if (!Array.isArray(value.decorations)) return [...errors, 'decorations must be an array'];
  const seen = new Set<string>();
  for (const entry of value.decorations as unknown[]) {
    if (!entry || typeof entry !== 'object') { errors.push('Decoration must be an object'); continue; }
    const d = entry as Record<string, unknown>;
    const id = typeof d.id === 'string' ? d.id : '(missing)';
    if (!ID_PATTERN.test(id)) errors.push(`Invalid decoration id: ${id}`);
    if (seen.has(id)) errors.push(`Duplicate decoration id: ${id}`);
    seen.add(id);
    const asset = assets.assets.find(a => a.id === d.assetId);
    if (!asset || asset.category !== 'environment') errors.push(`Unknown environment asset for ${id}: ${String(d.assetId)}`);
    const anchor = d.anchor as Record<string, unknown> | undefined;
    if (!anchor || anchor.type !== 'heritage' || !HERITAGE_IDS.has(String(anchor.locationId))) errors.push(`Invalid heritage anchor: ${id}`);
    const offset = d.offset as Record<string, unknown> | undefined;
    if (!offset || !finite(offset.x) || !finite(offset.y) || Math.abs(offset.x) > 500 || Math.abs(offset.y) > 500) errors.push(`Invalid decoration offset: ${id}`);
    if (!Array.isArray(d.eras) || d.eras.length === 0 || d.eras.some(e => !ERA_IDS.has(String(e)) || !asset?.eras.includes(e))) errors.push(`Invalid decoration eras: ${id}`);
    if (d.depthOffset !== undefined && (!finite(d.depthOffset) || Math.abs(d.depthOffset) > 1000)) errors.push(`Invalid decoration depthOffset: ${id}`);
    if (d.scale !== undefined && (!finite(d.scale) || d.scale < 0.25 || d.scale > 4)) errors.push(`Invalid decoration scale: ${id}`);
  }
  return errors;
}

export function assertValidSceneDecorations(input: unknown, assets: AssetManifest): asserts input is SceneDecorationManifest {
  const errors = validateSceneDecorations(input, assets);
  if (errors.length) throw new Error(`Invalid scene decorations:\n${errors.join('\n')}`);
}
