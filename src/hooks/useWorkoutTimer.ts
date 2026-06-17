import { useCallback, useEffect, useRef, useState } from 'react';
import { Exercise } from '../types';
import { PREP_SECS } from '../data/exerciseLibrary';

export type WorkoutPhase = 'idle' | 'prep' | 'active' | 'done';

export interface WorkoutTimerAPI {
  phase: WorkoutPhase;
  exIdx: number;
  timer: number;
  paused: boolean;
  showSwitch: boolean;
  exercise: Exercise | null;
  start: () => void;
  reset: () => void;
  togglePause: () => void;
}

interface Props {
  exercises: Exercise[];
  onSessionComplete: () => void;
}

export function useWorkoutTimer({ exercises, onSessionComplete }: Props): WorkoutTimerAPI {
  const [phase, setPhase] = useState<WorkoutPhase>('idle');
  const [exIdx, setExIdx] = useState(0);
  const [timer, setTimer] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showSwitch, setShowSwitch] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const switchFiredRef = useRef(false);
  const pausedRef = useRef(false);
  const onCompleteRef = useRef(onSessionComplete);

  useEffect(() => { onCompleteRef.current = onSessionComplete; }, [onSessionComplete]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const exercise = (phase === 'active' || phase === 'prep') ? exercises[exIdx] ?? null : null;

  const clearTick = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (phase === 'idle' || phase === 'done') {
      clearTick();
      return;
    }

    clearTick();
    intervalRef.current = setInterval(() => {
      if (pausedRef.current) return;

      setTimer(t => {
        if (t <= 1) {
          clearTick();
          if (phase === 'prep') {
            setShowSwitch(false);
            switchFiredRef.current = false;
            setPhase('active');
            setTimer(exercises[exIdx].duration);
          } else if (phase === 'active') {
            setShowSwitch(false);
            const next = exIdx + 1;
            if (next < exercises.length) {
              setExIdx(next);
              setPhase('prep');
              setTimer(PREP_SECS);
              switchFiredRef.current = false;
            } else {
              setPhase('done');
              onCompleteRef.current();
            }
          }
          return 0;
        }

        if (phase === 'active' && exercise?.bilateral && !switchFiredRef.current) {
          const elapsed = exercise.duration - t + 1;
          if (elapsed >= (exercise.switchAt ?? 0)) {
            switchFiredRef.current = true;
            setShowSwitch(true);
            setTimeout(() => setShowSwitch(false), 4000);
          }
        }

        return t - 1;
      });
    }, 1000);

    return clearTick;
  }, [phase, exIdx, exercises, exercise]);

  const start = useCallback(() => {
    setExIdx(0);
    setPhase('prep');
    setTimer(PREP_SECS);
    setShowSwitch(false);
    setPaused(false);
    switchFiredRef.current = false;
  }, []);

  const reset = useCallback(() => {
    clearTick();
    setPhase('idle');
    setExIdx(0);
    setTimer(0);
    setShowSwitch(false);
    setPaused(false);
    switchFiredRef.current = false;
  }, []);

  const togglePause = useCallback(() => setPaused(p => !p), []);

  return { phase, exIdx, timer, paused, showSwitch, exercise, start, reset, togglePause };
}
