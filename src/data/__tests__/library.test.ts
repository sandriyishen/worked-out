import {
  EXERCISE_LIBRARY,
  getExercisesByCategory,
  getExercisesByArea,
  getExercisesByEquipment,
  getExercisesWithNoEquipment,
  getExercisesForEquipment,
} from '../exerciseLibrary';
import { BUILT_IN_EXERCISES } from '../builtInExercises';
import { STANDALONE_EXERCISES } from '../standaloneExercises';

describe('EXERCISE_LIBRARY composition', () => {
  it('contains no duplicate ids', () => {
    const ids = EXERCISE_LIBRARY.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes every built-in exercise definition', () => {
    const libIds = new Set(EXERCISE_LIBRARY.map(e => e.id));
    for (const ex of BUILT_IN_EXERCISES) {
      expect(libIds.has(ex.id)).toBe(true);
    }
  });

  it('includes every standalone exercise', () => {
    const libIds = new Set(EXERCISE_LIBRARY.map(e => e.id));
    for (const ex of STANDALONE_EXERCISES) {
      expect(libIds.has(ex.id)).toBe(true);
    }
  });

  it('a built-in exercise wins over a standalone entry on id collision', () => {
    // Any id shared between the two pools should resolve to the built-in object.
    const builtInById = new Map(BUILT_IN_EXERCISES.map(e => [e.id, e]));
    for (const ex of EXERCISE_LIBRARY) {
      if (builtInById.has(ex.id)) {
        expect(ex).toBe(builtInById.get(ex.id));
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
