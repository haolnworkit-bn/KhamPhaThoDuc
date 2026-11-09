import { describe, expect, it } from 'vitest';
import { NavigationService } from '../../src/services/NavigationService';
import { VillageNpcService } from '../../src/services/VillageNpcService';
import type { EraId, GeographicMap } from '../../src/shared/types/content';
import mapJson from '../../public/data/geographic-map.json';

const map = mapJson as GeographicMap;
const create = () => {
  const navigation = new NavigationService(map);
  const life = new VillageNpcService(map.interaction.spawn, navigation);
  return { life, navigation };
};

describe('Sprint 03D.2 fictional present-day villagers', () => {
  it('spawns two villagers in traversable positions', () => {
    const { life, navigation } = create();
    const villagers = life.snapshot();
    expect(villagers.map((v) => v.id)).toEqual(['villager-a', 'villager-b']);
    for (const villager of villagers) {
      expect(navigation.isBlocked(villager.position, 'present', 12)).toBe(false);
      expect(villager.activity).toBe('resting');
    }
  });

  it('walks only on legal navigation segments and resumes rest at a waypoint', () => {
    const { life, navigation } = create();
    let previous = life.snapshot();
    let moved = false;
    let restedAfterMoving = false;
    for (let step = 0; step < 400; step++) {
      life.update(50, 'present');
      const next = life.snapshot();
      for (let i = 0; i < next.length; i++) {
        const before = previous[i], after = next[i];
        expect(navigation.canMove(before.position, after.position, 'present', 12)).toBe(true);
        expect(navigation.isBlocked(after.position, 'present', 12)).toBe(false);
        if (before.position.x !== after.position.x || before.position.y !== after.position.y) moved = true;
        if (moved && after.activity === 'resting') restedAfterMoving = true;
      }
      previous = next;
    }
    expect(moved).toBe(true);
    expect(restedAfterMoving).toBe(true);
  });

  it('does not move in interpretive historic eras or on invalid deltas', () => {
    const { life } = create();
    const start = life.snapshot();
    for (const era of ['ly_1077', 'le', 'nguyen_1845', 'twentieth_century'] as EraId[]) {
      life.update(5000, era);
    }
    life.update(-50, 'present');
    life.update(Number.NaN, 'present');
    expect(life.snapshot()).toEqual(start);
  });

  it('does not spawn villagers on top of newly blocked terrain', () => {
    const blocked = new NavigationService(map, [
      { id: 'test-obstacle', kind: 'circle', x: map.interaction.spawn.x + 8, y: map.interaction.spawn.y - 86, radius: 20 },
    ]);
    const life = new VillageNpcService(map.interaction.spawn, blocked);
    expect(life.snapshot().map((npc) => npc.id)).not.toContain('villager-a');
  });
});
