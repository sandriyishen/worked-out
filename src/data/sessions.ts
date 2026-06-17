import { CalendarData, WorkoutSession } from '../types';
import { getExerciseById } from './exerciseLibrary';

// PREP_SECS is owned by the library (it's the per-exercise time cost) but has
// historically been imported from here by the runner; keep that import path stable.
export { PREP_SECS } from './exerciseLibrary';

/**
 * A curated built-in session: presentation metadata plus an ordered list of
 * exercise ids referencing the library (#38). The exercise *definitions* live in
 * `builtInExercises.ts` / the `EXERCISE_LIBRARY`; presets keep only the expert
 * sequencing, so there is no duplicated exercise data.
 */
interface SessionPreset {
  id: number;
  name: string;
  emoji: string;
  time: string;
  focus: string;
  color: string;
  exerciseIds: string[];
}

const SESSION_PRESETS: SessionPreset[] = [
  {
    id: 1,
    name: 'Morning Ignition',
    emoji: '🌅',
    time: '9–10am',
    focus: 'Core activation + spine wake-up',
    color: '#E8531A',
    exerciseIds: ['s1-e1', 's1-e2', 's1-e3', 's1-e4', 's1-e5', 's1-e6'],
  },
  {
    id: 2,
    name: 'Mid-Morning Burn',
    emoji: '🔥',
    time: '11am–12pm',
    focus: 'Core + upper body',
    color: '#D4A017',
    exerciseIds: ['s2-e1', 's2-e2', 's2-e3', 's2-e4', 's2-e5', 's2-e6'],
  },
  {
    id: 3,
    name: 'Lunch Reset',
    emoji: '⚡',
    time: '12–1pm',
    focus: 'Full-body reset + fat burn',
    color: '#2E7D9F',
    exerciseIds: ['s3-e1', 's3-e2', 's3-e3', 's3-e4', 's3-e5', 's3-e6'],
  },
  {
    id: 4,
    name: 'Afternoon Power',
    emoji: '💪',
    time: '2–3pm',
    focus: 'Core + chest push',
    color: '#6B3FA0',
    exerciseIds: ['s4-e1', 's4-e2', 's4-e3', 's4-e4', 's4-e5', 's4-e6'],
  },
  {
    id: 5,
    name: 'End-of-Day Release',
    emoji: '🌙',
    time: '4–5pm',
    focus: 'Decompress + recovery',
    color: '#1A6B45',
    exerciseIds: ['s5-e1', 's5-e2', 's5-e3', 's5-e4', 's5-e5', 's5-e6'],
  },
];

/** Resolves a preset's ordered id-list into full library `Exercise` objects. */
function hydratePreset(preset: SessionPreset): WorkoutSession {
  const { exerciseIds, ...meta } = preset;
  const exercises = exerciseIds.map(id => {
    const exercise = getExerciseById(id);
    if (!exercise) {
      throw new Error(
        `Session "${preset.name}" references unknown exercise id "${id}".`,
      );
    }
    return exercise;
  });
  return { ...meta, exercises };
}

/**
 * The 5 curated built-in sessions, hydrated from the library. Each session's
 * `exercises` are the exact library objects (shared by reference), so the library
 * remains the single source of truth for exercise content.
 */
export const SESSIONS: WorkoutSession[] = SESSION_PRESETS.map(hydratePreset);

/**
 * Builds the day's session list of length `count` by cycling the curated
 * built-in sessions and presenting them generically ("Session 1", "Session 2", …).
 *
 * The number of sessions shown is driven by AppSettings.dailyTarget. Each slot
 * keeps its base session's exercises/color/emoji (for variety) but gets a generic
 * name and a slot-index id so React keys and index-based completion stay unique.
 */
export function buildDaySessions(count: number): WorkoutSession[] {
  return Array.from({ length: count }, (_, i) => {
    const base = SESSIONS[i % SESSIONS.length];
    return { ...base, id: i, name: `Session ${i + 1}`, time: '' };
  });
}

/** Built-in sessions whose exercise list contains the given exercise id. */
export function sessionsContainingExercise(id: string): WorkoutSession[] {
  return SESSIONS.filter(s => s.exercises.some(e => e.id === id));
}

/** The preset a session slot maps to: slot `i` cycles the built-ins (`i % 5`). */
function presetForSlot(slot: number): WorkoutSession {
  return SESSIONS[((slot % SESSIONS.length) + SESSIONS.length) % SESSIONS.length];
}

/**
 * Derives a normalised (0–1) popularity per exercise id from completion history
 * (#38 Phase B; the same derivation #27's per-exercise counter needs).
 *
 * Each `SessionRun` records a completed session *slot*, not its exercises, so we
 * attribute a run to the exercises of the preset that slot maps to. This assumes
 * the full preset ran (it ignores duration-budget trimming), which is a fine
 * signal for ranking. The most-completed exercise scores 1; an empty history
 * yields an empty map (every exercise then reads 0 in `scoreExercise`).
 */
export function exercisePopularity(calData: CalendarData): Map<string, number> {
  const counts = new Map<string, number>();
  for (const day of Object.values(calData)) {
    for (const run of day.sessionRuns ?? []) {
      for (const ex of presetForSlot(run.sessionId).exercises) {
        counts.set(ex.id, (counts.get(ex.id) ?? 0) + 1);
      }
    }
  }
  const max = Math.max(0, ...counts.values());
  if (max === 0) return new Map();
  const popularity = new Map<string, number>();
  for (const [id, count] of counts) popularity.set(id, count / max);
  return popularity;
}
