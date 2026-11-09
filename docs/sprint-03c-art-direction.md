# Sprint 03C — Art Direction & Asset Production Specification

Status: **design ready; no runtime integration**. Owner: ChatGPT. Depends on Sprint 03B.2 (#1) acceptance before renderer changes. Tracking: #2.

## 1. Goal and visual language

A readable, warm, illustrative top-down / three-quarter 2D village, not photorealism and not a historical reconstruction. Visual treatment: clear rounded silhouettes, muted earth/leaf hues, minimal outline, restrained texture, and distinct interaction indicators. Maps and all geographic features remain authoritative only to their documented uncertainty.

- Present era: warm daylight, clean legibility and a restrained natural palette. Suggested art-direction tokens (not geographic claims): deep foliage `#2F7049`, mid foliage `#4D8C54`, roof red `#9F3F36`, clay `#B56555`, cream `#F7F0D5`, dark ink `#203F36`.
- 1077: earth/ochre/desaturated vegetation; purely *interpretive*. Do not reuse modern building silhouettes or heritage art as assertions of 1077 structures. Retain the in-game disclaimer.
- Target camera zoom: current `VillageScene` has 1.05 desktop / 0.82 mobile. Inspect at both, including mobile dialogue and minimap overlays.
- Prefer PNG/WebP transparency, stable visible foot position and painter's-order depth. No decorative illustration should create collision on its own.

## 2. Current baseline (verified from repo `main@152ddddd66fc`)

`public/data/asset-manifest.json` has seven procedural assets: `player-procedural`, `guide-procedural`, `tree-procedural`, `house-procedural`, `dinh-tho-duc-illustration`, `den-can-vang-marker`, `chua-thap-linh-marker`; animation list is empty. `public/data/scene-decorations.json` contains five trees + three houses anchored near Đình Thọ Đức, present-only. `public/data/heritage-visuals.json` contains one illustrated đình and two markers, all provisional.

The manifest contract `src/assets/types.ts` already supports `procedural | image | spritesheet`, `path`, per-era visibility, `anchor`, `depthOffset`, `frameWidth`, `frameHeight`, `frames`, `VisualAnimation`. Follow `docs/visual-asset-contract.md` and the existing validator. Do not prematurely change schemaVersion 1.

## 3. Production inventory and priority

| Priority | Asset / use | Proposed asset ID | Kind | Allowed eras | Rules |
|---|---|---|---|---|---|
| P0 | Player 4-direction idle/walk | `player-v1` | spritesheet | present, ly_1077 | Character design fictional; 4 facings; foot anchor x=0.5, y=1 |
| P1 | Guide NPC portrait/world sprite | `guide-v1` | image or spritesheet | present, ly_1077 | Clearly fictional guide; don't assign verified costume history |
| P1 | Interaction prompt indicator | `interact-indicator-v1` | image | present, ly_1077 | High contrast on both map palettes |
| P2 | Tree replacement | `tree-v1` | image | present | Replace only the existing five procedural decorations, do not invent tree locations |
| P2 | House replacement | `house-v1` | image | present | Replace only existing three procedural decorations; label as illustrative |
| P3 | Đình Thọ Đức illustration | `dinh-tho-duc-v1` | image | present | *Illustration*, provisional geography, do not claim architectural accuracy |
| P3 | Đền Can Vang marker | `den-can-vang-marker-v1` | image | present | Location marker only; no invented temple structure |
| P3 | Chùa Tháp Linh marker | `chua-thap-linh-marker-v1` | image | present | Location marker only; name equivalence remains unverified |
| P4 | Historical atmospheric scenery | TBD after content review | image | ly_1077 | Non-architectural interpretation only; no current-road/building leakage |

No binary assets or manifest substitutions are committed as part of this document. Proposed IDs are reserved names, not existing asset declarations.

## 4. Player spritesheet acceptance contract (P0)

Recommended **draft** production grid: 36 × 44 px cells, 8 columns × 4 rows = 32 frames (sheet 288 × 176 px), transparent background, no gutters. Each direction occupies one row; columns 0–3 are idle (subtle breathing/pose), columns 4–7 are walking phases. Row mapping: down, left, right, up. Keep anatomy, size, feet and palette consistent between cells. Align feet near the same baseline in each frame; no shadow beyond frame bounds. This mapping is a design proposal and only becomes runtime configuration after real exported assets are inspected.

| Facing | Idle frames | Walk frames |
|---|---|---|
| down | 0–3 | 4–7 |
| left | 8–11 | 12–15 |
| right | 16–19 | 20–23 |
| up | 24–27 | 28–31 |

Animation recommendations: idle at 3–5 fps loop; walk 7–9 fps loop. For static idle, a single frame is acceptable if the visual has no usable idle motion (then don't claim a multi-frame animation). Avoid per-direction hard-coded frame assumptions inside scene logic: resolve by asset manifest metadata once integrated.

Suggested file placement: `public/assets/characters/player-v1.png`. `asset-manifest.json` path must be relative to public root: `assets/characters/player-v1.png`. For actual image exports, verify dimensions and alpha rather than trusting a filename.

## 5. Heritage and era integrity

- `heritage-visuals.json` remains the only mapping of asset -> location; its offset is visual-only. Keep each `verificationStatus: provisional` pending corroborating evidence.
- `dinh_tho_duc` may receive a stylized drawing with prominent “Minh họa”; `den_can_vang` and `chua_thap_linh` remain location markers until trustworthy architectural material is sourced and rights cleared.
- “Chùa Thọ Đức” vs “Chùa Tháp Linh” equivalence requires verification; never silently convert to verified.
- 1077 shares the coordinate reference system, not proven historic geography. No present-day asset should be reused to imply authentic ancient buildings.
- Preserve attribution for OSM and independent assets. Each asset entry must record source, rights holder and applicable license terms accurately.

## 6. Engineering integration boundary (for later Codex or targeted implementation)

**After #1 passes**: add real files; create minimal manifest additions; add focused validator tests; update Phaser loader and texture usage in a small PR; retain procedural fallback until the rendering path has passed E2E. Avoid touching `data/raw/**`, `data/generated/**`, `public/data/geographic-map.json`, `NavigationService`, save schema or quest logic.

Checklist:
- [ ] Actual asset alpha and dimensions inspected, no clipped sprite frames
- [ ] Paths valid with Vite base `/ThoDucQueToi/`
- [ ] Animation frames valid for actual sheet and validator
- [ ] Correct facing for up/down/left/right; idle frame on movement stop
- [ ] Display readable at 0.82 mobile and 1.05 desktop zoom
- [ ] No new collision or phantom geographic structure
- [ ] History disclaimer and era restrictions unchanged
- [ ] Typecheck, lint, Vitest, build and browser E2E results recorded, not assumed
- [ ] Before/after screenshots and performance notes included
- [ ] User approves merge

## 7. Parallel workflow

ChatGPT may draft visual content and standalone asset metadata without touching the files Codex owns for #1. A later PR containing renderer integration must be based on the reviewed main after #1 to avoid merge conflicts. Do not auto-merge.
