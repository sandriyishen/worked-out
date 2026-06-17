import { Exercise, ExerciseCategory, BodyArea, Equipment } from '../types';
import { BUILT_IN_EXERCISES } from './builtInExercises';
import { STANDALONE_EXERCISES } from './standaloneExercises';

/** Prep countdown (seconds) shown before each exercise; also its per-exercise time cost. */
export const PREP_SECS = 7;

/** Removes duplicate exercises by `id`, keeping the first occurrence. */
function dedupeById(exercises: Exercise[]): Exercise[] {
  const seen = new Set<string>();
  return exercises.filter(e => (seen.has(e.id) ? false : (seen.add(e.id), true)));
}

/**
 * The exercise library is the single source of truth for all exercises (#38):
 * exercise data lives here, and the generated session plan references it by id.
 * It is the entire pool the session generator and quick sessions draw from, so all
 * library content is reachable when building sessions, not just in the #4 browser.
 *
 * It combines the `BUILT_IN_EXERCISES` (the original curated movements) with the
 * `STANDALONE_EXERCISES` added for broad per-complaint coverage (feature #26).
 * Built-ins are listed first so that, on an id collision, the curated built-in
 * version wins over a standalone entry.
 */
export const EXERCISE_LIBRARY: Exercise[] = dedupeById([
  ...BUILT_IN_EXERCISES,
  ...STANDALONE_EXERCISES,
]);

/** Fast id → exercise lookup over the library (used to hydrate session presets). */
const EXERCISE_BY_ID: Map<string, Exercise> = new Map(
  EXERCISE_LIBRARY.map(e => [e.id, e]),
);

/** Returns the library exercise with the given id, or `undefined` if none. */
export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_BY_ID.get(id);
}

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
 * Filters to exercises doable with the user's available equipment (feature #28).
 * No-equipment exercises always qualify. An empty `available` list therefore
 * yields only the no-equipment exercises.
 */
export function getExercisesForEquipment(
  exercises: Exercise[],
  available: Equipment[],
): Exercise[] {
  return exercises.filter(e => e.equipment === 'none' || available.includes(e.equipment));
}

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  // Complaint / relief
  back_pain: 'Back Pain',
  upper_back_pain: 'Upper Back Pain',
  lower_back_pain: 'Lower Back Pain',
  neck_pain: 'Neck Pain',
  carpal_tunnel: 'Carpal Tunnel',
  wrist_forearm: 'Wrist & Forearm Strain',
  shoulder_tension: 'Shoulder Tension',
  hip_flexors: 'Tight Hips',
  sciatica: 'Sciatica Relief',
  eye_strain: 'Eye Strain',
  tension_headache: 'Tension Headache',
  ankle_circulation: 'Ankle & Leg Circulation',
  breathing: 'Breathing',
  posture: 'Posture',
  // Strength
  core_strength: 'Core Strength',
  back_strength: 'Back Strength',
  upper_body_strength: 'Upper Body Strength',
  lower_body_strength: 'Lower Body Strength',
  // Sculpting / fat-target
  chest_sculpting: 'Chest Sculpting',
  shoulder_sculpting: 'Shoulder Sculpting',
  arm_sculpting: 'Arm Sculpting',
  leg_sculpting: 'Leg Sculpting',
  belly_fat: 'Belly Fat',
  calves: 'Calf Stretches',
  // Wellness / goal
  general_fitness: 'General Fitness',
  upper_body: 'Upper Body',
  lower_body: 'Lower Body',
  cardio: 'Cardio',
  balance: 'Balance',
  energizing: 'Energizing',
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  none: 'No equipment',
  chair: 'Chair',
  desk: 'Desk',
  wall: 'Wall',
  doorframe: 'Doorframe',
};

export interface CategoryGroup {
  label: string;
  categories: ExerciseCategory[];
}

/**
 * Categories grouped for the focus-area picker (#38 Phase C). Every category
 * appears in at least one group; a few that fit two themes (e.g. `posture`)
 * are intentionally repeated so they're discoverable under either.
 */
export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    label: 'Complaints',
    categories: [
      'back_pain', 'upper_back_pain', 'lower_back_pain', 'neck_pain', 'shoulder_tension',
      'tension_headache', 'carpal_tunnel', 'wrist_forearm', 'hip_flexors', 'sciatica',
      'eye_strain', 'ankle_circulation', 'posture',
    ],
  },
  {
    label: 'Strength',
    categories: ['core_strength', 'back_strength', 'upper_body_strength', 'lower_body_strength'],
  },
  {
    label: 'Sculpting',
    categories: ['chest_sculpting', 'shoulder_sculpting', 'arm_sculpting', 'leg_sculpting', 'belly_fat', 'calves'],
  },
  {
    label: 'Wellness',
    categories: ['general_fitness', 'cardio', 'balance', 'energizing', 'breathing', 'upper_body', 'lower_body', 'posture'],
  },
];
