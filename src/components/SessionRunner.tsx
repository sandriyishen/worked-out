import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Exercise, WorkoutSession } from '../types';
import { WorkoutTimerAPI } from '../hooks/useWorkoutTimer';
import { Colors, Fonts } from '../theme';
import { ExerciseList } from './ExerciseList';

interface Props {
  session: WorkoutSession;
  exercises: Exercise[];
  timer: WorkoutTimerAPI;
  // Daily-plan context (omitted for quick sessions, #5):
  sessionsDone?: number;
  dailyTarget?: number;
  activeSession?: number;
  totalSessions?: number;
  onNextSession?: () => void;
  // Quick-session mode (#5): simpler done card with an exit instead of "Next".
  quick?: boolean;
  onExit?: () => void;
}

/**
 * The run controls for a single session: prep / active / done cards, the start
 * button, and the exercise list. Used both inside an expanded `SessionRow` (the
 * accordion body, #25) and standalone on the quick-session screen (#5, `quick`).
 */
export function SessionRunner({
  session,
  exercises,
  timer,
  sessionsDone = 0,
  dailyTarget = 0,
  activeSession = 0,
  totalSessions = 1,
  onNextSession,
  quick = false,
  onExit,
}: Props) {
  const { phase, exIdx, timer: t, paused, showSwitch, exercise, start, reset, togglePause } = timer;

  return (
    <View style={styles.container}>
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
          {exercise.contraindications && (
            <Text style={styles.prepCaution}>⚠ {exercise.contraindications}</Text>
          )}
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
          <Text style={styles.doneTitle}>{quick ? 'Quick Session Done!' : 'Session Complete!'}</Text>
          <Text style={styles.doneSubtitle}>
            {quick
              ? 'Nice — that counts. Logged to your history.'
              : `${sessionsDone}/${dailyTarget} sessions today${sessionsDone >= dailyTarget ? ' — Day Complete! 🎉' : ''}`}
          </Text>
          <View style={styles.doneButtons}>
            <TouchableOpacity onPress={reset} style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>↩ Again</Text>
            </TouchableOpacity>
            {quick ? (
              <TouchableOpacity onPress={onExit} style={styles.nextBtn}>
                <Text style={styles.nextBtnText}>Done</Text>
              </TouchableOpacity>
            ) : (
              activeSession < totalSessions - 1 && (
                <TouchableOpacity onPress={onNextSession} style={styles.nextBtn}>
                  <Text style={styles.nextBtnText}>Next Session →</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      )}

      {/* Start button (rest days are handled by the accordion's beach screen) */}
      {phase === 'idle' && (
        <TouchableOpacity
          onPress={start}
          style={[styles.startBtn, { backgroundColor: session.color, shadowColor: session.color }]}
        >
          <Text style={styles.startBtnText}>▶ START SESSION</Text>
        </TouchableOpacity>
      )}

      {/* Exercise list */}
      <ExerciseList
        exercises={exercises}
        phase={phase}
        exIdx={exIdx}
        sessionColor={session.color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
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
  prepCaution: {
    fontSize: 11,
    color: Colors.danger,
    fontFamily: Fonts.mono,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 10,
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
});
