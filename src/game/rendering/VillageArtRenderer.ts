import Phaser from 'phaser';
import type { AssetRegistry } from '../../assets/AssetRegistry';
import type { SceneDecorationRegistry } from '../../assets/SceneDecorationRegistry';
import type { EraId, GeographicMap } from '../../shared/types/content';

/** Procedural, original placeholder art; replaceable without changing geographic data. */
export function renderVillageArt(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, map: GeographicMap, era: EraId, registry: AssetRegistry, sceneDecorations: SceneDecorationRegistry | null): void {
  const historical = era === 'ly_1077';
  const dinh = map.heritage.find((place) => place.id === 'dinh_tho_duc')!.world;
  const texture = scene.add.graphics().lineStyle(2, historical ? 0x776b48 : 0x6b8b54, .18);
  for (let y = 180; y < map.projection.world.height; y += 95) texture.lineBetween(40, y, map.projection.world.width - 40, y + 26);
  layer.add(texture);
  if (historical) {
    [
      [dinh.x - 105, dinh.y - 80], [dinh.x + 110, dinh.y - 120], [dinh.x + 145, dinh.y + 90],
    ].forEach(([x, y]) => layer.add(scene.add.ellipse(x, y, 150, 85, 0x7a8759, .32).setDepth(y)));
    return;
  }
  const communalHouse = registry.getHeritage('dinh_tho_duc', era);
  if (communalHouse) drawCommunalHouse(scene, layer, dinh.x + communalHouse.offset.x, dinh.y + communalHouse.offset.y);
  sceneDecorations?.resolve(map, era).forEach((decoration) => {
    if (decoration.assetId === 'tree-procedural') drawTree(scene, layer, decoration.world.x, decoration.world.y, decoration.scale, decoration.depthOffset);
    if (decoration.assetId === 'house-procedural') drawHouse(scene, layer, decoration.world.x, decoration.world.y, decoration.scale, decoration.depthOffset);
  });
}

function drawTree(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, x: number, y: number, scale = 1, depthOffset = 0): void {
  const tree = scene.add.container(x, y).setDepth(y + 8 + depthOffset).setScale(scale);
  tree.add([scene.add.ellipse(4, 19, 42, 14, 0x294c38, .22), scene.add.rectangle(0, 5, 10, 25, 0x744e32), scene.add.circle(-8, -10, 24, 0x2f7049), scene.add.circle(10, -8, 22, 0x376f46), scene.add.circle(1, -25, 20, 0x4d8c54)]);
  layer.add(tree);
}

function drawHouse(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, x: number, y: number, scale = 1, depthOffset = 0): void {
  const house = scene.add.container(x, y).setDepth(y + depthOffset).setScale(scale);
  house.add([scene.add.ellipse(5, 21, 82, 18, 0x273e30, .2), scene.add.rectangle(0, 0, 62, 35, 0xd6ba8b), scene.add.triangle(0, -26, -42, 0, 42, 0, 0, -27, 0xaa493b), scene.add.rectangle(0, 10, 13, 22, 0x69452f)]);
  layer.add(house);
}

function drawCommunalHouse(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, x: number, y: number): void {
  const landmark = scene.add.container(x, y).setDepth(y);
  landmark.add([
    scene.add.ellipse(5, 54, 220, 38, 0x273e30, .22),
    scene.add.rectangle(0, 24, 155, 55, 0xdabf8b),
    scene.add.rectangle(0, 31, 32, 37, 0x6b4430),
    scene.add.triangle(0, -30, -112, 16, 112, 16, 0, -44, 0x9f3f36).setStrokeStyle(4, 0x71372f),
    scene.add.rectangle(0, -7, 190, 13, 0xc35e46),
    scene.add.text(0, 69, 'ĐÌNH THỌ ĐỨC · MINH HỌA', { fontFamily: '"Be Vietnam Pro", sans-serif', fontSize: '11px', color: '#fff7e5', backgroundColor: '#714232', padding: { x: 5, y: 3 } }).setOrigin(.5),
  ]);
  layer.add(landmark);
}
