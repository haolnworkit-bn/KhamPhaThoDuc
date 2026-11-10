import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../src/shared/types/state';
import { CULTURAL_CLUES, culturalClueCount, parseCulturalProgress, recordCulturalClue } from '../../src/services/CulturalDiscoveryService';

describe('Thọ Đức cultural trail', () => {
  it('requires real in-game discoveries before unlocking clues', () => {
    const initial = createInitialState();
    expect(CULTURAL_CLUES.every(clue => !clue.unlock(initial))).toBe(true);
    const explored = {
      ...initial,
      quest: { ...initial.quest, guideSpoken: true },
      discoveredLocations: ['dinh_tho_duc', 'den_can_vang', 'chua_thap_linh'] as typeof initial.discoveredLocations,
    };
    expect(CULTURAL_CLUES.every(clue => clue.unlock(explored))).toBe(true);
  });

  it('stores unique validated clue ids and rejects malformed saves', () => {
    expect(parseCulturalProgress('not json')).toEqual([]);
    expect(parseCulturalProgress('{"wrong":true}')).toEqual([]);
    expect(parseCulturalProgress('["river","river","invalid",20]')).toEqual(['river']);
    const first = recordCulturalClue([], 'river');
    const twice = recordCulturalClue(first, 'river');
    expect(twice).toEqual(['river']);
    expect(culturalClueCount(twice)).toBe(1);
  });

  it('has sourced, answerable questions with distinct options', () => {
    expect(CULTURAL_CLUES).toHaveLength(4);
    for (const clue of CULTURAL_CLUES) {
      expect(clue.heading.length).toBeGreaterThan(4);
      expect(clue.question.length).toBeGreaterThan(12);
      expect(clue.fact.length).toBeGreaterThan(40);
      expect(clue.choices.length).toBe(3);
      expect(new Set(clue.choices).size).toBe(3);
      expect(clue.choices[clue.correctChoice]).toBeTruthy();
      expect(clue.sourceUrl).toMatch(/^https:\/\//);
    }
  });
});
