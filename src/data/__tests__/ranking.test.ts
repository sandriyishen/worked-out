import { CalendarData, Exercise } from '../../types';
import {
  DEFAULT_RANKING_WEIGHTS,
  effectiveDifficulty,
  effectiveEfficacy,
  rankExercises,
  scoreExercise,
} from '../ranking';
import { SESSIONS, exercisePopularity } from '../sessions';

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

  it('attributes a session run to its preset exercises and normalises to 1', () => {
    const slot0 = SESSIONS[0].exercises;
    const calData: CalendarData = {
      '2026-06-17': {
        date: '2026-06-17',
        sessionsCompleted: 2,
        status: 'partial',
        completedSessionIds: [0],
        // Slot 0 completed twice → its exercises lead the popularity ranking.
        sessionRuns: [
          { sessionId: 0, completedAt: 1 },
          { sessionId: 0, completedAt: 2 },
        ],
      },
    };
    const pop = exercisePopularity(calData);
    // Every exercise in slot 0's preset is the most popular → 1.
    slot0.forEach(e => expect(pop.get(e.id)).toBe(1));
    // An exercise never completed has no entry.
    const untouched = SESSIONS[1].exercises.find(e => !slot0.some(s => s.id === e.id));
    if (untouched) expect(pop.get(untouched.id)).toBeUndefined();
  });

  it('normalises relative frequencies across slots', () => {
    const calData: CalendarData = {
      d: {
        date: 'd',
        sessionsCompleted: 3,
        status: 'partial',
        completedSessionIds: [0, 1],
        sessionRuns: [
          { sessionId: 0, completedAt: 1 },
          { sessionId: 0, completedAt: 2 },
          { sessionId: 1, completedAt: 3 },
        ],
      },
    };
    const pop = exercisePopularity(calData);
    const slot0Only = SESSIONS[0].exercises.find(
      e => !SESSIONS[1].exercises.some(s => s.id === e.id),
    )!;
    const slot1Only = SESSIONS[1].exercises.find(
      e => !SESSIONS[0].exercises.some(s => s.id === e.id),
    )!;
    expect(pop.get(slot0Only.id)).toBe(1);       // ran twice → max
    expect(pop.get(slot1Only.id)).toBeCloseTo(0.5); // ran once → half of max
  });
});
