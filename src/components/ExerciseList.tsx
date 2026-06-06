import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Exercise } from '../types';
import { Colors, Fonts } from '../theme';
import { WorkoutPhase } from '../hooks/useWorkoutTimer';

interface Props {
  exercises: Exercise[];
  phase: WorkoutPhase;
  exIdx: number;
  sessionColor: string;
}

const TYPE_COLOR: Record<string, string> = {
  work: Colors.work,
  stretch: Colors.stretch,
};

export function ExerciseList({ exercises, phase, exIdx, sessionColor }: Props) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const isRunning = phase === 'active' || phase === 'prep';
  const fullyDone = phase === 'done';

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>EXERCISES</Text>
      {exercises.map((ex, i) => {
        const isActive = isRunning && exIdx === i;
        const isPast = (isRunning && i < exIdx) || fullyDone;
        const isExpanded = expandedKey === ex.id;
        const typeColor = TYPE_COLOR[ex.type];

        return (
          <View
            key={ex.id}
            style={[
              styles.card,
              isActive && { backgroundColor: sessionColor + '14', borderColor: sessionColor },
              (isPast) && styles.cardPast,
            ]}
          >
            <TouchableOpacity
              onPress={() => setExpandedKey(isExpanded ? null : ex.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardRow}>
                {/* Step indicator */}
                <View style={[
                  styles.step,
                  isPast && { backgroundColor: Colors.stretch },
                  isActive && { backgroundColor: sessionColor },
                ]}>
                  <Text style={[styles.stepText, (isPast || isActive) && { color: '#fff' }]}>
                    {isPast ? '✓' : i + 1}
                  </Text>
                </View>

                {/* Exercise info */}
                <View style={styles.info}>
                  <Text style={[styles.name, isActive && { color: Colors.text }]}>{ex.name}</Text>
                  <View style={styles.meta}>
                    <Text style={[styles.metaTag, { color: typeColor }]}>
                      {ex.type === 'work' ? 'WORK' : 'STRETCH'}
                    </Text>
                    <Text style={styles.metaDuration}>{ex.reps ?? `${ex.duration}s`}</Text>
                    {ex.bilateral && (
                      <Text style={[styles.metaTag, { color: Colors.stretch }]}>↔ both sides</Text>
                    )}
                  </View>
                </View>

                {/* Expand chevron */}
                <Text style={[styles.chevron, isExpanded && styles.chevronOpen]}>▾</Text>
              </View>

              {isExpanded && (
                <View style={styles.description}>
                  <Text style={styles.descText}>{ex.desc}</Text>
                  {ex.bilateral && (
                    <Text style={styles.bilateralNote}>↔ Hold {ex.switchAt}s per side</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 3,
    color: Colors.textDim,
    fontFamily: Fonts.mono,
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 11,
    paddingHorizontal: 13,
    marginBottom: 7,
  },
  cardPast: {
    opacity: 0.5,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  step: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepText: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DDD',
  },
  meta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  metaTag: {
    fontSize: 10,
    fontFamily: Fonts.mono,
  },
  metaDuration: {
    fontSize: 10,
    color: Colors.textDim,
    fontFamily: Fonts.mono,
  },
  chevron: {
    color: Colors.textDim,
    fontSize: 13,
    paddingHorizontal: 6,
    flexShrink: 0,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  description: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  descText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  bilateralNote: {
    marginTop: 6,
    fontSize: 11,
    color: Colors.stretch,
    fontFamily: Fonts.mono,
  },
});
