import { Platform } from 'react-native';
import type {
  AuthResponse,
  NotificationLog,
  Reminder,
  ReminderInput,
  ReminderStatus,
  User,
} from './types';

const defaultHost = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
const configuredHost = process.env.EXPO_PUBLIC_API_URL?.trim() || defaultHost;
const API_URL = `${configuredHost.replace(/\/+$/, '')}/api/v1`;

interface ListResponse<T> {
  items: T[];
  limit: number;
  offset: number;
}

async function request<T>(path: string, token?: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new Error(`Can't reach the API at ${configuredHost}. Check that the backend is running and the URL is correct.`);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string };
      message = body.error || message;
    } catch {
      // Keep the HTTP status message when the server does not return JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', undefined, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (input: { email: string; phone_number: string; password: string; full_name: string }) =>
    request<AuthResponse>('/auth/register', undefined, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  me: (token: string) => request<User>('/me', token),

  reminders: (token: string) => request<ListResponse<Reminder>>('/reminders?limit=100&offset=0', token),

  notificationLogs: (token: string) =>
    request<ListResponse<NotificationLog>>('/notification-logs?limit=100&offset=0', token),

  createReminder: (token: string, input: ReminderInput) =>
    request<Reminder>('/reminders', token, { method: 'POST', body: JSON.stringify(input) }),

  updateReminder: (token: string, id: string, input: ReminderInput) =>
    request<Reminder>(`/reminders/${encodeURIComponent(id)}`, token, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  updateReminderStatus: (token: string, id: string, status: ReminderStatus) =>
    request<Reminder>(`/reminders/${encodeURIComponent(id)}/status`, token, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteReminder: (token: string, id: string) =>
    request<void>(`/reminders/${encodeURIComponent(id)}`, token, { method: 'DELETE' }),

  updateDeviceToken: (token: string, deviceToken: string | null) =>
    request<void>('/me/device-token', token, {
      method: 'PATCH',
      body: JSON.stringify({ fcm_device_token: deviceToken }),
    }),
};

export const apiHost = configuredHost;
