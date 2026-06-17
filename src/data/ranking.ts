import { Exercise, ExerciseCategory } from '../types';

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
}

/** Neutral default weights (sum to 1, so a score lands in 0–1). Tunable. */
export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  efficacy: 0.35,
  ease: 0.15,
  popularity: 0.2,
  focus: 0.3,
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
  return (
    w.efficacy * efficacy +
    w.ease * ease +
    w.popularity * popularity +
    w.focus * focusMatch
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
