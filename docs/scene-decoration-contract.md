# Sprint 03B – Scene Decoration Registry v1

Baseline: `haolnworkit-bn/KhamPhaThoDuc`, `main@ea76bbc2d5de`.

## Purpose

Moves the current hard-coded 5 trees + 3 houses by Đình Thọ Đức out of `VillageArtRenderer.ts` into a declarative scene-decoration manifest. The manifest describes **visual positions only**. This module does not author geographic locations, actual building footprints, verified architecture, navigation, collision or authentic historical reconstruction.

## Added files

- `src/assets/sceneDecorationTypes.ts`: typed data contract.
- `src/assets/validateSceneDecorations.ts`: validation at JSON boundary; checks unique IDs, existing environment assets, plausible offsets and eras.
- `src/assets/SceneDecorationRegistry.ts`: resolves existing heritage coordinates + decorative offset per era.
- `public/data/scene-decorations.json`: matches the 8 existing procedural placements around Đình Thọ Đức.
- `tests/unit/SceneDecorationRegistry.test.ts`: Vitest coverage.

## Codex integration (separate task)

1. Keep ownership of `src/game/rendering/VillageArtRenderer.ts`, `VillageScene.ts`, `src/app/App.tsx`, and `src/assets/loadAssetRegistry.ts`. ChatGPT's package intentionally changes none of these.
2. Fetch `${import.meta.env.BASE_URL}data/scene-decorations.json`, validate through `new SceneDecorationRegistry(json, assetRegistry.manifest)`, and pass the registry into the existing Phaser render chain.
3. In the present-era renderer, replace the 8 hardcoded `drawTree`/`drawHouse` placements with `decorations.resolve(map, era)`. Call the existing drawing functions based on `assetId`, applying `world.x`, `world.y` and optional scale/depth where meaningful. Do not draw both old and new arrays.
4. Historical era returns no modern scenery. Keep the existing 1077 interpretive placeholder behavior and disclaimers intact.
5. Keep renderer fallback if the decoration manifest is unavailable only if the UX clearly reports its noncritical load failure; do not silently pretend data is valid.
6. Treat world positions as drawing-only: never insert them into `NavigationService` collision geometry, and never mutate the map heritage positions.
7. Verify no duplicate drawing, no NaN positions, no era leakage, and no save/quest regressions; run typecheck, lint, unit tests, build, E2E and capture desktop/mobile screenshots.
8. Do not commit, push, merge, create PR or change branch without user authorization.

## Note

For now, only the existing illustration area near Đình Thọ Đức is migrated. Do not fabricate real houses at the other locations. Their architecture and placement require evidence or explicit designation as fictional scenery.
