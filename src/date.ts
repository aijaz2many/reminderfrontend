import type { Recurrence, Reminder } from './types';

export function todayDateString(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

export function parseDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function isValidDateString(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}

export function formatDate(date: string, options?: Intl.DateTimeFormatOptions): string {
  return parseDate(date).toLocaleDateString('en-US', options || { month: 'short', day: 'numeric', year: 'numeric' });
}

export function daysUntil(date: string): number {
  const target = parseDate(date);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function dueLabel(date: string): string {
  const days = daysUntil(date);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days < 7) return `In ${days} days`;
  return formatDate(date, { month: 'short', day: 'numeric' });
}

export function recurrenceLabel(recurrence: Recurrence, value?: number | null, unit?: string | null): string {
  switch (recurrence) {
    case 'weekly':
      return 'Every week';
    case '15_days':
      return 'Every 15 days';
    case 'monthly':
      return 'Every month';
    case 'yearly':
      return 'Every year';
    case 'custom':
      return `Every ${value || 1} ${unit || 'days'}`;
  }
}

export function sortUpcoming(reminders: Reminder[]): Reminder[] {
  return reminders
    .filter((reminder) => reminder.status === 'active')
    .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));
}

export function displayName(fullName?: string | null, email?: string): string {
  return fullName?.trim().split(/\s+/)[0] || email?.split('@')[0] || 'there';
}
