import { CalendarData, Exercise, ExerciseCategory } from '../types';

/**
 * Exercise ranking (#38 Phase B).
 *
 * A single, tunable score blends four signals so the daily generator (#38 Phase C)
 * and the quick-session engine (#5) can pick the "best" exercises for a context:
 *
 *   score = w.efficacy · (efficacy/5)
 *         + w.ease     · (ease/5)          // ease = 6 − difficulty
 *         + w.popularity · popularity      // 0–1, history-derived (see sessions.ts)
 *         + w.focus    · focusMatch        // 1 if any category is a user focus area
 *
 * This module is intentionally **pure** (depends only on `types`): it never imports
 * the library or sessions, so it can be used from anywhere without an import cycle.
 * Popularity is computed elsewhere (it needs the session presets) and passed in.
 *
 * Weights and per-exercise efficacy/difficulty seed values are an open decision —
 * the defaults below are neutral starting points, not tuned.
 */

export interface RankingWeights {
  efficacy: number;
  ease: number;
  popularity: number;
  focus: number;
  /**
   * Soft boost added when an exercise is favorited (#2). Applied *on top* of the
   * 0–1 base — the four core weights still sum to 1, so a favorited exercise can
   * score above 1. Favoriting nudges an exercise to show up more often without the
   * hard guarantee that pinning gives.
   */
  favorite: number;
};

/** Neutral default weights (the four core signals sum to 1; favorite is an additive bonus). Tunable. */
export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  efficacy: 0.35,
  ease: 0.15,
  popularity: 0.2,
  focus: 0.3,
  favorite: 0.15,
};

/** Neutral efficacy used when an exercise carries no editorial rating. */
export const DEFAULT_EFFICACY = 3;

/** Editorial efficacy (1–5), defaulting to neutral when unset. */
export function effectiveEfficacy(ex: Exercise): number {
  return ex.efficacy ?? DEFAULT_EFFICACY;
}

/**
 * Editorial difficulty (1–5), defaulting by type when unset: stretches read as
 * gentler (2) than work (3), so they rank slightly higher on the "ease" signal
 * absent an authored value.
 */
export function effectiveDifficulty(ex: Exercise): number {
  return ex.difficulty ?? (ex.type === 'work' ? 3 : 2);
}

export interface ScoreContext {
  /** The user's stated focus categories; an exercise matching any scores on focus. */
  focusAreas?: ExerciseCategory[];
  /** Normalised popularity per exercise id (0–1); see `exercisePopularity` in sessions.ts. */
  popularity?: Map<string, number>;
  /** Favorited exercise ids (#2): each gets the additive `favorite` boost. */
  favoriteIds?: Set<string>;
  /** Override the default weights. */
  weights?: RankingWeights;
}

/** Computes the blended ranking score for a single exercise (higher = better). */
export function scoreExercise(ex: Exercise, ctx: ScoreContext = {}): number {
  const w = ctx.weights ?? DEFAULT_RANKING_WEIGHTS;
  const efficacy = effectiveEfficacy(ex) / 5;
  const ease = (6 - effectiveDifficulty(ex)) / 5;
  const popularity = ctx.popularity?.get(ex.id) ?? 0;
  const focusMatch =
    ctx.focusAreas && ctx.focusAreas.length
      ? ex.categories.some(c => ctx.focusAreas!.includes(c))
        ? 1
        : 0
      : 0;
  const favorite = ctx.favoriteIds?.has(ex.id) ? w.favorite : 0;
  return (
    w.efficacy * efficacy +
    w.ease * ease +
    w.popularity * popularity +
    w.focus * focusMatch +
    favorite
  );
}

/**
 * Returns a new array of the exercises sorted by descending score. Stable for
 * equal scores (preserves the input order), so curated ordering survives ties.
 */
export function rankExercises(exercises: Exercise[], ctx: ScoreContext = {}): Exercise[] {
  return exercises
    .map((ex, i) => ({ ex, i, score: scoreExercise(ex, ctx) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map(e => e.ex);
}

/**
 * Derives a normalised (0–1) popularity per exercise id from completion history —
 * the popularity signal `scoreExercise` consumes, and the data #27's per-exercise
 * counter needs. Reads the exact `SessionRun.exerciseIds` recorded at completion
 * (#38 Phase C); runs from before Phase C carry no ids and are skipped. The
 * most-completed exercise scores 1; an empty history yields an empty map.
 *
 * Pure (depends only on `types`), so it stays in this cycle-free module.
 */
export function exercisePopularity(calData: CalendarData): Map<string, number> {
  const counts = new Map<string, number>();
  for (const day of Object.values(calData)) {
    for (const run of day.sessionRuns ?? []) {
      for (const id of run.exerciseIds ?? []) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
  }
  const max = Math.max(0, ...counts.values());
  if (max === 0) return new Map();
  const popularity = new Map<string, number>();
  for (const [id, count] of counts) popularity.set(id, count / max);
  return popularity;
}
