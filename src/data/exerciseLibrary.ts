import { Exercise, ExerciseCategory, BodyArea, Equipment, WorkoutSession } from '../types';
import { PREP_SECS, SESSIONS } from './sessions';
import { STANDALONE_EXERCISES } from './standaloneExercises';

/** Removes duplicate exercises by `id`, keeping the first occurrence. */
function dedupeById(exercises: Exercise[]): Exercise[] {
  const seen = new Set<string>();
  return exercises.filter(e => (seen.has(e.id) ? false : (seen.add(e.id), true)));
}

/**
 * The exercise library is the single source of truth for all exercises, and the
 * pool the session machinery draws from (`fitSessionToBudget`, and the #5 quick
 * generator) — so library content is reachable when building sessions, not just
 * in the #4 browser.
 *
 * It combines the exercises curated into the 5 built-in `SESSIONS` with the
 * `STANDALONE_EXERCISES` added for broad per-complaint coverage (feature #26).
 * Sessions are listed first so that, on an id collision, the curated built-in
 * version wins over a standalone entry.
 */
export const EXERCISE_LIBRARY: Exercise[] = dedupeById([
  ...SESSIONS.flatMap(s => s.exercises),
  ...STANDALONE_EXERCISES,
]);

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
