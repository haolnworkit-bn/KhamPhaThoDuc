# Sprint 03C.2 — Real SVG Art Assets

## Scope

This branch builds on Sprint 03C.1 (PR #5). It adds **three real project-owned SVG illustrations** and integrates them into the existing Phaser scene without altering geography or gameplay.

| Asset ID | File | Role |
|---|---|---|
| `tree-v1` | `public/assets/environment/tree-v1.svg` | Five existing illustrated trees |
| `house-v1` | `public/assets/environment/house-v1.svg` | Three existing illustrated houses |
| `dinh-tho-duc-v1` | `public/assets/heritage/dinh-tho-duc-v1.svg` | Existing Đình Thọ Đức visual |

These are new original, stylized illustrations designed for this project, **not** copied from chuaonline.org or external artwork. The đình is an illustration only, not surveyed architecture or an authentic historical reconstruction. The other heritage locations remain location markers.

## Runtime behavior

- Three files are registered as `kind: "image"` in `public/data/asset-manifest.json`.
- `VillageScene.preload()` uses `AssetRegistry.assetUrl()` and `this.load.svg()` to load local textures under the Vite base path.
- `renderVillageArt()` uses the images when present and falls back to procedural visuals when loading fails.
- The decorative scene position still comes from `sceneDecorations.resolve(map, era)`; the đình still uses `registry.getHeritage()` with its existing offset.
- All added art is `present`-only. `ly_1077` keeps abstract interpretive scenery.
- No changes to quest, save, navigation, map geometry or provenance.

## Test plan

From `chatgpt/sprint-03c2-svg-art-assets`:

```bash
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
npm run dev
```

Manually inspect the first playable village scene on desktop and mobile; compare with PR #5 and confirm all three real SVG textures appear. On mobile verify label readability. Confirm player movement, NPC interaction, minimap and 12 era transitions still work. If an SVG fails, its procedural fallback should show without blocking gameplay. Save screenshots from both devices.

This environment has inspected the GitHub files and manifest but **has not executed** npm/Playwright or visually rendered Phaser. Do not merge without those checks. This is a stacked branch based on PR #5; after #5 merges, retarget the PR to `main` before final acceptance.
