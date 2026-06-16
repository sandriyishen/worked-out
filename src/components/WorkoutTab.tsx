import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Exercise, WorkoutSession } from '../types';
import { WorkoutTimerAPI } from '../hooks/useWorkoutTimer';
import { Colors, Fonts } from '../theme';
import { ExerciseList } from './ExerciseList';
import { PREP_SECS } from '../data/sessions';

interface Props {
  session: WorkoutSession;
  exercises?: Exercise[];
  timer: WorkoutTimerAPI;
  isDayOff: boolean;
  completedSessionIds: Set<number>;
  dailyTarget: number;
  activeSession: number;
  totalSessions: number;
  onNextSession: () => void;
}

export function WorkoutTab({
  session,
  exercises = session.exercises,
  timer,
  isDayOff,
  completedSessionIds,
  dailyTarget,
  activeSession,
  totalSessions,
  onNextSession,
}: Props) {
  const { phase, exIdx, timer: t, paused, showSwitch, exercise, start, reset, togglePause } = timer;

  const totalSecs = exercises.reduce((a, e) => a + e.duration + PREP_SECS, 0);
  const totalMin = Math.floor(totalSecs / 60);
  const totalSecRem = totalSecs % 60;
  const sessionsDone = completedSessionIds.size;

  return (
    <View style={styles.container}>
      {/* Session info card */}
      <View style={[styles.sessionCard, { backgroundColor: session.color + '15', borderColor: session.color + '35' }]}>
        <View style={styles.sessionCardRow}>
          <View style={styles.sessionCardLeft}>
            <Text style={styles.sessionEmoji}>{session.emoji}</Text>
            <Text style={styles.sessionName}>{session.name}</Text>
            <Text style={[styles.sessionFocus, { color: session.color }]}>
              {session.time} · {session.focus}
            </Text>
          </View>
          <View style={styles.sessionCardRight}>
            <Text style={[styles.sessionDuration, { color: session.color }]}>
              {totalMin}:{String(totalSecRem).padStart(2, '0')}
            </Text>
            <Text style={styles.sessionDurationLabel}>TOTAL</Text>
            <Text style={styles.sessionProgress}>{sessionsDone}/{dailyTarget} today</Text>
          </View>
        </View>
      </View>

      {/* GET READY screen */}
      {phase === 'prep' && exercise && (
        <View style={[styles.prepCard, { borderColor: session.color }]}>
          <Text style={[styles.prepLabel, { color: session.color }]}>GET READY</Text>
          <Text style={[styles.prepTimer, { color: session.color }]}>{t}</Text>
          <Text style={styles.prepExName}>{exercise.name}</Text>
          {exercise.bilateral && (
            <View style={styles.bilateralBadge}>
              <Text style={styles.bilateralBadgeText}>
                ↔ BOTH SIDES — {exercise.switchAt}s each
              </Text>
            </View>
          )}
          <Text style={styles.prepDesc}>{exercise.desc}</Text>
        </View>
      )}

      {/* ACTIVE exercise */}
      {phase === 'active' && exercise && (
        <View style={[styles.activeCard, { borderColor: session.color }]}>
          {/* Progress bar */}
          <View
            style={[
              styles.progressBar,
              {
                width: `${((exercise.duration - t) / exercise.duration) * 100}%` as any,
                backgroundColor: session.color,
              },
            ]}
          />

          {/* Switch sides banner */}
          {showSwitch && (
            <View style={[styles.switchBanner, { backgroundColor: session.color }]}>
              <Text style={styles.switchText}>↔ SWITCH SIDES NOW</Text>
            </View>
          )}

          <View style={[styles.activeHeader, showSwitch && { marginTop: 36 }]}>
            <View style={[styles.typeBadge, { backgroundColor: exercise.type === 'work' ? Colors.work + '18' : Colors.stretch + '18' }]}>
              <Text style={[styles.typeBadgeText, { color: exercise.type === 'work' ? Colors.work : Colors.stretch }]}>
                {exercise.type === 'work' ? 'WORK' : 'STRETCH'}
              </Text>
            </View>
            <Text style={styles.exerciseCounter}>{exIdx + 1}/{exercises.length}</Text>
          </View>

          <Text style={styles.activeName}>{exercise.name}</Text>
          {exercise.bilateral && (
            <Text style={styles.bilateralHint}>↔ Switch at {exercise.switchAt}s</Text>
          )}
          {exercise.reps && (
            <Text style={[styles.repsText, { color: session.color }]}>Target: {exercise.reps}</Text>
          )}
          <Text style={styles.activeDesc}>{exercise.desc}</Text>

          <View style={styles.activeControls}>
            <Text style={[styles.activeTimer, { color: t <= 5 ? Colors.danger : session.color }]}>
              {t}s
            </Text>
            <View style={styles.activeButtons}>
              <TouchableOpacity onPress={togglePause} style={[styles.pauseBtn, { backgroundColor: session.color }]}>
                <Text style={styles.pauseBtnText}>{paused ? '▶ GO' : '⏸ PAUSE'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={reset} style={styles.stopBtn}>
                <Text style={styles.stopBtnText}>✕ Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* DONE */}
      {phase === 'done' && (
        <View style={styles.doneCard}>
          <Text style={styles.doneEmoji}>✅</Text>
          <Text style={styles.doneTitle}>Session Complete!</Text>
          <Text style={styles.doneSubtitle}>
            {sessionsDone}/{dailyTarget} sessions today
            {sessionsDone >= dailyTarget ? ' — Day Complete! 🎉' : ''}
          </Text>
          <View style={styles.doneButtons}>
            <TouchableOpacity onPress={reset} style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>↩ Reset</Text>
            </TouchableOpacity>
            {activeSession < totalSessions - 1 && (
              <TouchableOpacity onPress={onNextSession} style={styles.nextBtn}>
                <Text style={styles.nextBtnText}>Next Session →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Start button */}
      {phase === 'idle' && !isDayOff && (
        <TouchableOpacity
          onPress={start}
          style={[styles.startBtn, { backgroundColor: session.color, shadowColor: session.color }]}
        >
          <Text style={styles.startBtnText}>▶ START SESSION</Text>
        </TouchableOpacity>
      )}

      {phase === 'idle' && isDayOff && (
        <View style={styles.dayOffCard}>
          <Text style={styles.dayOffEmoji}>🌴</Text>
          <Text style={styles.dayOffText}>Today is a rest day. Enjoy it!</Text>
        </View>
      )}

      {/* Exercise list */}
      <ExerciseList
        exercises={exercises}
        phase={phase}
        exIdx={exIdx}
        sessionColor={session.color}
      />

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
        <Text style={[styles.tipItem, { color: session.color }]}>
          After 4 weeks, set your target to 10 and repeat each session twice daily
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

  // Session info card
  sessionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  sessionCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionCardLeft: {
    flex: 1,
  },
  sessionEmoji: {
    fontSize: 24,
    marginBottom: 3,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.serif,
    marginBottom: 2,
  },
  sessionFocus: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    letterSpacing: 1,
  },
  sessionCardRight: {
    alignItems: 'flex-end',
  },
  sessionDuration: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Fonts.mono,
  },
  sessionDurationLabel: {
    fontSize: 9,
    color: Colors.textDim,
    fontFamily: Fonts.mono,
    letterSpacing: 1,
  },
  sessionProgress: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    marginTop: 4,
  },

  // Prep card
  prepCard: {
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  prepLabel: {
    fontSize: 10,
    letterSpacing: 4,
    fontFamily: Fonts.mono,
    marginBottom: 8,
  },
  prepTimer: {
    fontSize: 52,
    fontWeight: '700',
    fontFamily: Fonts.mono,
    lineHeight: 60,
    marginBottom: 8,
  },
  prepExName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Fonts.serif,
  },
  bilateralBadge: {
    backgroundColor: 'rgba(78,205,196,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  bilateralBadgeText: {
    fontSize: 10,
    color: Colors.stretch,
    fontFamily: Fonts.mono,
  },
  prepDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 21,
    textAlign: 'center',
  },

  // Active card
  activeCard: {
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 2,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
  },
  switchBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    alignItems: 'center',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  switchText: {
    fontSize: 13,
    fontFamily: Fonts.mono,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#fff',
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.mono,
  },
  exerciseCounter: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
  },
  activeName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.serif,
    marginBottom: 4,
  },
  bilateralHint: {
    fontSize: 10,
    color: Colors.stretch,
    fontFamily: Fonts.mono,
    marginBottom: 6,
  },
  repsText: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    marginBottom: 6,
  },
  activeDesc: {
    fontSize: 12,
    color: '#999',
    lineHeight: 19,
    marginBottom: 12,
  },
  activeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeTimer: {
    fontSize: 44,
    fontWeight: '700',
    fontFamily: Fonts.mono,
    lineHeight: 52,
  },
  activeButtons: {
    flexDirection: 'column',
    gap: 6,
  },
  pauseBtn: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pauseBtnText: {
    color: '#fff',
    fontFamily: Fonts.mono,
    fontWeight: '700',
    fontSize: 12,
  },
  stopBtn: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  stopBtnText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.mono,
  },

  // Done card
  doneCard: {
    backgroundColor: 'rgba(26,107,69,0.09)',
    borderWidth: 1.5,
    borderColor: Colors.stretch,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  doneEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  doneTitle: {
    fontSize: 18,
    color: Colors.stretch,
    fontWeight: '700',
    fontFamily: Fonts.serif,
    marginBottom: 4,
  },
  doneSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    marginBottom: 14,
    textAlign: 'center',
  },
  doneButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  resetBtn: {
    borderWidth: 1,
    borderColor: Colors.stretch,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  resetBtnText: {
    color: Colors.stretch,
    fontSize: 12,
    fontFamily: Fonts.mono,
  },
  nextBtn: {
    backgroundColor: Colors.stretch,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  nextBtnText: {
    color: '#000',
    fontSize: 12,
    fontFamily: Fonts.mono,
    fontWeight: '700',
  },

  // Start button
  startBtn: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 8,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 14,
    letterSpacing: 2,
    fontFamily: Fonts.mono,
    fontWeight: '700',
  },

  // Day off
  dayOffCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(58,58,82,0.2)',
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(100,100,140,0.15)',
  },
  dayOffEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  dayOffText: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: 12,
  },

  // Tips
  tipsCard: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 13,
    paddingHorizontal: 15,
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
