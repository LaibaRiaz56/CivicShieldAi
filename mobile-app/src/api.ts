// ─── Network Configuration ────────────────────────────────────────────────────
// On Android, "localhost" means the PHONE itself — NOT your Mac.
// You must use your Mac's LAN IP address.
// ⚠️  UPDATE THIS if your Mac's IP changes (run: ifconfig | grep "inet ")
export const API_URL = 'http://10.7.68.22:4000';

// ─── Generic fetch wrappers ───────────────────────────────────────────────────
export const api = {
  async get(path: string): Promise<any> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const r = await fetch(`${API_URL}${path}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    } catch (e: any) {
      console.warn(`[API GET] ${path} failed:`, e.message);
      return null;
    }
  },

  async post(path: string, body: any, isFormData = false): Promise<any> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s for uploads
      const r = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        signal: controller.signal,
        headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
        body: isFormData ? body : JSON.stringify(body),
      });
      clearTimeout(timeout);
      return r.json();
    } catch (e: any) {
      console.warn(`[API POST] ${path} failed:`, e.message);
      return { error: e.message };
    }
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface Incident {
  id: string;
  status: string;
  crisis_type: string;
  confidence: number;
  severity_level: SeverityLevel;
  location: string;
  report_text?: string;
  ticket_id?: string;
  citizens_alerted?: number;
  actions_count?: number;
  lat?: number;
  lon?: number;
  created_at: string;
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
export const COLORS = {
  bg:     '#080c14',
  card:   '#0d1421',
  card2:  '#111827',
  border: 'rgba(255,255,255,0.08)',
  text:   '#e8f0fe',
  muted:  '#8899b4',
  faint:  '#4a5568',
  blue:   '#00a8ff',
  cyan:   '#00e5ff',
  green:  '#00e676',
  red:    '#ff3d3d',
  orange: '#ff8c00',
  yellow: '#ffd700',
  purple: '#b040fb',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function severityColor(level?: string): string {
  return ({ CRITICAL: '#ff3d3d', HIGH: '#ff8c00', MODERATE: '#ffd700', LOW: '#00e676' } as any)[level ?? ''] ?? '#8899b4';
}
export function crisisEmoji(type: string): string {
  return ({
    urban_flooding:        '🌊',
    transformer_explosion: '⚡',
    electrical_fire:       '🔥',
    smoke_fire:            '🌫️',
    road_accident:         '🚗',
    heatwave:              '🌡️',
    infrastructure_failure:'🏗️',
    crowd_emergency:       '👥',
    gas_leak:              '☢️',
  } as any)[type] ?? '⚠️';
}
export function crisisLabel(type: string): string {
  return type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? 'Unknown';
}

// ─── Inline demo data (shown when backend is unreachable) ─────────────────────
export const DEMO_INCIDENTS: Incident[] = [
  { id: 'd1', status: 'active',     crisis_type: 'urban_flooding',        confidence: 0.91, severity_level: 'HIGH',     location: 'G-10, Islamabad',        report_text: 'G-10 mein pani bhar gaya hai, gadiyan phans gayi hain', ticket_id: 'CS-18472', citizens_alerted: 12000, actions_count: 5, lat: 33.6789, lon: 72.9934, created_at: new Date().toISOString() },
  { id: 'd2', status: 'active',     crisis_type: 'transformer_explosion', confidence: 0.87, severity_level: 'CRITICAL', location: 'F-8, Islamabad',         report_text: 'F-8 mein transformer blast hua hai, bijli gayi', ticket_id: 'CS-29381', citizens_alerted: 8500,  actions_count: 6, lat: 33.7028, lon: 73.0436, created_at: new Date().toISOString() },
  { id: 'd3', status: 'contained',  crisis_type: 'road_accident',         confidence: 0.95, severity_level: 'MODERATE', location: 'Motorway M-2, Lahore',    report_text: 'Motorway pe bohat dhuaan hai, truck accident',         ticket_id: 'CS-37194', citizens_alerted: 3200,  actions_count: 4, lat: 31.6340, lon: 74.1950, created_at: new Date().toISOString() },
  { id: 'd4', status: 'active',     crisis_type: 'heatwave',              confidence: 0.83, severity_level: 'HIGH',     location: 'Karachi, Sindh',          report_text: 'Karachi mein garmi bohat zyada hai, log behosh ho rahe hain', ticket_id: 'CS-41827', citizens_alerted: 25000, actions_count: 3, lat: 24.8607, lon: 67.0011, created_at: new Date().toISOString() },
  { id: 'd5', status: 'retracted',  crisis_type: 'urban_flooding',        confidence: 0.21, severity_level: 'LOW',      location: 'I-10, Islamabad',         report_text: 'Yahan bohot pani aa raha hai', ticket_id: undefined, citizens_alerted: 0,     actions_count: 0, lat: 33.6585, lon: 72.9764, created_at: new Date().toISOString() },
];
