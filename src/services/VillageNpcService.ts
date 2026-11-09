import type { EraId, MapPoint } from '../shared/types/content';
import { NavigationService } from './NavigationService';

export type NpcActivity = 'walking' | 'resting';
export type NpcFacing = 'up' | 'down' | 'left' | 'right';

export interface NpcSnapshot {
  id: string;
  label: string;
  position: MapPoint;
  activity: NpcActivity;
  facing: NpcFacing;
}

interface NpcActor {
  id: string;
  label: string;
  position: MapPoint;
  route: MapPoint[];
  speed: number;
  targetIndex: number;
  waitMs: number;
  activity: NpcActivity;
  facing: NpcFacing;
}

const distance = (a: MapPoint, b: MapPoint): number => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Lightweight deterministic NPC routines. They are fictional present-day village
 * inhabitants, not depictions of historical people. Uses the exact NavigationService
 * rules as the player: neither walks through water, OSM building footprints nor scene art.
 */
export class VillageNpcService {
  private actors: NpcActor[];

  constructor(spawn: MapPoint, private readonly navigation: NavigationService) {
    const designs = [
      {
        id: 'villager-a', label: 'DÂN LÀNG',
        anchor: { x: spawn.x + 8, y: spawn.y - 86 },
        offsets: [{ x: 0, y: 0 }, { x: 48, y: 0 }, { x: 48, y: -38 }, { x: 0, y: -38 }],
        speed: 61, delay: 600,
      },
      {
        id: 'villager-b', label: 'NGƯỜI QUA ĐƯỜNG',
        anchor: { x: spawn.x + 75, y: spawn.y + 96 },
        offsets: [{ x: 0, y: 0 }, { x: 58, y: 0 }, { x: 58, y: 38 }, { x: 0, y: 38 }],
        speed: 49, delay: 1600,
      },
    ];
    this.actors = designs.flatMap((design) => {
      const route = design.offsets.map((offset) => ({
        x: design.anchor.x + offset.x,
        y: design.anchor.y + offset.y,
      }));
      // Never spawn an NPC in an obstructed area, even when map data changes.
      if (this.navigation.isBlocked(route[0], 'present', 12)) return [];
      return [{
        id: design.id, label: design.label, position: { ...route[0] }, route,
        speed: design.speed, targetIndex: 1, waitMs: design.delay,
        activity: 'resting' as NpcActivity, facing: 'down' as NpcFacing,
      }];
    });
  }

  update(deltaMs: number, era: EraId): void {
    if (era !== 'present' || !Number.isFinite(deltaMs) || deltaMs <= 0) return;
    const delta = Math.min(deltaMs, 100); // avoid teleportation after hidden-tab frame spikes
    for (const actor of this.actors) {
      if (actor.waitMs > 0) {
        actor.waitMs = Math.max(0, actor.waitMs - delta);
        actor.activity = 'resting';
        continue;
      }
      const target = actor.route[actor.targetIndex];
      const gap = distance(actor.position, target);
      if (gap < 1) {
        actor.position = { ...target };
        actor.targetIndex = (actor.targetIndex + 1) % actor.route.length;
        actor.waitMs = 900;
        actor.activity = 'resting';
        continue;
      }
      const travel = Math.min(gap, actor.speed * delta / 1000);
      const next = {
        x: actor.position.x + (target.x - actor.position.x) * travel / gap,
        y: actor.position.y + (target.y - actor.position.y) * travel / gap,
      };
      if (!this.navigation.canMove(actor.position, next, 'present', 12)) {
        // Never phase through a blocked waypoint; rest and try another leg.
        actor.targetIndex = (actor.targetIndex + 1) % actor.route.length;
        actor.waitMs = 1100;
        actor.activity = 'resting';
        continue;
      }
      actor.facing = Math.abs(target.x - actor.position.x) > Math.abs(target.y - actor.position.y)
        ? (target.x < actor.position.x ? 'left' : 'right')
        : (target.y < actor.position.y ? 'up' : 'down');
      actor.position = next;
      actor.activity = 'walking';
    }
  }

  snapshot(): NpcSnapshot[] {
    return this.actors.map(({ id, label, position, activity, facing }) => ({
      id, label, position: { ...position }, activity, facing,
    }));
  }
}
