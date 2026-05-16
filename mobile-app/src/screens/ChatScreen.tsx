import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { API_URL, COLORS } from '../api';

interface Msg { role: 'user' | 'ai'; text: string; time: string; }

const QUICK = [
  'G-10 jana safe hai?',
  'Kaun se raste band hain?',
  'G-10 mein flooding ka status?',
  'Transformer fire mein kya karun?',
  'Nearest hospital?',
  'Active incidents batao',
];

// Instant mock responses when backend is offline
const MOCK_RESPONSES: Record<string, string> = {
  default: 'CivicShield AI yahan hai! Abhi Islamabad mein:\n• G-10: Urban Flooding (HIGH) — Rescue teams on way\n• F-8: Transformer explosion (CRITICAL) — contained\n\nEmergency: 1122 | Fire: 16 | Police: 15',
  safe:    'G-10 mein abhi urban flooding ki emergency hai (Severity: HIGH). Is waqt G-10 safar karna SAFE NAHI hai. Kashmir Highway use karein. Rescue teams kaam kar rahi hain.',
  road:    '🚧 Currently blocked:\n• G-10/2 at Nazimuddin Road\n• G-10 Markaz access roads\n\nAlternate: Kashmir Highway → Srinagar Hwy interchange',
  hospital:'🏥 Nearest hospitals:\n1. PIMS Hospital — G-8 (3.2km) · 051-9261170\n2. Polyclinic — G-6 (4.1km)\n3. Shifa International — H-8 (5km)',
  transformer: '⚡ Transformer fire safety:\n1. 50 meter duur rahein\n2. Bijli ki cheez mat chhuein\n3. IESCO: 051-9252238\n4. Fire Brigade: 16\n5. Rescue: 1122',
  flooding:'🌊 G-10 flooding status: ACTIVE\n• Water level: 2.3ft above normal\n• 3 rescue boats deployed\n• 12,000 citizens alerted\n• ETA: Rescue Boat Charlie — 6 min',
  incidents:'🚨 Active incidents:\n1. G-10 — Urban Flooding (HIGH, 91%)\n2. F-8 — Transformer Explosion (CRITICAL, 87%)\n3. Karachi — Heatwave (HIGH, 83%)\n\nTotal: 3 active, 1 contained',
};

function getMockReply(msg: string): string {
  const q = msg.toLowerCase();
  if (/safe|jana|travel/.test(q))         return MOCK_RESPONSES.safe;
  if (/road|rasta|block|band/.test(q))    return MOCK_RESPONSES.road;
  if (/hospital|clinic|doctor/.test(q))   return MOCK_RESPONSES.hospital;
  if (/transformer|bijli|fire|kya karun/.test(q)) return MOCK_RESPONSES.transformer;
  if (/flood|pani|g-10/.test(q))          return MOCK_RESPONSES.flooding;
  if (/incident|crisis|emergency/.test(q)) return MOCK_RESPONSES.incidents;
  return MOCK_RESPONSES.default;
}

function ts() {
  return new Date().toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen() {
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: 'ai',
    text: 'السلام عليکم! 🛡️\n\nMain CivicShield AI hoon — aapka emergency assistant.\n\nPooch sakte hain:\n• G-10 mein pani hai?\n• Kaunse raste band hain?\n• Nearest hospital?\n• Transformer fire mein kya karun?\n\nKaise madad karun?',
    time: ts(),
  }]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [msgs]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMsgs(prev => [...prev, { role: 'user', text: msg, time: ts() }]);
    setLoading(true);

    // Try real backend first
    let reply = '';
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, role: 'citizen' }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      const data = await res.json();
      reply = data?.reply || '';
    } catch {
      // Backend offline — use instant mock
    }

    // Fallback to mock if backend failed or returned empty
    if (!reply) reply = getMockReply(msg);

    setMsgs(prev => [...prev, { role: 'ai', text: reply, time: ts() }]);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={88}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={s.avatar}><Text style={{ fontSize: 18 }}>🛡️</Text></View>
          <View>
            <Text style={s.title}>CivicShield AI</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green }} />
              <Text style={{ fontSize: 10, color: COLORS.green, fontWeight: '600' }}>Online · Multilingual</Text>
            </View>
          </View>
        </View>
        <Text style={{ fontSize: 9, color: COLORS.faint }}>Groq · llama-3.3-70b</Text>
      </View>

      {/* Quick prompts */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.quickRow} contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}>
        {QUICK.map(q => (
          <TouchableOpacity key={q} onPress={() => send(q)} style={s.quickChip}>
            <Text style={s.quickTxt}>{q}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages */}
      <ScrollView ref={scrollRef} style={s.msgs} contentContainerStyle={{ padding: 14, gap: 12 }} showsVerticalScrollIndicator={false}>
        {msgs.map((m, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}>
            {m.role === 'ai' && <View style={s.avatar}><Text style={{ fontSize: 14 }}>🛡️</Text></View>}
            <View style={{ maxWidth: '80%' }}>
              <View style={[s.bubble, m.role === 'user' ? s.userBubble : s.aiBubble]}>
                <Text style={[s.bubbleTxt, m.role === 'user' && { color: '#fff' }]}>{m.text}</Text>
              </View>
              <Text style={[s.timeTxt, { textAlign: m.role === 'user' ? 'right' : 'left' }]}>{m.time}</Text>
            </View>
            {m.role === 'user' && <View style={s.userAv}><Text style={{ fontSize: 14 }}>👤</Text></View>}
          </View>
        ))}
        {loading && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={s.avatar}><Text style={{ fontSize: 14 }}>🛡️</Text></View>
            <View style={[s.bubble, s.aiBubble, { paddingVertical: 14, paddingHorizontal: 18 }]}>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {[0,1,2].map(i => (
                  <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.blue, opacity: 0.4 + i * 0.3 }} />
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={s.inputRow}>
        <TextInput
          style={s.inputBox}
          value={input} onChangeText={setInput}
          placeholder="Kuch poochein... (Roman Urdu / English)"
          placeholderTextColor={COLORS.faint}
          multiline maxLength={500}
          returnKeyType="send"
          onSubmitEditing={() => send()}
          blurOnSubmit={false}
        />
        <TouchableOpacity onPress={() => send()} disabled={!input.trim() || loading} style={[s.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}>
          <Text style={{ fontSize: 20 }}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.bg },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: 'rgba(8,12,20,0.95)' },
  title:      { fontSize: 15, fontWeight: '800', color: COLORS.text },
  avatar:     { width: 34, height: 34, borderRadius: 10, backgroundColor: '#0044cc', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,168,255,0.4)' },
  userAv:     { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  quickRow:   { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  quickChip:  { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(0,168,255,0.07)', borderWidth: 1, borderColor: 'rgba(0,168,255,0.2)' },
  quickTxt:   { fontSize: 11, color: COLORS.muted },
  msgs:       { flex: 1 },
  bubble:     { borderRadius: 14, padding: 12 },
  aiBubble:   { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderTopLeftRadius: 4 },
  userBubble: { backgroundColor: 'rgba(0,68,204,0.4)', borderWidth: 1, borderColor: 'rgba(0,168,255,0.3)', borderTopRightRadius: 4 },
  bubbleTxt:  { fontSize: 13, color: COLORS.text, lineHeight: 20 },
  timeTxt:    { fontSize: 10, color: COLORS.faint, marginTop: 4 },
  inputRow:   { flexDirection: 'row', gap: 8, padding: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 14, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: 'rgba(8,12,20,0.95)', alignItems: 'flex-end' },
  inputBox:   { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: COLORS.text, fontSize: 13, maxHeight: 100 },
  sendBtn:    { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.blue, alignItems: 'center', justifyContent: 'center' },
});
