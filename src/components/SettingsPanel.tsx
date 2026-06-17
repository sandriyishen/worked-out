import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Equipment, ExerciseCategory } from '../types';
import { CATEGORY_GROUPS, CATEGORY_LABELS } from '../data/exerciseLibrary';
import { Colors, Fonts } from '../theme';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const EQUIPMENT_OPTIONS: { key: Equipment; label: string }[] = [
  { key: 'chair', label: '🪑 Chair' },
  { key: 'desk', label: '🖥 Desk' },
  { key: 'wall', label: '🧱 Wall' },
  { key: 'doorframe', label: '🚪 Door' },
];

interface Props {
  dailyTarget: number;
  sessionDurationMinutes?: number;
  skipDays: number[];
  availableEquipment: Equipment[];
  focusAreas: ExerciseCategory[];
  isDayOff: boolean;
  sessionColor: string;
  onUpdateTarget: (val: number) => void;
  onUpdateDuration: (val?: number) => void;
  onToggleSkipDay: (day: number) => void;
  onToggleEquipment: (item: Equipment) => void;
  onToggleFocus: (category: ExerciseCategory) => void;
  onMarkTodayOff: () => void;
  onUnmarkTodayOff: () => void;
}

export function SettingsPanel({ dailyTarget, sessionDurationMinutes, skipDays, availableEquipment, focusAreas, isDayOff, sessionColor, onUpdateTarget, onUpdateDuration, onToggleSkipDay, onToggleEquipment, onToggleFocus, onMarkTodayOff, onUnmarkTodayOff }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>SESSIONS PER DAY</Text>
      <View style={styles.targetRow}>
        <TouchableOpacity onPress={() => onUpdateTarget(dailyTarget - 1)} style={styles.stepper}>
          <Text style={styles.stepperText}>−</Text>
        </TouchableOpacity>
        <View style={styles.targetDisplay}>
          <Text style={[styles.targetValue, { color: sessionColor }]}>{dailyTarget}</Text>
          <Text style={styles.targetUnit}>sessions/day</Text>
        </View>
        <TouchableOpacity onPress={() => onUpdateTarget(dailyTarget + 1)} style={styles.stepper}>
          <Text style={styles.stepperText}>+</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Day marked ✓{'\n'}when you hit target</Text>
      </View>
      <View style={styles.divider} />
      <Text style={styles.label}>SESSION DURATION</Text>
      <View style={styles.targetRow}>
        <TouchableOpacity
          onPress={() => onUpdateDuration(sessionDurationMinutes == null || sessionDurationMinutes <= 1 ? undefined : sessionDurationMinutes - 1)}
          style={styles.stepper}
        >
          <Text style={styles.stepperText}>−</Text>
        </TouchableOpacity>
        <View style={styles.targetDisplay}>
          <Text style={[styles.targetValue, { color: sessionColor }]}>
            {sessionDurationMinutes == null ? 'Auto' : sessionDurationMinutes}
          </Text>
          <Text style={styles.targetUnit}>
            {sessionDurationMinutes == null ? 'full session' : 'min/session'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onUpdateDuration((sessionDurationMinutes ?? 0) + 1)}
          style={styles.stepper}
        >
          <Text style={styles.stepperText}>+</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Trims or fills{'\n'}to fit your time</Text>
      </View>
      <View style={styles.divider} />
      <Text style={styles.label}>SKIP DAYS</Text>
      <View style={styles.skipRow}>
        {WEEKDAY_LABELS.map((lbl, i) => {
          const on = skipDays.includes(i);
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onToggleSkipDay(i)}
              style={[
                styles.skipChip,
                on && { backgroundColor: sessionColor, borderColor: sessionColor },
              ]}
            >
              <Text style={[styles.skipChipText, on && styles.skipChipTextOn]}>{lbl}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.skipHint}>Skipped weekdays show a rest screen automatically</Text>
      <View style={styles.divider} />
      <Text style={styles.label}>MY EQUIPMENT</Text>
      <View style={styles.skipRow}>
        {EQUIPMENT_OPTIONS.map(({ key, label }) => {
          const on = availableEquipment.includes(key);
          return (
            <TouchableOpacity
              key={key}
              onPress={() => onToggleEquipment(key)}
              style={[
                styles.equipChip,
                on && { backgroundColor: sessionColor, borderColor: sessionColor },
              ]}
            >
              <Text style={[styles.skipChipText, on && styles.skipChipTextOn]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.skipHint}>Used to tailor the exercise library and quick sessions</Text>
      <View style={styles.divider} />
      <Text style={styles.label}>MY FOCUS</Text>
      {CATEGORY_GROUPS.map(group => (
        <View key={group.label} style={styles.focusGroup}>
          <Text style={styles.focusGroupLabel}>{group.label}</Text>
          <View style={styles.focusWrap}>
            {group.categories.map(cat => {
              const on = focusAreas.includes(cat);
              return (
                <TouchableOpacity
                  key={`${group.label}-${cat}`}
                  onPress={() => onToggleFocus(cat)}
                  style={[
                    styles.focusChip,
                    on && { backgroundColor: sessionColor, borderColor: sessionColor },
                  ]}
                >
                  <Text style={[styles.focusChipText, on && styles.skipChipTextOn]}>
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
      <Text style={styles.skipHint}>Your sessions are generated to target these — change them anytime, or shuffle for fresh picks</Text>
      <View style={styles.divider} />
      {!isDayOff ? (
        <TouchableOpacity onPress={onMarkTodayOff} style={styles.dayOffBtn}>
          <Text style={styles.dayOffBtnText}>🌴 Mark Today as Day Off</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={onUnmarkTodayOff} style={styles.resumeBtn}>
          <Text style={styles.resumeBtnText}>↩ Resume Today's Routine</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  label: {
    fontSize: 10,
    letterSpacing: 3,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    marginBottom: 10,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepper: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  stepperText: {
    color: '#CCC',
    fontSize: 16,
    fontFamily: Fonts.mono,
    fontWeight: '700',
  },
  targetDisplay: {
    alignItems: 'center',
  },
  targetValue: {
    fontSize: 24,
    fontFamily: Fonts.mono,
    fontWeight: '700',
  },
  targetUnit: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
  },
  hint: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 12,
  },
  skipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  skipChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  equipChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  skipChipText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontWeight: '700',
  },
  skipChipTextOn: {
    color: '#000',
  },
  focusGroup: {
    marginBottom: 10,
  },
  focusGroupLabel: {
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.textDim,
    fontFamily: Fonts.mono,
    marginBottom: 6,
  },
  focusWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  focusChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  focusChipText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
  },
  skipHint: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    marginTop: 8,
  },
  dayOffBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dayOffBtnText: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
  resumeBtn: {
    backgroundColor: 'rgba(78,205,196,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.5)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resumeBtnText: {
    color: Colors.stretch,
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
});
