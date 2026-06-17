import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WorkoutSession } from '../types';
import { Colors, Fonts } from '../theme';

interface Props {
  session: WorkoutSession;
  index: number;
  totalSecs: number;
  runCount: number;   // today's completions for this session slot
  expanded: boolean;
  onToggle: (index: number) => void;
}

/**
 * One collapsible session row in the workout accordion (#25). The header is
 * always visible and shows the session name, its total time, and how many times
 * it's been run today; tapping it expands the row (the `SessionRunner` body is
 * rendered by `SessionAccordion`).
 */
export function SessionRow({ session, index, totalSecs, runCount, expanded, onToggle }: Props) {
  const totalMin = Math.floor(totalSecs / 60);
  const totalSecRem = totalSecs % 60;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onToggle(index)}
      style={[
        styles.row,
        {
          backgroundColor: expanded ? session.color + '15' : Colors.bgCardAlt,
          borderColor: expanded ? session.color : Colors.border,
        },
      ]}
    >
      <Text style={[styles.chevron, { color: expanded ? session.color : Colors.textMuted }]}>
        {expanded ? '▾' : '▸'}
      </Text>
      <Text style={styles.emoji}>{session.emoji}</Text>
      <View style={styles.middle}>
        <Text style={styles.name}>{session.name}</Text>
        <Text style={[styles.focus, { color: session.color }]} numberOfLines={1}>
          {session.focus}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.duration, { color: session.color }]}>
          {totalMin}:{String(totalSecRem).padStart(2, '0')}
        </Text>
        {runCount > 0 ? (
          <View style={[styles.donePill, { borderColor: session.color }]}>
            <Text style={[styles.donePillText, { color: session.color }]}>
              ✓ {runCount}× today
            </Text>
          </View>
        ) : (
          <Text style={styles.notDone}>not yet today</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  chevron: {
    fontSize: 14,
    fontFamily: Fonts.mono,
    width: 16,
  },
  emoji: {
    fontSize: 22,
    marginRight: 10,
  },
  middle: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.serif,
    marginBottom: 2,
  },
  focus: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    letterSpacing: 1,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  duration: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.mono,
    marginBottom: 3,
  },
  donePill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  donePillText: {
    fontSize: 9,
    fontFamily: Fonts.mono,
  },
  notDone: {
    fontSize: 9,
    color: Colors.textDim,
    fontFamily: Fonts.mono,
  },
});
