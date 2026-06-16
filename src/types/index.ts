export type ExerciseCategory =
  | 'back_pain'
  | 'neck_pain'
  | 'carpal_tunnel'
  | 'shoulder_tension'
  | 'hip_flexors'
  | 'eye_strain'
  | 'general_fitness'
  | 'core_strength'
  | 'upper_body'
  | 'lower_body'
  | 'cardio'
  | 'breathing'
  | 'posture';

export type BodyArea =
  | 'neck'
  | 'shoulders'
  | 'upper_back'
  | 'lower_back'
  | 'core'
  | 'wrists'
  | 'forearms'
  | 'chest'
  | 'hips'
  | 'legs'
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
}

export interface PersistedState {
  calData: CalendarData;
  settings: AppSettings;
  version: number;
}
