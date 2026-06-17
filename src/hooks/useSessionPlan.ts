import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarData, Equipment, ExerciseCategory, SessionPlan, WorkoutSession } from '../types';
import { getExerciseById } from '../data/exerciseLibrary';
import { exercisePopularity } from '../data/ranking';
import {
  GeneratorProfile,
  generateDayPlan,
  hashString,
  planSignature,
} from '../data/sessionGenerator';
import { loadPlan, savePlan } from '../storage';

interface Args {
  dailyTarget: number;
  sessionDurationMinutes?: number;
  focusAreas: ExerciseCategory[];
  availableEquipment: Equipment[];
  pinnedExerciseIds: string[];
  favoriteExerciseIds: string[];
  calData: CalendarData;
  /** Gate generation until settings have loaded, so the first signature is correct. */
  ready: boolean;
}

export interface SessionPlanAPI {
  /** The generated sessions, hydrated into runnable `WorkoutSession`s (Session 1…N order). */
  daySessions: WorkoutSession[];
  /** Regenerate with a new seed (same profile) — the "I'm bored" shuffle. */
  shuffle: () => void;
}

/** Hydrates a persisted plan's id-lists into runnable sessions (library is the source of truth). */
function hydrate(plan: SessionPlan): WorkoutSession[] {
  return plan.sessions.map((s, i) => ({
    id: i,
    name: s.name,
    emoji: s.emoji,
    time: '',
    focus: s.focus,
    color: s.color,
    exercises: s.exerciseIds
      .map(getExerciseById)
      .filter((e): e is NonNullable<ReturnType<typeof getExerciseById>> => !!e),
  }));
}

/**
 * Owns the user's persisted, dynamically-generated session plan (#38 Phase C).
 *
 * The plan is generated once and reused every day so the routine stays stable. It
 * regenerates only when the profile *signature* changes (sessions/day, duration,
 * focus areas, equipment) or the user calls `shuffle()` (which bumps the seed).
 * Completion history is read only at generation time (via a ref) to seed
 * popularity — it never triggers a regenerate, so finishing a session never
 * reshuffles the plan.
 */
export function useSessionPlan({
  dailyTarget,
  sessionDurationMinutes,
  focusAreas,
  availableEquipment,
  pinnedExerciseIds,
  favoriteExerciseIds,
  calData,
  ready,
}: Args): SessionPlanAPI {
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [loadedPlan, setLoadedPlan] = useState(false);

  // Latest history, read at generation time only (not a regenerate trigger).
  const calDataRef = useRef(calData);
  useEffect(() => { calDataRef.current = calData; }, [calData]);

  // Load any persisted plan once.
  useEffect(() => {
    (async () => {
      setPlan(await loadPlan());
      setLoadedPlan(true);
    })();
  }, []);

  const profile: GeneratorProfile = {
    dailyTarget,
    durationMinutes: sessionDurationMinutes,
    focusAreas,
    availableEquipment,
    pinnedExerciseIds,
    favoriteExerciseIds,
  };
  const signature = planSignature(profile);

  const regenerate = useCallback(
    (seed: number) => {
      const popularity = exercisePopularity(calDataRef.current);
      const sessions = generateDayPlan(profile, popularity, seed);
      const next: SessionPlan = { signature, seed, sessions };
      setPlan(next);
      savePlan(next);
    },
    // profile fields are captured via `signature`; popularity via the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature],
  );

  // Generate when ready if there's no plan yet, or the profile signature changed.
  useEffect(() => {
    if (!ready || !loadedPlan) return;
    if (!plan || plan.signature !== signature) {
      regenerate(plan?.seed ?? hashString(signature));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, loadedPlan, signature]);

  const shuffle = useCallback(() => {
    regenerate((plan?.seed ?? hashString(signature)) + 1);
  }, [plan, signature, regenerate]);

  // Memoised by plan identity + signature so the array reference is stable across
  // renders (it only changes on regenerate), keeping the timer/effects in index quiet.
  const daySessions = useMemo(
    () => (plan && plan.signature === signature ? hydrate(plan) : []),
    [plan, signature],
  );

  return { daySessions, shuffle };
}
