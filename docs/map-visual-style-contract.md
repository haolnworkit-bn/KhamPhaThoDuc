# Sprint 03B – Map Visual Style Registry v1

Baseline: `haolnworkit-bn/KhamPhaThoDuc` `main@008d343f47df`.

## What this adds

- A declarative visual style catalog for the **existing** OpenStreetMap-derived features.
- A pure TypeScript mapping from (layer, kind, era) to visual style.
- Deterministic per-feature variant indexes using layer + source index + geometry. Generated map data repeats some OSM feature IDs, so ID-only hashing would be unreliable.
- Strict historical safeguards: the year 1077 must never render modern buildings, land use, or roads as verified historical features; river/ditch can appear only as explicitly labelled contemporary reference.
- No change to map projection, geography, heritage coordinates, collision, navigation, save game, or game state.

This module is a rendering contract; it does **not** generate new scenery or claim authenticity. The source map remains `public/data/geographic-map.json`.

## Files

- `src/assets/mapVisualTypes.ts`
- `src/assets/validateMapVisualStyles.ts`
- `src/assets/MapVisualStyleRegistry.ts`
- `public/data/map-visual-styles.json`
- `tests/unit/MapVisualStyleRegistry.test.ts`

## Codex integration scope

Codex owns the Phaser renderer, `VillageScene.ts`, app bootstrap and browser tests. Load the JSON with `${import.meta.env.BASE_URL}data/map-visual-styles.json`, construct `new MapVisualStyleRegistry(manifest)`, and pass it to the renderer.

Replace **only** style choices for the existing roads, paths, water, land-use and building polygons, not the source geometry itself. Use `registry.resolve(map, era)` as the data input. A style's `width` is a line width in world pixels and `color` is a CSS #RRGGBB token to convert into Phaser color. `variant` is a deterministic integer [0, variants) suitable for optional lightweight shade variation, not a new location. Keep OSM attribution and current legend. Preserve the current 1077 interpretation disclaimer.

Do not render the same features twice (old layer drawing + registry-based layer drawing). Keep map obstacle geometry/collision unchanged. Verify desktop/mobile readability, period switching and performance. Run typecheck, lint, Vitest, build and E2E; record actual outcomes. User controls commit/push/merge.
