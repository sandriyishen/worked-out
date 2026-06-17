import React, { createContext, useContext } from 'react';
import { useWorkoutHistory } from '../hooks/useWorkoutHistory';

type WorkoutHistory = ReturnType<typeof useWorkoutHistory>;

const WorkoutHistoryContext = createContext<WorkoutHistory | null>(null);

/**
 * Provides a single shared `useWorkoutHistory` instance to the whole app. Because
 * it sits above the navigator (in the root layout), every screen — the main
 * workout screen and the quick-session screen (#5) — reads and writes the *same*
 * calendar/settings state. A quick session completed on one screen is therefore
 * reflected live on the other, with no AsyncStorage round-trip or remount.
 */
export function WorkoutHistoryProvider({ children }: { children: React.ReactNode }) {
  const history = useWorkoutHistory();
  return (
    <WorkoutHistoryContext.Provider value={history}>
      {children}
    </WorkoutHistoryContext.Provider>
  );
}

export function useWorkoutHistoryContext(): WorkoutHistory {
  const ctx = useContext(WorkoutHistoryContext);
  if (!ctx) {
    throw new Error('useWorkoutHistoryContext must be used within a WorkoutHistoryProvider');
  }
  return ctx;
}
