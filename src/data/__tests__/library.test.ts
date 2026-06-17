import {
  EXERCISE_LIBRARY,
  getExercisesByCategory,
  getExercisesByArea,
  getExercisesByEquipment,
  getExercisesWithNoEquipment,
} from '../exerciseLibrary';
import { SESSIONS } from '../sessions';
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
});
