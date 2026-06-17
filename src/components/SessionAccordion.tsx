import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Exercise, WorkoutSession } from '../types';
import { WorkoutTimerAPI } from '../hooks/useWorkoutTimer';
import { PREP_SECS } from '../data/exerciseLibrary';
import { Colors, Fonts } from '../theme';
import { SessionRow } from './SessionRow';
import { SessionRunner } from './SessionRunner';

interface Props {
  sessions: WorkoutSession[];
  expanded: number | null;
  onToggle: (index: number) => void;
  isDayOff: boolean;
  onUnskipToday: () => void;
  // Wiring for the single expanded session's runner:
  expandedExercises: Exercise[];
  timer: WorkoutTimerAPI;
  runCountFor: (slot: number) => number;
  sessionsDone: number;
  dailyTarget: number;
  onNextSession: () => void;
  onShuffle: () => void;
  hasFocusAreas: boolean;
}

const totalSecsOf = (exercises: Exercise[]) =>
  exercises.reduce((a, e) => a + e.duration + PREP_SECS, 0);

/**
 * The workout tab's session accordion (#25 + #38 Phase C): a vertical list of
 * collapsible `SessionRow`s over the generated, persisted plan, one expanded at a
 * time, with the expanded row's `SessionRunner` rendered inline beneath its header.
 * A Shuffle control regenerates the plan from the profile. On a rest day the whole
 * list is replaced by the celebratory beach screen.
 */
export function SessionAccordion({
  sessions,
  expanded,
  onToggle,
  isDayOff,
  onUnskipToday,
  expandedExercises,
  timer,
  runCountFor,
  sessionsDone,
  dailyTarget,
  onNextSession,
  onShuffle,
  hasFocusAreas,
}: Props) {
  // On any rest day (manual or recurring skip) the workout is replaced entirely
  // by a celebratory beach screen — no rows or tips are shown.
  if (isDayOff) {
    return (
      <View style={styles.container}>
        <View style={styles.beachCard}>
          <Text style={styles.beachArt}>☀️🌴🏖️🌊</Text>
          <Text style={styles.beachTitle}>Enjoy your day off</Text>
          <Text style={styles.beachSubtitle}>Rest is part of the work. See you tomorrow.</Text>
          <TouchableOpacity onPress={onUnskipToday} style={styles.unskipBtn}>
            <Text style={styles.unskipBtnText}>Un-skip today</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // The plan hasn't hydrated yet (first launch / mid-regenerate).
  if (sessions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Building your sessions…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.dayProgress}>
          {sessionsDone}/{dailyTarget} sessions done today
          {sessionsDone >= dailyTarget ? ' · Day complete 🎉' : ''}
        </Text>
        <TouchableOpacity onPress={onShuffle} style={styles.shuffleBtn}>
          <Text style={styles.shuffleText}>🔀 Shuffle</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.planHint}>
        {hasFocusAreas
          ? 'Built around your focus areas · same each day until you shuffle'
          : 'Set focus areas in ⚙ to target specific goals · shuffle for fresh picks'}
      </Text>

      {sessions.map((session, i) => {
        const isExpanded = expanded === i;
        // The plan's exercises are final (already budget-fit at generation); the
        // expanded row uses the timer-bound list, identical to its own exercises.
        const exercises = isExpanded ? expandedExercises : session.exercises;
        return (
          <View key={session.id}>
            <SessionRow
              session={session}
              index={i}
              totalSecs={totalSecsOf(exercises)}
              runCount={runCountFor(i)}
              expanded={isExpanded}
              onToggle={onToggle}
            />
            {isExpanded && (
              <View style={styles.body}>
                <SessionRunner
                  session={session}
                  exercises={exercises}
                  timer={timer}
                  sessionsDone={sessionsDone}
                  dailyTarget={dailyTarget}
                  activeSession={i}
                  totalSessions={sessions.length}
                  onNextSession={onNextSession}
                />
              </View>
            )}
          </View>
        );
      })}

      {/* Pro tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsLabel}>PRO TIPS</Text>
        <Text style={styles.tipItem}>
          Fat loss comes from <Text style={styles.tipHighlight}>calorie deficit</Text> — these sessions spike metabolism throughout the day
        </Text>
        <Text style={styles.tipItem}>
          Stretches directly target{' '}
          <Text style={styles.tipHighlight}>neck, traps, rhomboids & thoracic spine</Text> pain from sitting
        </Text>
        <Text style={styles.tipItem}>
          Tap any session to expand it; run the same one twice to build the habit
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayProgress: {
    flex: 1,
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    letterSpacing: 1,
  },
  shuffleBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shuffleText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
  },
  planHint: {
    fontSize: 10,
    color: Colors.textDim,
    fontFamily: Fonts.mono,
    marginTop: 8,
    marginBottom: 14,
  },
  empty: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    textAlign: 'center',
    paddingVertical: 40,
  },
  body: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  // Day off — beach rest screen
  beachCard: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(78,205,196,0.10)',
    borderRadius: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.35)',
  },
  beachArt: {
    fontSize: 52,
    marginBottom: 14,
  },
  beachTitle: {
    fontSize: 22,
    color: Colors.text,
    fontWeight: '700',
    fontFamily: Fonts.serif,
    marginBottom: 6,
    textAlign: 'center',
  },
  beachSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    marginBottom: 22,
    textAlign: 'center',
  },
  unskipBtn: {
    backgroundColor: Colors.stretch,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  unskipBtnText: {
    color: '#000',
    fontSize: 13,
    fontFamily: Fonts.mono,
    fontWeight: '700',
  },

  // Tips
  tipsCard: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 13,
    paddingHorizontal: 15,
    marginTop: 6,
  },
  tipsLabel: {
    fontSize: 10,
    letterSpacing: 3,
    color: Colors.textFaint,
    fontFamily: Fonts.mono,
    marginBottom: 6,
  },
  tipItem: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 22,
  },
  tipHighlight: {
    color: Colors.text,
  },
});
