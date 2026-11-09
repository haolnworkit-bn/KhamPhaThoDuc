# Sprint 03C.3 — Original SVG character animation

## Deliverable
An original fictional chibi protagonist in four directions, with idle and alternating walking poses. The **single SVG texture sheet** `public/assets/characters/player-chibi-v1.svg` has 12 cells across a 576×60 canvas, each 48×60 pixels:

| Row order | Frame 0 | Frame 1 | Frame 2 |
|---|---|---|---|
| down (x 0–143) | down idle | down walk A | down walk B |
| left (x 144–287) | left idle | left walk A | left walk B |
| right (x 288–431) | right idle | right walk A | right walk B |
| up (x 432–575) | up idle | up walk A | up walk B |

This sheet is registered as a single `image` visual asset, not as a Phaser native spritesheet: Phaser's `this.load.svg()` rasterizes the SVG and `Texture.add()` explicitly slices its 12 frames. The existing `player-<direction>-walk` animation names and original movement state machine remain in place. The procedural renderer remains as a graceful fallback if loading fails.

## Visual identity and guardrails
- Original drawing created for KhamPhaThoDuc; not derived from or copied from Chùa Online.
- Clothing is fictional, not a claim about attire of 1077.
- Keeps existing collision, camera, world coordinates, save and quest logic unchanged.
- Supports present and interpretive 1077 using the same game protagonist (not a claimed historical person).

## Validation required before merge
- `npm run check` and `npm run test:e2e` on a local checkout.
- View the character standing and walking up/down/left/right, including repeated era transitions.
- Verify when the SVG is unavailable, procedural textures and animations are still usable.
- Confirm E2E screenshot hash stability after switching eras 12 times.
- Review rendering at desktop zoom 1.05 and mobile zoom 0.82.
- Merge only after parent PR #6 and its parent #5 have been accepted; retarget the stacked PR to main.

Tests added: `tests/unit/ChibiSpriteAssets.test.ts` and a browser fallback case in `tests/e2e/game.spec.ts`.

No browser execution is claimed in this document; the connected GitHub reader has validated file presence and the commits only.
