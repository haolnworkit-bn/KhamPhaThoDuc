import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import manifestJson from '../../public/data/asset-manifest.json';
import { validateAssetManifest } from '../../src/assets/AssetValidator';
import type { AssetManifest } from '../../src/assets/types';

describe('Sprint 03C.3 chibi animation sheet', () => {
  const manifest = manifestJson as AssetManifest;
  it('registers a local SVG accessible in both game eras', () => {
    expect(validateAssetManifest(manifest)).toEqual([]);
    const asset = manifest.assets.find((entry) => entry.id === 'player-chibi-v1');
    expect(asset).toMatchObject({
      kind: 'image',
      path: 'assets/characters/player-chibi-v1.svg',
      category: 'character',
      eras: ['present', 'ly_1077'],
    });
  });
  it('contains exactly 12 arranged 48x60 artwork frames', () => {
    const file = fileURLToPath(new URL('../../public/assets/characters/player-chibi-v1.svg', import.meta.url));
    const svg = readFileSync(file, 'utf8');
    expect(svg).toContain('viewBox="0 0 576 60"');
    expect([...svg.matchAll(/<g transform="translate\((\d+) 0\)">/g)].map((match) => Number(match[1]))).toEqual(
      Array.from({ length: 12 }, (_, index) => index * 48),
    );
    expect(svg).not.toMatch(/<script\b|<image\b|href=/);
  });
});
