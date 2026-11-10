import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { AssetRegistry } from '../../src/assets/AssetRegistry';
import { validateAssetManifest } from '../../src/assets/AssetValidator';
import type { AssetManifest, HeritageVisual } from '../../src/assets/types';
import manifestJson from '../../public/data/asset-manifest.json';
import heritageJson from '../../public/data/heritage-visuals.json';

const manifest = manifestJson as AssetManifest;
const registry = new AssetRegistry(manifest, heritageJson as HeritageVisual[]);
const svgFile = (path: string) => readFileSync(fileURLToPath(new URL('../../public/' + path, import.meta.url)), 'utf8');

describe('Release demo: distinct present and interpretive 1077 visuals', () => {
  it('validates all era-specific visual metadata', () => {
    expect(validateAssetManifest(manifest)).toEqual([]);
  });

  it('has separate playable player and guide costumes in 1077', () => {
    for (const id of ['player-chibi-v1', 'guide-v2']) {
      expect(registry.get(id)?.eras).toContain('present');
    }
    for (const id of ['player-ly1077-v1', 'guide-ly1077-v1']) {
      const asset = registry.get(id);
      expect(asset?.eras).toContain('ly_1077');
      expect(asset?.path).toMatch(/\.svg$/);
      expect(svgFile(asset!.path!)).toContain('<svg');
    }
    const contemporary = svgFile(registry.get('player-chibi-v1')!.path!);
    const historical = svgFile(registry.get('player-ly1077-v1')!.path!);
    expect(historical).not.toEqual(contemporary);
    expect((historical.match(/<g transform=/g) ?? []).length).toBe(12);
  });

  it('provides houses and crop fields without leaking present-day mapped buildings into 1077', () => {
    const historical = registry.available('ly_1077').map(a => a.id);
    expect(historical).toContain('house-ly1077-v1');
    expect(historical).toContain('rice-field-ly1077-v1');
    expect(historical).not.toContain('house-v2');
    expect(historical).not.toContain('dinh-tho-duc-v2');
    for (const id of ['house-ly1077-v1', 'rice-field-ly1077-v1']) {
      const asset = registry.get(id)!;
      const svg = svgFile(asset.path!);
      expect(svg).toMatch(/viewBox=/);
      expect(svg).not.toMatch(/<script\b|<foreignObject\b|<image\b|href=/i);
    }
  });
});
