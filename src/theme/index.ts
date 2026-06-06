import { Platform } from 'react-native';

export const Colors = {
  bg: '#0D0D0F',
  bgCard: '#12121A',
  bgCardAlt: '#16161A',
  border: 'rgba(255,255,255,0.07)',
  borderSubtle: 'rgba(255,255,255,0.05)',
  text: '#F0EDE8',
  textSecondary: '#AAA',
  textMuted: '#666',
  textDim: '#555',
  textFaint: '#444',
  work: '#FF6B35',
  stretch: '#4ECDC4',
  statusCompleted: '#1A6B45',
  statusMissed: '#7A2020',
  statusDayOff: '#3A3A52',
  statusPartial: '#7A5A10',
  danger: '#FF4444',
};

export const Fonts = {
  mono: Platform.select({ android: 'monospace', ios: 'Courier', default: 'monospace' }) as string,
  serif: Platform.select({ android: 'serif', ios: 'Georgia', default: 'serif' }) as string,
};
