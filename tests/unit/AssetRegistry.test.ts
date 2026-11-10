import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AssetRegistry } from '../../src/assets/AssetRegistry';
import { loadAssetRegistry } from '../../src/assets/loadAssetRegistry';
import { validateAssetManifest, validateHeritageVisuals } from '../../src/assets/AssetValidator';
import manifestJson from '../../public/data/asset-manifest.json';
import visualsJson from '../../public/data/heritage-visuals.json';
import type { AssetManifest, HeritageVisual } from '../../src/assets/types';

const manifest = manifestJson as unknown as AssetManifest;
const visuals = visualsJson as unknown as HeritageVisual[];

describe('Visual Asset Foundation', () => {
  it('validates the bundled manifests', () => {
    expect(validateAssetManifest(manifest)).toEqual([]);
    expect(validateHeritageVisuals(visuals, manifest.assets)).toEqual([]);
  });
  it('finds available modern assets without leaking them into 1077', () => {
    const registry = new AssetRegistry(manifest, visuals);
    expect(registry.available('present').some((asset) => asset.id === 'dinh-tho-duc-illustration')).toBe(true);
    expect(registry.available('ly_1077').some((asset) => asset.category === 'heritage')).toBe(false);
    expect(registry.getHeritage('dinh_tho_duc', 'ly_1077')).toBeUndefined();
  });
  it('flags invalid duplicate IDs and invalid asset paths', () => {
    const bad: AssetManifest = { schemaVersion: 1, animations: [], assets: [
      manifest.assets[0],
      { ...manifest.assets[0], kind: 'image', path: '../unsafe.png' },
    ] };
    expect(validateAssetManifest(bad).join(' ')).toContain('Duplicate asset');
    expect(validateAssetManifest(bad).join(' ')).toContain('Invalid local asset path');
  });
  it('registers local v2 SVG assets with safe metadata and era filtering', () => {
    const registry = new AssetRegistry(manifest, visuals);
    const required = ['player-v2', 'guide-v2', 'tree-v2', 'house-v2', 'dinh-tho-duc-v2'];
    for (const id of required) {
      const asset = registry.get(id);
      expect(asset, id).toBeDefined();
      expect(asset?.kind).toBe('image');
      expect(asset?.path).toMatch(/^assets\/visual\/[a-z0-9-]+\.svg$/);
      const svg = readFileSync(resolve('public', asset!.path!), 'utf-8');
      expect(svg).toContain('<svg');
      expect(svg).toContain('viewBox=');
      expect(svg).not.toMatch(/<script\b/i);
      expect(svg).not.toMatch(/<foreignObject\b/i);
      expect(AssetRegistry.assetUrl(asset!, '/ThoDucQueToi/')).toBe('/ThoDucQueToi/' + asset!.path);
    }
    expect(registry.available('ly_1077').some(asset => asset.id === 'dinh-tho-duc-v2')).toBe(false);
    expect(registry.available('ly_1077').some(asset => asset.id === 'tree-v2')).toBe(false);
    expect(registry.available('ly_1077').some(asset => asset.id === 'guide-v2')).toBe(true);
  });
  it('builds base-path-safe URLs', () => {
    expect(AssetRegistry.assetUrl({ ...manifest.assets[0], path: 'art/player.png' }, '/KhamPhaThoDuc/')).toBe('/KhamPhaThoDuc/art/player.png');
    expect(AssetRegistry.assetUrl(manifest.assets[0], '/KhamPhaThoDuc/')).toBeUndefined();
  });
  it('surfaces a visual metadata load failure', async () => {
    const failedFetch: typeof fetch = async () => new Response('', { status: 503 });
    await expect(loadAssetRegistry(failedFetch)).rejects.toThrow('Unable to load visual metadata (503).');
  });
});
