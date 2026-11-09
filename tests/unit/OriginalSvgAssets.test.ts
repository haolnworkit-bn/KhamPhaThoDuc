import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import manifestJson from '../../public/data/asset-manifest.json';
import { AssetRegistry } from '../../src/assets/AssetRegistry';
import { validateAssetManifest } from '../../src/assets/AssetValidator';
import type { AssetManifest } from '../../src/assets/types';

const manifest = manifestJson as AssetManifest;
const filenames = [
  'assets/environment/tree-v1.svg',
  'assets/environment/house-v1.svg',
  'assets/heritage/dinh-tho-duc-v1.svg',
];

describe('Sprint 03C.2 original SVG artwork', () => {
  it('has a valid manifest with unique image identifiers', () => {
    expect(validateAssetManifest(manifest)).toEqual([]);
    const entries = manifest.assets.filter((asset) => filenames.includes(asset.path ?? ''));
    expect(entries).toHaveLength(3);
    expect(new Set(entries.map((asset) => asset.id)).size).toBe(3);
    expect(entries.every((asset) => asset.kind === 'image' && asset.eras.length === 1 && asset.eras[0] === 'present')).toBe(true);
  });

  it.each(filenames)('ships a local valid-looking transparent SVG: %s', (filename) => {
    const file = fileURLToPath(new URL(`../../public/${filename}`, import.meta.url));
    const svg = readFileSync(file, 'utf8');
    expect(svg).toMatch(/<svg\b[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).toMatch(/viewBox="0 0 \d+ \d+"/);
    expect(svg).toContain('</svg>');
    expect(svg).not.toMatch(/<image\b|<script\b|https?:\/\/(?!www\.w3\.org\/2000\/svg)/);
  });

  it('resolves stable Vite base-path URLs for real assets', () => {
    const entry = manifest.assets.find((asset) => asset.id === 'tree-v1');
    expect(entry).toBeDefined();
    expect(AssetRegistry.assetUrl(entry!, '/ThoDucQueToi/')).toBe('/ThoDucQueToi/assets/environment/tree-v1.svg');
  });
});
