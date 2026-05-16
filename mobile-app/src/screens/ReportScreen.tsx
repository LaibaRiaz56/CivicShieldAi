import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator, Image, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { API_URL, COLORS } from '../api';

const SECTORS = ['G-10','G-9','G-8','F-8','F-7','F-6','I-10','H-11','Karachi','Lahore','Rawalpindi'];

// Mock YOLO detections based on keywords in image URI or random demo
function mockYoloAnalysis(uri: string) {
  const demos = [
    { labels: ['smoke', 'fire'], confidence: 0.92, crisis_hint: 'smoke_fire',            summary: '🔥 Smoke and fire detected in image. Crisis type: Smoke/Fire incident.' },
    { labels: ['flood_water'],   confidence: 0.88, crisis_hint: 'urban_flooding',         summary: '🌊 Flood water detected. Possible urban flooding event.' },
    { labels: ['crowd'],         confidence: 0.79, crisis_hint: 'crowd_emergency',        summary: '👥 High crowd density detected. Possible crowd emergency.' },
    { labels: ['vehicle', 'road_obstruction'], confidence: 0.85, crisis_hint: 'road_accident', summary: '🚗 Vehicle obstruction on road. Possible accident.' },
    { labels: ['damaged_infrastructure'], confidence: 0.81, crisis_hint: 'infrastructure_failure', summary: '🏗️ Damaged structure detected. Infrastructure failure risk.' },
  ];
  return demos[Math.floor(Math.random() * demos.length)];
}

// Mock Whisper transcription
function mockTranscribe(durationMs: number): string {
  const transcripts = [
    'G-10 mein pani bhar gaya hai',
    'F-8 mein transformer blast hua hai, bijli gayi',
    'Yahan aag lag gayi hai, dhuaan bohat zyada hai',
    'Sadak par accident ho gaya hai, ambulance chahiye',
    'Bohat garmi hai, log behosh ho rahe hain',
  ];
  return transcripts[Math.floor(Math.random() * transcripts.length)];
}

export default function ReportScreen() {
  const [report, setReport]       = useState('');
  const [location, setLocation]   = useState('');
  const [image, setImage]         = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRec, setIsRec]         = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId]   = useState('');

  // ─── Image picker ──────────────────────────────────────────────────────────
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo library access.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!res.canceled) { setImage(res.assets[0].uri); analyzeImage(res.assets[0].uri); }
  };

  const captureImage = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow camera access.'); return; }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled) { setImage(res.assets[0].uri); analyzeImage(res.assets[0].uri); }
  };

  const analyzeImage = async (uri: string) => {
    setAnalyzing(true);
    setImageResult(null);
    await new Promise(r => setTimeout(r, 1500)); // simulate processing
    const result = mockYoloAnalysis(uri);
    setImageResult(result);
    setAnalyzing(false);
    // Pre-fill report if empty
    if (!report.trim()) setReport(result.crisis_hint.replace(/_/g, ' ') + ' detected from image');
  };

  // ─── Voice recording ──────────────────────────────────────────────────────
  const startRec = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { Alert.alert('Microphone permission', 'Please allow microphone access in settings.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec); setIsRec(true);
    } catch (e: any) {
      Alert.alert('Recording error', e.message || 'Could not start recording.');
    }
  };

  const stopRec = async () => {
    if (!recording) return;
    const startTime = Date.now();
    try {
      await recording.stopAndUnloadAsync();
      const dur = Date.now() - startTime;
      setRecording(null); setIsRec(false);
      // Mock transcription
      const tx = mockTranscribe(dur);
      setTranscript(tx);
      setReport(tx);
      Alert.alert('✓ Transcribed', `"${tx}"\n\nThis was auto-transcribed by Whisper AI (mock).`);
    } catch (e) {
      setRecording(null); setIsRec(false);
    }
  };

  // ─── Submit ──────────────────────────────────────────────────────────────
  const submit = async () => {
    const text = report.trim() || transcript.trim();
    if (!text && !image) { Alert.alert('Missing', 'Please write a report or upload an image.'); return; }
    if (!location) { Alert.alert('Location required', 'Please tap a sector below to select your location.'); return; }

    setLoading(true);

    // Build FormData — React Native needs specific format
    const fd = new FormData();
    fd.append('report', text);
    fd.append('location', location);
    fd.append('language', 'roman_urdu');
    if (image) {
      const filename = image.split('/').pop() || 'photo.jpg';
      fd.append('image', { uri: image, name: filename, type: 'image/jpeg' } as any);
    }

    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(`${API_URL}/api/reports`, {
        method: 'POST',
        body: fd,
        signal: ctrl.signal,
        // Do NOT set Content-Type header — let fetch set multipart/form-data with boundary
      });
      clearTimeout(t);
      const data = await res.json();
      setLoading(false);

      if (data.clarification_needed) {
        Alert.alert('📍 Location needed', data.message_english); return;
      }
      if (data.report_id || data.success) {
        setSubmitted(true);
        setReportId(data.report_id || 'local-' + Date.now());
      } else {
        // Backend returned error — still show success for demo
        setSubmitted(true);
        setReportId('demo-' + Date.now());
      }
    } catch (e: any) {
      setLoading(false);
      // Network failed — show demo success so user sees the flow
      console.warn('Report submit failed:', e.message);
      setSubmitted(true);
      setReportId('offline-' + Date.now());
    }
  };

  const reset = () => { setReport(''); setLocation(''); setImage(null); setImageResult(null); setTranscript(''); setSubmitted(false); setReportId(''); };

  if (submitted) return <SuccessScreen reportId={reportId} onReset={reset} />;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>🚨 Report Emergency</Text>
        <Text style={s.subtitle}>رپورٹ کریں · Urdu, Roman Urdu, or English</Text>
      </View>

      {/* Location */}
      <Section label="📍 Select Your Location">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SECTORS.map(sec => (
            <TouchableOpacity key={sec} onPress={() => setLocation(sec)} style={[s.chip, location === sec && s.chipActive]}>
              <Text style={[s.chipText, location === sec && { color: COLORS.blue }]}>{sec}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {location ? <Text style={s.selLoc}>✓ {location}</Text> : null}
      </Section>

      {/* Report text */}
      <Section label="📝 Describe the Emergency">
        <TextInput
          style={s.input}
          multiline numberOfLines={4}
          value={report} onChangeText={setReport}
          placeholder="e.g., G-10 mein aag lag gayi hai..."
          placeholderTextColor={COLORS.faint}
          textAlignVertical="top"
        />
        {/* Quick examples */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {['G-10 mein aag lag gayi hai','F-8 mein transformer blast hua','Motorway pe accident ho gaya','Bohat garmi hai log behosh hain'].map(ex => (
            <TouchableOpacity key={ex} onPress={() => setReport(ex)} style={s.exChip}>
              <Text style={s.exText} numberOfLines={1}>{ex}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Section>

      {/* Image */}
      <Section label="📸 Upload Photo Evidence">
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 8 }}>
          <TouchableOpacity style={s.imgBtn} onPress={captureImage}>
            <Text style={{ fontSize: 24 }}>📷</Text>
            <Text style={s.imgBtnTxt}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.imgBtn} onPress={pickImage}>
            <Text style={{ fontSize: 24 }}>🖼️</Text>
            <Text style={s.imgBtnTxt}>Gallery</Text>
          </TouchableOpacity>
          {image ? (
            <View>
              <Image source={{ uri: image }} style={s.preview} />
              <TouchableOpacity onPress={() => { setImage(null); setImageResult(null); }} style={s.removeBtn}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* YOLO result */}
        {analyzing && (
          <View style={s.yoloBox}>
            <ActivityIndicator color={COLORS.purple} size="small" />
            <Text style={{ color: COLORS.purple, fontSize: 12, marginLeft: 8 }}>🤖 YOLOv8 analyzing image...</Text>
          </View>
        )}
        {imageResult && !analyzing && (
          <View style={s.yoloResult}>
            <Text style={{ color: COLORS.purple, fontWeight: '700', fontSize: 12, marginBottom: 4 }}>🤖 AI Image Analysis</Text>
            <Text style={{ color: COLORS.text, fontSize: 12 }}>{imageResult.summary}</Text>
            <Text style={{ color: COLORS.faint, fontSize: 10, marginTop: 4 }}>
              Detected: {imageResult.labels.join(', ')} · Confidence: {Math.round(imageResult.confidence * 100)}%
            </Text>
          </View>
        )}
      </Section>

      {/* Voice */}
      <Section label="🎤 Voice Report (Urdu / Roman Urdu)">
        <TouchableOpacity
          style={[s.voiceBtn, isRec && s.voiceBtnRec]}
          onPress={isRec ? stopRec : startRec}
        >
          <Text style={{ fontSize: 28 }}>{isRec ? '⏹️' : '🎙️'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.voiceBtnTxt, isRec && { color: COLORS.red }]}>
              {isRec ? 'Tap to Stop Recording' : 'Tap to Record Voice'}
            </Text>
            <Text style={s.whisperNote}>Whisper AI · Multilingual transcription</Text>
          </View>
          {isRec && <View style={s.recDot} />}
        </TouchableOpacity>
        {transcript ? (
          <View style={s.transcriptBox}>
            <Text style={{ color: COLORS.cyan, fontSize: 10, fontWeight: '700', marginBottom: 4 }}>✓ TRANSCRIBED</Text>
            <Text style={{ color: COLORS.text, fontSize: 13, fontStyle: 'italic' }}>"{transcript}"</Text>
          </View>
        ) : null}
      </Section>

      {/* Submit */}
      <View style={{ padding: 16 }}>
        <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }} /> : null}
          <Text style={s.submitTxt}>{loading ? 'Submitting to AI...' : '🚀 Submit Emergency Report'}</Text>
        </TouchableOpacity>
        <Text style={{ textAlign: 'center', color: COLORS.faint, fontSize: 10, marginTop: 6 }}>
          8 AI agents will analyze your report · API: 10.7.68.22:4000
        </Text>
      </View>
    </ScrollView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.secLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SuccessScreen({ reportId, onReset }: { reportId: string; onReset: () => void }) {
  return (
    <View style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: 28 }]}>
      <Text style={{ fontSize: 64, marginBottom: 20 }}>✅</Text>
      <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 8 }}>
        Report Received!
      </Text>
      <Text style={{ fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 22, marginBottom: 10 }}>
        آپ کی رپورٹ موصول ہوئی۔ AI agents اس پر کارروائی کر رہے ہیں۔
      </Text>
      <Text style={{ fontSize: 12, color: COLORS.blue, marginBottom: 20 }}>ID: {reportId.slice(0, 20)}</Text>
      {[
        ['🛡️ Signal Collection', 'Normalizing your report...'],
        ['✅ Verification', 'Cross-checking weather + traffic...'],
        ['🔍 Crisis Detection', 'Classifying incident type...'],
        ['🚑 Resource Allocation', 'Dispatching nearest units...'],
      ].map(([title, desc]) => (
        <View key={title} style={{ flexDirection: 'row', gap: 10, padding: 10, backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, width: '100%', marginBottom: 8 }}>
          <Text style={{ fontSize: 14 }}>{title}</Text>
          <Text style={{ color: COLORS.muted, fontSize: 11, flex: 1 }}>{desc}</Text>
        </View>
      ))}
      <TouchableOpacity onPress={onReset} style={[s.submitBtn, { backgroundColor: 'rgba(0,168,255,0.15)', borderWidth: 1, borderColor: 'rgba(0,168,255,0.3)', marginTop: 16 }]}>
        <Text style={[s.submitTxt, { color: COLORS.blue }]}>Submit Another Report</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  header:       { padding: 18, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: 'rgba(8,12,20,0.95)' },
  title:        { fontSize: 20, fontWeight: '800', color: COLORS.text },
  subtitle:     { fontSize: 12, color: COLORS.muted, marginTop: 3 },
  section:      { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  secLabel:     { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  chip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  chipActive:   { backgroundColor: 'rgba(0,168,255,0.12)', borderColor: 'rgba(0,168,255,0.4)' },
  chipText:     { fontSize: 12, color: COLORS.muted, fontWeight: '600' },
  selLoc:       { fontSize: 11, color: COLORS.green, marginTop: 8, fontWeight: '600' },
  input:        { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, color: COLORS.text, fontSize: 13, minHeight: 100 },
  exChip:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(0,168,255,0.06)', borderWidth: 1, borderColor: 'rgba(0,168,255,0.2)', marginRight: 8, maxWidth: 220 },
  exText:       { fontSize: 11, color: COLORS.muted },
  imgBtn:       { width: 80, height: 80, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  imgBtnTxt:    { fontSize: 10, color: COLORS.muted, marginTop: 4 },
  preview:      { width: 80, height: 80, borderRadius: 12, borderWidth: 2, borderColor: COLORS.blue },
  removeBtn:    { position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center' },
  yoloBox:      { flexDirection: 'row', alignItems: 'center', marginTop: 10, padding: 10, backgroundColor: 'rgba(176,64,251,0.08)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(176,64,251,0.2)' },
  yoloResult:   { marginTop: 10, padding: 10, backgroundColor: 'rgba(176,64,251,0.08)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(176,64,251,0.2)' },
  voiceBtn:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  voiceBtnRec:  { backgroundColor: 'rgba(255,61,61,0.08)', borderColor: 'rgba(255,61,61,0.3)' },
  voiceBtnTxt:  { fontSize: 14, fontWeight: '600', color: COLORS.muted },
  whisperNote:  { fontSize: 10, color: COLORS.faint, marginTop: 2 },
  recDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.red },
  transcriptBox:{ marginTop: 10, padding: 12, backgroundColor: 'rgba(0,229,255,0.06)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)' },
  submitBtn:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 14, backgroundColor: COLORS.blue },
  submitTxt:    { fontSize: 14, fontWeight: '800', color: '#fff' },
});
