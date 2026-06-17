import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Equipment, ExerciseCategory } from '../types';
import { Colors, Fonts } from '../theme';
import { Collapsible } from './Collapsible';
import { CategoryGroupPicker } from './CategoryGroupPicker';

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
  sessionColor: string;
  onUpdateTarget: (val: number) => void;
  onUpdateDuration: (val?: number) => void;
  onToggleSkipDay: (day: number) => void;
  onToggleEquipment: (item: Equipment) => void;
  onToggleFocus: (category: ExerciseCategory) => void;
  onOpenLibrary: () => void;
}

/**
 * The Settings panel (#46): an "Exercise Setup" group of collapsible sections
 * (sessions/day, duration, skip days, equipment, issues/focus), a Library
 * button into the catalogue, and a placeholder for future general settings.
 * Per-day actions (skip today) live in the workout tab, not here.
 */
export function SettingsPanel({
  dailyTarget,
  sessionDurationMinutes,
  skipDays,
  availableEquipment,
  focusAreas,
  sessionColor,
  onUpdateTarget,
  onUpdateDuration,
  onToggleSkipDay,
  onToggleEquipment,
  onToggleFocus,
  onOpenLibrary,
}: Props) {
  const durationSummary = sessionDurationMinutes == null ? 'Auto' : `${sessionDurationMinutes} min`;
  const skipSummary = skipDays.length > 0 ? `${skipDays.length} day${skipDays.length > 1 ? 's' : ''}` : 'None';
  const equipSummary = availableEquipment.length > 0 ? `${availableEquipment.length} owned` : 'None';
  const focusSummary = focusAreas.length > 0 ? `${focusAreas.length} selected` : 'All';

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeading}>EXERCISE SETUP</Text>

      <Collapsible title="Sessions per day" summary={`${dailyTarget} / day`} accent={sessionColor}>
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
      </Collapsible>

      <Collapsible title="Session duration" summary={durationSummary} accent={sessionColor}>
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
      </Collapsible>

      <Collapsible title="Skip days" summary={skipSummary} accent={sessionColor}>
        <View style={styles.skipRow}>
          {WEEKDAY_LABELS.map((lbl, i) => {
            const on = skipDays.includes(i);
            return (
              <TouchableOpacity
                key={i}
                onPress={() => onToggleSkipDay(i)}
                style={[styles.skipChip, on && { backgroundColor: sessionColor, borderColor: sessionColor }]}
              >
                <Text style={[styles.skipChipText, on && styles.skipChipTextOn]}>{lbl}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.skipHint}>Skipped weekdays show a rest screen automatically</Text>
      </Collapsible>

      <Collapsible title="My equipment" summary={equipSummary} accent={sessionColor}>
        <View style={styles.skipRow}>
          {EQUIPMENT_OPTIONS.map(({ key, label }) => {
            const on = availableEquipment.includes(key);
            return (
              <TouchableOpacity
                key={key}
                onPress={() => onToggleEquipment(key)}
                style={[styles.equipChip, on && { backgroundColor: sessionColor, borderColor: sessionColor }]}
              >
                <Text style={[styles.skipChipText, on && styles.skipChipTextOn]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.skipHint}>Used to tailor the exercise library and quick sessions</Text>
      </Collapsible>

      <Collapsible title="Issues / Focus" summary={focusSummary} accent={sessionColor}>
        <CategoryGroupPicker
          accent={sessionColor}
          isSelected={cat => focusAreas.includes(cat)}
          onSelect={onToggleFocus}
        />
        <Text style={styles.skipHint}>Your sessions are generated to target these — change them anytime, or shuffle for fresh picks</Text>
      </Collapsible>

      <View style={styles.divider} />
      <TouchableOpacity onPress={onOpenLibrary} style={styles.libraryBtn}>
        <Text style={styles.libraryBtnText}>📚 Browse Exercise Library</Text>
        <Text style={styles.libraryChevron}>›</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionHeading, styles.sectionHeadingSpaced]}>GENERAL</Text>
      <Text style={styles.placeholder}>More settings coming soon.</Text>
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
  sectionHeading: {
    fontSize: 10,
    letterSpacing: 3,
    color: Colors.textDim,
    fontFamily: Fonts.mono,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionHeadingSpaced: {
    marginTop: 8,
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
  skipHint: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    marginTop: 8,
  },
  libraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  libraryBtnText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '700',
  },
  libraryChevron: {
    color: Colors.textMuted,
    fontSize: 18,
    fontFamily: Fonts.mono,
  },
  placeholder: {
    fontSize: 11,
    color: Colors.textDim,
    fontFamily: Fonts.mono,
    marginTop: 4,
  },
});
