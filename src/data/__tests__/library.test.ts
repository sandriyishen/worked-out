import {
  EXERCISE_LIBRARY,
  getExercisesByCategory,
  getExercisesByArea,
  getExercisesByEquipment,
  getExercisesWithNoEquipment,
  getExercisesForEquipment,
} from '../exerciseLibrary';
import { SESSIONS, buildDaySessions, sessionsContainingExercise } from '../sessions';
import { STANDALONE_EXERCISES } from '../standaloneExercises';

describe('EXERCISE_LIBRARY composition', () => {
  it('contains no duplicate ids', () => {
    const ids = EXERCISE_LIBRARY.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes every exercise from the built-in sessions', () => {
    const libIds = new Set(EXERCISE_LIBRARY.map(e => e.id));
    for (const session of SESSIONS) {
      for (const ex of session.exercises) {
        expect(libIds.has(ex.id)).toBe(true);
      }
    }
  });

  it('includes every standalone exercise', () => {
    const libIds = new Set(EXERCISE_LIBRARY.map(e => e.id));
    for (const ex of STANDALONE_EXERCISES) {
      expect(libIds.has(ex.id)).toBe(true);
    }
  });

  it('a built-in session exercise wins over a standalone entry on id collision', () => {
    // Any id shared between the two pools should resolve to the session object.
    const sessionById = new Map(
      SESSIONS.flatMap(s => s.exercises).map(e => [e.id, e]),
    );
    for (const ex of EXERCISE_LIBRARY) {
      if (sessionById.has(ex.id)) {
        expect(ex).toBe(sessionById.get(ex.id));
      }
    }
  });
});

describe('session presets reference the library (#38)', () => {
  it('every session exercise is the exact library object (no duplicated definitions)', () => {
    const libById = new Map(EXERCISE_LIBRARY.map(e => [e.id, e]));
    for (const session of SESSIONS) {
      for (const ex of session.exercises) {
        expect(ex).toBe(libById.get(ex.id));
      }
    }
  });

  it('buildDaySessions cycles the presets without duplicating exercise data', () => {
    const day = buildDaySessions(7); // > 5 forces a wrap around the 5 presets
    expect(day).toHaveLength(7);
    const libIds = new Set(EXERCISE_LIBRARY.map(e => e.id));
    day.forEach((session, i) => {
      expect(session.name).toBe(`Session ${i + 1}`);
      session.exercises.forEach(ex => expect(libIds.has(ex.id)).toBe(true));
    });
  });

  it('sessionsContainingExercise finds the built-in sessions for an exercise id', () => {
    expect(sessionsContainingExercise('s1-e1').map(s => s.id)).toEqual([1]);
    // A standalone-only id appears in no built-in session.
    expect(sessionsContainingExercise(STANDALONE_EXERCISES[0].id)).toEqual([]);
  });
});

describe('query helpers', () => {
  it('getExercisesByCategory returns exactly the exercises in that category', () => {
    const result = getExercisesByCategory('posture');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toEqual(
      EXERCISE_LIBRARY.filter(e => e.categories.includes('posture')),
    );
    result.forEach(e => expect(e.categories).toContain('posture'));
  });

  it('getExercisesByArea filters by target area', () => {
    const result = getExercisesByArea('shoulders');
    result.forEach(e => expect(e.targetAreas).toContain('shoulders'));
  });

  it('getExercisesByEquipment / getExercisesWithNoEquipment filter by equipment', () => {
    const noEquip = getExercisesWithNoEquipment();
    expect(noEquip).toEqual(getExercisesByEquipment('none'));
    noEquip.forEach(e => expect(e.equipment).toBe('none'));
  });

  it('getExercisesForEquipment respects the available profile (#28)', () => {
    // Empty profile → only no-equipment exercises.
    const none = getExercisesForEquipment(EXERCISE_LIBRARY, []);
    expect(none).toEqual(getExercisesWithNoEquipment());

    // With chair → no-equipment plus chair exercises, nothing else.
    const withChair = getExercisesForEquipment(EXERCISE_LIBRARY, ['chair']);
    withChair.forEach(e => expect(['none', 'chair']).toContain(e.equipment));
    expect(withChair.length).toBeGreaterThan(none.length);
    expect(withChair.some(e => e.equipment === 'chair')).toBe(true);
    expect(withChair.some(e => e.equipment === 'desk')).toBe(false);
  });
});
