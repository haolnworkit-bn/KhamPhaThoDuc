import { MapVisualStyleRegistry } from './MapVisualStyleRegistry';
import type { MapVisualStyleManifest } from './mapVisualTypes';

/** Loads map paint styles from the Vite public base without changing map geometry. */
export async function loadMapVisualStyleRegistry(): Promise<MapVisualStyleRegistry> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/map-visual-styles.json`);
  if (!response.ok) throw new Error(`Unable to load map visual styles (${response.status}).`);
  return new MapVisualStyleRegistry(await response.json() as MapVisualStyleManifest);
}
