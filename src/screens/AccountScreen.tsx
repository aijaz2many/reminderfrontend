import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { apiHost } from '../api';
import { displayName } from '../date';
import { colors, radius } from '../theme';
import type { User } from '../types';

type Props = {
  user: User;
  remindersCount: number;
  notificationsEnabled: boolean;
  notificationMessage?: string;
  onEnableNotifications: () => void;
  onSignOut: () => void;
};

export function AccountScreen({
  user,
  remindersCount,
  notificationsEnabled,
  notificationMessage,
  onEnableNotifications,
  onSignOut,
}: Props) {
  const name = displayName(user.full_name, user.email);
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>YOUR SPACE</Text>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>A little corner that’s all yours.</Text>
      </View>

      <View style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{name.slice(0, 1).toUpperCase()}</Text></View>
        <Text style={styles.name}>{user.full_name || name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.plan}><Feather name="star" size={11} color="#A4743C" /><Text style={styles.planText}>{user.subscription_tier || 'free'} plan</Text></View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{remindersCount}</Text>
          <Text style={styles.statLabel}>REMINDERS</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>Just you</Text>
          <Text style={styles.statLabel}>YOUR SPACE</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>PREFERENCES</Text>
      <Pressable onPress={onEnableNotifications} style={({ pressed }) => [styles.setting, pressed && styles.pressed]}>
        <View style={styles.settingIcon}><Feather name="bell" size={16} color={colors.green} /></View>
        <View style={styles.settingCopy}>
          <Text style={styles.settingTitle}>Push notifications</Text>
          <Text style={styles.settingSubtitle}>
            {notificationMessage || (notificationsEnabled ? 'This device is ready for reminders' : 'Turn on gentle reminders')}
          </Text>
        </View>
        <View style={[styles.toggle, notificationsEnabled && styles.toggleOn]}>
          <View style={[styles.toggleKnob, notificationsEnabled && styles.toggleKnobOn]} />
        </View>
      </Pressable>

      <View style={styles.setting}>
        <View style={[styles.settingIcon, styles.settingIconNeutral]}><Feather name="shield" size={16} color={colors.muted} /></View>
        <View style={styles.settingCopy}>
          <Text style={styles.settingTitle}>Private by design</Text>
          <Text style={styles.settingSubtitle}>Only you can see your reminders.</Text>
        </View>
        <Feather name="check-circle" size={16} color={colors.green} />
      </View>

      <View style={styles.serverCard}>
        <Text style={styles.serverLabel}>CONNECTED TO</Text>
        <Text numberOfLines={1} style={styles.serverAddress}>{apiHost}</Text>
      </View>

      <Pressable onPress={onSignOut} style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
        <Feather name="log-out" size={16} color={colors.red} />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
      <Text style={styles.version}>daymark · a softer way to remember</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 21, paddingBottom: 36 },
  header: { marginTop: 5, marginBottom: 19 },
  eyebrow: { color: colors.green, fontSize: 9, fontWeight: '800', letterSpacing: 1.7, marginBottom: 8 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '700', letterSpacing: -1 },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 5 },
  profile: { alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.lg, paddingVertical: 23, borderWidth: 1, borderColor: colors.line },
  avatar: { width: 61, height: 61, borderRadius: 21, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D5E6D8' },
  avatarText: { color: colors.green, fontSize: 22, fontWeight: '700' },
  name: { color: colors.ink, fontSize: 17, fontWeight: '700', marginTop: 12 },
  email: { color: colors.muted, fontSize: 11, marginTop: 4 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FBF1E3', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5, marginTop: 12 },
  planText: { color: '#8D6737', fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
  stats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, paddingVertical: 15, marginTop: 10 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  statLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1, marginTop: 5 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.line },
  sectionLabel: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.4, marginTop: 24, marginBottom: 9 },
  setting: { minHeight: 71, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, marginBottom: 8 },
  settingIcon: { width: 37, height: 37, borderRadius: 13, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  settingIconNeutral: { backgroundColor: '#F2F3EF' },
  settingCopy: { flex: 1, marginHorizontal: 10 },
  settingTitle: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  settingSubtitle: { color: colors.muted, fontSize: 9, marginTop: 4 },
  toggle: { width: 37, height: 22, borderRadius: 15, justifyContent: 'center', paddingHorizontal: 3, backgroundColor: '#D9DED9' },
  toggleOn: { backgroundColor: colors.green },
  toggleKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.white },
  toggleKnobOn: { alignSelf: 'flex-end' },
  serverCard: { backgroundColor: '#EEF1EB', borderRadius: 15, padding: 13, marginTop: 6 },
  serverLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  serverAddress: { color: colors.ink, fontSize: 10, marginTop: 6 },
  signOut: { minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 13, borderRadius: 15, backgroundColor: '#FFF5F3' },
  signOutText: { color: colors.red, fontSize: 11, fontWeight: '700' },
  version: { color: colors.muted, fontSize: 9, textAlign: 'center', marginTop: 19 },
  pressed: { opacity: 0.82 },
});
