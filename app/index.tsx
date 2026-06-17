import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildDaySessions } from '../src/data/sessions';
import { fitSessionToBudget } from '../src/data/exerciseLibrary';
import { useWorkoutTimer } from '../src/hooks/useWorkoutTimer';
import { useWorkoutHistory } from '../src/hooks/useWorkoutHistory';
import { Header } from '../src/components/Header';
import { SettingsPanel } from '../src/components/SettingsPanel';
import { SessionTabBar } from '../src/components/SessionTabBar';
import { WorkoutTab } from '../src/components/WorkoutTab';
import { CalendarTab } from '../src/components/CalendarTab';
import { Colors, Fonts } from '../src/theme';

type Tab = 'workout' | 'calendar';

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('workout');
  const [activeSession, setActiveSession] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const {
    calData,
    dailyTarget,
    sessionDurationMinutes,
    skipDays,
    availableEquipment,
    isTodaySkipDay,
    completedSessionIds,
    isDayOff,
    markSessionComplete,
    toggleDayOff,
    markTodayOff,
    unmarkTodayOff,
    updateDailyTarget,
    updateSessionDuration,
    updateSkipDays,
    updateAvailableEquipment,
    unskipToday,
  } = useWorkoutHistory();

  // The day's sessions are generic ("Session 1"…N), count driven by dailyTarget.
  const daySessions = useMemo(() => buildDaySessions(dailyTarget), [dailyTarget]);
  const safeActive = Math.min(activeSession, daySessions.length - 1);
  const session = daySessions[safeActive];
  const effectiveDayOff = isDayOff || isTodaySkipDay;

  // Keep the selected index in range when the target shrinks below it.
  useEffect(() => {
    if (activeSession > daySessions.length - 1) setActiveSession(daySessions.length - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daySessions.length]);

  const exercises = useMemo(
    () => fitSessionToBudget(session, sessionDurationMinutes),
    [session, sessionDurationMinutes],
  );

  const handleSessionComplete = useCallback(() => {
    markSessionComplete(safeActive);
  }, [safeActive, markSessionComplete]);

  const timer = useWorkoutTimer({
    exercises,
    onSessionComplete: handleSessionComplete,
  });

  // Restart cleanly when the time budget changes mid-session so the timer and
  // the (re-derived) exercise list stay in sync.
  useEffect(() => {
    timer.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionDurationMinutes]);

  const handleSessionChange = useCallback((idx: number) => {
    timer.reset();
    setActiveSession(idx);
  }, [timer]);

  const handleNextSession = useCallback(() => {
    handleSessionChange(safeActive + 1);
  }, [safeActive, handleSessionChange]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Sticky header section */}
      <View style={[styles.stickyHeader, { borderBottomColor: Colors.border }]}>
        <Header
          session={session}
          showSettings={showSettings}
          onToggleSettings={() => setShowSettings(s => !s)}
        />
        {showSettings && (
          <SettingsPanel
            dailyTarget={dailyTarget}
            sessionDurationMinutes={sessionDurationMinutes}
            skipDays={skipDays}
            availableEquipment={availableEquipment}
            isDayOff={isDayOff}
            sessionColor={session.color}
            onUpdateTarget={updateDailyTarget}
            onUpdateDuration={updateSessionDuration}
            onToggleSkipDay={updateSkipDays}
            onToggleEquipment={updateAvailableEquipment}
            onMarkTodayOff={async () => { await markTodayOff(); timer.reset(); }}
            onUnmarkTodayOff={unmarkTodayOff}
          />
        )}
        {!effectiveDayOff && (
          <SessionTabBar
            sessions={daySessions}
            activeSession={safeActive}
            completedSessionIds={completedSessionIds}
            onSelect={handleSessionChange}
          />
        )}
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: Colors.border }]}>
        {(['workout', 'calendar'] as Tab[]).map(id => (
          <TouchableOpacity
            key={id}
            onPress={() => setActiveTab(id)}
            style={[styles.tab, activeTab === id && { borderBottomColor: session.color, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabText, { color: activeTab === id ? session.color : Colors.textMuted, fontWeight: activeTab === id ? '700' : '400' }]}>
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
          <WorkoutTab
            session={session}
            exercises={exercises}
            timer={timer}
            isDayOff={effectiveDayOff}
            completedSessionIds={completedSessionIds}
            dailyTarget={dailyTarget}
            activeSession={safeActive}
            totalSessions={daySessions.length}
            onNextSession={handleNextSession}
            onUnskipToday={unskipToday}
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
