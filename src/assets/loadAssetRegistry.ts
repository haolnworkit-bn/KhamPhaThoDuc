import { AssetRegistry } from './AssetRegistry';
import type { AssetManifest, HeritageVisual } from './types';

async function loadJson(url: string, fetcher: typeof fetch): Promise<unknown> {
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`Unable to load visual metadata (${response.status}).`);
  return response.json();
}

/** Loads and validates declarative visual metadata from the Vite public base. */
export async function loadAssetRegistry(fetcher: typeof fetch = fetch): Promise<AssetRegistry> {
  const baseUrl = import.meta.env.BASE_URL;
  const [manifest, heritageVisuals] = await Promise.all([
    loadJson(`${baseUrl}data/asset-manifest.json`, fetcher),
    loadJson(`${baseUrl}data/heritage-visuals.json`, fetcher),
  ]);
  return new AssetRegistry(manifest as AssetManifest, heritageVisuals as HeritageVisual[]);
}
