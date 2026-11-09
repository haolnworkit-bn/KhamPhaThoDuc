import Phaser from 'phaser';
import type { AssetRegistry } from '../../assets/AssetRegistry';
import type { SceneDecorationRegistry } from '../../assets/SceneDecorationRegistry';
import type { EraId, GeographicMap } from '../../shared/types/content';

/**
 * Original, stylized 2.5D village illustrations.
 * These are scene-only illustrations, not verified architecture or collision geometry.
 * Positions remain anchored to the existing heritage and decoration registries.
 */
export function renderVillageArt(
  scene: Phaser.Scene,
  layer: Phaser.GameObjects.Container,
  map: GeographicMap,
  era: EraId,
  registry: AssetRegistry,
  sceneDecorations: SceneDecorationRegistry | null,
): void {
  const historical = era === 'ly_1077';
  const dinh = map.heritage.find((place) => place.id === 'dinh_tho_duc')!.world;
  const texture = scene.add.graphics().lineStyle(2, historical ? 0x776b48 : 0x6b8b54, .12);
  for (let y = 180; y < map.projection.world.height; y += 95) {
    texture.lineBetween(40, y, map.projection.world.width - 40, y + 26);
  }
  layer.add(texture);

  if (historical) {
    // Deliberately abstract. Modern scenery is never shown as authentic 1077 architecture.
    [
      [dinh.x - 105, dinh.y - 80],
      [dinh.x + 110, dinh.y - 120],
      [dinh.x + 145, dinh.y + 90],
    ].forEach(([x, y]) => layer.add(scene.add.ellipse(x, y, 150, 85, 0x7a8759, .32).setDepth(y)));
    return;
  }

  const communalHouse = registry.getHeritage('dinh_tho_duc', era);
  if (communalHouse) {
    drawCommunalHouse(scene, layer, dinh.x + communalHouse.offset.x, dinh.y + communalHouse.offset.y);
  }
  sceneDecorations?.resolve(map, era).forEach((decoration) => {
    if (decoration.assetId === 'tree-procedural') {
      drawTree(scene, layer, decoration.world.x, decoration.world.y, decoration.scale, decoration.depthOffset);
    }
    if (decoration.assetId === 'house-procedural') {
      drawHouse(scene, layer, decoration.world.x, decoration.world.y, decoration.scale, decoration.depthOffset);
    }
  });
}

/** Soft clustered canopies and an offset shadow give a miniature-world silhouette. */
function drawTree(
  scene: Phaser.Scene,
  layer: Phaser.GameObjects.Container,
  x: number,
  y: number,
  scale = 1,
  depthOffset = 0,
): void {
  const tree = scene.add.container(x, y).setDepth(y + 8 + depthOffset).setScale(scale);
  tree.add([
    scene.add.ellipse(8, 17, 66, 22, 0x172e23, .19),
    scene.add.ellipse(0, 4, 20, 14, 0x3e2a22, .22),
    scene.add.rectangle(0, -20, 14, 59, 0x75513a).setStrokeStyle(2, 0x4b342b),
    scene.add.ellipse(-17, -45, 57, 49, 0x244c35),
    scene.add.ellipse(22, -48, 61, 49, 0x2f6944),
    scene.add.ellipse(-3, -68, 66, 58, 0x3e8151),
    scene.add.ellipse(7, -82, 34, 24, 0x65a466, .7),
    scene.add.ellipse(-25, -60, 19, 13, 0x79ad75, .52),
    scene.add.ellipse(22, -73, 23, 12, 0x77b072, .4),
  ]);
  layer.add(tree);
}

/** Stylized fictional contemporary house, not an OSM footprint. */
function drawHouse(
  scene: Phaser.Scene,
  layer: Phaser.GameObjects.Container,
  x: number,
  y: number,
  scale = 1,
  depthOffset = 0,
): void {
  const house = scene.add.container(x, y).setDepth(y + depthOffset).setScale(scale);
  house.add([
    scene.add.ellipse(8, 19, 110, 27, 0x203326, .19),
    scene.add.rectangle(0, -1, 76, 46, 0xe4c99d).setStrokeStyle(2, 0xa78768),
    scene.add.rectangle(-17, -5, 13, 17, 0x5c766a).setStrokeStyle(3, 0x765b44),
    scene.add.rectangle(19, 7, 17, 28, 0x76523c),
    scene.add.triangle(0, -37, -53, 18, 53, 18, 0, -30, 0x783b32).setStrokeStyle(3, 0x542b29),
    scene.add.rectangle(0, -19, 102, 7, 0xae5843),
    scene.add.triangle(0, -45, -35, 16, 35, 16, 0, -19, 0xaf5541),
    scene.add.rectangle(0, -23, 68, 5, 0x6f342b),
  ]);
  layer.add(house);
}

function drawLantern(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, x: number, y: number): void {
  parent.add([
    scene.add.ellipse(x, y + 4, 22, 29, 0xf4ad45, .19),
    scene.add.line(x, y - 21, 0, 0, 0, 15, 0x6b4834).setLineWidth(2),
    scene.add.ellipse(x, y, 13, 19, 0xd9553d).setStrokeStyle(2, 0x8d372c),
    scene.add.ellipse(x - 3, y - 2, 4, 12, 0xffc96a, .86),
    scene.add.rectangle(x, y - 10, 9, 4, 0x63412d),
    scene.add.rectangle(x, y + 11, 8, 3, 0x63412d),
  ]);
}

function drawCommunalHouse(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, x: number, y: number): void {
  const landmark = scene.add.container(x, y).setDepth(y);
  // This intentionally remains an illustrative courtyard. Neither the roof nor walls
  // are presented as a surveyed depiction of Đình Thọ Đức.
  const courtyard = scene.add.graphics();
  courtyard.fillStyle(0x294335, .18).fillEllipse(13, 91, 370, 85);
  courtyard.fillStyle(0x819677, 1).fillRoundedRect(-188, 39, 377, 127, 20);
  courtyard.fillStyle(0xb2a78c, 1).fillRoundedRect(-167, 44, 337, 116, 10);
  courtyard.fillStyle(0xd6c6a5, 1).fillRoundedRect(-157, 51, 317, 102, 8);
  courtyard.lineStyle(1, 0xb9a785, .58);
  for (let row = 0; row < 6; row++) {
    courtyard.lineBetween(-149, 60 + row * 17, 151, 60 + row * 17);
  }
  for (let col = 0; col < 13; col++) {
    const px = -147 + col * 25;
    courtyard.lineBetween(px, 60, px - 12, 152);
  }

  // Main platform, pillars and three overlapping roof tiers produce an architectural
  // focal point without claiming historically accurate dimensions or details.
  const roof = scene.add.graphics();
  roof.fillStyle(0x394334, .23).fillEllipse(13, 47, 274, 34);
  roof.fillStyle(0x997652).fillRoundedRect(-117, -14, 240, 79, 6);
  roof.fillStyle(0xf1d9ae).fillRoundedRect(-109, -29, 222, 72, 4);
  roof.fillStyle(0x684433).fillRect(-105, -26, 10, 77);
  roof.fillStyle(0x684433).fillRect(-51, -26, 10, 77);
  roof.fillStyle(0x684433).fillRect(43, -26, 10, 77);
  roof.fillStyle(0x684433).fillRect(99, -26, 10, 77);
  roof.fillStyle(0x6d4933).fillRect(-37, 0, 78, 41);
  roof.fillStyle(0x2c5146).fillRect(-27, 4, 58, 30);
  roof.lineStyle(2, 0xd4ad73, .8).strokeRect(-25, 6, 54, 26);

  const roofOutline = scene.add.graphics();
  roofOutline.fillStyle(0x5a2926).fillTriangle(-160, -44, 0, -125, 161, -44);
  roofOutline.fillStyle(0x9e4336).fillTriangle(-151, -51, 0, -120, 151, -51);
  roofOutline.fillStyle(0xc16b48).fillTriangle(-110, -65, 0, -111, 111, -65);
  roofOutline.lineStyle(6, 0x60302b).lineBetween(-163, -44, 163, -44);
  roofOutline.lineStyle(3, 0xdca06a).lineBetween(-140, -54, 140, -54);
  roofOutline.fillStyle(0x54312b).fillEllipse(0, -126, 24, 10);
  roofOutline.fillStyle(0xd19a4f).fillCircle(0, -132, 7);
  roofOutline.lineStyle(3, 0x6d342c);
  roofOutline.beginPath().moveTo(-161, -44).lineTo(-176, -58).strokePath();
  roofOutline.beginPath().moveTo(161, -44).lineTo(176, -58).strokePath();

  const entrance = scene.add.graphics();
  entrance.fillStyle(0x846747).fillRoundedRect(-40, 48, 83, 12, 3);
  entrance.fillStyle(0xad8a60).fillRoundedRect(-46, 61, 95, 10, 3);
  entrance.fillStyle(0xd8b78d).fillRoundedRect(-50, 72, 103, 11, 3);
  // Courtyard planters and stone lanterns are decorative, not geographic objects.
  for (const sign of [-1, 1]) {
    const side = sign * 132;
    entrance.fillStyle(0x6d6c56).fillRoundedRect(side - 15, 16, 30, 14, 3);
    entrance.fillStyle(0x466c43).fillEllipse(side, 10, 42, 25);
    entrance.fillStyle(0x6f9853).fillEllipse(side - 5, 3, 29, 18);
    entrance.fillStyle(0xdcc8a0).fillRoundedRect(sign * 149 - 6, 106, 12, 24, 2);
    entrance.fillStyle(0x775b42).fillTriangle(sign * 149 - 11, 106, sign * 149, 95, sign * 149 + 11, 106);
  }

  // Original courtyard gardens. Decorative elements are local illustration only,
  // anchored to the existing heritage marker; they never become OSM map features.
  const garden = scene.add.graphics();
  for (const side of [-1, 1]) {
    const center = side * 123;
    garden.fillStyle(0x52684b).fillEllipse(center, 129, 61, 23);
    garden.fillStyle(0x324f3c).fillEllipse(center, 125, 59, 17);
    for (let i = 0; i < 7; i++) {
      const px = center - 23 + i * 8;
      const py = 125 + (i % 3) * 3;
      garden.fillStyle(i % 2 === 0 ? 0xf4d390 : 0xda8c9b).fillCircle(px, py, 3.1);
      garden.fillStyle(0x7aab69).fillEllipse(px + 3, py + 4, 8, 4);
    }
  }
  // Sparse stone steps clarify the visual route toward the courtyard.
  for (let i = 0; i < 3; i++) {
    const w = 28 + i * 4;
    garden.fillStyle(i % 2 === 0 ? 0xe6d5b4 : 0xd9c4a0).fillRoundedRect(-w / 2, 91 + i * 21, w, 12, 5);
    garden.lineStyle(1, 0xb59d78, 0.7).strokeRoundedRect(-w / 2, 91 + i * 21, w, 12, 5);
  }
  // Stylized ceremonial banners: this is atmosphere, not an assertion of period use.
  for (const side of [-1, 1]) {
    const pole = side * 181;
    garden.lineStyle(4, 0x75513b).lineBetween(pole, -37, pole, 64);
    garden.fillStyle(0xb34d3b).fillTriangle(pole, -43, pole + side * 27, -33, pole, -18);
    garden.fillStyle(0xe2bb6b).fillCircle(pole, -47, 5);
  }

  const nameplate = scene.add.text(0, -28, 'ĐÌNH THỌ ĐỨC', {
    fontFamily: '"Be Vietnam Pro", sans-serif',
    fontSize: '14px',
    color: '#f9ecd3',
    backgroundColor: '#624132',
    fontStyle: 'bold',
    padding: { x: 10, y: 5 },
  }).setOrigin(.5);
  const disclaimer = scene.add.text(0, 171, 'KHÔNG GIAN MINH HỌA · CHƯA KHẢO SÁT', {
    fontFamily: '"Be Vietnam Pro", sans-serif',
    fontSize: '10px',
    color: '#284936',
    backgroundColor: '#fff3d5',
    padding: { x: 7, y: 4 },
  }).setOrigin(.5);

  landmark.add([courtyard, roof, roofOutline, entrance, garden]);
  for (const lx of [-112, -71, 73, 114]) drawLantern(scene, landmark, lx, -14);
  landmark.add([nameplate, disclaimer]);
  layer.add(landmark);
}
