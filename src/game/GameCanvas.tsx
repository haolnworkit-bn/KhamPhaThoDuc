import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import type { AssetRegistry } from '../assets/AssetRegistry';
import type { SceneDecorationRegistry } from '../assets/SceneDecorationRegistry';
import type { MapVisualStyleRegistry } from '../assets/MapVisualStyleRegistry';
import type { GameSession } from '../services/GameSession';
import { createGame } from './config/createGame';

export function GameCanvas({ session, assetRegistry, sceneDecorations, mapVisualStyles }: { session: GameSession; assetRegistry: AssetRegistry; sceneDecorations: SceneDecorationRegistry | null; mapVisualStyles: MapVisualStyleRegistry }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!hostRef.current || gameRef.current) return;
    gameRef.current = createGame(hostRef.current, session, assetRegistry, sceneDecorations, mapVisualStyles);
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [assetRegistry, mapVisualStyles, sceneDecorations, session]);

  return <div className="game-canvas" ref={hostRef} aria-label="Bản đồ địa lý Thọ Đức" />;
}
