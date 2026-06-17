import { useCallback, useEffect, useState } from 'react';
import { CalendarData, DayRecord, Equipment, ExerciseCategory } from '../types';
import { loadState, saveState } from '../storage';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function useWorkoutHistory() {
  const [calData, setCalData] = useState<CalendarData>({});
  const [dailyTarget, setDailyTarget] = useState(5);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number | undefined>(undefined);
  const [skipDays, setSkipDays] = useState<number[]>([]);
  const [skipOverrides, setSkipOverrides] = useState<string[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [focusAreas, setFocusAreas] = useState<ExerciseCategory[]>([]);
  const [completedSessionIds, setCompletedSessionIds] = useState<Set<number>>(new Set());
  const [isDayOff, setIsDayOff] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const state = await loadState();
      if (state) {
        setCalData(state.calData ?? {});
        setDailyTarget(state.settings?.dailyTarget ?? 5);
        setSessionDurationMinutes(state.settings?.sessionDurationMinutes);
        setSkipDays(state.settings?.skipDays ?? []);
        setSkipOverrides(state.settings?.skipOverrides ?? []);
        setAvailableEquipment(state.settings?.availableEquipment ?? []);
        setFocusAreas(state.settings?.focusAreas ?? []);
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

  const persist = useCallback(async (
    newCal: CalendarData,
    target: number,
    duration?: number,
    skip: number[] = skipDays,
    overrides: string[] = skipOverrides,
    equipment: Equipment[] = availableEquipment,
    focus: ExerciseCategory[] = focusAreas,
  ) => {
    await saveState({
      calData: newCal,
      settings: {
        dailyTarget: target,
        sessionDurationMinutes: duration,
        skipDays: skip,
        skipOverrides: overrides,
        availableEquipment: equipment,
        focusAreas: focus,
      },
      version: 3,
    });
  }, [skipDays, skipOverrides, availableEquipment, focusAreas]);

  const markSessionComplete = useCallback(async (sessionId: number, exerciseIds: string[] = []) => {
    const td = todayStr();
    // The set tracks which sessions have been run at least once (record-keeping);
    // the day's *count* comes from sessionRuns so repeats are counted (#3).
    setCompletedSessionIds(prev => new Set([...prev, sessionId]));

    setCalData(cal => {
      const existing: DayRecord = cal[td] ?? {
        date: td,
        sessionsCompleted: 0,
        status: 'partial',
        completedSessionIds: [],
        sessionRuns: [],
      };
      // Record the exercises actually completed so popularity (#38) / #27 are exact.
      const run = { sessionId, completedAt: Date.now(), exerciseIds };
      const sessionRuns = [...(existing.sessionRuns ?? []), run];
      const completedSessionIds = Array.from(
        new Set([...(existing.completedSessionIds ?? []), sessionId]),
      );
      // Repeat tracking (#3): every run counts toward the daily target, including
      // repeats of the same session — so the total is the run count, not unique IDs.
      const runCount = sessionRuns.length;
      const status = runCount >= dailyTarget ? 'completed' : 'partial';
      const updated: DayRecord = {
        ...existing,
        sessionsCompleted: runCount,
        status,
        completedSessionIds,
        sessionRuns,
      };
      const newCal = { ...cal, [td]: updated };
      persist(newCal, dailyTarget, sessionDurationMinutes);
      return newCal;
    });
  }, [dailyTarget, sessionDurationMinutes, persist]);

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
    await persist(newCal, dailyTarget, sessionDurationMinutes);
  }, [calData, dailyTarget, sessionDurationMinutes, persist]);

  const markTodayOff = useCallback(async () => {
    const td = todayStr();
    const newCal: CalendarData = {
      ...calData,
      [td]: { date: td, status: 'dayoff', sessionsCompleted: 0, completedSessionIds: [], sessionRuns: [] },
    };
    setCalData(newCal);
    setIsDayOff(true);
    await persist(newCal, dailyTarget, sessionDurationMinutes);
  }, [calData, dailyTarget, sessionDurationMinutes, persist]);

  const unmarkTodayOff = useCallback(async () => {
    const td = todayStr();
    const { [td]: _removed, ...rest } = calData;
    setCalData(rest);
    setIsDayOff(false);
    await persist(rest, dailyTarget, sessionDurationMinutes);
  }, [calData, dailyTarget, sessionDurationMinutes, persist]);

  const updateDailyTarget = useCallback(async (val: number) => {
    const target = Math.max(1, Math.min(10, val));
    setDailyTarget(target);
    await persist(calData, target, sessionDurationMinutes);
  }, [calData, sessionDurationMinutes, persist]);

  const updateSessionDuration = useCallback(async (val?: number) => {
    const next = val == null ? undefined : Math.max(1, Math.min(30, val));
    setSessionDurationMinutes(next);
    await persist(calData, dailyTarget, next);
  }, [calData, dailyTarget, persist]);

  const updateSkipDays = useCallback(async (day: number) => {
    const next = skipDays.includes(day) ? skipDays.filter(d => d !== day) : [...skipDays, day];
    setSkipDays(next);
    await persist(calData, dailyTarget, sessionDurationMinutes, next, skipOverrides);
  }, [calData, dailyTarget, sessionDurationMinutes, skipDays, skipOverrides, persist]);

  const updateAvailableEquipment = useCallback(async (item: Equipment) => {
    const next = availableEquipment.includes(item)
      ? availableEquipment.filter(e => e !== item)
      : [...availableEquipment, item];
    setAvailableEquipment(next);
    await persist(calData, dailyTarget, sessionDurationMinutes, skipDays, skipOverrides, next);
  }, [availableEquipment, calData, dailyTarget, sessionDurationMinutes, skipDays, skipOverrides, persist]);

  const updateFocusAreas = useCallback(async (category: ExerciseCategory) => {
    const next = focusAreas.includes(category)
      ? focusAreas.filter(c => c !== category)
      : [...focusAreas, category];
    setFocusAreas(next);
    await persist(calData, dailyTarget, sessionDurationMinutes, skipDays, skipOverrides, availableEquipment, next);
  }, [focusAreas, calData, dailyTarget, sessionDurationMinutes, skipDays, skipOverrides, availableEquipment, persist]);

  // Today is a rest day if its weekday is a recurring skip day and not overridden for today.
  const isTodaySkipDay = skipDays.includes(new Date().getDay()) && !skipOverrides.includes(todayStr());

  // Clears today's off state regardless of how it was set: removes a manual day-off
  // record and/or cancels the recurring weekday skip for today only.
  const unskipToday = useCallback(async () => {
    const td = todayStr();
    const { [td]: _removed, ...rest } = calData;
    const nextOverrides =
      skipDays.includes(new Date().getDay()) && !skipOverrides.includes(td)
        ? [...skipOverrides, td]
        : skipOverrides;
    setCalData(rest);
    setIsDayOff(false);
    setSkipOverrides(nextOverrides);
    await persist(rest, dailyTarget, sessionDurationMinutes, skipDays, nextOverrides);
  }, [calData, dailyTarget, sessionDurationMinutes, skipDays, skipOverrides, persist]);

  return {
    calData,
    dailyTarget,
    sessionDurationMinutes,
    skipDays,
    skipOverrides,
    availableEquipment,
    focusAreas,
    isTodaySkipDay,
    completedSessionIds,
    isDayOff,
    loaded,
    markSessionComplete,
    toggleDayOff,
    markTodayOff,
    unmarkTodayOff,
    updateDailyTarget,
    updateSessionDuration,
    updateSkipDays,
    updateAvailableEquipment,
    updateFocusAreas,
    unskipToday,
    todayStr,
  };
}
