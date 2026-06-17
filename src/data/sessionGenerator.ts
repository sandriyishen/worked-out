import { Equipment, Exercise, ExerciseCategory, PlannedSession } from '../types';
import {
  CATEGORY_LABELS,
  EXERCISE_LIBRARY,
  PREP_SECS,
  getExerciseById,
  getExercisesForEquipment,
} from './exerciseLibrary';
import { scoreExercise } from './ranking';

/**
 * The session generator (#38 Phase C) — the single selection engine behind both
 * the daily plan and quick sessions (#5).
 *
 * It draws from the ranked, equipment-filtered library to build N themed sessions:
 * each guarantees a minimum quota for its focus area, always reserves a posture /
 * anti-sitting staple (the North Star), then fills the time budget by score while
 * alternating work/stretch, avoiding in-session duplicates, and minimising overlap
 * across the day. Thin focus areas borrow from related categories rather than
 * padding with unrelated work.
 *
 * Generation is a pure function of (profile, popularity, seed): the same inputs
 * always produce the same plan, so a persisted plan is stable across renders and
 * only changes when the profile changes or the user shuffles (a new seed).
 */

/** Default per-session budget when the user hasn't set a duration ("Auto"). */
export const DEFAULT_SESSION_SECS = 240; // ~4 min → roughly six short exercises
const MAX_PER_SESSION = 12;
/** Seeded score jitter, so shuffling reorders near-equal candidates for variety. */
const JITTER = 0.25;

const SESSION_COLORS = ['#E8531A', '#D4A017', '#2E7D9F', '#6B3FA0', '#1A6B45'];
const SESSION_EMOJIS = ['🌅', '🔥', '⚡', '💪', '🌙', '🧘', '🏃', '✨', '🌊', '⭐'];

// Categories too broad to make a meaningful session theme on their own.
const GENERIC_CATEGORIES = new Set<ExerciseCategory>(['general_fitness', 'upper_body', 'lower_body']);

/** Related categories to borrow from when a focus area is thin in the pool. */
const RELATED_CATEGORIES: Partial<Record<ExerciseCategory, ExerciseCategory[]>> = {
  eye_strain: ['tension_headache', 'neck_pain'],
  tension_headache: ['neck_pain', 'shoulder_tension'],
  carpal_tunnel: ['wrist_forearm'],
  wrist_forearm: ['carpal_tunnel'],
  sciatica: ['hip_flexors', 'lower_back_pain'],
  hip_flexors: ['lower_back_pain', 'sciatica'],
  ankle_circulation: ['calves'],
  calves: ['ankle_circulation', 'lower_body_strength'],
  upper_back_pain: ['back_pain', 'posture'],
  lower_back_pain: ['back_pain', 'core_strength'],
  neck_pain: ['shoulder_tension', 'tension_headache'],
  breathing: ['energizing'],
};

const cost = (e: Exercise) => e.duration + PREP_SECS;

/** Deterministic 32-bit string hash (FNV-1a) — used for signatures and seeds. */
export function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Seeded PRNG (mulberry32) → deterministic generation/shuffle without Math.random. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GeneratorProfile {
  dailyTarget: number;
  durationMinutes?: number;
  focusAreas: ExerciseCategory[];
  availableEquipment: Equipment[];
}

/**
 * A stable fingerprint of the inputs that should force a regenerate when they
 * change (sessions/day, duration, focus areas, equipment). History is deliberately
 * excluded so completing sessions never reshuffles the plan.
 */
export function planSignature(profile: GeneratorProfile): string {
  return JSON.stringify({
    t: profile.dailyTarget,
    d: profile.durationMinutes ?? null,
    f: [...profile.focusAreas].sort(),
    e: [...profile.availableEquipment].sort(),
  });
}

interface SessionInput {
  pool: Exercise[];
  primaryFocus?: ExerciseCategory;
  focusAreas: ExerciseCategory[];
  budgetSecs: number;
  rng: () => number;
  excludeIds: Set<string>;
  popularity: Map<string, number>;
}

/** Selects one session's exercises (in run order) from the pool. */
function buildSession(input: SessionInput): Exercise[] {
  // Prefer exercises not already used today; relax if that leaves too few to choose.
  let available = input.pool.filter(e => !input.excludeIds.has(e.id));
  if (available.length < 4) available = input.pool.slice();

  // Score once (with seeded jitter) and work down the ranked order.
  const ranked = available
    .map(e => ({
      e,
      s: scoreExercise(e, { focusAreas: input.focusAreas, popularity: input.popularity }) + input.rng() * JITTER,
    }))
    .sort((a, b) => b.s - a.s)
    .map(x => x.e);

  const picked: Exercise[] = [];
  const pickedIds = new Set<string>();
  let used = 0;

  const tryAdd = (e?: Exercise): boolean => {
    if (!e || pickedIds.has(e.id)) return false;
    if (picked.length > 0 && used + cost(e) > input.budgetSecs) return false; // always keep ≥1
    picked.push(e);
    pickedIds.add(e.id);
    used += cost(e);
    return true;
  };

  // Quota: ensure the session's primary focus is represented (borrowing from
  // related categories when the focus itself is thin in the pool).
  if (input.primaryFocus) {
    const wanted = [input.primaryFocus, ...(RELATED_CATEGORIES[input.primaryFocus] ?? [])];
    tryAdd(ranked.find(e => !pickedIds.has(e.id) && e.categories.some(c => wanted.includes(c))));
  }

  // Posture / anti-sitting staple — the North Star.
  if (!picked.some(e => e.categories.includes('posture'))) {
    tryAdd(ranked.find(e => !pickedIds.has(e.id) && e.categories.includes('posture')));
  }

  // Fill the remaining budget by score, biasing toward alternating work/stretch.
  while (used < input.budgetSecs && picked.length < MAX_PER_SESSION) {
    const lastType = picked.length ? picked[picked.length - 1].type : null;
    const preferred: Exercise['type'] | null =
      lastType === 'work' ? 'stretch' : lastType === 'stretch' ? 'work' : null;

    const fits = (e: Exercise) => !pickedIds.has(e.id) && used + cost(e) <= input.budgetSecs;
    let next = preferred ? ranked.find(e => e.type === preferred && fits(e)) : undefined;
    if (!next) next = ranked.find(fits);
    if (!tryAdd(next)) break;
  }

  return picked;
}

/** The category that best names a session: its primary focus, else its commonest specific tag. */
function dominantCategory(exercises: Exercise[], primaryFocus?: ExerciseCategory): ExerciseCategory {
  if (primaryFocus) return primaryFocus;
  const counts = new Map<ExerciseCategory, number>();
  for (const e of exercises) {
    for (const c of e.categories) {
      if (GENERIC_CATEGORIES.has(c)) continue;
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
  }
  let best: ExerciseCategory = 'general_fitness';
  let bestCount = -1;
  for (const [c, n] of counts) {
    if (n > bestCount) {
      best = c;
      bestCount = n;
    }
  }
  return best;
}

/**
 * Generates the day's session plan: `dailyTarget` themed sessions drawn from the
 * ranked library. Focus areas round-robin across the sessions (so the day covers
 * them all when there are enough slots), and exercises minimally overlap between
 * sessions. Pure in (profile, popularity, seed).
 */
export function generateDayPlan(
  profile: GeneratorProfile,
  popularity: Map<string, number>,
  seed: number,
): PlannedSession[] {
  const rng = mulberry32(seed);
  const pool = getExercisesForEquipment(EXERCISE_LIBRARY, profile.availableEquipment);
  const budgetSecs = profile.durationMinutes ? profile.durationMinutes * 60 : DEFAULT_SESSION_SECS;
  const focus = profile.focusAreas ?? [];
  const usedToday = new Set<string>();
  const sessions: PlannedSession[] = [];

  for (let i = 0; i < profile.dailyTarget; i++) {
    const primaryFocus = focus.length ? focus[i % focus.length] : undefined;
    const exercises = buildSession({
      pool,
      primaryFocus,
      focusAreas: focus,
      budgetSecs,
      rng,
      excludeIds: usedToday,
      popularity,
    });
    exercises.forEach(e => usedToday.add(e.id));

    const work = exercises.filter(e => e.type === 'work').length;
    const stretch = exercises.length - work;
    const dom = dominantCategory(exercises, primaryFocus);
    sessions.push({
      name: CATEGORY_LABELS[dom] ?? `Session ${i + 1}`,
      emoji: SESSION_EMOJIS[i % SESSION_EMOJIS.length],
      focus: `${work} work · ${stretch} stretch`,
      color: SESSION_COLORS[i % SESSION_COLORS.length],
      exerciseIds: exercises.map(e => e.id),
    });
  }

  return sessions;
}

/**
 * Generates a single targeted quick session (#5) — the same engine with one slot.
 * Returns the chosen exercises (already budget-fit), ready to run.
 */
export function generateQuickSession(
  category: ExerciseCategory,
  durationMinutes: number,
  popularity: Map<string, number> = new Map(),
  availableEquipment: Equipment[] = [],
  seed = 1,
): Exercise[] {
  const plan = generateDayPlan(
    { dailyTarget: 1, durationMinutes, focusAreas: [category], availableEquipment },
    popularity,
    seed,
  );
  return plan[0].exerciseIds.map(getExerciseById).filter((e): e is Exercise => !!e);
}
