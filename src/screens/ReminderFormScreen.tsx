import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { isValidDateString, todayDateString } from '../date';
import type { IntervalUnit, Recurrence, Reminder, ReminderInput } from '../types';

type Props = {
  reminder?: Reminder;
  onCancel: () => void;
  onSave: (input: ReminderInput) => Promise<void>;
};

const recurrenceOptions: { value: Recurrence; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: '15_days', label: '15 days' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' },
];
const intervalUnits: IntervalUnit[] = ['days', 'weeks', 'months', 'years'];
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function ReminderFormScreen({ reminder, onCancel, onSave }: Props) {
  const [name, setName] = useState(reminder?.entity_name || '');
  const [description, setDescription] = useState(reminder?.description || '');
  const [startDate, setStartDate] = useState(reminder?.start_date || todayDateString());
  const [recurrence, setRecurrence] = useState<Recurrence>(reminder?.recurrence || 'monthly');
  const [intervalValue, setIntervalValue] = useState(String(reminder?.custom_interval_value || 2));
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>(reminder?.custom_interval_unit || 'weeks');
  const [noticeDays, setNoticeDays] = useState(String(reminder?.advance_notice_days || 0));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const [yearPageStart, setYearPageStart] = useState(0);
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const [year, month] = (reminder?.start_date || todayDateString()).split('-').map(Number);
    return new Date(year, month - 1, 1, 12);
  });

  function showDatePicker() {
    const [year, month] = startDate.split('-').map(Number);
    setDisplayedMonth(new Date(year, month - 1, 1, 12));
    setYearPickerVisible(false);
    setDatePickerVisible(true);
  }

  function changeMonth(offset: number) {
    setDisplayedMonth((month) => new Date(month.getFullYear(), month.getMonth() + offset, 1, 12));
  }

  const firstWeekday = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 0).getDate();
  const calendarDayCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const calendarDays = Array.from({ length: calendarDayCount }, (_, index) => {
    return new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), index - firstWeekday + 1, 12);
  });
  const years = Array.from({ length: 12 }, (_, index) => yearPageStart + index);

  async function submit() {
    setError('');
    if (!name.trim()) {
      setError('Give this reminder a name so you can spot it later.');
      return;
    }
    if (!isValidDateString(startDate)) {
      setError('Enter a valid date in YYYY-MM-DD format.');
      return;
    }
    const advanceNotice = Number(noticeDays);
    if (!Number.isInteger(advanceNotice) || advanceNotice < 0 || advanceNotice > 365) {
      setError('Advance notice must be between 0 and 365 days.');
      return;
    }
    const customValue = Number(intervalValue);
    if (recurrence === 'custom' && (!Number.isInteger(customValue) || customValue < 1 || customValue > 1000)) {
      setError('A custom interval must be between 1 and 1000.');
      return;
    }

    const input: ReminderInput = {
      entity_name: name.trim(),
      description: description.trim(),
      start_date: startDate,
      recurrence,
      advance_notice_days: advanceNotice,
    };
    if (recurrence === 'custom') {
      input.custom_interval_value = customValue;
      input.custom_interval_unit = intervalUnit;
    }

    setSaving(true);
    try {
      await onSave(input);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save your reminder. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Pressable accessibilityLabel="Go back" onPress={onCancel} style={styles.backButton}>
            <Feather name="arrow-left" size={19} color={colors.ink} />
          </Pressable>
          <Text style={styles.topLabel}>{reminder ? 'Edit reminder' : 'New reminder'}</Text>
          <View style={styles.backButton} />
        </View>

        <Text style={styles.title}>{reminder ? 'Edit reminder' : 'Add a reminder'}</Text>
        <Text style={styles.subtitle}>We’ll help you remember.</Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>What should we remind you about?</Text>
          <TextInput
            autoCapitalize="sentences"
            maxLength={255}
            onChangeText={setName}
            placeholder="e.g. Water the plants"
            placeholderTextColor="#A0AAA3"
            style={styles.input}
            value={name}
          />

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            maxLength={10000}
            multiline
            onChangeText={setDescription}
            placeholder="Add a little context for future you…"
            placeholderTextColor="#A0AAA3"
            style={[styles.input, styles.multiline]}
            textAlignVertical="top"
            value={description}
          />

          <Text style={styles.label}>Start date</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Choose start date, currently ${startDate}`}
            onPress={showDatePicker}
            style={styles.inputWithIcon}
          >
            <Feather name="calendar" size={16} color={colors.muted} />
            <Text style={styles.dateInput}>{startDate}</Text>
            <Feather name="chevron-down" size={16} color={colors.muted} />
          </Pressable>
          <Text style={styles.helper}>Tap to choose a date.</Text>

          <Text style={[styles.label, styles.recurrenceLabel]}>Repeat</Text>
          <View style={styles.recurrenceGrid}>
            {recurrenceOptions.map((option) => {
              const selected = recurrence === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setRecurrence(option.value)}
                  style={[styles.recurrenceOption, selected && styles.recurrenceSelected]}
                >
                  {selected ? <Feather name="check" size={13} color={colors.white} /> : null}
                  <Text style={[styles.recurrenceText, selected && styles.recurrenceTextSelected]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {recurrence === 'custom' ? (
            <View style={styles.customRow}>
              <View style={styles.customInputGroup}>
                <Text style={styles.smallLabel}>EVERY</Text>
                <TextInput
                  keyboardType="number-pad"
                  onChangeText={setIntervalValue}
                  style={styles.numberInput}
                  value={intervalValue}
                />
              </View>
              <View style={styles.unitGroup}>
                <Text style={styles.smallLabel}>UNIT</Text>
                <View style={styles.unitOptions}>
                  {intervalUnits.map((unit) => (
                    <Pressable
                      key={unit}
                      onPress={() => setIntervalUnit(unit)}
                      style={[styles.unitOption, intervalUnit === unit && styles.unitSelected]}
                    >
                      <Text style={[styles.unitText, intervalUnit === unit && styles.unitTextSelected]}>{unit}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          ) : null}

          <Text style={[styles.label, styles.noticeLabel]}>Advance notice</Text>
          <View style={styles.noticeRow}>
            <View style={styles.noticeIcon}><Feather name="bell" size={16} color={colors.green} /></View>
            <Text style={styles.noticeCopy}>Days before it’s due</Text>
            <TextInput
              keyboardType="number-pad"
              onChangeText={setNoticeDays}
              style={styles.noticeInput}
              value={noticeDays}
            />
          </View>
        </View>

        {error ? (
          <View style={styles.error}>
            <Feather name="alert-circle" size={16} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable disabled={saving} onPress={submit} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed, saving && styles.disabled]}>
          {saving ? <ActivityIndicator color={colors.white} /> : <><Text style={styles.saveText}>{reminder ? 'Save changes' : 'Create reminder'}</Text><Feather name="arrow-up-right" size={18} color={colors.white} /></>}
        </Pressable>
        <Pressable disabled={saving} onPress={onCancel} style={styles.cancelButton}><Text style={styles.cancelText}>Maybe later</Text></Pressable>
      </ScrollView>
      <Modal
        animationType="fade"
        onRequestClose={() => setDatePickerVisible(false)}
        transparent
        visible={datePickerVisible}
      >
        <View style={styles.datePickerBackdrop}>
          <View accessibilityLabel="Choose start date" accessibilityRole="dialog" style={styles.datePickerCard}>
            <View style={styles.calendarHeader}>
              <Pressable
                accessibilityLabel={yearPickerVisible ? 'Previous years' : 'Previous month'}
                onPress={() => yearPickerVisible ? setYearPageStart((year) => year - 12) : changeMonth(-1)}
                style={styles.monthButton}
              >
                <Feather name="chevron-left" size={20} color={colors.ink} />
              </Pressable>
              <Pressable
                accessibilityLabel="Choose year"
                accessibilityRole="button"
                onPress={() => {
                  setYearPageStart(Math.floor(displayedMonth.getFullYear() / 12) * 12);
                  setYearPickerVisible((visible) => !visible);
                }}
                style={styles.calendarTitleButton}
              >
                <Text style={styles.calendarTitle}>
                  {yearPickerVisible
                    ? `${years[0]} - ${years[years.length - 1]}`
                    : displayedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel={yearPickerVisible ? 'Next years' : 'Next month'}
                onPress={() => yearPickerVisible ? setYearPageStart((year) => year + 12) : changeMonth(1)}
                style={styles.monthButton}
              >
                <Feather name="chevron-right" size={20} color={colors.ink} />
              </Pressable>
            </View>
            {yearPickerVisible ? (
              <View style={styles.yearGrid}>
                {years.map((year) => (
                  <Pressable
                    accessibilityLabel={`Select ${year}`}
                    accessibilityRole="button"
                    key={year}
                    onPress={() => {
                      setDisplayedMonth((month) => new Date(year, month.getMonth(), 1, 12));
                      setYearPickerVisible(false);
                    }}
                    style={[styles.yearOption, year === displayedMonth.getFullYear() && styles.yearOptionSelected]}
                  >
                    <Text style={[styles.yearText, year === displayedMonth.getFullYear() && styles.yearTextSelected]}>{year}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.calendarGrid}>
                {weekdays.map((day) => (
                  <Text key={day} style={styles.weekday}>{day}</Text>
                ))}
                {calendarDays.map((day) => {
                  const value = dateString(day);
                  const selected = value === startDate;
                  const inDisplayedMonth = day.getMonth() === displayedMonth.getMonth();
                  return (
                    <Pressable
                      accessibilityLabel={day.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={value}
                      onPress={() => {
                        setStartDate(value);
                        setDatePickerVisible(false);
                      }}
                      style={[styles.calendarDay, selected && styles.calendarDaySelected]}
                    >
                      <Text style={[
                        styles.calendarDayText,
                        !inDisplayedMonth && styles.calendarDayOutside,
                        selected && styles.calendarDayTextSelected,
                      ]}>
                        {day.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            <Pressable onPress={() => setDatePickerVisible(false)} style={styles.datePickerCancel}>
              <Text style={styles.datePickerCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 21, paddingBottom: 36 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 23 },
  backButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  topLabel: { color: colors.muted, fontWeight: '600', fontSize: 12 },
  title: { color: colors.ink, fontSize: 25, lineHeight: 31, fontWeight: '700', letterSpacing: -0.6 },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 5, marginBottom: 17 },
  formCard: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 16 },
  label: { color: colors.ink, fontSize: 12, fontWeight: '600', marginBottom: 7, marginTop: 5 },
  input: { height: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FCFDFB', paddingHorizontal: 12, color: colors.ink, fontSize: 13, marginBottom: 13 },
  multiline: { height: 76, paddingTop: 12 },
  inputWithIcon: { height: 46, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FCFDFB', paddingHorizontal: 12 },
  dateInput: { flex: 1, color: colors.ink, fontSize: 13 },
  helper: { color: colors.muted, fontSize: 9, marginTop: 6 },
  datePickerBackdrop: { flex: 1, backgroundColor: 'rgba(20, 32, 24, 0.4)', justifyContent: 'center', padding: 24 },
  datePickerCard: { width: '100%', maxWidth: 340, alignSelf: 'center', backgroundColor: colors.white, borderRadius: radius.md, padding: 12 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  monthButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F3F5F1' },
  calendarTitleButton: { minHeight: 34, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  calendarTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.2857%', textAlign: 'center', color: colors.muted, fontSize: 10, fontWeight: '600', paddingVertical: 6 },
  calendarDay: { width: '14.2857%', height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  calendarDaySelected: { backgroundColor: colors.green },
  calendarDayText: { color: colors.ink, fontSize: 13 },
  calendarDayOutside: { color: '#A0AAA3' },
  calendarDayTextSelected: { color: colors.white, fontWeight: '700' },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 6 },
  yearOption: { width: '25%', height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  yearOptionSelected: { backgroundColor: colors.green },
  yearText: { color: colors.ink, fontSize: 13 },
  yearTextSelected: { color: colors.white, fontWeight: '700' },
  datePickerCancel: { alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, marginTop: 6 },
  datePickerCancelText: { color: colors.green, fontSize: 13, fontWeight: '700' },
  recurrenceLabel: { marginTop: 19 },
  recurrenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  recurrenceOption: { height: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FCFDFB' },
  recurrenceSelected: { backgroundColor: colors.green, borderColor: colors.green },
  recurrenceText: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  recurrenceTextSelected: { color: colors.white },
  customRow: { flexDirection: 'row', gap: 13, marginTop: 15 },
  customInputGroup: { width: 72 },
  smallLabel: { color: colors.muted, fontSize: 9, fontWeight: '600', marginBottom: 6 },
  numberInput: { height: 40, borderRadius: 11, borderWidth: 1, borderColor: colors.line, textAlign: 'center', color: colors.ink, fontWeight: '700' },
  unitGroup: { flex: 1 },
  unitOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  unitOption: { paddingHorizontal: 8, height: 30, justifyContent: 'center', borderRadius: 9, backgroundColor: '#F3F5F1' },
  unitSelected: { backgroundColor: colors.mint },
  unitText: { color: colors.muted, fontSize: 9, textTransform: 'capitalize' },
  unitTextSelected: { color: colors.green, fontWeight: '700' },
  noticeLabel: { marginTop: 20 },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  noticeIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  noticeCopy: { flex: 1, color: colors.ink, fontSize: 12 },
  noticeInput: { width: 49, height: 37, borderRadius: 11, borderWidth: 1, borderColor: colors.line, textAlign: 'center', color: colors.ink, fontSize: 13, fontWeight: '700' },
  error: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 13, paddingHorizontal: 3 },
  errorText: { flex: 1, color: colors.red, fontSize: 11, lineHeight: 16 },
  saveButton: { minHeight: 49, borderRadius: 14, backgroundColor: colors.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  saveText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.7 },
  cancelButton: { alignItems: 'center', padding: 13 },
  cancelText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
});
