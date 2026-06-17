import { Exercise, ExerciseCategory, BodyArea, Equipment, WorkoutSession } from '../types';
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
 * exercise data lives here, and the curated `SESSIONS` reference it by id rather
 * than defining their own copies. It is also the pool the session machinery draws
 * from (`fitSessionToBudget`, and the #5 quick generator), so library content is
 * reachable when building sessions, not just in the #4 browser.
 *
 * It combines the `BUILT_IN_EXERCISES` curated for the 5 built-in sessions with
 * the `STANDALONE_EXERCISES` added for broad per-complaint coverage (feature #26).
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

/** Time a single exercise occupies in a session, including its prep window. */
const exerciseCost = (e: Exercise) => e.duration + PREP_SECS;

/**
 * Adjusts a session's exercise list to fit a per-session time budget (feature #1).
 *
 * - No budget (undefined/0) → returns the session unchanged ("Auto").
 * - Budget shorter than the session → trims exercises in their curated order,
 *   keeping at least one so there's always something to do.
 * - Budget longer than the session → keeps the whole session, then appends
 *   category-matched exercises from the library to fill the remaining time.
 *
 * Cost per exercise mirrors WorkoutTab's `duration + PREP_SECS` total, so the
 * resulting list fills (without exceeding) the budget as closely as possible.
 */
export function fitSessionToBudget(
  session: WorkoutSession,
  budgetMinutes?: number,
): Exercise[] {
  if (!budgetMinutes) return session.exercises; // Auto / off → unchanged
  const budgetSecs = budgetMinutes * 60;

  // Trim: take session exercises in curated order while they fit; always keep ≥1.
  const picked: Exercise[] = [];
  let used = 0;
  for (const e of session.exercises) {
    if (used + exerciseCost(e) > budgetSecs && picked.length > 0) break;
    picked.push(e);
    used += exerciseCost(e);
  }

  // Extend: budget exceeds the session pool → pull matching exercises from the library.
  if (used < budgetSecs && picked.length === session.exercises.length) {
    const sessionCats = new Set(session.exercises.flatMap(e => e.categories));
    const haveIds = new Set(picked.map(e => e.id));
    const candidates = EXERCISE_LIBRARY.filter(
      e => !haveIds.has(e.id) && e.categories.some(c => sessionCats.has(c)),
    );
    for (const e of candidates) {
      if (used + exerciseCost(e) > budgetSecs) continue; // skip ones that don't fit; keep filling
      picked.push(e);
      used += exerciseCost(e);
      haveIds.add(e.id);
    }
  }

  return picked;
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
