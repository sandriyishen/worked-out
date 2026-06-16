import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts } from '../theme';

interface Props {
  dailyTarget: number;
  sessionDurationMinutes?: number;
  isDayOff: boolean;
  sessionColor: string;
  onUpdateTarget: (val: number) => void;
  onUpdateDuration: (val?: number) => void;
  onMarkTodayOff: () => void;
  onUnmarkTodayOff: () => void;
}

export function SettingsPanel({ dailyTarget, sessionDurationMinutes, isDayOff, sessionColor, onUpdateTarget, onUpdateDuration, onMarkTodayOff, onUnmarkTodayOff }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>DAILY TARGET</Text>
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
