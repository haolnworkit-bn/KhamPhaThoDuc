import Phaser from 'phaser';
import type { EraId, MapFeature } from '../../shared/types/content';
import type { InteractionTarget } from '../../shared/events/GameEvents';
import type { GameSession } from '../../services/GameSession';
import { AssetRegistry } from '../../assets/AssetRegistry';
import type { SceneDecorationRegistry } from '../../assets/SceneDecorationRegistry';
import type { MapVisualStyleRegistry } from '../../assets/MapVisualStyleRegistry';
import type { MapVisualStyle } from '../../assets/mapVisualTypes';
import { NavigationService } from '../../services/NavigationService';
import { renderVillageArt } from '../rendering/VillageArtRenderer';

interface TargetPoint { x: number; y: number; target: InteractionTarget; visual?: Phaser.GameObjects.Container }

export class VillageScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  private vector = new Phaser.Math.Vector2();
  private touchVector = new Phaser.Math.Vector2();
  private pausedByUi = false;
  private nearest: TargetPoint | null = null;
  private targetPoints: TargetPoint[] = [];
  private eraLayer!: Phaser.GameObjects.Container;
  private navigation!: NavigationService;
  private unsubscribe: Array<() => void> = [];
  private lastPositionSave = 0;
  private renderedEra: EraId | null = null;
  private facing: 'up' | 'down' | 'left' | 'right' = 'down';

  constructor(private readonly session: GameSession, private readonly assetRegistry: AssetRegistry, private readonly sceneDecorations: SceneDecorationRegistry | null, private readonly mapVisualStyles: MapVisualStyleRegistry) { super('village'); }

  preload(): void {
    // Phaser rasterizes these project-owned SVG files once. Missing files degrade gracefully
    // to the existing procedural artwork inside VillageArtRenderer.
    for (const asset of this.assetRegistry.manifest.assets) {
      if (asset.kind !== 'image' || !asset.path?.endsWith('.svg')) continue;
      const url = AssetRegistry.assetUrl(asset, import.meta.env.BASE_URL);
      if (url && !this.textures.exists(asset.id)) this.load.svg(asset.id, url);
    }
  }

  create(): void {
    this.renderedEra = null;
    this.targetPoints = [];
    this.nearest = null;
    this.touchVector.set(0, 0);
    this.pausedByUi = false;
    this.lastPositionSave = 0;
    const { width, height } = this.session.content.map.projection.world;
    this.physics.world.setBounds(0, 0, width, height);
    this.cameras.main.setBounds(0, 0, width, height);
    this.createTextures();
    this.navigation = new NavigationService(this.session.content.map);
    this.eraLayer = this.add.container(0, 0).setDepth(-10);
    this.drawEnvironment();
    this.createTargets();

    const state = this.session.snapshot();
    const initialSheet = state.activeEra === 'ly_1077' && this.textures.exists('player-ly1077-v1')
      ? 'player-ly1077-v1'
      : this.textures.exists('player-chibi-v1') ? 'player-chibi-v1' : null;
    this.player = this.physics.add.sprite(
      state.player.x, state.player.y,
      initialSheet ?? 'player-down-idle',
      initialSheet ? 'down-idle' : undefined,
    );
    this.player.setCircle(15, 9, 26).setCollideWorldBounds(true).setDepth(state.player.y + 12);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(window.matchMedia('(max-width: 780px)').matches ? 0.82 : 1.05);

    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Không thể khởi tạo bàn phím.');
    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' }) as Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
    keyboard.on('keydown-E', () => this.interact());
    keyboard.on('keydown-SPACE', () => this.interact());
    keyboard.on('keydown-T', () => this.session.switchEra());

    this.unsubscribe.push(
      this.session.events.onCommand((command) => {
        if (command.type === 'move') this.touchVector.set(command.x, command.y);
        if (command.type === 'interact') this.interact();
        if (command.type === 'pause') this.pausedByUi = command.paused;
        if (command.type === 'switch-era') this.session.switchEra();
        if (command.type === 'reset-position') this.player.setPosition(this.session.content.map.interaction.spawn.x, this.session.content.map.interaction.spawn.y);
      }),
      this.session.events.on('state', () => this.drawEnvironment()),
    );
    // Phaser canvas exists during preload, but movement is not safe until create() finishes.
    // Expose a durable readiness signal for browser tests and accessibility tooling.
    this.game.canvas.dataset.gameReady = 'true';
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      delete this.game.canvas.dataset.gameReady;
      this.unsubscribe.splice(0).forEach((off) => off());
    });
  }

  update(time: number, delta: number): void {
    const speed = 230;
    this.vector.set(0, 0);
    if (!this.pausedByUi) {
      if (this.cursors.left.isDown || this.wasd.left.isDown) this.vector.x--;
      if (this.cursors.right.isDown || this.wasd.right.isDown) this.vector.x++;
      if (this.cursors.up.isDown || this.wasd.up.isDown) this.vector.y--;
      if (this.cursors.down.isDown || this.wasd.down.isDown) this.vector.y++;
      if (this.vector.lengthSq() === 0) this.vector.copy(this.touchVector);
    }
    if (this.vector.lengthSq() > 0) this.vector.normalize().scale(speed);
    if (this.vector.lengthSq() > 0) this.facing = Math.abs(this.vector.x) > Math.abs(this.vector.y) ? (this.vector.x < 0 ? 'left' : 'right') : (this.vector.y < 0 ? 'up' : 'down');
    this.player.setVelocity(0, 0).setDepth(this.player.y + 12);
    const activeEra = this.session.snapshot().activeEra;
    const historicalSheet = activeEra === 'ly_1077' && this.textures.exists('player-ly1077-v1');
    if (this.vector.lengthSq() > 0) {
      const animation = historicalSheet ? `player-ly1077-${this.facing}-walk` : `player-${this.facing}-walk`;
      if (this.player.anims.currentAnim?.key !== animation) this.player.play(animation);
    } else {
      this.player.anims.stop();
      const sheet = historicalSheet ? 'player-ly1077-v1' : 'player-chibi-v1';
      if (this.textures.exists(sheet)) this.player.setTexture(sheet, `${this.facing}-idle`);
      else this.player.setTexture(`player-${this.facing}-idle`);
    }
    const next = { x: this.player.x + this.vector.x * delta / 1000, y: this.player.y + this.vector.y * delta / 1000 };
    const era = this.session.snapshot().activeEra;
    if (this.vector.lengthSq() > 0 && this.navigation.canMove(this.player, next, era)) this.player.setPosition(next.x, next.y);
    this.updateNearestTarget();
    this.session.updatePlayer(this.player.x, this.player.y);
    if (time - this.lastPositionSave > 1500) { this.session.flushPlayerPosition(); this.lastPositionSave = time; }
  }

  private createTextures(): void {
    if (this.textures.exists('player-chibi-v1')) {
      // Twelve cells in one SVG texture: down, left, right, up; idle, walk-a, walk-b.
      // Existing physics and gameplay remain unchanged; only visual frame sources differ.
      const sheet = this.textures.get('player-chibi-v1');
      (['down', 'left', 'right', 'up'] as const).forEach((direction, row) => {
        (['idle', 'walk-a', 'walk-b'] as const).forEach((pose, column) => {
          const key = `${direction}-${pose}`;
          if (!sheet.has(key)) sheet.add(key, 0, (row * 3 + column) * 48, 0, 48, 60);
        });
        const animKey = `player-${direction}-walk`;
        if (!this.anims.exists(animKey)) {
          this.anims.create({
            key: animKey,
            frames: [
              { key: 'player-chibi-v1', frame: `${direction}-walk-a` },
              { key: 'player-chibi-v1', frame: `${direction}-walk-b` },
            ],
            frameRate: 7,
            repeat: -1,
          });
        }
      });
      if (this.textures.exists('player-ly1077-v1')) {
        const historySheet = this.textures.get('player-ly1077-v1');
        (['down', 'left', 'right', 'up'] as const).forEach((direction, row) => {
          (['idle', 'walk-a', 'walk-b'] as const).forEach((pose, column) => {
            const key = `${direction}-${pose}`;
            if (!historySheet.has(key)) historySheet.add(key, 0, (row * 3 + column) * 48, 0, 48, 60);
          });
          const key = `player-ly1077-${direction}-walk`;
          if (!this.anims.exists(key)) this.anims.create({
            key,
            frames: [
              { key: 'player-ly1077-v1', frame: `${direction}-walk-a` },
              { key: 'player-ly1077-v1', frame: `${direction}-walk-b` },
            ],
            frameRate: 7,
            repeat: -1,
          });
        });
      }
      return;
    }
    if (this.textures.exists('player-down-idle')) return;
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    // Same costume in each direction; feet and outline stay aligned between frames.
    // All art is original, fictional chibi illustration and does not claim historic dress.
    const drawFrame = (direction: 'up' | 'down' | 'left' | 'right', stride: number): void => {
      graphics.clear();
      const step = stride === 0 ? 0 : stride === 1 ? -3 : 3;
      graphics.fillStyle(0x192d28, 0.22).fillEllipse(24, 55, 30, 8);
      // Arms and alternating legs sit behind the tunic.
      graphics.fillStyle(0x594136).fillRoundedRect(16 + step, 45, 8, 12, 3);
      graphics.fillRoundedRect(26 - step, 45, 8, 12, 3);
      graphics.fillStyle(0x293f39).fillRoundedRect(14 + step, 53, 12, 5, 2);
      graphics.fillRoundedRect(25 - step, 53, 12, 5, 2);
      graphics.fillStyle(0xe2ad79).fillCircle(10, 35 - step / 2, 6);
      graphics.fillCircle(38, 35 + step / 2, 6);
      graphics.fillStyle(0x355f51).fillRoundedRect(10, 29, 28, 23, 8);
      graphics.fillStyle(0x5f9880).fillRoundedRect(14, 32, 20, 15, 6);
      graphics.fillStyle(0xd6b176).fillRect(22, 33, 4, 18);
      graphics.fillStyle(0x9e513e).fillRoundedRect(13, 48, 22, 5, 2);
      // Distinctive wide chibi head and dark hair fringe.
      graphics.fillStyle(0x49342c).fillEllipse(24, 17, 34, 30);
      graphics.fillStyle(0xf1bd86).fillEllipse(24, 20, 29, 25);
      graphics.fillStyle(0x4b342b).fillEllipse(24, 11, 33, 18);
      graphics.fillStyle(0x654334).fillEllipse(24, 7, 18, 8);
      if (direction === 'down') {
        graphics.fillStyle(0x322923).fillCircle(17, 23, 2.4);
        graphics.fillCircle(31, 23, 2.4);
        graphics.lineStyle(1.5, 0x9e624f).lineBetween(21, 29, 27, 29);
        graphics.fillStyle(0xdf8c79, 0.5).fillCircle(12, 27, 3.5);
        graphics.fillCircle(36, 27, 3.5);
      } else if (direction === 'up') {
        graphics.fillStyle(0x48332b).fillEllipse(24, 19, 28, 21);
        graphics.fillStyle(0x80604a).fillEllipse(24, 17, 16, 13);
      } else {
        const eye = direction === 'left' ? 16 : 32;
        graphics.fillStyle(0x362b26).fillCircle(eye, 23, 2.5);
        graphics.fillStyle(0xb16c51).fillCircle(direction === 'left' ? 10 : 38, 26, 2.5);
      }
    };
    (['down', 'left', 'right', 'up'] as const).forEach((direction) => {
      drawFrame(direction, 0);
      graphics.generateTexture(`player-${direction}-idle`, 48, 60);
      (['a', 'b'] as const).forEach((frame, index) => {
        drawFrame(direction, index + 1);
        graphics.generateTexture(`player-${direction}-walk-${frame}`, 48, 60);
      });
      this.anims.create({
        key: `player-${direction}-walk`,
        frames: [{ key: `player-${direction}-walk-a` }, { key: `player-${direction}-walk-b` }],
        frameRate: 7,
        repeat: -1,
      });
    });
    graphics.destroy();
  }

  private drawEnvironment(): void {
    if (!this.eraLayer) return;
    const era = this.session.snapshot().activeEra;
    if (era === this.renderedEra) return;
    this.eraLayer.removeAll(true);
    const historical = era === 'ly_1077';
    const { width, height } = this.session.content.map.projection.world;
    this.eraLayer.add(this.add.rectangle(width / 2, height / 2, width, height, historical ? 0xb8aa78 : 0xb9d49b));
    if (historical) this.drawHistoricalReconstruction(width, height);
    this.drawMapVisualLayers(era);
    renderVillageArt(this, this.eraLayer, this.session.content.map, era, this.assetRegistry, this.sceneDecorations);
    const label = this.add.text(95, 95, historical ? 'THỌ ĐỨC · TÁI HIỆN DIỄN GIẢI 1077' : 'THỌ ĐỨC · BẢN ĐỒ HIỆN TẠI', { fontFamily: '"Be Vietnam Pro", sans-serif', fontSize: '18px', color: historical ? '#493b2c' : '#173b33', fontStyle: 'bold' });
    const note = historical ? this.add.text(95, 124, 'Không hiển thị đường/công trình hiện đại · Thủy hệ chỉ là mốc tham chiếu hiện nay', { fontFamily: '"Be Vietnam Pro", sans-serif', fontSize: '13px', color: '#584a36', backgroundColor: '#e6d7a8', padding: { x: 8, y: 5 } }) : null;
    this.eraLayer.add(note ? [label, note] : label);
    this.renderedEra = era;
  }

  private drawMapVisualLayers(era: EraId): void {
    const groups = new Map<string, { style: MapVisualStyle; features: MapFeature[] }>();
    this.mapVisualStyles.resolve(this.session.content.map, era).forEach(({ style, feature }) => {
      const group = groups.get(style.id) ?? { style, features: [] };
      group.features.push(feature);
      groups.set(style.id, group);
    });
    groups.forEach(({ style, features }) => {
      const color = Number.parseInt(style.color.slice(1), 16);
      const outline = style.outlineColor ? Number.parseInt(style.outlineColor.slice(1), 16) : undefined;
      if (style.paint === 'line') this.drawLines(features, color, style.width!, outline, style.alpha);
      else this.drawPolygons(features, color, style.alpha, outline ?? color);
    });
  }

  private drawLines(features: MapFeature[], color: number, width: number, outline?: number, alpha = 1): void {
    const graphics = this.add.graphics().setAlpha(alpha);
    const draw = (stroke: number, lineWidth: number) => {
      graphics.lineStyle(lineWidth, stroke, 1);
      features.forEach(({ points }) => { if (points.length < 2) return; graphics.beginPath().moveTo(points[0].x, points[0].y); points.slice(1).forEach((p) => graphics.lineTo(p.x, p.y)); graphics.strokePath(); });
    };
    if (outline) draw(outline, width + 5);
    draw(color, width);
    this.eraLayer.add(graphics);
  }

  private drawHistoricalReconstruction(width: number, height: number): void {
    const shapes = [
      this.add.ellipse(width * .2, height * .28, 430, 260, 0x8f9564, .45),
      this.add.ellipse(width * .55, height * .64, 680, 390, 0x9c925f, .35),
      this.add.ellipse(width * .78, height * .24, 410, 300, 0x7e8e5b, .38),
    ];
    const texture = this.add.graphics().lineStyle(3, 0x746b48, .28);
    for (let y = 260; y < height; y += 170) texture.lineBetween(100, y, width - 100, y + 45);
    this.eraLayer.add([...shapes, texture]);
  }

  private drawPolygons(features: MapFeature[], color: number, alpha: number, stroke = color): void {
    const graphics = this.add.graphics().fillStyle(color, alpha).lineStyle(2, stroke, 0.8);
    features.forEach(({ points }) => { if (points.length < 3) return; graphics.beginPath().moveTo(points[0].x, points[0].y); points.slice(1).forEach((p) => graphics.lineTo(p.x, p.y)); graphics.closePath().fillPath().strokePath(); });
    this.eraLayer.add(graphics);
  }

  private createTargets(): void {
    const { guide, portal } = this.session.content.map.interaction;
    this.targetPoints.push({ ...guide, target: { type: 'guide' }, visual: this.createGuide(guide.x, guide.y) });
    this.session.locations.all().forEach((location) => this.targetPoints.push({ x: location.world.x, y: location.world.y, target: { type: 'location', location }, visual: this.createMarker(location.world.x, location.world.y, 0x9d4b55, location.id === 'dinh_tho_duc' ? 'ĐIỂM KÝ ỨC\nĐÌNH THỌ ĐỨC' : location.name.toUpperCase()) }));
    const portalVisual = this.createMarker(portal.x, portal.y, 0x644d82, 'CỔNG THỜI GIAN');
    this.targetPoints.push({ ...portal, target: { type: 'portal', unlocked: false }, visual: portalVisual });
  }

  private createGuide(x: number, y: number): Phaser.GameObjects.Container {
    // Fictional guide character: a readable world sprite, not a historical portrait.
    const guide = this.add.container(x, y).setDepth(y + 15);
    if (this.textures.exists('guide-v2')) {
      guide.add(this.add.image(0, 20, 'guide-v2').setOrigin(.5, 1).setScale(.57));
      guide.add(this.add.text(0, 30, 'NGƯỜI DẪN CHUYỆN', {
        fontFamily: '"Be Vietnam Pro", sans-serif',
        fontSize: '11px',
        color: '#173b33',
        backgroundColor: '#fff7e5',
        padding: { x: 5, y: 3 },
      }).setOrigin(.5));
      return guide;
    }
    const art = this.add.graphics();
    art.fillStyle(0x1f3529, .24).fillEllipse(2, 18, 43, 12);
    art.fillStyle(0x543c32).fillRoundedRect(-14, 5, 11, 17, 4);
    art.fillRoundedRect(5, 5, 11, 17, 4);
    art.fillStyle(0xe6b482).fillCircle(-21, -10, 6);
    art.fillCircle(21, -10, 6);
    art.fillStyle(0x81583e).fillRoundedRect(-21, -14, 42, 30, 10);
    art.fillStyle(0xd0a16d).fillRoundedRect(-14, -10, 28, 20, 6);
    art.fillStyle(0xf0be8d).fillEllipse(0, -29, 36, 31);
    art.fillStyle(0x493528).fillEllipse(0, -42, 43, 20);
    art.fillStyle(0x5f4631).fillRoundedRect(-25, -46, 50, 7, 3);
    art.fillStyle(0x332a25).fillCircle(-8, -28, 2.3);
    art.fillCircle(8, -28, 2.3);
    art.lineStyle(1.5, 0x945c48).lineBetween(-4, -22, 4, -22);
    const name = this.add.text(0, 30, 'NGƯỜI DẪN CHUYỆN', {
      fontFamily: '"Be Vietnam Pro", sans-serif',
      fontSize: '11px',
      color: '#173b33',
      backgroundColor: '#fff7e5',
      padding: { x: 5, y: 3 },
    }).setOrigin(.5);
    guide.add([art, name]);
    return guide;
  }

  private createMarker(x: number, y: number, color: number, text: string): Phaser.GameObjects.Container {
    // Consistent illustrative navigation symbols: no claim about a monument's architecture.
    const marker = this.add.container(x, y).setDepth(y + 14);
    const portal = text === 'CỔNG THỜI GIAN';
    const art = this.add.graphics();
    art.fillStyle(0x21382d, 0.20).fillEllipse(2, 19, 68, 20);
    art.fillStyle(0x9a8366).fillRoundedRect(-34, 13, 68, 8, 3);
    art.fillStyle(0xe5d1a5).fillRoundedRect(-31, 7, 62, 8, 3);
    if (portal) {
      art.fillStyle(0x4e355d).fillRoundedRect(-29, -42, 12, 53, 3);
      art.fillRoundedRect(17, -42, 12, 53, 3);
      art.fillStyle(0x7c5a8d).fillRoundedRect(-34, -49, 68, 13, 5);
      art.fillStyle(0xb99ccd).fillEllipse(0, -19, 32, 39);
      art.fillStyle(0x51355f).fillEllipse(0, -19, 24, 30);
      art.lineStyle(3, 0xd7b97a).strokeEllipse(0, -19, 24, 30);
      art.fillStyle(0xf0d4a0).fillCircle(0, -20, 6);
    } else {
      // Signpost and scroll icon; a heritage location marker, not a modeled building.
      art.fillStyle(0x654736).fillRoundedRect(-5, -29, 10, 42, 3);
      art.fillStyle(0x744937).fillRoundedRect(-29, -56, 58, 33, 7);
      art.fillStyle(0xf3e3bb).fillRoundedRect(-25, -52, 50, 25, 5);
      art.lineStyle(2, color).strokeRoundedRect(-25, -52, 50, 25, 5);
      art.fillStyle(color).fillCircle(-12, -40, 6);
      art.fillStyle(0xc7a875).fillRoundedRect(-2, -46, 22, 3, 1);
      art.fillRoundedRect(-2, -39, 17, 3, 1);
    }
    const label = this.add.text(0, 26, text, {
      align: 'center',
      fontFamily: '"Be Vietnam Pro", sans-serif',
      fontSize: '12px',
      color: '#173b33',
      backgroundColor: '#fff7e5',
      padding: { x: 6, y: 3 },
      fontStyle: 'bold',
    }).setOrigin(.5, 0);
    marker.add([art, label]);
    return marker;
  }

  private updateNearestTarget(): void {
    let best: TargetPoint | null = null; let distance = 90;
    for (const point of this.targetPoints) {
      const candidate = Phaser.Math.Distance.Between(this.player.x, this.player.y, point.x, point.y);
      if (candidate < distance) { best = point; distance = candidate; }
    }
    this.targetPoints.forEach((point) => { if (point.target.type === 'portal') point.target = { type: 'portal', unlocked: this.session.portalUnlocked() }; });
    if (this.nearest === best) return;
    this.nearest = best;
    this.session.events.emit('prompt', best ? (best.target.type === 'location' ? 'Khám phá' : best.target.type === 'guide' ? 'Trò chuyện' : best.target.unlocked ? 'Du hành thời gian' : 'Cổng chưa mở') : null);
  }

  private interact(): void {
    if (this.pausedByUi || !this.nearest) return;
    const target = this.nearest.target;
    if (target.type !== 'portal') { this.session.events.emit('interaction', target); return; }
    if (!target.unlocked) { this.session.events.emit('notice', 'Hãy trò chuyện và khám phá đủ ba địa điểm trước.'); return; }
    this.session.usePortal();
    this.session.events.emit('notice', 'Bạn đã bước qua cổng thời gian. Lớp 1077 là tái hiện diễn giải trên cùng hệ tọa độ.');
  }
}
