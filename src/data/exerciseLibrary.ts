import { Exercise, ExerciseCategory, BodyArea, Equipment } from '../types';
import { SESSIONS } from './sessions';

/**
 * The exercise library is the single source of truth for all exercises.
 *
 * Current exercises come from the built-in sessions. As the library grows
 * (feature #4), additional exercises can be appended here directly.
 *
 * Feature #5 (quick session generator) will use getExercisesByCategory and
 * generateQuickSession to build targeted sessions on demand.
 */
export const EXERCISE_LIBRARY: Exercise[] = SESSIONS.flatMap(s => s.exercises);

export function getExercisesByCategory(category: ExerciseCategory): Exercise[] {
  return EXERCISE_LIBRARY.filter(e => e.categories.includes(category));
}

export function getExercisesByArea(area: BodyArea): Exercise[] {
  return EXERCISE_LIBRARY.filter(e => e.targetAreas.includes(area));
}

export function getExercisesByEquipment(equipment: Equipment): Exercise[] {
  return EXERCISE_LIBRARY.filter(e => e.equipment === equipment);
}

export function getExercisesWithNoEquipment(): Exercise[] {
  return getExercisesByEquipment('none');
}

/**
 * Generates a targeted quick session fitting within a time budget.
 *
 * Selects exercises matching the complaint category, balancing work and stretch,
 * and ensures the total duration (including prep time) fits within durationMinutes.
 *
 * Feature #5 placeholder — implement when the quick-session screen is built.
 */
export function generateQuickSession(
  _category: ExerciseCategory,
  _durationMinutes: number,
): Exercise[] {
  // TODO(feature-5): implement selection algorithm
  // 1. Filter library by category
  // 2. Sort by relevance (primary category match scores higher)
  // 3. Greedily pick exercises until time budget is exhausted
  // 4. Ensure at least one stretch and one work exercise where possible
  throw new Error('generateQuickSession is not yet implemented');
}

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  back_pain: 'Back Pain',
  neck_pain: 'Neck Pain',
  carpal_tunnel: 'Carpal Tunnel',
  shoulder_tension: 'Shoulder Tension',
  hip_flexors: 'Tight Hips',
  eye_strain: 'Eye Strain',
  general_fitness: 'General Fitness',
  core_strength: 'Core Strength',
  upper_body: 'Upper Body',
  lower_body: 'Lower Body',
  cardio: 'Cardio',
  breathing: 'Breathing',
  posture: 'Posture',
};
