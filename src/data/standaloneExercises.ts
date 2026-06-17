import { Exercise } from '../types';

/**
 * Standalone library exercises (feature #26).
 *
 * These exercises are NOT part of the 5 built-in `SESSIONS`; they exist to give
 * every complaint category broad, balanced coverage. They are merged into
 * `EXERCISE_LIBRARY` (see `exerciseLibrary.ts`), which is the single pool the
 * session machinery draws from — so this content is **reachable when building
 * sessions** (`fitSessionToBudget`'s extend path, and the quick-session
 * generator in #5), not library-only. On an id collision a built-in session
 * exercise wins (sessions are concatenated first, then de-duped keep-first).
 *
 * ── Authoring gate ──────────────────────────────────────────────────────────
 * Content is authored in #26 *Phase 2*, and only AFTER the developer approves
 * the category set in #26 *Phase 1*. Every entry must:
 *   - conform fully to the `Exercise` model (unique `id`, full metadata);
 *   - honour the philosophy (short, no-gym: equipment ∈
 *     none/chair/desk/wall/doorframe, text-only `desc`, no warm-up ceremony);
 *   - carry a `contraindications` note where a movement could aggravate a
 *     condition (#31);
 *   - NOT duplicate an exercise already in the built-in sessions.
 *
 * ⚠ Movement instructions are quasi-medical. This AI-authored content requires
 * a human safety review before it is merged to `main`.
 */
export const STANDALONE_EXERCISES: Exercise[] = [
  // Populated in #26 Phase 2, after category approval + human review.
];
