import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts } from '../theme';

interface Props {
  pinned: boolean;
  favorited: boolean;
  onTogglePin: () => void;
  onToggleFavorite: () => void;
  /** Compact variant for dense rows (workout view); default suits library cards. */
  compact?: boolean;
}

const FAVORITE_COLOR = '#F2C14E';

/**
 * The shared favorite (★) + pin (📌) toggles for a single exercise (#2). Rendered
 * on library cards and on workout-view exercise rows so the gesture is identical
 * in both places. Favorite is a soft bookmark/ranking boost; pin guarantees the
 * exercise stays in the generated plan.
 */
export function ExerciseToggles({ pinned, favorited, onTogglePin, onToggleFavorite, compact }: Props) {
  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <TouchableOpacity
        onPress={onToggleFavorite}
        hitSlop={8}
        style={[styles.btn, compact && styles.btnCompact, favorited && { borderColor: FAVORITE_COLOR }]}
        accessibilityLabel={favorited ? 'Unfavorite exercise' : 'Favorite exercise'}
      >
        <Text style={[styles.icon, { color: favorited ? FAVORITE_COLOR : Colors.textMuted }]}>
          {favorited ? '★' : '☆'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onTogglePin}
        hitSlop={8}
        style={[styles.btn, compact && styles.btnCompact, pinned && { borderColor: Colors.work, backgroundColor: Colors.work + '1A' }]}
        accessibilityLabel={pinned ? 'Unpin exercise' : 'Pin exercise into your plan'}
      >
        <Text style={[styles.icon, { opacity: pinned ? 1 : 0.4 }]}>📌</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  rowCompact: {
    gap: 6,
  },
  btn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCompact: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  icon: {
    fontSize: 15,
    fontFamily: Fonts.mono,
  },
});
