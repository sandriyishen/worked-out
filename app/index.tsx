import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SESSIONS } from '../src/data/sessions';
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

  const session = SESSIONS[activeSession];

  const {
    calData,
    dailyTarget,
    completedSessionIds,
    isDayOff,
    markSessionComplete,
    toggleDayOff,
    markTodayOff,
    unmarkTodayOff,
    updateDailyTarget,
  } = useWorkoutHistory();

  const handleSessionComplete = useCallback(() => {
    markSessionComplete(activeSession);
  }, [activeSession, markSessionComplete]);

  const timer = useWorkoutTimer({
    exercises: session.exercises,
    onSessionComplete: handleSessionComplete,
  });

  const handleSessionChange = useCallback((idx: number) => {
    timer.reset();
    setActiveSession(idx);
  }, [timer]);

  const handleNextSession = useCallback(() => {
    handleSessionChange(activeSession + 1);
  }, [activeSession, handleSessionChange]);

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
            isDayOff={isDayOff}
            sessionColor={session.color}
            onUpdateTarget={updateDailyTarget}
            onMarkTodayOff={async () => { await markTodayOff(); timer.reset(); }}
            onUnmarkTodayOff={unmarkTodayOff}
          />
        )}
        {isDayOff && !showSettings && (
          <View style={styles.dayOffBanner}>
            <Text style={styles.dayOffBannerText}>🌴 Today is marked as a day off</Text>
            <TouchableOpacity onPress={unmarkTodayOff}>
              <Text style={styles.dayOffUndo}>undo</Text>
            </TouchableOpacity>
          </View>
        )}
        <SessionTabBar
          sessions={SESSIONS}
          activeSession={activeSession}
          completedSessionIds={completedSessionIds}
          onSelect={handleSessionChange}
        />
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
            timer={timer}
            isDayOff={isDayOff}
            completedSessionIds={completedSessionIds}
            dailyTarget={dailyTarget}
            activeSession={activeSession}
            totalSessions={SESSIONS.length}
            onNextSession={handleNextSession}
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
  dayOffBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(58,58,82,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(100,100,140,0.3)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  dayOffBannerText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
  },
  dayOffUndo: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
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
