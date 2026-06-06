import { useCallback, useEffect, useState } from 'react';
import { CalendarData, DayRecord } from '../types';
import { loadState, saveState } from '../storage';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function useWorkoutHistory() {
  const [calData, setCalData] = useState<CalendarData>({});
  const [dailyTarget, setDailyTarget] = useState(5);
  const [completedSessionIds, setCompletedSessionIds] = useState<Set<number>>(new Set());
  const [isDayOff, setIsDayOff] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const state = await loadState();
      if (state) {
        setCalData(state.calData ?? {});
        setDailyTarget(state.settings?.dailyTarget ?? 5);
        const td = todayStr();
        const rec = (state.calData ?? {})[td];
        if (rec) {
          setCompletedSessionIds(new Set(rec.completedSessionIds));
          setIsDayOff(rec.status === 'dayoff');
        }
      }
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback(async (newCal: CalendarData, target: number) => {
    await saveState({ calData: newCal, settings: { dailyTarget: target }, version: 3 });
  }, []);

  const markSessionComplete = useCallback(async (sessionId: number) => {
    setCompletedSessionIds(prev => {
      const next = new Set([...prev, sessionId]);
      const count = next.size;
      const td = todayStr();

      setCalData(cal => {
        const existing: DayRecord = cal[td] ?? {
          date: td,
          sessionsCompleted: 0,
          status: 'partial',
          completedSessionIds: [],
          sessionRuns: [],
        };
        const status = count >= dailyTarget ? 'completed' : 'partial';
        const run = { sessionId, completedAt: Date.now() };
        const updated: DayRecord = {
          ...existing,
          sessionsCompleted: count,
          status,
          completedSessionIds: [...next],
          sessionRuns: [...(existing.sessionRuns ?? []), run],
        };
        const newCal = { ...cal, [td]: updated };
        persist(newCal, dailyTarget);
        return newCal;
      });

      return next;
    });
  }, [dailyTarget, persist]);

  const toggleDayOff = useCallback(async (ds: string, currentStatus?: string) => {
    let newCal: CalendarData;
    if (currentStatus === 'dayoff') {
      const { [ds]: _removed, ...rest } = calData;
      newCal = rest;
    } else {
      newCal = {
        ...calData,
        [ds]: {
          date: ds,
          status: 'dayoff',
          sessionsCompleted: 0,
          completedSessionIds: [],
          sessionRuns: [],
        },
      };
    }
    setCalData(newCal);
    if (ds === todayStr()) setIsDayOff(currentStatus !== 'dayoff');
    await persist(newCal, dailyTarget);
  }, [calData, dailyTarget, persist]);

  const markTodayOff = useCallback(async () => {
    const td = todayStr();
    const newCal: CalendarData = {
      ...calData,
      [td]: { date: td, status: 'dayoff', sessionsCompleted: 0, completedSessionIds: [], sessionRuns: [] },
    };
    setCalData(newCal);
    setIsDayOff(true);
    await persist(newCal, dailyTarget);
  }, [calData, dailyTarget, persist]);

  const unmarkTodayOff = useCallback(async () => {
    const td = todayStr();
    const { [td]: _removed, ...rest } = calData;
    setCalData(rest);
    setIsDayOff(false);
    await persist(rest, dailyTarget);
  }, [calData, dailyTarget, persist]);

  const updateDailyTarget = useCallback(async (val: number) => {
    const target = Math.max(1, Math.min(10, val));
    setDailyTarget(target);
    await persist(calData, target);
  }, [calData, persist]);

  return {
    calData,
    dailyTarget,
    completedSessionIds,
    isDayOff,
    loaded,
    markSessionComplete,
    toggleDayOff,
    markTodayOff,
    unmarkTodayOff,
    updateDailyTarget,
    todayStr,
  };
}
