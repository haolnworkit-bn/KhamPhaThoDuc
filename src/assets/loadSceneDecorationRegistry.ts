import { SceneDecorationRegistry } from './SceneDecorationRegistry';
import type { AssetRegistry } from './AssetRegistry';
import type { SceneDecorationManifest } from './sceneDecorationTypes';

/** Loads visual-only scene decoration metadata from the Vite public base. */
export async function loadSceneDecorationRegistry(assetRegistry: AssetRegistry): Promise<SceneDecorationRegistry> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/scene-decorations.json`);
  if (!response.ok) throw new Error(`Unable to load scene decorations (${response.status}).`);
  return new SceneDecorationRegistry(await response.json() as SceneDecorationManifest, assetRegistry.manifest);
}
