import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { WorkoutSession } from '../src/types';
import { useWorkoutTimer } from '../src/hooks/useWorkoutTimer';
import { useWorkoutHistory } from '../src/hooks/useWorkoutHistory';
import { useSessionPlan } from '../src/hooks/useSessionPlan';
import { Header } from '../src/components/Header';
import { SettingsPanel } from '../src/components/SettingsPanel';
import { SessionAccordion } from '../src/components/SessionAccordion';
import { CalendarTab } from '../src/components/CalendarTab';
import { Colors, Fonts } from '../src/theme';

type Tab = 'workout' | 'calendar';

// Accent used before the generated plan has hydrated (first launch / mid-regenerate).
const FALLBACK_SESSION: WorkoutSession = {
  id: 0, name: '', emoji: '', time: '', focus: '', color: Colors.work, exercises: [],
};

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('workout');
  // Which session row is expanded (the active, timer-bound session). One at a
  // time — true accordion. `null` means every row is collapsed.
  const [expanded, setExpanded] = useState<number | null>(0);
  const [showSettings, setShowSettings] = useState(false);

  const {
    calData,
    dailyTarget,
    sessionDurationMinutes,
    skipDays,
    availableEquipment,
    focusAreas,
    isTodaySkipDay,
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
  } = useWorkoutHistory();

  // The day's sessions are a persisted, generated plan (#38 Phase C): stable day to
  // day, regenerated only on profile change or an explicit shuffle.
  const { daySessions, shuffle } = useSessionPlan({
    dailyTarget,
    sessionDurationMinutes,
    focusAreas,
    availableEquipment,
    calData,
    ready: loaded,
  });
  const effectiveDayOff = isDayOff || isTodaySkipDay;

  // The header/tab accent follows the expanded session, defaulting to the first.
  const accentSession = daySessions[expanded ?? 0] ?? daySessions[0] ?? FALLBACK_SESSION;

  // The expanded session drives the single timer; its exercises are the plan's.
  const expandedSession = expanded == null ? null : daySessions[expanded] ?? null;
  const expandedExercises = useMemo(
    () => expandedSession?.exercises ?? [],
    [expandedSession],
  );

  // Keep the expanded index in range when the plan shrinks below it.
  useEffect(() => {
    if (daySessions.length > 0 && expanded != null && expanded > daySessions.length - 1) {
      setExpanded(daySessions.length - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daySessions.length]);

  const handleSessionComplete = useCallback(() => {
    if (expanded != null) markSessionComplete(expanded, expandedExercises.map(e => e.id));
  }, [expanded, expandedExercises, markSessionComplete]);

  const timer = useWorkoutTimer({
    exercises: expandedExercises,
    onSessionComplete: handleSessionComplete,
  });

  // Reset the timer whenever the plan changes (regenerate / shuffle / duration edit)
  // so a running session never bleeds onto a freshly-generated exercise list.
  useEffect(() => {
    timer.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daySessions]);

  // Expand a collapsed row (or collapse the open one). Either way the timer
  // resets so a half-run session never bleeds into another row.
  const handleToggle = useCallback((idx: number) => {
    timer.reset();
    setExpanded(prev => (prev === idx ? null : idx));
  }, [timer]);

  const handleNextSession = useCallback(() => {
    if (daySessions.length === 0) return;
    timer.reset();
    setExpanded(prev => (prev == null ? null : Math.min(prev + 1, daySessions.length - 1)));
  }, [timer, daySessions.length]);

  // Today's runs drive both the per-slot row badge and the day total. With repeat
  // tracking (#3) the day total is the run count, so repeating a session counts.
  const todaysRuns = calData[todayStr()]?.sessionRuns ?? [];
  const runCountFor = useCallback(
    (slot: number) => todaysRuns.filter(r => r.sessionId === slot).length,
    [todaysRuns],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Sticky header section */}
      <View style={[styles.stickyHeader, { borderBottomColor: Colors.border }]}>
        <Header
          session={accentSession}
          showSettings={showSettings}
          onToggleSettings={() => setShowSettings(s => !s)}
          onOpenLibrary={() => router.push('/library')}
        />
        {showSettings && (
          <SettingsPanel
            dailyTarget={dailyTarget}
            sessionDurationMinutes={sessionDurationMinutes}
            skipDays={skipDays}
            availableEquipment={availableEquipment}
            focusAreas={focusAreas}
            isDayOff={isDayOff}
            sessionColor={accentSession.color}
            onUpdateTarget={updateDailyTarget}
            onUpdateDuration={updateSessionDuration}
            onToggleSkipDay={updateSkipDays}
            onToggleEquipment={updateAvailableEquipment}
            onToggleFocus={updateFocusAreas}
            onMarkTodayOff={async () => { await markTodayOff(); timer.reset(); }}
            onUnmarkTodayOff={unmarkTodayOff}
          />
        )}
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: Colors.border }]}>
        {(['workout', 'calendar'] as Tab[]).map(id => (
          <TouchableOpacity
            key={id}
            onPress={() => setActiveTab(id)}
            style={[styles.tab, activeTab === id && { borderBottomColor: accentSession.color, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabText, { color: activeTab === id ? accentSession.color : Colors.textMuted, fontWeight: activeTab === id ? '700' : '400' }]}>
              {id === 'workout' ? 'WORKOUT' : 'CALENDAR'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scrollable content */}
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {activeTab === 'calendar' ? (
          <CalendarTab
            calData={calData}
            dailyTarget={dailyTarget}
            onToggleDay={toggleDayOff}
          />
        ) : (
          <SessionAccordion
            sessions={daySessions}
            expanded={effectiveDayOff ? null : expanded}
            onToggle={handleToggle}
            isDayOff={effectiveDayOff}
            onUnskipToday={unskipToday}
            expandedExercises={expandedExercises}
            timer={timer}
            runCountFor={runCountFor}
            sessionsDone={todaysRuns.length}
            dailyTarget={dailyTarget}
            onNextSession={handleNextSession}
            onShuffle={shuffle}
            hasFocusAreas={focusAreas.length > 0}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  stickyHeader: {
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 2,
  },
  content: {
    flex: 1,
  },
});
