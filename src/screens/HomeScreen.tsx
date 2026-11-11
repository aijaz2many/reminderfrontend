import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { daysUntil, displayName, dueLabel, formatDate, recurrenceLabel, sortUpcoming } from '../date';
import { colors, radius } from '../theme';
import type { Reminder, User } from '../types';

type Props = {
  user: User;
  reminders: Reminder[];
  onAdd: () => void;
  onOpenReminder: (reminder: Reminder) => void;
  onShowAll: () => void;
};

export function HomeScreen({ user, reminders, onAdd, onOpenReminder, onShowAll }: Props) {
  const upcoming = sortUpcoming(reminders);
  const dueSoon = upcoming.filter((reminder) => daysUntil(reminder.next_due_date) <= 7).length;
  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.date}>{dateLabel}</Text>
        <Text style={styles.greeting}>Hi, {displayName(user.full_name, user.email)} 👋</Text>
        <Text style={styles.subtitle}>Let’s keep the little things on track.</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryIcon}>
          <Feather name={dueSoon ? 'bell' : 'check'} size={18} color={colors.green} />
        </View>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryTitle}>
            {dueSoon === 0 ? 'You’re all caught up' : `${dueSoon} ${dueSoon === 1 ? 'reminder' : 'reminders'} this week`}
          </Text>
          <Text style={styles.summaryText}>
            {dueSoon === 0 ? 'Enjoy a little breathing room.' : 'We’ll help you remember.'}
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Coming up</Text>
          <Text style={styles.sectionSubtitle}>Your next reminders</Text>
        </View>
        {upcoming.length > 3 ? (
          <Pressable onPress={onShowAll} hitSlop={8} style={styles.seeAll}>
            <Text style={styles.seeAllText}>See all</Text>
            <Feather name="arrow-right" size={14} color={colors.green} />
          </Pressable>
        ) : null}
      </View>

      {upcoming.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing on your list yet</Text>
          <Text style={styles.emptyText}>Add a reminder and we’ll help you keep track.</Text>
          <Pressable onPress={onAdd} style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Add a reminder</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {upcoming.slice(0, 3).map((reminder, index) => (
            <ReminderRow
              key={reminder.id}
              reminder={reminder}
              isLast={index === Math.min(upcoming.length, 3) - 1}
              onPress={() => onOpenReminder(reminder)}
            />
          ))}
        </View>
      )}

      <Pressable onPress={onAdd} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
        <Feather name="plus" size={18} color={colors.white} />
        <Text style={styles.addButtonText}>Add a reminder</Text>
      </Pressable>
    </ScrollView>
  );
}

function ReminderRow({ reminder, isLast, onPress }: { reminder: Reminder; isLast: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.reminderRow, !isLast && styles.rowBorder, pressed && styles.pressed]}>
      <View style={styles.calendarIcon}>
        <Feather name="calendar" size={17} color={colors.green} />
      </View>
      <View style={styles.reminderCopy}>
        <Text numberOfLines={1} style={styles.reminderName}>{reminder.entity_name}</Text>
        <Text style={styles.reminderMeta}>
          {recurrenceLabel(reminder.recurrence, reminder.custom_interval_value, reminder.custom_interval_unit)} · {formatDate(reminder.next_due_date)}
        </Text>
      </View>
      <View style={styles.due}>
        <Text style={styles.dueText}>{dueLabel(reminder.next_due_date)}</Text>
        <Feather name="chevron-right" size={15} color={colors.muted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 22, paddingBottom: 32 },
  header: { marginTop: 6, marginBottom: 22 },
  date: { color: colors.muted, fontSize: 13, marginBottom: 8 },
  greeting: { color: colors.ink, fontSize: 26, fontWeight: '700', letterSpacing: -0.7 },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 6 },
  summary: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.mint, borderRadius: radius.md, padding: 15, marginBottom: 27 },
  summaryIcon: { width: 40, height: 40, backgroundColor: colors.white, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  summaryCopy: { flex: 1, marginLeft: 12 },
  summaryTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  summaryText: { color: colors.muted, fontSize: 11, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  sectionSubtitle: { color: colors.muted, fontSize: 11, marginTop: 4 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 6 },
  seeAllText: { color: colors.green, fontSize: 12, fontWeight: '600' },
  list: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13 },
  reminderRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  calendarIcon: { width: 38, height: 38, backgroundColor: colors.mint, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reminderCopy: { flex: 1, minWidth: 0, marginHorizontal: 10 },
  reminderName: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  reminderMeta: { color: colors.muted, fontSize: 10, marginTop: 5 },
  due: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  dueText: { color: colors.green, fontSize: 10, fontWeight: '600' },
  empty: { alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 22, paddingVertical: 24 },
  emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  emptyText: { color: colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 7 },
  emptyButton: { backgroundColor: colors.mint, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginTop: 15 },
  emptyButtonText: { color: colors.green, fontSize: 12, fontWeight: '700' },
  addButton: { minHeight: 49, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.green, borderRadius: 14, marginTop: 16 },
  addButtonText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.8 },
});
