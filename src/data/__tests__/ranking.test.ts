import { CalendarData, Exercise } from '../../types';
import {
  DEFAULT_RANKING_WEIGHTS,
  effectiveDifficulty,
  effectiveEfficacy,
  exercisePopularity,
  rankExercises,
  scoreExercise,
} from '../ranking';

function makeExercise(over: Partial<Exercise> = {}): Exercise {
  return {
    id: 'x',
    name: 'X',
    duration: 30,
    type: 'work',
    desc: '...',
    categories: ['core_strength'],
    targetAreas: ['core'],
    equipment: 'none',
    ...over,
  };
}

describe('ranking defaults', () => {
  it('efficacy falls back to a neutral default', () => {
    expect(effectiveEfficacy(makeExercise())).toBe(3);
    expect(effectiveEfficacy(makeExercise({ efficacy: 5 }))).toBe(5);
  });

  it('difficulty defaults by type (stretches read easier than work)', () => {
    expect(effectiveDifficulty(makeExercise({ type: 'work' }))).toBe(3);
    expect(effectiveDifficulty(makeExercise({ type: 'stretch' }))).toBe(2);
    expect(effectiveDifficulty(makeExercise({ difficulty: 1 }))).toBe(1);
  });
});

describe('scoreExercise', () => {
  it('rewards higher efficacy', () => {
    const lo = scoreExercise(makeExercise({ efficacy: 1 }));
    const hi = scoreExercise(makeExercise({ efficacy: 5 }));
    expect(hi).toBeGreaterThan(lo);
  });

  it('rewards higher ease (lower difficulty)', () => {
    const hard = scoreExercise(makeExercise({ difficulty: 5 }));
    const easy = scoreExercise(makeExercise({ difficulty: 1 }));
    expect(easy).toBeGreaterThan(hard);
  });

  it('adds the focus weight only when a category matches a focus area', () => {
    const ex = makeExercise({ categories: ['back_pain', 'posture'] });
    const noFocus = scoreExercise(ex);
    const matched = scoreExercise(ex, { focusAreas: ['posture'] });
    const unmatched = scoreExercise(ex, { focusAreas: ['cardio'] });
    expect(matched).toBeCloseTo(noFocus + DEFAULT_RANKING_WEIGHTS.focus);
    expect(unmatched).toBeCloseTo(noFocus);
  });

  it('reads popularity from the provided map', () => {
    const ex = makeExercise({ id: 'pop' });
    const base = scoreExercise(ex);
    const popular = scoreExercise(ex, { popularity: new Map([['pop', 1]]) });
    expect(popular).toBeCloseTo(base + DEFAULT_RANKING_WEIGHTS.popularity);
  });

  it('a perfect exercise scores ~1 with default weights', () => {
    const ex = makeExercise({ efficacy: 5, difficulty: 1, categories: ['posture'] });
    const score = scoreExercise(ex, {
      focusAreas: ['posture'],
      popularity: new Map([[ex.id, 1]]),
    });
    expect(score).toBeCloseTo(1);
  });
});

describe('rankExercises', () => {
  it('sorts by descending score and is stable on ties', () => {
    const a = makeExercise({ id: 'a', efficacy: 5 });
    const b = makeExercise({ id: 'b', efficacy: 1 });
    const c = makeExercise({ id: 'c', efficacy: 1 });
    const ranked = rankExercises([b, a, c]);
    expect(ranked.map(e => e.id)).toEqual(['a', 'b', 'c']); // a first; b before c (stable tie)
  });
});

describe('exercisePopularity', () => {
  it('returns an empty map when there is no history', () => {
    expect(exercisePopularity({}).size).toBe(0);
  });

  it('counts the recorded exerciseIds and normalises the most-completed to 1', () => {
    const calData: CalendarData = {
      '2026-06-17': {
        date: '2026-06-17',
        sessionsCompleted: 2,
        status: 'partial',
        completedSessionIds: [0],
        sessionRuns: [
          { sessionId: 0, completedAt: 1, exerciseIds: ['a', 'b'] },
          { sessionId: 0, completedAt: 2, exerciseIds: ['a'] }, // 'a' done twice, 'b' once
        ],
      },
    };
    const pop = exercisePopularity(calData);
    expect(pop.get('a')).toBe(1);        // most completed → 1
    expect(pop.get('b')).toBeCloseTo(0.5); // half as often
    expect(pop.get('never')).toBeUndefined();
  });

  it('ignores legacy runs that carry no exerciseIds', () => {
    const calData: CalendarData = {
      d: {
        date: 'd',
        sessionsCompleted: 1,
        status: 'partial',
        completedSessionIds: [0],
        sessionRuns: [{ sessionId: 0, completedAt: 1 }], // pre-Phase-C run, no ids
      },
    };
    expect(exercisePopularity(calData).size).toBe(0);
  });
});
