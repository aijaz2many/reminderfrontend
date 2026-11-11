import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import type { NotificationLog } from '../types';

type Props = {
  logs: NotificationLog[];
};

export function ActivityScreen({ logs }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>A LOOK BACK</Text>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>A quiet record of your reminders.</Text>
      </View>
      <View style={styles.summary}>
        <View style={styles.summaryIcon}><Feather name="activity" size={18} color={colors.green} /></View>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryTitle}>{logs.length === 0 ? 'Your story is just beginning' : `${logs.length} reminder${logs.length === 1 ? '' : 's'} sent`}</Text>
          <Text style={styles.summarySub}>Every little nudge, right here when you need it.</Text>
        </View>
      </View>
      {logs.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Feather name="feather" size={19} color={colors.green} /></View>
          <Text style={styles.emptyTitle}>Nothing to show just yet</Text>
          <Text style={styles.emptyText}>When a reminder is sent, it’ll appear here.</Text>
        </View>
      ) : (
        <View style={styles.logList}>
          <Text style={styles.listTitle}>RECENT</Text>
          {logs.map((log) => (
            <View key={log.id} style={styles.logRow}>
              <View style={styles.timeline}>
                <View style={styles.dot} />
                <View style={styles.line} />
              </View>
              <View style={styles.logCard}>
                <View style={[styles.logIcon, log.status !== 'sent' && styles.logIconFailed]}>
                  <Feather name={log.status === 'sent' ? 'check' : 'alert-circle'} size={15} color={log.status === 'sent' ? colors.green : colors.red} />
                </View>
                <View style={styles.logCopy}>
                  <Text style={styles.logTitle}>
                    {log.status === 'sent'
                      ? 'Reminder delivered'
                      : log.status === 'skipped_no_device_token'
                        ? 'No device registered'
                        : 'Reminder not sent'}
                  </Text>
                  <Text style={styles.logDate}>
                    {new Date(log.sent_at || log.scheduled_for).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    {log.status && log.status !== 'sent' ? ` · ${log.status.replaceAll('_', ' ')}` : ''}
                  </Text>
                </View>
                <View style={styles.channel}><Text style={styles.channelText}>{log.channel || 'push'}</Text></View>
              </View>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.footnote}>Your activity is private to you.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 21, paddingBottom: 36 },
  header: { marginTop: 5, marginBottom: 20 },
  eyebrow: { color: colors.green, fontSize: 9, fontWeight: '800', letterSpacing: 1.7, marginBottom: 8 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '700', letterSpacing: -1 },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 5 },
  summary: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.mint, borderRadius: 18, padding: 15, marginBottom: 25 },
  summaryIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  summaryCopy: { flex: 1, marginLeft: 11 },
  summaryTitle: { color: colors.ink, fontWeight: '700', fontSize: 12 },
  summarySub: { color: colors.muted, fontSize: 10, marginTop: 4 },
  empty: { alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 26 },
  emptyIcon: { width: 43, height: 43, borderRadius: 15, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  emptyText: { color: colors.muted, fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 6 },
  logList: { gap: 2 },
  listTitle: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.3, marginBottom: 12 },
  logRow: { flexDirection: 'row', minHeight: 76 },
  timeline: { width: 19, alignItems: 'center', paddingTop: 17 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green, zIndex: 1 },
  line: { position: 'absolute', top: 24, bottom: 0, width: 1, backgroundColor: '#DCE7DD' },
  logCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 11, marginBottom: 8 },
  logIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  logIconFailed: { backgroundColor: '#FFF0EE' },
  logCopy: { flex: 1, marginLeft: 10 },
  logTitle: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  logDate: { color: colors.muted, fontSize: 9, marginTop: 5 },
  channel: { backgroundColor: '#F2F4F0', borderRadius: 15, paddingHorizontal: 8, paddingVertical: 4 },
  channelText: { color: colors.muted, fontSize: 8, textTransform: 'capitalize' },
  footnote: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 22 },
});
