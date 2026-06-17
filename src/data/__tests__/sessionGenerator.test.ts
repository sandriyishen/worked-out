import { Exercise } from '../../types';
import { PREP_SECS, getExerciseById } from '../exerciseLibrary';
import {
  DEFAULT_SESSION_SECS,
  GeneratorProfile,
  generateDayPlan,
  generateQuickSession,
  hashString,
  planSignature,
} from '../sessionGenerator';

const NO_POP = new Map<string, number>();
const ex = (id: string) => getExerciseById(id) as Exercise;
const totalSecs = (ids: string[]) => ids.reduce((a, id) => a + ex(id).duration + PREP_SECS, 0);

const baseProfile: GeneratorProfile = {
  dailyTarget: 3,
  focusAreas: [],
  availableEquipment: [],
};

describe('generateDayPlan', () => {
  it('produces exactly dailyTarget sessions, each non-empty with unique ids', () => {
    const plan = generateDayPlan({ ...baseProfile, dailyTarget: 4 }, NO_POP, 1);
    expect(plan).toHaveLength(4);
    for (const session of plan) {
      expect(session.exerciseIds.length).toBeGreaterThan(0);
      expect(new Set(session.exerciseIds).size).toBe(session.exerciseIds.length);
      session.exerciseIds.forEach(id => expect(getExerciseById(id)).toBeDefined());
    }
  });

  it('respects the equipment profile (empty → only no-equipment exercises)', () => {
    const plan = generateDayPlan(baseProfile, NO_POP, 7);
    for (const session of plan) {
      session.exerciseIds.forEach(id => expect(ex(id).equipment).toBe('none'));
    }

    const withChair = generateDayPlan({ ...baseProfile, availableEquipment: ['chair'] }, NO_POP, 7);
    for (const session of withChair) {
      session.exerciseIds.forEach(id => expect(['none', 'chair']).toContain(ex(id).equipment));
    }
  });

  it('fits a per-session time budget but always keeps at least one exercise', () => {
    const plan = generateDayPlan({ ...baseProfile, durationMinutes: 2 }, NO_POP, 3); // 120s
    for (const session of plan) {
      expect(session.exerciseIds.length).toBeGreaterThanOrEqual(1);
      expect(totalSecs(session.exerciseIds)).toBeLessThanOrEqual(120);
    }
  });

  it('reserves a posture / anti-sitting staple in each session', () => {
    const plan = generateDayPlan(baseProfile, NO_POP, 5);
    for (const session of plan) {
      const hasPosture = session.exerciseIds.some(id => ex(id).categories.includes('posture'));
      expect(hasPosture).toBe(true);
    }
  });

  it('covers a stated focus area (directly or via a related category)', () => {
    const plan = generateDayPlan(
      { dailyTarget: 1, focusAreas: ['carpal_tunnel'], availableEquipment: [] },
      NO_POP,
      2,
    );
    const cats = new Set(plan[0].exerciseIds.flatMap(id => ex(id).categories));
    expect(cats.has('carpal_tunnel') || cats.has('wrist_forearm')).toBe(true);
  });

  it('names sessions and defaults the budget to ~one short session', () => {
    const plan = generateDayPlan({ ...baseProfile, dailyTarget: 1 }, NO_POP, 9);
    expect(plan[0].name.length).toBeGreaterThan(0);
    expect(totalSecs(plan[0].exerciseIds)).toBeLessThanOrEqual(DEFAULT_SESSION_SECS);
  });

  it('is deterministic in (profile, popularity, seed)', () => {
    const a = generateDayPlan(baseProfile, NO_POP, 42);
    const b = generateDayPlan(baseProfile, NO_POP, 42);
    expect(a).toEqual(b);
  });

  it('a different seed (shuffle) generally yields a different plan', () => {
    const a = generateDayPlan(baseProfile, NO_POP, 1).flatMap(s => s.exerciseIds).join(',');
    const b = generateDayPlan(baseProfile, NO_POP, 2).flatMap(s => s.exerciseIds).join(',');
    expect(a).not.toBe(b);
  });

  describe('pinning (#2)', () => {
    it('guarantees a pinned exercise appears once, bypassing the equipment filter', () => {
      // s1-e2 (Desk Push-Ups) needs a desk; with no equipment it is normally filtered out.
      const plan = generateDayPlan({ ...baseProfile, pinnedExerciseIds: ['s1-e2'] }, NO_POP, 1);
      const allIds = plan.flatMap(s => s.exerciseIds);
      expect(allIds).toContain('s1-e2');
      expect(allIds.filter(id => id === 's1-e2')).toHaveLength(1); // no duplicate across the day
    });

    it('keeps the pinned exercise across a shuffle (new seed)', () => {
      const withPin = (seed: number) =>
        generateDayPlan({ ...baseProfile, pinnedExerciseIds: ['s1-e2'] }, NO_POP, seed).flatMap(s => s.exerciseIds);
      expect(withPin(1)).toContain('s1-e2');
      expect(withPin(2)).toContain('s1-e2');
    });
  });
});

describe('planSignature', () => {
  it('is stable for the same profile and changes when a setting changes', () => {
    const p = planSignature(baseProfile);
    expect(planSignature(baseProfile)).toBe(p);
    expect(planSignature({ ...baseProfile, focusAreas: ['back_pain'] })).not.toBe(p);
    expect(planSignature({ ...baseProfile, availableEquipment: ['chair'] })).not.toBe(p);
    expect(planSignature({ ...baseProfile, dailyTarget: 5 })).not.toBe(p);
    expect(planSignature({ ...baseProfile, durationMinutes: 3 })).not.toBe(p);
    expect(planSignature({ ...baseProfile, pinnedExerciseIds: ['s1-e1'] })).not.toBe(p);
    expect(planSignature({ ...baseProfile, favoriteExerciseIds: ['s1-e1'] })).not.toBe(p);
  });

  it('ignores ordering of focus areas / equipment', () => {
    expect(planSignature({ ...baseProfile, focusAreas: ['back_pain', 'posture'] })).toBe(
      planSignature({ ...baseProfile, focusAreas: ['posture', 'back_pain'] }),
    );
  });
});

describe('hashString', () => {
  it('is deterministic and varies by input', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
    expect(hashString('abc')).not.toBe(hashString('abd'));
  });
});

describe('generateQuickSession', () => {
  it('builds a single targeted session within the budget', () => {
    const session = generateQuickSession('neck_pain', 3); // 180s
    expect(session.length).toBeGreaterThan(0);
    const secs = session.reduce((a, e) => a + e.duration + PREP_SECS, 0);
    expect(secs).toBeLessThanOrEqual(180);
    const cats = new Set(session.flatMap(e => e.categories));
    expect(cats.has('neck_pain') || cats.has('tension_headache') || cats.has('shoulder_tension')).toBe(true);
  });
});
