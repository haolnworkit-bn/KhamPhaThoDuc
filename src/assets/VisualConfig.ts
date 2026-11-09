/** Color and layering tokens, not geographic data or collision geometry. */
export const VISUAL_CONFIG = {
  colors: {
    foliageDark: 0x496e48,
    foliageLight: 0xa4b97b,
    earth: 0xc6a77d,
    roofTile: 0xa34d3f,
    parchment: 0xd9c497,
    water: 0x477d87,
  },
  depth: {
    /** Applied to sortable objects using their world-space foot position. */
    footOffset: 0,
    shadowsOffset: -1,
    foregroundOffset: 2,
  },
  player: { width: 36, height: 44, anchor: { x: 0.5, y: 1 } },
} as const;
