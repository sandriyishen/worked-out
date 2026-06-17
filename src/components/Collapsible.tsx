import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts } from '../theme';

interface Props {
  title: string;
  // Optional value preview shown on the header when collapsed (e.g. "3 / day").
  summary?: string;
  accent?: string;
  initiallyOpen?: boolean;
  children: React.ReactNode;
}

/**
 * A self-contained collapsible section: a tappable header (title + optional
 * collapsed-state summary + chevron) that reveals its children when open.
 * Shared by the Settings sections and the category-group picker so both the
 * Settings panel and the library filter read the same way (#46).
 */
export function Collapsible({ title, summary, accent, initiallyOpen = false, children }: Props) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View style={styles.wrap}>
      <TouchableOpacity onPress={() => setOpen(o => !o)} style={styles.header} activeOpacity={0.7}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.right}>
          {!open && summary != null && (
            <Text style={[styles.summary, accent ? { color: accent } : null]}>{summary}</Text>
          )}
          <Text style={[styles.chevron, open && styles.chevronOpen]}>▾</Text>
        </View>
      </TouchableOpacity>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  title: {
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.textSecondary,
    fontFamily: Fonts.mono,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summary: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
  },
  chevron: {
    color: Colors.textDim,
    fontSize: 13,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  body: {
    paddingBottom: 12,
  },
});
