export type ExerciseCategory =
  // Complaint / relief
  | 'back_pain'
  | 'upper_back_pain'
  | 'lower_back_pain'
  | 'neck_pain'
  | 'carpal_tunnel'
  | 'wrist_forearm'
  | 'shoulder_tension'
  | 'hip_flexors'
  | 'sciatica'
  | 'eye_strain'
  | 'tension_headache'
  | 'ankle_circulation'
  | 'breathing'
  | 'posture'
  // Strength
  | 'core_strength'
  | 'back_strength'
  | 'upper_body_strength'
  | 'lower_body_strength'
  // Sculpting / fat-target
  | 'chest_sculpting'
  | 'shoulder_sculpting'
  | 'arm_sculpting'
  | 'leg_sculpting'
  | 'belly_fat'
  | 'calves'
  // Wellness / goal
  | 'general_fitness'
  | 'upper_body'
  | 'lower_body'
  | 'cardio'
  | 'balance'
  | 'energizing';

export type BodyArea =
  | 'neck'
  | 'shoulders'
  | 'upper_back'
  | 'lower_back'
  | 'core'
  | 'wrists'
  | 'forearms'
  | 'arms'
  | 'chest'
  | 'hips'
  | 'glutes'
  | 'legs'
  | 'calves'
  | 'ankles'
  | 'eyes'
  | 'full_body';

export type Equipment = 'none' | 'chair' | 'desk' | 'wall' | 'doorframe';

export interface Exercise {
  id: string;
  name: string;
  duration: number;
  type: 'work' | 'stretch';
  desc: string;
  bilateral?: boolean;
  switchAt?: number;
  reps?: string;
  /**
   * Optional safety note, e.g. "Skip if you have acute lower-back pain."
   * Surfaced in the library detail (#4) and optionally the runner prep card (#31).
   * Absent for exercises with no specific contraindication.
   */
  contraindications?: string;
  /**
   * Editorial efficacy rating 1–5 (higher = more effective for its categories).
   * Feeds the ranking score (#38 Phase B). Optional — the ranker falls back to a
   * neutral default when unset; per-exercise seed values are an open decision.
   */
  efficacy?: number;
  /**
   * Editorial difficulty 1–5 (higher = harder). The ranker uses ease = 6 − difficulty.
   * Optional — defaults by exercise type when unset (#38 Phase B).
   */
  difficulty?: number;
  categories: ExerciseCategory[];
  targetAreas: BodyArea[];
  equipment: Equipment;
}

export interface WorkoutSession {
  id: number;
  name: string;
  emoji: string;
  time: string;
  focus: string;
  color: string;
  exercises: Exercise[];
  isCustom?: boolean;
  durationMinutes?: number;
}

export interface SessionRun {
  sessionId: number;
  completedAt: number;
  /**
   * The library ids of the exercises actually completed in this run (#38 Phase C).
   * Lets popularity (#38) and the per-exercise counter (#27) be derived exactly,
   * instead of inferring exercises from a session slot. Optional for back-compat
   * with runs recorded before Phase C.
   */
  exerciseIds?: string[];
}

export interface DayRecord {
  date: string;
  sessionsCompleted: number;
  status: 'completed' | 'partial' | 'dayoff' | 'missed';
  completedSessionIds: number[];
  sessionRuns: SessionRun[];
}

export interface CalendarData {
  [date: string]: DayRecord;
}

export interface AppSettings {
  dailyTarget: number;
  sessionDurationMinutes?: number; // undefined = Auto (full session, current behavior)
  skipDays?: number[];             // recurring rest weekdays, 0=Sun … 6=Sat (Date.getDay())
  skipOverrides?: string[];        // YYYY-MM-DD dates where a recurring skip is cancelled
  availableEquipment?: Equipment[]; // equipment the user has (chair/desk/wall/doorframe); undefined/empty = none
  focusAreas?: ExerciseCategory[];  // categories the user wants to target (#38 Phase C); feeds the generator
  pinnedExerciseIds?: string[];     // exercises guaranteed into the generated plan, surviving shuffle (#2)
  favoriteExerciseIds?: string[];   // bookmarked exercises; soft ranking boost + library filter (#2)
}

export interface PersistedState {
  calData: CalendarData;
  settings: AppSettings;
  version: number;
}

/** One generated session in the persisted plan: theme metadata + ordered exercise ids. */
export interface PlannedSession {
  name: string;
  emoji: string;
  focus: string;
  color: string;
  exerciseIds: string[];
}

/**
 * The user's persisted, dynamically-generated session plan (#38 Phase C). Generated
 * once and reused every day so the routine is stable; regenerated only when the
 * profile `signature` changes (focus areas / equipment / target / duration) or the
 * user shuffles (which bumps `seed`).
 */
export interface SessionPlan {
  signature: string;
  seed: number;
  sessions: PlannedSession[];
}
