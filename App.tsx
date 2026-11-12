import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Feather } from '@expo/vector-icons';
import { api } from './src/api';
import { AccountScreen } from './src/screens/AccountScreen';
import { ActivityScreen } from './src/screens/ActivityScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ReminderDetailScreen } from './src/screens/ReminderDetailScreen';
import { ReminderFormScreen } from './src/screens/ReminderFormScreen';
import { RemindersScreen } from './src/screens/RemindersScreen';
import { sessionStore } from './src/sessionStore';
import { colors } from './src/theme';
import type { AuthResponse, NotificationLog, Reminder, ReminderInput, ReminderStatus, User, UserDevice } from './src/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type Session = { token: string; user: User };
type Tab = 'Today' | 'Reminders' | 'Activity' | 'Account';
type Page = 'create' | 'detail' | 'edit' | null;

const SESSION_KEY = 'daymark-session';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('Today');
  const [page, setPage] = useState<Page>(null);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [updatingNotifications, setUpdatingNotifications] = useState(false);
  const [error, setError] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        const saved = await sessionStore.getItemAsync(SESSION_KEY);
        if (saved && active) {
          const parsed = JSON.parse(saved) as Session;
          if (parsed.token && parsed.user?.id) setSession(parsed);
        }
      } catch {
        await sessionStore.deleteItemAsync(SESSION_KEY);
      } finally {
        if (active) setReady(true);
      }
    }
    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const refreshData = useCallback(async (token: string) => {
    setLoadingData(true);
    try {
      const [currentUser, reminderResponse, logResponse, deviceResponse] = await Promise.all([
        api.me(token),
        api.reminders(token),
        api.notificationLogs(token),
        api.devices(token),
      ]);
      setSession((current) => current?.token === token ? { token, user: currentUser } : current);
      setReminders(reminderResponse.items);
      setLogs(logResponse.items);
      setDevices(deviceResponse.items);
      let thisDeviceId: string | null = null;
      if (Device.isDevice && Device.osName?.toLowerCase() === 'android') {
        try {
          const nativeToken = await Notifications.getDevicePushTokenAsync();
          const currentDevice = deviceResponse.items.find((device) =>
            device.device_token === String(nativeToken.data),
          );
          thisDeviceId = currentDevice?.id || null;
        } catch {
          thisDeviceId = null;
        }
      }
      setCurrentDeviceId(thisDeviceId);
      setNotificationsEnabled(Boolean(deviceResponse.items.find((device) => device.id === thisDeviceId)?.is_active));
      setError('');
      await sessionStore.setItemAsync(SESSION_KEY, JSON.stringify({ token, user: currentUser }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not refresh your reminders.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (session) void refreshData(session.token);
    else {
      setReminders([]);
      setLogs([]);
      setDevices([]);
      setCurrentDeviceId(null);
      setNotificationsEnabled(false);
    }
  }, [session?.token, refreshData]);

  async function onAuthenticated(result: AuthResponse) {
    const nextSession = { token: result.token, user: result.user };
    await sessionStore.setItemAsync(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    setTab('Today');
    setError('');
  }

  async function signOut() {
    await sessionStore.deleteItemAsync(SESSION_KEY);
    setSession(null);
    setPage(null);
    setSelectedReminder(null);
    setError('');
    setNotificationMessage('');
  }

  function openReminder(reminder: Reminder) {
    setSelectedReminder(reminder);
    setPage('detail');
  }

  async function saveReminder(input: ReminderInput) {
    if (!session) throw new Error('Your session expired. Please sign in again.');
    if (page === 'edit' && selectedReminder) {
      const updated = await api.updateReminder(session.token, selectedReminder.id, input);
      setSelectedReminder(updated);
    } else {
      await api.createReminder(session.token, input);
    }
    await refreshData(session.token);
    setPage(null);
    setTab('Reminders');
  }

  async function updateStatus(status: ReminderStatus) {
    if (!session || !selectedReminder) return;
    try {
      const updated = await api.updateReminderStatus(session.token, selectedReminder.id, status);
      setSelectedReminder(updated);
      await refreshData(session.token);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update this reminder.');
    }
  }

  async function deleteReminder() {
    if (!session || !selectedReminder) return;
    try {
      await api.deleteReminder(session.token, selectedReminder.id);
      setPage(null);
      setSelectedReminder(null);
      await refreshData(session.token);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not delete this reminder.');
    }
  }

  async function toggleNotifications() {
    setNotificationMessage('');
    if (!session) return;
    if (!Device.isDevice) {
      setNotificationMessage('Push notifications need a physical Android device.');
      return;
    }
    if (Device.osName?.toLowerCase() !== 'android') {
      setNotificationMessage('iOS push delivery needs Firebase and APNs credentials.');
      return;
    }

    setUpdatingNotifications(true);
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: colors.green,
      });
      let permission = await Notifications.getPermissionsAsync();
      if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
      if (!permission.granted) {
        setNotificationMessage('Allow notifications in Android settings to receive reminders.');
        return;
      }
      let updatedDevice: UserDevice;
      const currentDevice = currentDeviceId ? devices.find((item) => item.id === currentDeviceId) : undefined;
      if (currentDevice) {
        updatedDevice = await api.updateDevice(session.token, currentDevice.id, !currentDevice.is_active);
      } else {
        const nativeToken = await Notifications.getDevicePushTokenAsync();
        updatedDevice = await api.registerDevice(session.token, {
          device_token: String(nativeToken.data),
          platform: 'android',
          device_name: Device.deviceName || Device.modelName || undefined,
        });
        setCurrentDeviceId(updatedDevice.id);
      }
      setDevices((current) => [
        ...current.filter((item) => item.id !== updatedDevice.id),
        updatedDevice,
      ]);
      setNotificationsEnabled(updatedDevice.is_active);
      setNotificationMessage(updatedDevice.is_active ? 'This device is ready for reminders.' : 'Push notifications are off on this device.');
    } catch (reason) {
      setNotificationMessage(reason instanceof Error ? reason.message : 'Could not enable push notifications.');
    } finally {
      setUpdatingNotifications(false);
    }
  }

  async function toggleDevice(deviceId: string, isActive: boolean) {
    if (!session) return;
    try {
      setUpdatingNotifications(true);
      if (isActive && deviceId === currentDeviceId) {
        let permission = await Notifications.getPermissionsAsync();
        if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
        if (!permission.granted) {
          setNotificationMessage('Allow notifications in Android settings to receive reminders.');
          return;
        }
      }
      const updatedDevice = await api.updateDevice(session.token, deviceId, isActive);
      setDevices((current) => current.map((device) => device.id === updatedDevice.id ? updatedDevice : device));
      if (deviceId === currentDeviceId) setNotificationsEnabled(updatedDevice.is_active);
      setNotificationMessage('');
    } catch (reason) {
      setNotificationMessage(reason instanceof Error ? reason.message : 'Could not update this device.');
    } finally {
      setUpdatingNotifications(false);
    }
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar style="dark" />
        <View style={styles.loadingMark}><Feather name="sun" size={22} color={colors.white} /></View>
        <ActivityIndicator color={colors.green} style={styles.loadingSpinner} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.authRoot}>
        <StatusBar style="dark" />
        <AuthScreen onAuthenticated={onAuthenticated} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      {error ? (
        <Pressable onPress={() => setError('')} style={styles.errorBanner}>
          <Feather name="alert-circle" size={15} color={colors.white} />
          <Text numberOfLines={2} style={styles.errorText}>{error}</Text>
          <Feather name="x" size={16} color={colors.white} />
        </Pressable>
      ) : null}
      <View style={styles.body}>
        {page === 'create' ? (
          <ReminderFormScreen onCancel={() => setPage(null)} onSave={saveReminder} />
        ) : page === 'edit' && selectedReminder ? (
          <ReminderFormScreen reminder={selectedReminder} onCancel={() => setPage('detail')} onSave={saveReminder} />
        ) : page === 'detail' && selectedReminder ? (
          <ReminderDetailScreen
            reminder={selectedReminder}
            onBack={() => setPage(null)}
            onEdit={() => setPage('edit')}
            onStatusChange={updateStatus}
            onDelete={deleteReminder}
          />
        ) : (
          <>
            <View style={styles.screen}>
              {tab === 'Today' ? (
                <HomeScreen
                  user={session.user}
                  reminders={reminders}
                  onAdd={() => setPage('create')}
                  onOpenReminder={openReminder}
                  onShowAll={() => setTab('Reminders')}
                />
              ) : null}
              {tab === 'Reminders' ? (
                <RemindersScreen reminders={reminders} onAdd={() => setPage('create')} onOpenReminder={openReminder} />
              ) : null}
              {tab === 'Activity' ? <ActivityScreen logs={logs} /> : null}
              {tab === 'Account' ? (
                <AccountScreen
                  user={session.user}
                  remindersCount={reminders.length}
                  devices={devices}
                  currentDeviceId={currentDeviceId}
                  notificationsEnabled={notificationsEnabled}
                  notificationMessage={notificationMessage}
                  updatingNotifications={updatingNotifications}
                  onToggleNotifications={() => void toggleNotifications()}
                  onToggleDevice={(id, isActive) => void toggleDevice(id, isActive)}
                  onSignOut={() => void signOut()}
                />
              ) : null}
            </View>
            <TabBar activeTab={tab} onSelect={setTab} loading={loadingData} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function TabBar({ activeTab, onSelect, loading }: { activeTab: Tab; onSelect: (tab: Tab) => void; loading: boolean }) {
  const tabs: { name: Tab; icon: keyof typeof Feather.glyphMap; label: string }[] = [
    { name: 'Today', icon: 'sun', label: 'Today' },
    { name: 'Reminders', icon: 'calendar', label: 'Reminders' },
    { name: 'Activity', icon: 'clock', label: 'Activity' },
    { name: 'Account', icon: 'user', label: 'You' },
  ];
  return (
    <View style={styles.tabBar}>
      {tabs.map((item) => {
        const active = activeTab === item.name;
        return (
          <Pressable key={item.name} onPress={() => onSelect(item.name)} style={styles.tabButton}>
            <View style={[styles.tabIcon, active && styles.tabIconActive]}>
              <Feather name={item.icon} size={17} color={active ? colors.green : colors.muted} />
              {loading && active ? <View style={styles.syncDot} /> : null}
            </View>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  loadingMark: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green },
  loadingSpinner: { marginTop: 16 },
  authRoot: { flex: 1, backgroundColor: colors.paper },
  root: { flex: 1, backgroundColor: colors.paper },
  body: { flex: 1 },
  screen: { flex: 1 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.red, paddingHorizontal: 15, paddingVertical: 10 },
  errorText: { flex: 1, color: colors.white, fontSize: 11 },
  tabBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', minHeight: 67, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 7, paddingBottom: 4 },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 57 },
  tabIcon: { width: 38, height: 29, borderRadius: 11, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tabIconActive: { backgroundColor: colors.mint },
  tabLabel: { color: colors.muted, fontSize: 9, marginTop: 3, fontWeight: '600' },
  tabLabelActive: { color: colors.green, fontWeight: '700' },
  syncDot: { position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: colors.orange, top: 3, right: 4 },
});
