export type Recurrence = 'weekly' | '15_days' | 'monthly' | 'yearly' | 'custom';
export type IntervalUnit = 'days' | 'weeks' | 'months' | 'years';
export type ReminderStatus = 'active' | 'paused' | 'completed';

export interface User {
  id: string;
  email: string;
  phone_number: string;
  full_name?: string | null;
  role: 'tenant_user' | 'super_admin';
  subscription_tier: string;
  created_at: string;
}

export interface UserDevice {
  id: string;
  device_token: string;
  platform: 'android' | 'ios';
  device_name?: string | null;
  is_active: boolean;
  last_used_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  entity_name: string;
  description?: string | null;
  start_date: string;
  next_due_date: string;
  recurrence: Recurrence;
  custom_interval_value?: number | null;
  custom_interval_unit?: IntervalUnit | null;
  advance_notice_days: number;
  notification_time: string;
  timezone: string;
  status: ReminderStatus;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  reminder_id?: string | null;
  user_id?: string | null;
  device_id?: string | null;
  scheduled_for: string;
  sent_at?: string | null;
  status: string;
  channel: string;
  provider?: string | null;
  provider_message_id?: string | null;
  error_message?: string | null;
  retry_count: number;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ReminderInput {
  entity_name: string;
  description: string;
  start_date: string;
  recurrence: Recurrence;
  custom_interval_value?: number;
  custom_interval_unit?: IntervalUnit;
  advance_notice_days: number;
  notification_time: string;
  timezone: string;
}
