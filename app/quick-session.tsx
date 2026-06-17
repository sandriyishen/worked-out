import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Exercise, ExerciseCategory, WorkoutSession } from '../src/types';
import { CATEGORY_GROUPS, CATEGORY_LABELS, PREP_SECS } from '../src/data/exerciseLibrary';
import { generateQuickSession } from '../src/data/sessionGenerator';
import { exercisePopularity } from '../src/data/ranking';
import { useWorkoutTimer } from '../src/hooks/useWorkoutTimer';
import { useWorkoutHistoryContext } from '../src/state/WorkoutHistoryContext';
import { SessionRunner } from '../src/components/SessionRunner';
import { Colors, Fonts } from '../src/theme';

// Quick sessions are recorded in history under a sentinel session id so they count
// as movement (#3/#5) without ever matching a daily-plan slot.
const QUICK_SESSION_ID = -1;
const DURATIONS = [5, 10, 15];
const ACCENT = Colors.work;

export default function QuickSessionScreen() {
  const router = useRouter();
  const { availableEquipment, calData, markSessionComplete } = useWorkoutHistoryContext();

  const [category, setCategory] = useState<ExerciseCategory | null>(null);
  const [minutes, setMinutes] = useState(5);
  const [seed, setSeed] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Exercise[]>([]);

  // Popularity is read only when generating (not a live input to the run).
  const popularity = useMemo(() => exercisePopularity(calData), [calData]);

  const generate = useCallback(
    (nextSeed: number) => {
      if (!category) return;
      setResult(generateQuickSession(category, minutes, popularity, availableEquipment, nextSeed));
      setSeed(nextSeed);
      setRunning(true);
    },
    [category, minutes, popularity, availableEquipment],
  );

  const handleComplete = useCallback(() => {
    markSessionComplete(QUICK_SESSION_ID, result.map(e => e.id));
  }, [markSessionComplete, result]);

  const timer = useWorkoutTimer({ exercises: result, onSessionComplete: handleComplete });

  // Reset the timer whenever the generated set changes (generate / new picks).
  useEffect(() => {
    timer.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const totalSecs = result.reduce((a, e) => a + e.duration + PREP_SECS, 0);
  const session: WorkoutSession = useMemo(
    () => ({
      id: QUICK_SESSION_ID,
      name: category ? CATEGORY_LABELS[category] : 'Quick Session',
      emoji: '⚡',
      time: '',
      focus: `${minutes} min target`,
      color: ACCENT,
      exercises: result,
    }),
    [category, minutes, result],
  );

  const goBackToSelect = useCallback(() => {
    timer.reset();
    setRunning(false);
  }, [timer]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: Colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>⚡ Quick Session</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!running ? (
          <>
            <Text style={styles.tagline}>A specific ache, a specific amount of time — we'll handle the rest.</Text>

            <Text style={styles.label}>WHAT'S BOTHERING YOU?</Text>
            {CATEGORY_GROUPS.map(group => (
              <View key={group.label} style={styles.group}>
                <Text style={styles.groupLabel}>{group.label}</Text>
                <View style={styles.wrap}>
                  {group.categories.map(cat => {
                    const on = category === cat;
                    return (
                      <TouchableOpacity
                        key={`${group.label}-${cat}`}
                        onPress={() => setCategory(cat)}
                        style={[styles.chip, on && { backgroundColor: ACCENT, borderColor: ACCENT }]}
                      >
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{CATEGORY_LABELS[cat]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            <Text style={[styles.label, { marginTop: 8 }]}>HOW LONG DO YOU HAVE?</Text>
            <View style={styles.durationRow}>
              {DURATIONS.map(d => {
                const on = minutes === d;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setMinutes(d)}
                    style={[styles.durChip, on && { backgroundColor: ACCENT, borderColor: ACCENT }]}
                  >
                    <Text style={[styles.durChipText, on && styles.chipTextOn]}>{d} min</Text>
                  </TouchableOpacity>
                );
              })}
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => setMinutes(m => Math.max(1, m - 1))} style={styles.stepBtn}>
                  <Text style={styles.stepText}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMinutes(m => Math.min(30, m + 1))} style={styles.stepBtn}>
                  <Text style={styles.stepText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => generate(seed)}
              disabled={!category}
              style={[styles.goBtn, { backgroundColor: category ? ACCENT : 'rgba(255,255,255,0.08)' }]}
            >
              <Text style={[styles.goBtnText, !category && { color: Colors.textMuted }]}>Let's do this!</Text>
            </TouchableOpacity>
            {!category && <Text style={styles.pickHint}>Pick what's bothering you to begin</Text>}
          </>
        ) : result.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No exercises matched — try another complaint.</Text>
            <TouchableOpacity onPress={goBackToSelect} style={[styles.goBtn, { backgroundColor: ACCENT }]}>
              <Text style={styles.goBtnText}>← Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.runHeader, { borderColor: ACCENT + '55', backgroundColor: ACCENT + '15' }]}>
              <View style={styles.runHeaderLeft}>
                <Text style={styles.runName}>⚡ {session.name}</Text>
                <Text style={[styles.runFocus, { color: ACCENT }]}>
                  {result.filter(e => e.type === 'work').length} work · {result.filter(e => e.type === 'stretch').length} stretch
                </Text>
              </View>
              <View style={styles.runHeaderRight}>
                <Text style={[styles.runTotal, { color: ACCENT }]}>
                  {Math.floor(totalSecs / 60)}:{String(totalSecs % 60).padStart(2, '0')}
                </Text>
                <Text style={styles.runTotalLabel}>TOTAL</Text>
              </View>
            </View>

            <View style={styles.runActions}>
              <TouchableOpacity onPress={goBackToSelect} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>← Change</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => generate(seed + 1)} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>🔀 New picks</Text>
              </TouchableOpacity>
            </View>

            <SessionRunner
              session={session}
              exercises={result}
              timer={timer}
              quick
              onExit={() => router.back()}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { minWidth: 60 },
  backText: { color: ACCENT, fontFamily: Fonts.mono, fontSize: 14 },
  topTitle: { color: Colors.text, fontFamily: Fonts.serif, fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 48 },
  tagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 18,
  },
  label: {
    fontSize: 10,
    letterSpacing: 3,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    marginBottom: 10,
  },
  group: { marginBottom: 10 },
  groupLabel: {
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.textDim,
    fontFamily: Fonts.mono,
    marginBottom: 6,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipText: { fontSize: 11, color: Colors.textMuted, fontFamily: Fonts.mono },
  chipTextOn: { color: '#000', fontWeight: '700' },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  durChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  durChipText: { fontSize: 13, color: Colors.textMuted, fontFamily: Fonts.mono, fontWeight: '700' },
  stepper: { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
  stepBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stepText: { color: '#CCC', fontSize: 16, fontFamily: Fonts.mono, fontWeight: '700' },
  goBtn: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 22,
  },
  goBtnText: { color: '#fff', fontSize: 15, letterSpacing: 1, fontFamily: Fonts.mono, fontWeight: '700' },
  pickHint: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textDim,
    fontFamily: Fonts.mono,
    marginTop: 8,
  },
  emptyWrap: { alignItems: 'center', paddingVertical: 40, gap: 18 },
  emptyText: { color: Colors.textMuted, fontFamily: Fonts.mono, fontSize: 13, textAlign: 'center' },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  runHeaderLeft: { flex: 1 },
  runName: { fontSize: 18, fontWeight: '700', color: Colors.text, fontFamily: Fonts.serif, marginBottom: 3 },
  runFocus: { fontSize: 11, fontFamily: Fonts.mono, letterSpacing: 1 },
  runHeaderRight: { alignItems: 'flex-end' },
  runTotal: { fontSize: 20, fontWeight: '700', fontFamily: Fonts.mono },
  runTotalLabel: { fontSize: 9, color: Colors.textDim, fontFamily: Fonts.mono, letterSpacing: 1 },
  runActions: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingVertical: 9,
  },
  secondaryBtnText: { color: Colors.textSecondary, fontFamily: Fonts.mono, fontSize: 12, fontWeight: '700' },
});
