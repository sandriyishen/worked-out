import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WorkoutSession } from '../types';
import { Colors, Fonts } from '../theme';

interface Props {
  session: WorkoutSession;
  showSettings: boolean;
  onToggleSettings: () => void;
}

export function Header({ session, showSettings, onToggleSettings }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View>
          <Text style={styles.eyebrow}>DESK ATHLETE</Text>
          <Text style={styles.title}>
            Between-Call{' '}
            <Text style={[styles.titleAccent, { color: session.color }]}>Workout</Text>
          </Text>
        </View>
        <TouchableOpacity onPress={onToggleSettings} style={[styles.settingsBtn, showSettings && styles.settingsBtnActive]}>
          <Text style={styles.settingsBtnText}>⚙ Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 4,
    color: Colors.textDim,
    fontFamily: Fonts.mono,
  },
  title: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Fonts.serif,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  titleAccent: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
  },
  settingsBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  settingsBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  settingsBtnText: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
});
