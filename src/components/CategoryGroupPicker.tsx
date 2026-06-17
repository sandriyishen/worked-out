import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ExerciseCategory } from '../types';
import { CATEGORY_GROUPS, CATEGORY_LABELS } from '../data/exerciseLibrary';
import { Colors, Fonts } from '../theme';
import { Collapsible } from './Collapsible';

interface Props {
  accent: string;
  isSelected: (cat: ExerciseCategory) => boolean;
  onSelect: (cat: ExerciseCategory) => void;
}

/**
 * The shared "issues / goals" selector (#46): the big category groups
 * (Complaints / Strength / Sculpting / Wellness) each expand to reveal their
 * category chips. Used identically by the Settings focus picker and the
 * library's complaint/goal filter so the two stay consistent. Selection is
 * delegated, so the same component serves multi-select (settings, library)
 * callers via `isSelected` / `onSelect`.
 */
export function CategoryGroupPicker({ accent, isSelected, onSelect }: Props) {
  return (
    <View>
      {CATEGORY_GROUPS.map(group => {
        const count = group.categories.filter(isSelected).length;
        return (
          <Collapsible
            key={group.label}
            title={group.label}
            summary={count > 0 ? `${count} selected` : undefined}
            accent={accent}
          >
            <View style={styles.wrap}>
              {group.categories.map(cat => {
                const on = isSelected(cat);
                return (
                  <TouchableOpacity
                    key={`${group.label}-${cat}`}
                    onPress={() => onSelect(cat)}
                    style={[styles.chip, on && { backgroundColor: accent, borderColor: accent }]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{CATEGORY_LABELS[cat]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Collapsible>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
  },
  chipTextOn: {
    color: '#000',
    fontWeight: '700',
  },
});
