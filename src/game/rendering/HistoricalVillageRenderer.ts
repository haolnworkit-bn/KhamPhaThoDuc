import Phaser from 'phaser';
import type { AssetRegistry } from '../../assets/AssetRegistry';
import type { GeographicMap } from '../../shared/types/content';

/**
 * Interpretive rural tableau for the 1077 playable demo.
 * NOT a survey, period street network, cadastral map, or architectural reconstruction.
 * Fixed decoration offsets are relative to a contemporary heritage reference point.
 * All objects remain presentation-only; NavigationService remains authoritative.
 */
export function renderHistoricalVillage(
  scene: Phaser.Scene,
  layer: Phaser.GameObjects.Container,
  map: GeographicMap,
  registry: AssetRegistry,
): void {
  const center = map.heritage.find(p => p.id === 'dinh_tho_duc')?.world;
  if (!center) return;
  const { x, y } = center;

  const landscape = scene.add.graphics();
  landscape.fillStyle(0xa6a06c, .7).fillEllipse(x - 85, y - 45, 480, 275);
  landscape.fillStyle(0x81875f, .36).fillEllipse(x + 135, y + 215, 500, 250);
  landscape.fillStyle(0xc6ba88, .75).fillEllipse(x + 34, y + 68, 300, 165);
  // Decorative footpath only, never a historically attested road or collision line.
  landscape.lineStyle(26, 0x8b7857, .67);
  landscape.beginPath().moveTo(x - 44, y + 40).lineTo(x + 40, y + 115).lineTo(x + 58, y + 220).strokePath();
  landscape.lineStyle(19, 0xd5bf89, .88);
  landscape.beginPath().moveTo(x - 44, y + 40).lineTo(x + 40, y + 115).lineTo(x + 58, y + 220).strokePath();
  layer.add(landscape);

  const ornaments: Array<[string, number, number, number]> = [
    ['house-ly1077-v1', x - 125, y - 12, .83],
    ['house-ly1077-v1', x + 126, y + 6, .72],
    ['rice-field-ly1077-v1', x - 248, y + 230, .78],
    ['rice-field-ly1077-v1', x + 228, y + 210, .86],
  ];
  ornaments.forEach(([assetId, px, py, scale]) => {
    const asset = registry.get(assetId);
    if (!asset || !asset.eras.includes('ly_1077') || !scene.textures.exists(asset.id)) return;
    layer.add(scene.add.image(px, py, asset.id)
      .setOrigin(asset.anchor.x, asset.anchor.y).setScale(scale).setDepth(py));
  });

  // Three generic agricultural tools/stack silhouettes; no claims of specific 1077 artifacts.
  const objects = scene.add.graphics();
  for (const [ox, oy] of [[x - 203, y + 118], [x + 195, y + 105], [x + 120, y + 267]]) {
    objects.fillStyle(0x776748, .2).fillEllipse(ox + 5, oy + 17, 55, 15);
    objects.fillStyle(0x9a8252).fillEllipse(ox, oy, 36, 34);
    objects.fillStyle(0xc1a46c).fillTriangle(ox - 17, oy + 9, ox, oy - 30, ox + 17, oy + 9);
    objects.lineStyle(2, 0x7b684b, .65).lineBetween(ox - 20, oy + 11, ox + 20, oy + 11);
  }
  // Bamboo-like clusters enhance time-period silhouette without locating a real historic grove.
  for (const [ox, oy] of [[x - 283, y + 37], [x + 280, y + 54]]) {
    for (let i = 0; i < 4; i++) {
      const bx = ox + (i - 1.5) * 12;
      const top = oy - 78 - (i % 2) * 15;
      objects.lineStyle(5, 0x63734c).lineBetween(bx, oy, bx + 7, top);
      objects.lineStyle(1.5, 0x9da96e).lineBetween(bx + 2, oy - 32, bx + 5, top + 12);
      objects.fillStyle(0x4d6946, .85).fillEllipse(bx - 18, top + 7, 41, 10);
      objects.fillEllipse(bx + 24, top + 17, 42, 10);
    }
  }
  layer.add(objects);
  layer.add(scene.add.text(x, y - 167, 'LÀNG QUÊ THỜI LÝ · DIỄN GIẢI', {
    fontFamily: '"Be Vietnam Pro", sans-serif',
    fontSize: '13px', color: '#453b2c', backgroundColor: '#ead9b0',
    padding: { x: 10, y: 6 },
  }).setOrigin(.5).setDepth(y + 1));
}
