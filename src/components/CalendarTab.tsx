import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarData } from '../types';
import { Colors, Fonts } from '../theme';

interface Props {
  calData: CalendarData;
  dailyTarget: number;
  onToggleDay: (ds: string, currentStatus?: string) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const STATUS_COLORS: Record<string, string> = {
  completed: Colors.statusCompleted,
  missed: Colors.statusMissed,
  dayoff: Colors.statusDayOff,
  partial: Colors.statusPartial,
};
const STATUS_EMOJI: Record<string, string> = {
  completed: '✓', missed: '✕', dayoff: '🌴', partial: '…',
};

function todayStr() { return new Date().toISOString().split('T')[0]; }

function dateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function CalendarTab({ calData, dailyTarget, onToggleDay }: Props) {
  const [viewDate, setViewDate] = useState(new Date());
  const today = todayStr();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const getStatus = (ds: string) => {
    if (calData[ds]) return calData[ds].status;
    if (ds < today) return 'missed';
    return null;
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  let comp = 0, miss = 0, off = 0, partial = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = dateStr(year, month, d);
    if (ds > today) continue;
    const s = getStatus(ds);
    if (s === 'completed') comp++;
    else if (s === 'dayoff') off++;
    else if (s === 'partial') partial++;
    else miss++;
  }

  return (
    <View style={styles.container}>
      {/* Month nav */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => setViewDate(new Date(year, month - 1, 1))} style={styles.navBtn}>
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={() => setViewDate(new Date(year, month + 1, 1))} style={styles.navBtn}>
          <Text style={styles.navBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[['✓', 'Done', Colors.statusCompleted], ['✕', 'Missed', Colors.statusMissed], ['🌴', 'Day Off', Colors.statusDayOff], ['…', 'Partial', Colors.statusPartial]].map(([em, lb, col]) => (
          <View key={lb} style={styles.legendItem}>
            <View style={[styles.legendChip, { backgroundColor: col }]}>
              <Text style={styles.legendEmoji}>{em}</Text>
            </View>
            <Text style={styles.legendLabel}>{lb}</Text>
          </View>
        ))}
      </View>

      {/* Day headers */}
      <View style={styles.grid}>
        {DAY_LABELS.map(d => (
          <View key={d} style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{d}</Text>
          </View>
        ))}

        {/* Day cells */}
        {cells.map((day, i) => {
          if (!day) return <View key={`empty-${i}`} style={styles.cell} />;
          const ds = dateStr(year, month, day);
          const status = getStatus(ds);
          const isToday = ds === today;
          const isFuture = ds > today;
          const col = status ? STATUS_COLORS[status] : null;
          // Show the run count on multi-run days so repeats are visible (#3).
          const runs = calData[ds]?.sessionRuns?.length ?? 0;

          return (
            <TouchableOpacity
              key={ds}
              onPress={() => !isFuture && onToggleDay(ds, status ?? undefined)}
              disabled={isFuture}
              style={[
                styles.cell,
                {
                  backgroundColor: col ? col + '35' : isToday ? 'rgba(255,255,255,0.07)' : 'transparent',
                  borderColor: isToday ? 'rgba(255,255,255,0.25)' : col ? col + '55' : 'rgba(255,255,255,0.05)',
                  borderWidth: isToday ? 1.5 : 1,
                  opacity: isFuture ? 0.25 : 1,
                },
              ]}
            >
              <Text style={[styles.dayNumber, { color: col ?? (isToday ? Colors.text : Colors.textDim) }]}>
                {day}
              </Text>
              {status && (
                <Text style={styles.statusEmoji}>
                  {STATUS_EMOJI[status]}{runs > 1 ? ` ${runs}` : ''}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.tapHint}>Tap any past day to toggle missed ↔ day off</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          [comp, '✓', Colors.statusCompleted, 'DONE'],
          [miss, '✕', Colors.statusMissed, 'MISSED'],
          [partial, '…', Colors.statusPartial, 'PARTIAL'],
          [off, '🌴', Colors.statusDayOff, 'OFF'],
        ].map(([n, em, col, lbl]) => (
          <View key={String(lbl)} style={[styles.statCard, { backgroundColor: (col as string) + '28', borderColor: (col as string) + '55' }]}>
            <Text style={[styles.statValue, { color: col as string }]}>{n as number}</Text>
            <Text style={styles.statLabel}>{lbl as string}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  navBtnText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  monthLabel: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    letterSpacing: 2,
    color: Colors.text,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendChip: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  legendEmoji: {
    fontSize: 10,
    color: '#fff',
  },
  legendLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  dayHeader: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayHeaderText: {
    fontSize: 10,
    color: Colors.textDim,
    fontFamily: Fonts.mono,
  },
  cell: {
    width: '14.28%',
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  dayNumber: {
    fontSize: 12,
    fontFamily: Fonts.mono,
  },
  statusEmoji: {
    fontSize: 9,
    marginTop: 1,
  },
  tapHint: {
    marginTop: 12,
    fontSize: 11,
    color: Colors.textFaint,
    textAlign: 'center',
    fontFamily: Fonts.mono,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    justifyContent: 'center',
  },
  statCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 52,
  },
  statValue: {
    fontSize: 20,
    fontFamily: Fonts.mono,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 9,
    color: Colors.textDim,
    fontFamily: Fonts.mono,
    letterSpacing: 1,
  },
});
