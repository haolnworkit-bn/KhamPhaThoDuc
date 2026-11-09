import Phaser from 'phaser';
import type { AssetRegistry } from '../../assets/AssetRegistry';
import type { GameSession } from '../../services/GameSession';
import { VillageScene } from '../scenes/VillageScene';

export function createGame(parent: HTMLElement, session: GameSession, assetRegistry: AssetRegistry): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#d8e5c0',
    pixelArt: false,
    render: { antialias: true, roundPixels: true },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: parent.clientWidth,
      height: parent.clientHeight,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scene: [new VillageScene(session, assetRegistry)],
  });
}
