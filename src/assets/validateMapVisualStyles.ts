import type { MapVisualStyleManifest, MapVisualLayer } from './mapVisualTypes';

const LAYERS = new Set<MapVisualLayer>(['roads', 'footpaths', 'water', 'landuse', 'buildings']);
const ERAS = new Set(['present', 'ly_1077', 'le', 'nguyen_1845', 'twentieth_century']);
const ID = /^[a-z][a-z0-9_-]*$/;
const HEX = /^#[0-9a-fA-F]{6}$/;
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Validate untrusted styles without importing Phaser. */
export function validateMapVisualStyles(input: unknown): string[] {
  if (!record(input)) return ['Map visual manifest must be an object'];
  const errors: string[] = [];
  if (input.schemaVersion !== 1) errors.push('Unsupported map visual schema');
  if (input.mapId !== 'tho_duc_geographic_v1') errors.push('Unsupported map visual mapId');
  if (!Array.isArray(input.styles)) return [...errors, 'styles must be an array'];
  const seenIds = new Set<string>();
  const seenKinds = new Set<string>();
  for (const value of input.styles) {
    if (!record(value)) { errors.push('Style must be an object'); continue; }
    const id = typeof value.id === 'string' ? value.id : '(missing)';
    if (!ID.test(id) || seenIds.has(id)) errors.push(`Invalid/duplicate style id: ${id}`);
    seenIds.add(id);
    const layer = String(value.layer);
    if (!LAYERS.has(layer as MapVisualLayer)) errors.push(`Invalid style layer: ${id}`);
    const expectedPaint = layer === 'roads' || layer === 'footpaths' || layer === 'water' ? 'line' : 'polygon';
    if (value.paint !== expectedPaint) errors.push(`Invalid paint for layer: ${id}`);
    if (!Array.isArray(value.kinds) || value.kinds.length === 0 || value.kinds.some(k => typeof k !== 'string' || !k.trim())) {
      errors.push(`Invalid style kinds: ${id}`);
    } else {
      for (const kind of value.kinds) {
        const key = `${layer}:${kind}`;
        if (seenKinds.has(key)) errors.push(`Duplicate layer/kind style: ${key}`);
        seenKinds.add(key);
      }
    }
    if (typeof value.color !== 'string' || !HEX.test(value.color)) errors.push(`Invalid color: ${id}`);
    if (value.outlineColor !== undefined && (typeof value.outlineColor !== 'string' || !HEX.test(value.outlineColor))) errors.push(`Invalid outline color: ${id}`);
    if (!finite(value.alpha) || value.alpha < 0 || value.alpha > 1) errors.push(`Invalid alpha: ${id}`);
    if (!Number.isInteger(value.variants) || (value.variants as number) < 1 || (value.variants as number) > 8) errors.push(`Invalid variants: ${id}`);
    if (expectedPaint === 'line' && (!finite(value.width) || value.width <= 0 || value.width > 40)) errors.push(`Invalid line width: ${id}`);
    if (expectedPaint === 'polygon' && value.width !== undefined) errors.push(`Polygon cannot have line width: ${id}`);
    if (!Array.isArray(value.eras) || !value.eras.length || value.eras.some(e => !ERAS.has(String(e)))) errors.push(`Invalid eras: ${id}`);
    if (value.interpretation !== 'contemporary-osm' && value.interpretation !== 'contemporary-reference') errors.push(`Invalid provenance: ${id}`);
    if (Array.isArray(value.eras) && value.eras.includes('ly_1077') &&
       (layer !== 'water' || value.interpretation !== 'contemporary-reference')) {
      errors.push(`1077 may display only labelled contemporary water reference: ${id}`);
    }
  }
  return errors;
}

export function assertValidMapVisualStyles(input: unknown): asserts input is MapVisualStyleManifest {
  const errors = validateMapVisualStyles(input);
  if (errors.length) throw new Error(`Invalid map visual styles:\n${errors.join('\n')}`);
}
