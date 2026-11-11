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
import type { AuthResponse, NotificationLog, Reminder, ReminderInput, ReminderStatus, User } from './src/types';

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
  const [loadingData, setLoadingData] = useState(false);
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
      const [currentUser, reminderResponse, logResponse] = await Promise.all([
        api.me(token),
        api.reminders(token),
        api.notificationLogs(token),
      ]);
      setSession((current) => current?.token === token ? { token, user: currentUser } : current);
      setReminders(reminderResponse.items);
      setLogs(logResponse.items);
      setNotificationsEnabled(Boolean(currentUser.fcm_device_token));
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

  async function enableNotifications() {
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
      const nativeToken = await Notifications.getDevicePushTokenAsync();
      await api.updateDeviceToken(session.token, String(nativeToken.data));
      const updatedUser = { ...session.user, fcm_device_token: String(nativeToken.data) };
      setSession({ token: session.token, user: updatedUser });
      setNotificationsEnabled(true);
      setNotificationMessage('This device is ready for reminders.');
    } catch (reason) {
      setNotificationMessage(reason instanceof Error ? reason.message : 'Could not enable push notifications.');
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
                  notificationsEnabled={notificationsEnabled}
                  notificationMessage={notificationMessage}
                  onEnableNotifications={() => void enableNotifications()}
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
