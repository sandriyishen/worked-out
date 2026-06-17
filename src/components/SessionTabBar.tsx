import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { WorkoutSession } from '../types';
import { Colors, Fonts } from '../theme';

interface Props {
  sessions: WorkoutSession[];
  activeSession: number;
  completedSessionIds: Set<number>;
  onSelect: (idx: number) => void;
}

export function SessionTabBar({ sessions, activeSession, completedSessionIds, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {sessions.map((s, i) => {
        const isActive = activeSession === i;
        const isDone = completedSessionIds.has(i);
        return (
          <TouchableOpacity
            key={s.id}
            onPress={() => onSelect(i)}
            style={[
              styles.pill,
              {
                borderColor: isActive ? s.color : 'rgba(255,255,255,0.09)',
                backgroundColor: isActive ? s.color + '20' : 'transparent',
              },
            ]}
          >
            <Text style={[styles.pillText, { color: isActive ? s.color : Colors.textMuted, fontWeight: isActive ? '700' : '400' }]}>
              {isDone ? '✓ ' : ''}{s.emoji} {s.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 5,
    flexDirection: 'row',
  },
  pill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillText: {
    fontSize: 11,
    fontFamily: Fonts.mono,
  },
});
