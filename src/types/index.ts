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
}

export interface PersistedState {
  calData: CalendarData;
  settings: AppSettings;
  version: number;
}
