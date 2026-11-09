# Visual Asset Foundation v1 — integration contract

Baseline: `haolnworkit-bn/KhamPhaThoDuc`, `main@b62ee197307c`.

## Intent

This package is **data infrastructure** only. It does not replace the Phaser renderer, alter map coordinates, create physical textures, or claim any reconstruction is authentic.

- `src/assets/types.ts`: manifest/animation/heritage visual contracts.
- `src/assets/AssetRegistry.ts`: pure lookup and era filtering.
- `src/assets/AssetValidator.ts`: runtime data validation, with actionable error messages.
- `src/assets/VisualConfig.ts`: stylistic tokens, not spatial geometry.
- `public/data/*.json`: declarative metadata (currently all procedural placeholders).
- `tests/unit/AssetRegistry.test.ts`: Vitest tests.

## Codex integration instructions

1. Copy files into the repository **without modifying existing files**.
2. Run `npm run typecheck && npm run lint && npm run test && npm run build`.
3. Once tests pass, integrate as a *separate task* in `VillageArtRenderer.ts` and `VillageScene.ts` (owned by Codex).
4. Fetch `asset-manifest.json` and `heritage-visuals.json` using `${import.meta.env.BASE_URL}data/...`; instantiate `new AssetRegistry(manifest, heritageVisuals)`.
5. Use `registry.getHeritage(id, era)` to decide which illustrated heritage visuals are allowed. **Do not render modern structures as authentic 1077 reconstructions**.
6. For image/spritesheet assets added later, call `AssetRegistry.assetUrl(asset, import.meta.env.BASE_URL)` and load through Phaser Loader. Procedural placeholders have `path === undefined` and must keep existing programmatic drawing.
7. Use `visual.offset` only for image placement, never as collision or geographic location data. All geographic positions still come from `map.heritage`.
8. Animation array intentionally empty: current player is procedural; populate animations only when actual spritesheets exist. Do **not** pretend static texture swaps are multi-frame walking animations.

Do not commit/push/merge automatically. User controls Git actions.

## Checks not performed in this handoff

This isolated package can be statically checked, but full app typecheck, lint, Vitest, build and browser QA require installing the complete repository dependencies. No such results are claimed here.
