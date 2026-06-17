import { BodyArea, Equipment, ExerciseCategory } from '../../types';
import { CATEGORY_LABELS, EXERCISE_LIBRARY, getExercisesByCategory } from '../exerciseLibrary';
import { STANDALONE_EXERCISES } from '../standaloneExercises';
import { SESSIONS } from '../sessions';

const VALID_EQUIPMENT: Equipment[] = ['none', 'chair', 'desk', 'wall', 'doorframe'];

const VALID_AREAS: BodyArea[] = [
  'neck', 'shoulders', 'upper_back', 'lower_back', 'core', 'wrists', 'forearms',
  'arms', 'chest', 'hips', 'glutes', 'legs', 'calves', 'ankles', 'eyes', 'full_body',
];

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as ExerciseCategory[];

describe('STANDALONE_EXERCISES conformance', () => {
  it('every entry has a unique id, not colliding with built-in session ids', () => {
    const ids = STANDALONE_EXERCISES.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    const sessionIds = new Set(SESSIONS.flatMap(s => s.exercises).map(e => e.id));
    for (const id of ids) {
      expect(sessionIds.has(id)).toBe(false);
    }
  });

  it('every entry conforms to the Exercise model and the no-gym philosophy', () => {
    for (const ex of STANDALONE_EXERCISES) {
      expect(ex.id).toMatch(/^lib-/);
      expect(ex.name.trim().length).toBeGreaterThan(0);
      expect(ex.desc.trim().length).toBeGreaterThan(0);
      expect(ex.duration).toBeGreaterThan(0);
      expect(['work', 'stretch']).toContain(ex.type);

      expect(VALID_EQUIPMENT).toContain(ex.equipment);

      expect(ex.categories.length).toBeGreaterThan(0);
      ex.categories.forEach(c => expect(ALL_CATEGORIES).toContain(c));

      expect(ex.targetAreas.length).toBeGreaterThan(0);
      ex.targetAreas.forEach(a => expect(VALID_AREAS).toContain(a));

      // Bilateral exercises must switch sides within their duration.
      if (ex.bilateral && ex.switchAt != null) {
        expect(ex.switchAt).toBeGreaterThan(0);
        expect(ex.switchAt).toBeLessThan(ex.duration);
      }
    }
  });
});

describe('catalogue coverage', () => {
  it('every category label maps to at least one library exercise', () => {
    const empty = ALL_CATEGORIES.filter(c => getExercisesByCategory(c).length === 0);
    expect(empty).toEqual([]);
  });

  it('each category resolves through CATEGORY_LABELS', () => {
    ALL_CATEGORIES.forEach(c => {
      expect(typeof CATEGORY_LABELS[c]).toBe('string');
      expect(CATEGORY_LABELS[c].length).toBeGreaterThan(0);
    });
  });

  it('offers both work and stretch exercises across the catalogue', () => {
    const types = new Set(EXERCISE_LIBRARY.map(e => e.type));
    expect(types.has('work')).toBe(true);
    expect(types.has('stretch')).toBe(true);
  });
});
