import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { BodyArea, Equipment, Exercise, ExerciseCategory } from '../src/types';
import {
  CATEGORY_LABELS,
  EQUIPMENT_LABELS,
  EXERCISE_LIBRARY,
} from '../src/data/exerciseLibrary';
import { sessionsContainingExercise } from '../src/data/sessions';
import { loadState } from '../src/storage';
import { Colors, Fonts } from '../src/theme';

type TypeFilter = 'all' | 'work' | 'stretch';

const ACCENT = Colors.stretch;
const EQUIPMENT_KEYS: Equipment[] = ['chair', 'desk', 'wall', 'doorframe'];
const CATEGORY_KEYS = (Object.keys(CATEGORY_LABELS) as ExerciseCategory[]).sort((a, b) =>
  CATEGORY_LABELS[a].localeCompare(CATEGORY_LABELS[b]),
);

function prettyArea(area: BodyArea): string {
  return area.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function LibraryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedCats, setSelectedCats] = useState<Set<ExerciseCategory>>(new Set());
  // Equipment the user owns is always allowed; these chips add optional extra gear.
  const [selectedEquip, setSelectedEquip] = useState<Set<Equipment>>(new Set(EQUIPMENT_KEYS));
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Default the equipment filter to the user's saved profile (#28). An empty
  // profile leaves all equipment shown so the catalogue isn't hidden.
  useEffect(() => {
    (async () => {
      const state = await loadState();
      const owned = state?.settings?.availableEquipment ?? [];
      if (owned.length > 0) setSelectedEquip(new Set(owned));
    })();
  }, []);

  const toggleCat = (c: ExerciseCategory) =>
    setSelectedCats(prev => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });

  const toggleEquip = (e: Equipment) =>
    setSelectedEquip(prev => {
      const next = new Set(prev);
      next.has(e) ? next.delete(e) : next.add(e);
      return next;
    });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return EXERCISE_LIBRARY.filter(e => {
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (selectedCats.size > 0 && !e.categories.some(c => selectedCats.has(c))) return false;
      if (e.equipment !== 'none' && !selectedEquip.has(e.equipment)) return false;
      if (q && !e.name.toLowerCase().includes(q) && !e.desc.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, typeFilter, selectedCats, selectedEquip]);

  const renderHeader = () => (
    <View>
      <TextInput
        style={styles.search}
        placeholder="Search exercises…"
        placeholderTextColor={Colors.textMuted}
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
        returnKeyType="search"
      />

      <Text style={styles.filterLabel}>TYPE</Text>
      <View style={styles.row}>
        {(['all', 'work', 'stretch'] as TypeFilter[]).map(t => {
          const on = typeFilter === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setTypeFilter(t)}
              style={[styles.chip, on && { backgroundColor: ACCENT, borderColor: ACCENT }]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                {t === 'all' ? 'All' : t === 'work' ? 'Work' : 'Stretch'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.filterLabel}>EQUIPMENT</Text>
      <View style={styles.wrapRow}>
        {EQUIPMENT_KEYS.map(eq => {
          const on = selectedEquip.has(eq);
          return (
            <TouchableOpacity
              key={eq}
              onPress={() => toggleEquip(eq)}
              style={[styles.chip, on && { backgroundColor: ACCENT, borderColor: ACCENT }]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{EQUIPMENT_LABELS[eq]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.hint}>No-equipment exercises always show. Defaults to your saved equipment.</Text>

      <Text style={styles.filterLabel}>COMPLAINT / GOAL</Text>
      <View style={styles.wrapRow}>
        {CATEGORY_KEYS.map(c => {
          const on = selectedCats.has(c);
          return (
            <TouchableOpacity
              key={c}
              onPress={() => toggleCat(c)}
              style={[styles.chip, on && { backgroundColor: ACCENT, borderColor: ACCENT }]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{CATEGORY_LABELS[c]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {selectedCats.size > 0 && (
        <TouchableOpacity onPress={() => setSelectedCats(new Set())}>
          <Text style={styles.clearLink}>Clear categories</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.resultCount}>
        {filtered.length} {filtered.length === 1 ? 'exercise' : 'exercises'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: Colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Exercise Library</Text>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={e => e.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No exercises match these filters.</Text>
            <Text style={styles.emptyHint}>Try removing a filter or clearing your search.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ExerciseCard
            exercise={item}
            expanded={expandedId === item.id}
            onToggle={() => setExpandedId(prev => (prev === item.id ? null : item.id))}
          />
        )}
      />
    </SafeAreaView>
  );
}

function ExerciseCard({
  exercise: ex,
  expanded,
  onToggle,
}: {
  exercise: Exercise;
  expanded: boolean;
  onToggle: () => void;
}) {
  const typeColor = ex.type === 'work' ? Colors.work : Colors.stretch;
  const appearances = sessionsContainingExercise(ex.id).length;

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.cardHead}>
          <Text style={styles.cardName}>{ex.name}</Text>
          <Text style={[styles.chevron, expanded && styles.chevronOpen]}>▾</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.typeTag, { color: typeColor }]}>
            {ex.type === 'work' ? 'WORK' : 'STRETCH'}
          </Text>
          <Text style={styles.metaText}>{ex.reps ?? `${ex.duration}s`}</Text>
          <Text style={styles.metaText}>· {EQUIPMENT_LABELS[ex.equipment]}</Text>
          {ex.contraindications && <Text style={styles.warnTag}>⚠</Text>}
        </View>
        <View style={styles.catRow}>
          {ex.categories.slice(0, expanded ? ex.categories.length : 3).map(c => (
            <Text key={c} style={styles.catChip}>
              {CATEGORY_LABELS[c]}
            </Text>
          ))}
          {!expanded && ex.categories.length > 3 && (
            <Text style={styles.catMore}>+{ex.categories.length - 3}</Text>
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.detail}>
          <Text style={styles.descText}>{ex.desc}</Text>
          {ex.bilateral && ex.switchAt != null && (
            <Text style={styles.bilateralNote}>↔ Switch sides at {ex.switchAt}s</Text>
          )}
          <Text style={styles.detailLine}>
            <Text style={styles.detailKey}>Targets: </Text>
            {ex.targetAreas.map(prettyArea).join(', ')}
          </Text>
          <Text style={styles.detailLine}>
            <Text style={styles.detailKey}>Appears in: </Text>
            {appearances === 0
              ? 'Library only'
              : `${appearances} built-in ${appearances === 1 ? 'session' : 'sessions'}`}
          </Text>
          {ex.contraindications && (
            <View style={styles.warnBox}>
              <Text style={styles.warnText}>⚠ {ex.contraindications}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { minWidth: 60 },
  backText: { color: ACCENT, fontFamily: Fonts.mono, fontSize: 14 },
  topTitle: { color: Colors.text, fontFamily: Fonts.serif, fontSize: 18, fontWeight: '700' },
  listContent: { padding: 16, paddingBottom: 40 },
  search: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: 14,
    marginBottom: 14,
  },
  filterLabel: {
    fontSize: 10,
    letterSpacing: 3,
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    marginBottom: 8,
    marginTop: 4,
  },
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipText: { fontSize: 12, color: Colors.textSecondary, fontFamily: Fonts.mono },
  chipTextOn: { color: '#000', fontWeight: '700' },
  hint: { fontSize: 11, color: Colors.textMuted, fontFamily: Fonts.mono, marginBottom: 6 },
  clearLink: { color: ACCENT, fontFamily: Fonts.mono, fontSize: 12, marginBottom: 4 },
  resultCount: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 4,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 13,
    marginBottom: 8,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { flex: 1, color: Colors.text, fontSize: 14, fontWeight: '600' },
  chevron: { color: Colors.textDim, fontSize: 13, paddingLeft: 8 },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  typeTag: { fontSize: 10, fontFamily: Fonts.mono },
  metaText: { fontSize: 10, color: Colors.textDim, fontFamily: Fonts.mono },
  warnTag: { fontSize: 11 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  catChip: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: Fonts.mono,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  catMore: { fontSize: 10, color: Colors.textDim, fontFamily: Fonts.mono, alignSelf: 'center' },
  detail: {
    marginTop: 11,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  descText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 19, marginBottom: 8 },
  bilateralNote: { fontSize: 11, color: Colors.stretch, fontFamily: Fonts.mono, marginBottom: 8 },
  detailLine: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  detailKey: { color: Colors.textMuted, fontFamily: Fonts.mono, fontSize: 11 },
  warnBox: {
    marginTop: 10,
    backgroundColor: 'rgba(255,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.35)',
    borderRadius: 8,
    padding: 9,
  },
  warnText: { fontSize: 12, color: '#FF9A9A', lineHeight: 18 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: Colors.textSecondary, fontFamily: Fonts.mono, fontSize: 13 },
  emptyHint: { color: Colors.textMuted, fontFamily: Fonts.mono, fontSize: 11, marginTop: 6 },
});
