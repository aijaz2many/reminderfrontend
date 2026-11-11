import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { dueLabel, formatDate, recurrenceLabel, sortUpcoming } from '../date';
import { colors, radius } from '../theme';
import type { Reminder, ReminderStatus } from '../types';

type Filter = 'all' | ReminderStatus;
type Props = {
  reminders: Reminder[];
  onAdd: () => void;
  onOpenReminder: (reminder: Reminder) => void;
};

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'paused', label: 'Paused' },
  { key: 'completed', label: 'Done' },
];

export function RemindersScreen({ reminders, onAdd, onOpenReminder }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const items = useMemo(() => {
    const filtered = filter === 'all' ? reminders : reminders.filter((reminder) => reminder.status === filter);
    return [
      ...sortUpcoming(filtered),
      ...filtered.filter((reminder) => reminder.status !== 'active')
        .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date)),
    ];
  }, [filter, reminders]);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Reminders</Text>
          <Text style={styles.subtitle}>Keep the things that matter in view.</Text>
        </View>
        <Pressable accessibilityLabel="Add reminder" onPress={onAdd} style={styles.addButton}>
          <Feather name="plus" size={20} color={colors.white} />
        </Pressable>
      </View>

      <View style={styles.filters}>
        {filters.map((item) => {
          const selected = filter === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setFilter(item.key)}
              style={[styles.filter, selected && styles.filterSelected]}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>{filter === 'all' ? 'All reminders' : filters.find((item) => item.key === filter)?.label}</Text>
        <Text style={styles.listCount}>{items.length}</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Feather name="calendar" size={19} color={colors.green} /></View>
          <Text style={styles.emptyTitle}>{filter === 'all' ? 'No reminders yet' : `No ${filter} reminders`}</Text>
          <Text style={styles.emptyText}>
            {filter === 'all' ? 'Add your first reminder to get started.' : 'Try another filter or add a new reminder.'}
          </Text>
          {filter === 'all' ? (
            <Pressable onPress={onAdd} style={styles.emptyAction}>
              <Text style={styles.emptyActionText}>Add reminder</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((reminder, index) => (
            <ReminderRow
              key={reminder.id}
              reminder={reminder}
              isLast={index === items.length - 1}
              onPress={() => onOpenReminder(reminder)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function ReminderRow({ reminder, isLast, onPress }: { reminder: Reminder; isLast: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, !isLast && styles.rowBorder, pressed && styles.pressed]}>
      <View style={styles.icon}><Feather name="calendar" size={17} color={colors.green} /></View>
      <View style={styles.rowCopy}>
        <View style={styles.nameLine}>
          <Text numberOfLines={1} style={styles.name}>{reminder.entity_name}</Text>
          <Text style={[styles.status, reminder.status !== 'active' && styles.statusMuted]}>
            {reminder.status === 'completed' ? 'Done' : reminder.status === 'paused' ? 'Paused' : ''}
          </Text>
        </View>
        <Text style={styles.recurrence}>
          {recurrenceLabel(reminder.recurrence, reminder.custom_interval_value, reminder.custom_interval_unit)}
        </Text>
        <Text style={styles.dueDate}>
          Next: {formatDate(reminder.next_due_date)}{reminder.status === 'active' ? ` · ${dueLabel(reminder.next_due_date)}` : ''}
        </Text>
      </View>
      <Feather name="chevron-right" size={17} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 22, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: 20 },
  title: { color: colors.ink, fontSize: 26, fontWeight: '700', letterSpacing: -0.7 },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 6 },
  addButton: { width: 43, height: 43, backgroundColor: colors.green, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', gap: 7, marginBottom: 22 },
  filter: { flex: 1, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1 },
  filterSelected: { backgroundColor: colors.green, borderColor: colors.green },
  filterText: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  filterTextSelected: { color: colors.white },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  listTitle: { color: colors.ink, fontWeight: '700', fontSize: 14 },
  listCount: { color: colors.muted, fontSize: 11 },
  list: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13 },
  row: { minHeight: 76, flexDirection: 'row', alignItems: 'center' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0, marginHorizontal: 10 },
  nameLine: { flexDirection: 'row', alignItems: 'center' },
  name: { color: colors.ink, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  status: { color: colors.green, fontSize: 9, fontWeight: '600', marginLeft: 7 },
  statusMuted: { color: colors.muted },
  recurrence: { color: colors.muted, fontSize: 10, marginTop: 4 },
  dueDate: { color: colors.green, fontSize: 9, marginTop: 5 },
  empty: { alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: 22, paddingVertical: 24, borderWidth: 1, borderColor: colors.line },
  emptyIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  emptyTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  emptyText: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 6 },
  emptyAction: { padding: 10, marginTop: 5 },
  emptyActionText: { color: colors.green, fontSize: 12, fontWeight: '700' },
  pressed: { opacity: 0.8 },
});
