import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { api, Incident, COLORS, DEMO_INCIDENTS, severityColor, crisisEmoji, crisisLabel } from '../api';

export default function HomeScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [time, setTime] = useState('');
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const data = await api.get('/api/incidents');

    if (data?.incidents && data.incidents.length > 0) {
      setIncidents(data.incidents);
      setBackendOnline(true);
    } else {
      // Backend unreachable or empty — show demo data
      setIncidents(DEMO_INCIDENTS);
      setBackendOnline(data === null ? false : true);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(() => load(), 20000);
    const tv = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi', hour12: false }));
    }, 1000);
    return () => { clearInterval(iv); clearInterval(tv); };
  }, [load]);

  const active   = incidents.filter(i => i.status === 'active');
  const critical = incidents.filter(i => i.severity_level === 'CRITICAL' && i.status !== 'retracted');
  const alerted  = incidents.reduce((s, i) => s + (i.citizens_alerted || 0), 0);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.logo}>🛡️ CivicShield AI</Text>
          <View style={s.liveRow}>
            <View style={[s.dot, { backgroundColor: backendOnline === false ? COLORS.red : COLORS.green }]} />
            <Text style={s.liveText}>
              {backendOnline === false ? 'DEMO MODE · OFFLINE' : 'LIVE · ISLAMABAD'}
            </Text>
          </View>
        </View>
        <Text style={s.clock}>{time || '--:--:--'}</Text>
      </View>

      {/* Offline banner */}
      {backendOnline === false && (
        <View style={s.offlineBanner}>
          <Text style={s.offlineText}>⚠️  Backend offline — showing demo data. Start backend on your Mac.</Text>
        </View>
      )}

      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.blue} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={s.statsRow}>
          <StatCard label="Active" value={active.length} color={active.length > 0 ? COLORS.red : COLORS.green} icon="🚨" />
          <StatCard label="Critical" value={critical.length} color={COLORS.orange} icon="⚠️" />
          <StatCard label="Alerted" value={alerted >= 1000 ? `${(alerted/1000).toFixed(0)}K` : String(alerted)} color={COLORS.blue} icon="📢" />
        </View>

        {/* Critical banner */}
        {critical.length > 0 && (
          <View style={s.alertBanner}>
            <Text style={s.alertText}>🚨 {critical.length} CRITICAL incident{critical.length > 1 ? 's' : ''} require immediate attention</Text>
          </View>
        )}

        <Text style={s.sectionTitle}>
          All Incidents ({incidents.filter(i => i.status !== 'retracted').length} active / {incidents.length} total)
        </Text>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={COLORS.blue} size="large" />
            <Text style={s.loadText}>Fetching incidents from http://10.7.68.22:4000...</Text>
          </View>
        ) : incidents.length === 0 ? (
          <View style={s.center}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🛡️</Text>
            <Text style={{ color: COLORS.faint }}>No incidents found</Text>
          </View>
        ) : incidents.map(inc => <IncidentCard key={inc.id} inc={inc} />)}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }: any) {
  return (
    <View style={[s.statCard, { borderColor: `${color}33` }]}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function IncidentCard({ inc }: { inc: Incident }) {
  const color = severityColor(inc.severity_level);
  const isRetracted = inc.status === 'retracted';
  return (
    <View style={[s.incCard, { borderLeftColor: color, opacity: isRetracted ? 0.5 : 1 }]}>
      <View style={s.incHeader}>
        <Text style={{ fontSize: 26 }}>{crisisEmoji(inc.crisis_type)}</Text>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.incTitle} numberOfLines={1}>{crisisLabel(inc.crisis_type)}</Text>
          <Text style={s.incLoc} numberOfLines={1}>📍 {inc.location}</Text>
        </View>
        <SevBadge level={inc.severity_level} />
      </View>

      {inc.report_text ? (
        <Text style={s.incReport} numberOfLines={2}>"{inc.report_text}"</Text>
      ) : null}

      <View style={s.incFooter}>
        <StatusChip status={inc.status} />
        <Text style={s.incConf}>{Math.round((inc.confidence || 0) * 100)}% conf</Text>
        {inc.ticket_id ? <Text style={s.incTicket}>{inc.ticket_id}</Text> : null}
        {(inc.citizens_alerted || 0) > 0 ? (
          <Text style={s.incAlerted}>📢 {(inc.citizens_alerted||0).toLocaleString()}</Text>
        ) : null}
      </View>
    </View>
  );
}

function SevBadge({ level }: { level: string }) {
  const c = severityColor(level);
  return (
    <View style={{ backgroundColor: `${c}22`, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: `${c}44` }}>
      <Text style={{ color: c, fontSize: 9, fontWeight: '800' }}>{level}</Text>
    </View>
  );
}

function StatusChip({ status }: { status: string }) {
  const m: Record<string, string> = { active: '#00e676', contained: '#ffd700', resolved: '#8899b4', retracted: '#4a5568', processing: '#00a8ff' };
  const c = m[status] || '#8899b4';
  return (
    <View style={{ backgroundColor: `${c}18`, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: `${c}30` }}>
      <Text style={{ color: c, fontSize: 9, fontWeight: '700' }}>{status?.toUpperCase()}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.bg },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: 'rgba(8,12,20,0.95)' },
  logo:        { fontSize: 18, fontWeight: '800', color: COLORS.text },
  liveRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  dot:         { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  liveText:    { fontSize: 10, color: COLORS.muted, fontWeight: '600', letterSpacing: 0.8 },
  clock:       { fontSize: 20, fontWeight: '700', color: COLORS.blue },
  offlineBanner:{ backgroundColor: 'rgba(255,140,0,0.12)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,140,0,0.3)', padding: 10 },
  offlineText: { color: COLORS.orange, fontSize: 11, textAlign: 'center', fontWeight: '600' },
  scroll:      { flex: 1 },
  statsRow:    { flexDirection: 'row', padding: 14, gap: 10 },
  statCard:    { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1 },
  statVal:     { fontSize: 24, fontWeight: '800', marginTop: 4 },
  statLabel:   { fontSize: 10, color: COLORS.muted, marginTop: 2, fontWeight: '600' },
  alertBanner: { marginHorizontal: 14, marginBottom: 10, padding: 10, backgroundColor: 'rgba(255,61,61,0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,61,61,0.3)' },
  alertText:   { color: COLORS.orange, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  sectionTitle:{ fontSize: 13, fontWeight: '700', color: COLORS.text, paddingHorizontal: 14, paddingBottom: 10, paddingTop: 4 },
  center:      { padding: 40, alignItems: 'center', gap: 10 },
  loadText:    { color: COLORS.faint, fontSize: 11, textAlign: 'center' },
  incCard:     { marginHorizontal: 14, marginBottom: 10, backgroundColor: COLORS.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 3 },
  incHeader:   { flexDirection: 'row', alignItems: 'flex-start' },
  incTitle:    { fontSize: 14, fontWeight: '700', color: COLORS.text },
  incLoc:      { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  incReport:   { fontSize: 11, color: COLORS.muted, fontStyle: 'italic', marginTop: 8, lineHeight: 16, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: 'rgba(0,168,255,0.3)' },
  incFooter:   { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' },
  incConf:     { fontSize: 10, color: COLORS.faint },
  incTicket:   { fontSize: 10, color: COLORS.faint },
  incAlerted:  { fontSize: 10, color: COLORS.blue },
});
