import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { dueLabel, formatDate, recurrenceLabel } from '../date';
import { colors, radius } from '../theme';
import type { Reminder, ReminderStatus } from '../types';

type Props = {
  reminder: Reminder;
  onBack: () => void;
  onEdit: () => void;
  onStatusChange: (status: ReminderStatus) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function ReminderDetailScreen({ reminder, onBack, onEdit, onStatusChange, onDelete }: Props) {
  const nextStatus: ReminderStatus = reminder.status === 'active' ? 'paused' : 'active';
  const statusLabel = reminder.status === 'active' ? 'Pause reminder' : 'Resume reminder';

  function confirmDelete() {
    Alert.alert('Delete this reminder?', 'This cannot be undone. Your reminder and its notification history will be removed.', [
      { text: 'Keep reminder', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void onDelete() },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.top}>
        <Pressable accessibilityLabel="Go back" onPress={onBack} style={styles.backButton}>
          <Feather name="arrow-left" size={19} color={colors.ink} />
        </Pressable>
        <Text style={styles.topLabel}>YOUR REMINDER</Text>
        <Pressable accessibilityLabel="Edit reminder" onPress={onEdit} style={styles.editButton}>
          <Feather name="edit-2" size={17} color={colors.green} />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroIcon}><Feather name="bell" size={22} color={colors.green} /></View>
        <View style={[styles.status, reminder.status === 'completed' ? styles.done : reminder.status === 'paused' && styles.paused]}>
          <Text style={[styles.statusText, reminder.status !== 'active' && styles.statusMuted]}>{reminder.status}</Text>
        </View>
        <Text style={styles.title}>{reminder.entity_name}</Text>
        <Text style={styles.description}>{reminder.description || 'A little nudge for something worth remembering.'}</Text>
      </View>

      <View style={styles.nextCard}>
        <View style={styles.nextIcon}><Feather name="calendar" size={17} color={colors.white} /></View>
        <View style={styles.nextCopy}>
          <Text style={styles.nextLabel}>NEXT UP</Text>
          <Text style={styles.nextDate}>{formatDate(reminder.next_due_date, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>
        <Text style={styles.due}>{dueLabel(reminder.next_due_date)}</Text>
      </View>

      <View style={styles.infoCard}>
        <InfoRow icon="repeat" label="Repeats" value={recurrenceLabel(reminder.recurrence, reminder.custom_interval_value, reminder.custom_interval_unit)} />
        <View style={styles.divider} />
        <InfoRow icon="calendar" label="Started" value={formatDate(reminder.start_date)} />
        <View style={styles.divider} />
        <InfoRow icon="bell" label="Advance notice" value={reminder.advance_notice_days === 0 ? 'On the day' : `${reminder.advance_notice_days} days before`} />
      </View>

      <Text style={styles.note}>You’re doing a good job keeping the little things in view.</Text>

      {reminder.status !== 'completed' ? (
        <Pressable onPress={() => void onStatusChange(nextStatus)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
          <Feather name={nextStatus === 'paused' ? 'pause-circle' : 'play-circle'} size={17} color={colors.green} />
          <Text style={styles.secondaryText}>{statusLabel}</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => void onStatusChange('active')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
          <Feather name="rotate-ccw" size={16} color={colors.green} />
          <Text style={styles.secondaryText}>Bring this reminder back</Text>
        </Pressable>
      )}
      {reminder.status !== 'completed' ? (
        <Pressable onPress={() => void onStatusChange('completed')} style={({ pressed }) => [styles.completeButton, pressed && styles.pressed]}>
          <Feather name="check" size={16} color={colors.green} />
          <Text style={styles.completeText}>Mark as complete</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={confirmDelete} style={styles.deleteButton}>
        <Text style={styles.deleteText}>Delete reminder</Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><Feather name={icon} size={15} color={colors.green} /></View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 21, paddingBottom: 36 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 18 },
  backButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  topLabel: { color: colors.green, fontWeight: '800', letterSpacing: 1.5, fontSize: 9 },
  editButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint },
  hero: { alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.lg, padding: 23, borderWidth: 1, borderColor: colors.line },
  heroIcon: { width: 54, height: 54, borderRadius: 19, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  status: { backgroundColor: colors.mint, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  done: { backgroundColor: colors.lavender },
  paused: { backgroundColor: '#F1F1ED' },
  statusText: { color: colors.green, fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
  statusMuted: { color: colors.muted },
  title: { color: colors.ink, fontSize: 23, fontWeight: '700', letterSpacing: -0.6, textAlign: 'center', marginTop: 10 },
  description: { color: colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 19, marginTop: 6 },
  nextCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.greenDark, borderRadius: 18, padding: 15, marginTop: 12 },
  nextIcon: { width: 39, height: 39, borderRadius: 14, backgroundColor: '#FFFFFF1A', alignItems: 'center', justifyContent: 'center' },
  nextCopy: { flex: 1, marginLeft: 11 },
  nextLabel: { color: '#BED0C1', fontSize: 8, letterSpacing: 1.2, fontWeight: '800' },
  nextDate: { color: colors.white, fontSize: 12, fontWeight: '700', marginTop: 4 },
  due: { color: '#E8C697', fontSize: 9, fontWeight: '700' },
  infoCard: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, marginTop: 12, paddingHorizontal: 14 },
  infoRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center' },
  infoIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  infoLabel: { flex: 1, color: colors.muted, fontSize: 11 },
  infoValue: { color: colors.ink, fontSize: 11, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.line },
  note: { color: '#87938A', fontSize: 11, lineHeight: 17, fontStyle: 'italic', textAlign: 'center', marginVertical: 18 },
  secondaryButton: { minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 15, borderWidth: 1, borderColor: '#D5E4D8', backgroundColor: colors.white },
  secondaryText: { color: colors.green, fontSize: 12, fontWeight: '700' },
  completeButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 7 },
  completeText: { color: colors.green, fontSize: 11, fontWeight: '700' },
  deleteButton: { alignItems: 'center', padding: 10, marginTop: 3 },
  deleteText: { color: colors.red, fontSize: 10, fontWeight: '600' },
  pressed: { opacity: 0.78 },
});
